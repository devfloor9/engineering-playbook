const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const yaml = require('js-yaml');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const {parse} = require('parse5');
const {DEFAULT_PARSE_FRONT_MATTER, encodePath, fileToPath, loadFreshModule} = require('@docusaurus/utils');
const {applyTrailingSlash} = require('@docusaurus/utils-common');
const {getTagsFile} = require('@docusaurus/utils-validation');
const {processDocMetadata, readVersionDocs} = require('@docusaurus/plugin-content-docs/lib/docs.js');
const {readVersionsMetadata} = require('@docusaurus/plugin-content-docs/lib/versions/version.js');
const {DEFAULT_OPTIONS: DOCS_OPTIONS} = require('@docusaurus/plugin-content-docs/lib/options.js');
const {DEFAULT_OPTIONS: PAGES_OPTIONS} = require('@docusaurus/plugin-content-pages/lib/options.js');
const {loadPagesContent} = require('@docusaurus/plugin-content-pages/lib/content.js');
const {documentRoute, blogRoute} = require('../tag-routes');
const {collectDocuments, generateTagStats, main} = require('../generate-tag-pages');
const {tagPageRoute, documentRouteForLocale} = require('../../src/components/TagList/routes');
const {sourceLoader, root} = require('./document-tools/source-loader.cjs');

function temporarySite(t) {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-tag-routing-'));
  t.after(() => fs.rmSync(directory, {recursive: true, force: true}));
  return directory;
}

function writeDoc(directory, relativePath, metadata = {}) {
  const file = path.join(directory, relativePath);
  fs.mkdirSync(path.dirname(file), {recursive: true});
  fs.writeFileSync(file, `---\n${yaml.dump({title: 'Fixture', tags: ['scope:ops', 'eks'], ...metadata})}---\n\nFixture content.\n`);
  return file;
}

function config(docs = {}, extra = {}) {
  return {
    baseUrl: '/engineering-playbook/',
    i18n: {defaultLocale: 'ko', locales: ['ko', 'en']},
    presets: [['classic', {docs, blog: false}]],
    ...extra,
  };
}

function hrefs(html) {
  const output = [];
  const visit = node => {
    if (node.tagName === 'a') {
      const href = node.attrs.find(attr => attr.name === 'href')?.value;
      if (href) output.push(href);
    }
    (node.childNodes || []).forEach(visit);
  };
  visit(parse(html));
  return output;
}

function createRenderer(locale, baseUrl) {
  const context = () => ({i18n: {currentLocale: locale}, siteConfig: {baseUrl}});
  const loadUrlHelper = sourceLoader({'./useDocusaurusContext': context});
  const {addBaseUrl} = loadUrlHelper(require.resolve('@docusaurus/core/lib/client/exports/useBaseUrl.js'));
  const load = sourceLoader({
    '@docusaurus/useDocusaurusContext': context,
    '@docusaurus/Translate': {translate: value => value.message},
    '@theme/Layout': ({children}) => React.createElement('main', null, children),
    '@docusaurus/Link': ({to, children, ...props}) => {
      const href = applyTrailingSlash(addBaseUrl({
        url: to, baseUrl, siteUrl: 'https://example.org', router: 'browser',
      }), {baseUrl, trailingSlash: false});
      return React.createElement('a', {...props, href}, children);
    },
  });
  return file => renderToStaticMarkup(React.createElement(load(file).default));
}

function renderPage(file, locale, baseUrl) {
  return createRenderer(locale, baseUrl)(file);
}

test('document routes match actual Docusaurus metadata for indexes, prefixes, IDs and slugs', async t => {
  const directory = temporarySite(t);
  const cases = [
    ['index.md', {}, '/docs/'],
    ['guide/index.md', {}, '/docs/guide/'],
    ['guide/README.md', {}, '/docs/guide/'],
    ['guide/guide.md', {}, '/docs/guide/'],
    ['guide/GUIDE.md', {}, '/docs/guide/'],
    ['01-guide/02-topic.md', {}, '/docs/guide/topic'],
    ['1.2-version/2026-09-18-release.md', {}, '/docs/1.2-version/2026-09-18-release'],
    ['01-guide/02-topic.md', {parse_number_prefixes: false}, '/docs/01-guide/02-topic'],
    ['guide/topic.md', {id: 'different-id'}, '/docs/guide/different-id'],
    ['guide/index.md', {id: 'different-id'}, '/docs/guide/'],
    ['guide/topic.md', {slug: '/absolute'}, '/docs/absolute'],
    ['guide/topic.md', {slug: 'relative'}, '/docs/guide/relative'],
    ['guide/topic.md', {slug: '../sibling'}, '/docs/sibling'],
    ['guide/topic.md', {slug: '/'}, '/docs/'],
    ['guide/topic.md', {slug: '/한글'}, '/docs/한글'],
    ['01-guide/02-topic.md', {slug: 'relative', parse_number_prefixes: false}, '/docs/01-guide/relative'],
  ];
  for (const [source, frontMatter, expected] of cases) {
    const content = `---\n${yaml.dump(frontMatter)}---\n\nFixture.\n`;
    const metadata = await processDocMetadata({
      docFile: {source, content, filePath: path.join(directory, source), contentPath: directory},
      versionMetadata: {versionName: 'current', path: '/docs', tagsPath: '/docs/tags'},
      context: {siteDir: directory, i18n: {currentLocale: 'ko'},
        siteConfig: {markdown: {parseFrontMatter: DEFAULT_PARSE_FRONT_MATTER}}},
      options: DOCS_OPTIONS, env: 'production',
    });
    assert.equal(metadata.permalink, expected, source);
    assert.equal(documentRoute(source, frontMatter), expected, source);
  }
  assert.equal(documentRoute('01-guide\\02-topic.md', {}), '/docs/guide/topic');
  assert.equal(documentRoute('index.md', {}, {routeBasePath: 'manual'}), '/manual/');
  assert.equal(documentRoute('topic.md', {}, {
    routeBasePath: 'docs', versions: {current: {path: 'next'}},
  }), '/docs/next/topic');
  assert.equal(documentRoute('A-guide/B-topic.md', {}, {
    routeBasePath: 'manual',
    numberPrefixParser: filename => ({filename: filename.replace(/^[A-Z]-/, '')}),
  }), '/manual/guide/topic');
  assert.throws(() => documentRoute('topic.md', {id: 'invalid/id'}), /cannot include slash/);
});

test('collection honors configured docs paths, exclusions, disabled blog and localized slugs', async t => {
  const directory = temporarySite(t);
  writeDoc(directory, 'manual/05-architecture.md');
  writeDoc(directory, 'manual/guide/index.md');
  writeDoc(directory, 'manual/localized.md', {slug: '/korean'});
  writeDoc(directory, 'manual/fallback.md');
  writeDoc(directory, 'manual/_partial.md');
  writeDoc(directory, 'manual/_partials/included.md');
  writeDoc(directory, 'manual/draft.md', {draft: true});
  writeDoc(directory, 'manual/unlisted.md', {unlisted: true});
  writeDoc(directory, 'manual/excluded.md');
  writeDoc(directory, 'blog/2026-09-18-post.md', {tags: ['blog-only']});
  writeDoc(directory, 'translations/english/docusaurus-plugin-content-docs/current/localized.md',
    {slug: '/english'});
  writeDoc(directory, 'translations/english/docusaurus-plugin-content-docs/current/translated-only.md');
  const siteConfig = config({
    path: 'manual', routeBasePath: 'reference',
    exclude: [...DOCS_OPTIONS.exclude, '**/excluded.md'],
  }, {
    i18n: {
      defaultLocale: 'ko', locales: ['ko', 'en'], path: 'translations',
      localeConfigs: {en: {path: 'english'}},
    },
  });
  const documents = await collectDocuments({siteDir: directory, siteConfig});
  assert.deepEqual(documents.map(doc => doc.relativePath).sort(),
    ['05-architecture.md', 'fallback.md', 'guide/index.md', 'localized.md']);
  const localized = documents.find(doc => doc.relativePath === 'localized.md');
  assert.deepEqual(localized.pathsByLocale, {ko: '/reference/korean', en: '/reference/english'});
  assert.equal(documents.find(doc => doc.relativePath === 'guide/index.md').path, '/reference/guide/');
  assert.equal(documents.find(doc => doc.relativePath === '05-architecture.md').path, '/reference/architecture');
  assert.equal(documentRouteForLocale(documents.find(doc => doc.relativePath === 'fallback.md'), 'en'),
    '/reference/fallback');
  assert.ok(!Object.hasOwn(generateTagStats(documents), 'blog-only'));
});

test('locale translation opt-out and localized drafts do not produce invalid destinations', async t => {
  const directory = temporarySite(t);
  writeDoc(directory, 'docs/article.md');
  writeDoc(directory, 'i18n/en/docusaurus-plugin-content-docs/current/article.md',
    {slug: '/english-only', draft: true});
  const enabled = await collectDocuments({siteDir: directory, siteConfig: config()});
  assert.equal(documentRouteForLocale(enabled[0], 'en'), null);
  const disabled = await collectDocuments({siteDir: directory, siteConfig: config({}, {
    i18n: {defaultLocale: 'ko', locales: ['ko', 'en'], localeConfigs: {en: {translate: false}}},
  })});
  assert.equal(documentRouteForLocale(disabled[0], 'en'), '/docs/article');
  assert.equal(documentRouteForLocale({path: '/docs/legacy'}, 'en'), '/docs/legacy');
});

test('a published translation contributes its own tags even when the source is draft or untagged', async t => {
  const directory = temporarySite(t);
  writeDoc(directory, 'docs/draft.md', {draft: true});
  writeDoc(directory, 'docs/untagged.md', {tags: []});
  for (const name of ['draft', 'untagged']) {
    writeDoc(directory, `i18n/en/docusaurus-plugin-content-docs/current/${name}.md`,
      {tags: ['english-only']});
  }
  const documents = await collectDocuments({siteDir: directory, siteConfig: config()});
  assert.equal(documents.length, 2);
  const stats = generateTagStats(documents);
  assert.deepEqual(Object.keys(stats), ['english-only']);
  assert.equal(stats['english-only'].byLocale.en.count, 2);
  assert.equal(stats['english-only'].byLocale.ko, undefined);
  assert.equal(documents.find(doc => doc.relativePath === 'draft.md').pathsByLocale.ko, null);
});

test('enabled blog routes use Docusaurus date and explicit-slug conventions', async t => {
  const directory = temporarySite(t);
  writeDoc(directory, 'blog/2026-09-18-post.md', {tags: ['blog-only']});
  const documents = await collectDocuments({siteDir: directory, siteConfig: config({}, {
    presets: [['classic', {docs: false, blog: {routeBasePath: 'articles'}}]],
  })});
  assert.equal(documents.length, 1);
  assert.equal(documents[0].path, '/articles/2026/09/18/post');
  assert.equal(blogRoute('2026-09-18-post.md', {slug: '/custom'}, {routeBasePath: 'articles'}),
    '/articles/custom');
});

test('custom tag routes preserve JSX filename encoding instead of native docs tag slugs', () => {
  for (const tag of ['scope:ops', 'scope-ops', 'AWS', 'hello world', '한글', 'a+b', "owner's", 'a/b', 'a/index']) {
    assert.equal(tagPageRoute(tag), encodePath(fileToPath(`tags/${tag}.js`)), tag);
  }
  assert.equal(tagPageRoute('scope:ops'), '/tags/scope%3Aops');
  assert.notEqual(tagPageRoute('scope:ops'), tagPageRoute('scope-ops'));
});

test('generated pages and TagList render existing encoded tag and correct locale document routes', async t => {
  const directory = temporarySite(t);
  writeDoc(directory, 'docs/guide/index.md');
  writeDoc(directory, 'docs/05-architecture.md');
  writeDoc(directory, 'docs/localized.md', {slug: '/korean', tags: ['scope:ops', 'scope-ops']});
  writeDoc(directory, 'i18n/en/docusaurus-plugin-content-docs/current/localized.md',
    {title: 'English title', slug: '/english', tags: ['scope:ops', 'english-only']});
  const outputDir = path.join(directory, 'src/pages/tags');
  const generated = await main({siteDir: directory, siteConfig: config(), outputDir});
  assert.equal(generated.generatedPages, 4);
  assert.ok(fs.existsSync(path.join(outputDir, 'scope:ops.js')));
  assert.ok(fs.existsSync(path.join(outputDir, 'scope-ops.js')));
  assert.ok(fs.existsSync(path.join(outputDir, 'english-only.js')));
  for (const locale of ['ko', 'en']) {
    const baseUrl = locale === 'ko' ? '/engineering-playbook/' : '/engineering-playbook/en/';
    const pages = await loadPagesContent({
      options: PAGES_OPTIONS,
      contentPaths: {contentPath: path.join(directory, 'src/pages')},
      context: {siteDir: directory, baseUrl},
    });
    const generatedRoutes = new Set(pages.map(page => page.permalink.replace(/\/$/, '')));
    const indexLinks = hrefs(renderPage(path.join(outputDir, 'index.js'), locale, baseUrl));
    assert.ok(indexLinks.includes(`${baseUrl}tags/scope%3Aops`));
    assert.equal(indexLinks.includes(`${baseUrl}tags/english-only`), locale === 'en');
    assert.equal(indexLinks.includes(`${baseUrl}tags/scope-ops`), locale === 'ko');
    assert.ok(indexLinks.every(link => generatedRoutes.has(link)));

    const pageHTML = renderPage(path.join(outputDir, 'scope:ops.js'), locale, baseUrl);
    const pageLinks = hrefs(pageHTML);
    assert.ok(pageLinks.includes(`${baseUrl}docs/guide`));
    assert.ok(pageLinks.includes(`${baseUrl}docs/architecture`));
    assert.ok(pageLinks.includes(`${baseUrl}docs/${locale === 'en' ? 'english' : 'korean'}`));
    assert.ok(!pageLinks.some(link => link.includes('/index') || link.includes('/05-architecture')));
    assert.ok(pageLinks.filter(link => link.includes('/tags/')).every(link => generatedRoutes.has(link)));
    assert.ok(pageLinks.includes(`${baseUrl}tags/${locale === 'en' ? 'english-only' : 'scope-ops'}`));
    assert.equal(pageHTML.includes('English title'), locale === 'en');
    assert.ok(pageLinks.every(link => link.startsWith(baseUrl)));
    assert.ok(!pageLinks.some(link => link.includes('/en/en/') || link.includes('scope:ops')));

    const translatedTagLinks = hrefs(renderPage(path.join(outputDir, 'english-only.js'), locale, baseUrl));
    assert.deepEqual(translatedTagLinks.filter(link => link.includes('/docs/')),
      locale === 'en' ? [`${baseUrl}docs/english`] : []);
  }
});

test('tag generation rejects index collisions and escaping filenames before writing', async t => {
  for (const tag of ['index', '../../outside']) {
    const directory = temporarySite(t);
    writeDoc(directory, 'docs/article.md', {tags: [tag]});
    const outputDir = path.join(directory, 'output');
    await assert.rejects(main({siteDir: directory, siteConfig: config(), outputDir}),
      /Duplicate generated tag route|leaves the output directory/);
    assert.equal(fs.existsSync(outputDir), false);
  }
});

function outputSnapshot(directory) {
  return Object.fromEntries(fs.readdirSync(directory, {recursive: true})
    .filter(relative => fs.lstatSync(path.join(directory, relative)).isFile())
    .sort().map(relative => [relative, fs.readFileSync(path.join(directory, relative), 'utf8')]));
}

test('regeneration removes obsolete generated pages for drafts, unlisted docs, deleted docs and removed tags', async t => {
  for (const reason of ['draft', 'unlisted', 'deleted', 'untagged']) {
    const directory = temporarySite(t);
    const outputDir = path.join(directory, 'src/pages/tags');
    const article = writeDoc(directory, 'docs/article.md', {tags: ['retired/nested']});
    writeDoc(directory, 'docs/retained.md', {tags: ['retained']});
    const siteConfig = config();
    await main({siteDir: directory, siteConfig, outputDir});
    fs.writeFileSync(path.join(outputDir, 'manual.js'), 'export default function Manual() { return null; }\n');
    fs.writeFileSync(path.join(outputDir, 'notes.txt'), 'Keep these manual notes.\n');
    if (reason === 'deleted') fs.unlinkSync(article);
    else writeDoc(directory, 'docs/article.md', reason === 'untagged'
      ? {tags: []} : {tags: ['retired/nested'], [reason]: true});
    const result = await main({siteDir: directory, siteConfig, outputDir});
    assert.equal(result.removedPages, 1, reason);
    assert.equal(fs.existsSync(path.join(outputDir, 'retired/nested.js')), false, reason);
    assert.ok(fs.existsSync(path.join(outputDir, 'retained.js')), reason);
    assert.equal(fs.readFileSync(path.join(outputDir, 'manual.js'), 'utf8'),
      'export default function Manual() { return null; }\n');
    assert.equal(fs.readFileSync(path.join(outputDir, 'notes.txt'), 'utf8'), 'Keep these manual notes.\n');
    for (const locale of ['ko', 'en']) {
      const baseUrl = `/engineering-playbook/${locale === 'en' ? 'en/' : ''}`;
      const links = hrefs(renderPage(path.join(outputDir, 'index.js'), locale, baseUrl));
      assert.ok(!links.some(link => link.includes('retired')), reason);
      assert.ok(links.includes(`${baseUrl}tags/retained`), reason);
    }
  }
});

test('unmarked legacy outputs are adopted only when their full template is unchanged', async t => {
  const directory = temporarySite(t);
  const outputDir = path.join(directory, 'src/pages/tags');
  writeDoc(directory, 'docs/article.md', {
    title: "Literal replacement characters: $& $$ $` $'",
    tags: ['legacy', 'retired', 'customized'],
  });
  const siteConfig = config();
  await main({siteDir: directory, siteConfig, outputDir});
  for (const name of ['legacy', 'retired', 'customized', 'index']) {
    const file = path.join(outputDir, `${name}.js`);
    const content = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, content.slice(content.indexOf('\n') + 1));
  }
  const customizedFile = path.join(outputDir, 'customized.js');
  fs.appendFileSync(customizedFile, '\n// Manual addition: preserve this file.\n');
  const customized = fs.readFileSync(customizedFile, 'utf8');
  writeDoc(directory, 'docs/article.md', {title: 'Updated title', tags: ['legacy']});
  const result = await main({siteDir: directory, siteConfig, outputDir});
  assert.equal(result.removedPages, 1);
  assert.equal(fs.existsSync(path.join(outputDir, 'retired.js')), false);
  assert.equal(fs.readFileSync(customizedFile, 'utf8'), customized);
  assert.match(fs.readFileSync(path.join(outputDir, 'legacy.js'), 'utf8'),
    /^\/\/ Generated by scripts\/generate-tag-pages\.js; sha256=[a-f0-9]{64}\n/);
  assert.ok(fs.readFileSync(path.join(outputDir, 'legacy.js'), 'utf8').includes('Updated title'));
  assert.match(fs.readFileSync(path.join(outputDir, 'index.js'), 'utf8'), /^\/\/ Generated by/);
});

test('manually edited generated outputs are neither deleted nor overwritten', async t => {
  const directory = temporarySite(t);
  const outputDir = path.join(directory, 'src/pages/tags');
  const siteConfig = config();
  writeDoc(directory, 'docs/article.md', {tags: ['customized', 'retired']});
  await main({siteDir: directory, siteConfig, outputDir});
  fs.appendFileSync(path.join(outputDir, 'customized.js'), '\n// Keep my edit.\n');
  const edited = fs.readFileSync(path.join(outputDir, 'customized.js'), 'utf8');
  // A conflicting active output aborts before an otherwise obsolete file is deleted.
  writeDoc(directory, 'docs/article.md', {tags: ['customized', 'new-page']});
  const before = outputSnapshot(outputDir);
  await assert.rejects(main({siteDir: directory, siteConfig, outputDir}), /manual or modified output/);
  assert.deepEqual(outputSnapshot(outputDir), before);
  // Once the tag is retired, leave the manually edited page to its owner.
  writeDoc(directory, 'docs/article.md', {tags: ['new-page']});
  const result = await main({siteDir: directory, siteConfig, outputDir});
  assert.equal(result.removedPages, 1);
  assert.equal(fs.readFileSync(path.join(outputDir, 'customized.js'), 'utf8'), edited);
});

test('normalized route collisions abort before writes or cleanup for every trailing slash setting', async t => {
  for (const trailingSlash of [false, true, undefined]) {
    const directory = temporarySite(t);
    const outputDir = path.join(directory, 'src/pages/tags');
    const siteConfig = config({}, {trailingSlash});
    writeDoc(directory, 'docs/article.md', {tags: ['retired']});
    await main({siteDir: directory, siteConfig, outputDir});
    const before = outputSnapshot(outputDir);
    writeDoc(directory, 'docs/article.md', {tags: ['new-page', 'foo', 'foo/index']});
    await assert.rejects(main({siteDir: directory, siteConfig, outputDir}),
      /Duplicate generated tag route: \/tags\/foo/);
    assert.deepEqual(outputSnapshot(outputDir), before);
  }
});

test('manual files and manual route aliases block conflicting generation before mutation', async t => {
  for (const manual of ['index.js', 'foo.js', 'foo/index.js']) {
    const directory = temporarySite(t);
    const outputDir = path.join(directory, 'src/pages/tags');
    writeDoc(directory, 'docs/article.md', {tags: ['foo']});
    const manualPath = path.join(outputDir, manual);
    fs.mkdirSync(path.dirname(manualPath), {recursive: true});
    fs.writeFileSync(manualPath, 'export default function ManualPage() { return null; }\n');
    const before = outputSnapshot(outputDir);
    await assert.rejects(main({siteDir: directory, siteConfig: config(), outputDir}),
      /manual or modified output|conflicts with manual output/);
    assert.deepEqual(outputSnapshot(outputDir), before);
  }
});

test('cleanup preserves symlinks and refuses to write through linked files or directories', async t => {
  const directory = temporarySite(t);
  const outputDir = path.join(directory, 'src/pages/tags');
  const siteConfig = config();
  writeDoc(directory, 'docs/article.md', {tags: ['retired']});
  await main({siteDir: directory, siteConfig, outputDir});
  const outside = path.join(directory, 'outside');
  fs.mkdirSync(outside);
  const externalFile = path.join(outside, 'outside.js');
  const generated = fs.readFileSync(path.join(outputDir, 'retired.js'), 'utf8');
  fs.writeFileSync(externalFile, generated);
  fs.symlinkSync(outside, path.join(outputDir, 'linked'));
  fs.symlinkSync(externalFile, path.join(outputDir, 'linked-file.js'));
  writeDoc(directory, 'docs/article.md', {tags: []});
  assert.equal((await main({siteDir: directory, siteConfig, outputDir})).removedPages, 1);
  assert.equal(fs.readFileSync(externalFile, 'utf8'), generated);
  assert.ok(fs.lstatSync(path.join(outputDir, 'linked-file.js')).isSymbolicLink());
  for (const tag of ['linked/new-page', 'linked-file']) {
    writeDoc(directory, 'docs/article.md', {tags: [tag]});
    const before = outputSnapshot(outputDir);
    await assert.rejects(main({siteDir: directory, siteConfig, outputDir}),
      /not a regular directory|manual or modified output/);
    assert.deepEqual(outputSnapshot(outputDir), before);
    assert.deepEqual(fs.readdirSync(outside), ['outside.js']);
    assert.equal(fs.readFileSync(externalFile, 'utf8'), generated);
  }
  const linkedOutput = path.join(directory, 'linked-output');
  fs.symlinkSync(outside, linkedOutput);
  await assert.rejects(main({siteDir: directory, siteConfig, outputDir: linkedOutput}),
    /not a regular directory/);
  assert.deepEqual(fs.readdirSync(outside), ['outside.js']);
});

test('ambiguous dot-segment and backslash filenames are rejected before output creation', async t => {
  for (const tag of ['foo/../index', './index', 'foo//index', 'foo\\index']) {
    const directory = temporarySite(t);
    const outputDir = path.join(directory, 'output');
    writeDoc(directory, 'docs/article.md', {tags: [tag]});
    await assert.rejects(main({siteDir: directory, siteConfig: config(), outputDir}),
      /Unsupported generated tag filename/);
    assert.equal(fs.existsSync(outputDir), false);
  }
});

test('all repository tag-page links resolve to current Docusaurus metadata in both locales', async t => {
  // This invokes only metadata readers and component SSR, never the site build,
  // plugins, network, or the repository's generated-pages output directory.
  const directory = temporarySite(t);
  const siteConfig = await loadFreshModule(path.join(root, 'docusaurus.config.js'));
  const outputDir = path.join(directory, 'src/pages/tags');
  const generated = await main({siteDir: root, siteConfig, outputDir});
  const rawDocsOptions = siteConfig.presets.find(entry => entry[0] === 'classic')[1].docs;
  const options = {...DOCS_OPTIONS, ...rawDocsOptions};
  if (typeof options.sidebarPath === 'string') {
    options.sidebarPath = path.resolve(root, options.sidebarPath);
  }
  const localeConfigs = Object.fromEntries(siteConfig.i18n.locales.map(locale => [
    locale, {translate: true, ...siteConfig.i18n.localeConfigs?.[locale]},
  ]));
  const normalize = url => applyTrailingSlash(url, {
    baseUrl: siteConfig.baseUrl, trailingSlash: siteConfig.trailingSlash,
  });
  let documentsChecked = 0;
  let pagesChecked = 0;
  let linksChecked = 0;
  for (const locale of siteConfig.i18n.locales) {
    const localeConfig = localeConfigs[locale];
    const baseUrl = locale === siteConfig.i18n.defaultLocale
      ? siteConfig.baseUrl : `${siteConfig.baseUrl}${locale}/`;
    const context = {
      siteDir: root, baseUrl,
      localizationDir: path.resolve(root, siteConfig.i18n.path || 'i18n', localeConfig.path || locale),
      i18n: {...siteConfig.i18n, currentLocale: locale, localeConfigs},
      siteConfig: {
        ...siteConfig,
        markdown: {parseFrontMatter: DEFAULT_PARSE_FRONT_MATTER, ...siteConfig.markdown},
      },
    };
    const versions = await readVersionsMetadata({context, options});
    const versionMetadata = versions.find(version => version.versionName === 'current');
    assert.ok(versionMetadata, 'This generator indexes current docs');
    const docFiles = await readVersionDocs(versionMetadata, options);
    const tagsFile = await getTagsFile({contentPaths: versionMetadata, tags: options.tags});
    const metadata = await Promise.all(docFiles.map(docFile =>
      processDocMetadata({docFile, versionMetadata, context, options, env: 'production', tagsFile})));
    const documentRoutes = new Set(metadata.filter(doc => !doc.draft).map(doc => normalize(doc.permalink)));
    for (const doc of generated.documents) {
      if (!doc.pathsByLocale[locale]) continue;
      const permalink = normalize(`${baseUrl}${doc.pathsByLocale[locale].replace(/^\//, '')}`);
      assert.ok(documentRoutes.has(permalink), `${locale}: ${doc.relativePath} -> ${permalink}`);
      documentsChecked++;
    }
    const pages = await loadPagesContent({
      options: PAGES_OPTIONS,
      contentPaths: {contentPath: path.join(directory, 'src/pages')},
      context: {siteDir: directory, baseUrl},
    });
    const pageRoutes = new Set(pages.map(page => normalize(page.permalink)));
    const validRoutes = new Set([...documentRoutes, ...pageRoutes]);
    const render = createRenderer(locale, baseUrl);
    for (const page of pages) {
      const file = path.join(directory, page.source.replace(/^@site\//, ''));
      for (const href of hrefs(render(file))) {
        assert.ok(validRoutes.has(href), `${locale}: ${page.permalink} -> ${href}`);
        assert.ok(href.startsWith(baseUrl), `Unexpected locale: ${href}`);
        linksChecked++;
      }
      pagesChecked++;
    }
    for (const [tag, stats] of Object.entries(generated.tagStats)) {
      if (!stats.byLocale[locale]) continue;
      assert.ok(pageRoutes.has(normalize(`${baseUrl}${tagPageRoute(tag).replace(/^\//, '')}`)), tag);
    }
  }
  t.diagnostic(`${documentsChecked} doc routes, ${generated.generatedPages} tag pages + index, ` +
    `${pagesChecked} locale-page renders, ${linksChecked} links checked`);
});
