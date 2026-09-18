const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {root, dependency, sourceLoader} = require('./source-loader.cjs');
const React = dependency('react');
const {renderToStaticMarkup} = dependency('react-dom/server');
const {parseFragment} = dependency('parse5');
const h = React.createElement;

async function setup(doc, locale = 'ko') {
  const {MDXProvider} = await import(pathToFileURL(dependency.resolve('@mdx-js/react')));
  const anchors = [];
  const theme = {h1: ({id, ...props}) => h('h1', props)};
  const load = sourceLoader({
    '@docusaurus/useDocusaurusContext': () => ({
      i18n: {currentLocale: locale},
      siteConfig: {url: 'https://devfloor9.github.io', customFields: {documentationBaseUrl: '/engineering-playbook/'}},
    }),
    '@docusaurus/plugin-content-docs/client': {useDoc: () => doc},
    '@docusaurus/router': {useLocation: () => ({pathname: doc.metadata.permalink})},
    '@docusaurus/useBaseUrl': url => `/engineering-playbook${locale === 'ko' ? '' : '/en'}${url}`,
    '@docusaurus/Link': ({to, ...props}) => h('a', {...props, href: to}),
    '@docusaurus/Head': ({children}) => h(React.Fragment, null, children),
    '@docusaurus/theme-common': {ThemeClassNames: {docs: {docMarkdown: 'theme-doc-markdown'}}},
    '@docusaurus/useBrokenLinks': () => ({collectAnchor: id => anchors.push(id)}),
    '@theme/Heading': ({as, id, ...props}) => h(as, {...props, id: as === 'h1' ? undefined : id}),
    '@theme/MDXContent': ({children}) => h(MDXProvider, {components: theme}, children),
  });
  return {load, anchors};
}

const baseDoc = {
  metadata: {title: 'Document title', permalink: '/engineering-playbook/docs/aidlc', source: '@site/docs/aidlc/index.md'},
  frontMatter: {created: '2026-02-05', last_update: {date: '2026-09-18', author: 'Preserved author'}, reading_time: 6},
};

function elements(html) {
  const result = [];
  function visit(node) {
    if (node.tagName) result.push(node);
    node.childNodes?.forEach(visit);
  }
  visit(parseFragment(html));
  return result;
}
const attr = (node, name) => node.attrs.find(item => item.name === name)?.value;

test('synthetic title precedes metadata, tools and introduction; existing alternate is preserved', async () => {
  const {load} = await setup(baseDoc);
  const Content = load(path.join(root, 'src/theme/DocItem/Content')).default;
  const html = renderToStaticMarkup(h(Content, null, h('p', {id: 'intro'}, 'Introduction')));
  const nodes = elements(html);
  const positions = ['h1', 'time', 'button', 'p'].map(tag => nodes.findIndex(node => node.tagName === tag));
  assert.deepEqual(positions, [...positions].sort((a, b) => a - b));
  assert.equal(nodes.filter(node => node.tagName === 'h1').length, 1);
  assert.match(html, /type="text\/markdown" href="https:\/\/devfloor9.github.io\/engineering-playbook\/llm-wiki\/aidlc\/index.md"/);
});

test('compiled source H1 keeps inline content, explicit ID and title/meta/tools/intro order', async () => {
  const {compile, run} = await import(pathToFileURL(dependency.resolve('@mdx-js/mdx')));
  const mdxReact = await import(pathToFileURL(dependency.resolve('@mdx-js/react')));
  const titlePlugin = dependency('@docusaurus/mdx-loader/lib/remark/contentTitle').default;
  const headingPlugin = dependency('@docusaurus/mdx-loader/lib/remark/headings').default;
  const compiled = await compile('# A **meaningful** title {#original-title}\n\nIntroduction.\n\n## Section {#section-old}', {
    format: 'md', outputFormat: 'function-body', providerImportSource: '@mdx-js/react',
    remarkPlugins: [titlePlugin, [headingPlugin, {anchorsMaintainCase: false}]],
  });
  const {default: Body} = await run(compiled, {
    ...dependency('react/jsx-runtime'), useMDXComponents: mdxReact.useMDXComponents,
  });
  for (const hide_title of [false, true]) {
    const doc = {...baseDoc, contentTitle: compiled.data.contentTitle, frontMatter: {...baseDoc.frontMatter, hide_title}};
    const {load, anchors} = await setup(doc);
    const Content = load(path.join(root, 'src/theme/DocItem/Content')).default;
    const html = renderToStaticMarkup(h(Content, null, h(Body)));
    const nodes = elements(html);
    assert.equal(nodes.filter(node => node.tagName === 'h1').length, 1);
    assert.match(html, /id="original-title"/);
    assert.match(html, /<strong>meaningful<\/strong>/);
    assert.match(html, /id="section-old"/);
    assert.ok(html.indexOf('<h1') < html.indexOf('<time'));
    assert.ok(html.indexOf('<time') < html.indexOf('<button'));
    assert.ok(html.indexOf('aria-label="문서 도구"') < html.indexOf('Introduction.'));
    assert.deepEqual(anchors, ['original-title']);
  }
});

test('hide_title still suppresses only the synthetic title and English has no Korean alternate', async () => {
  const doc = {...baseDoc, frontMatter: {...baseDoc.frontMatter, hide_title: true}};
  const {load} = await setup(doc, 'en');
  const Content = load(path.join(root, 'src/theme/DocItem/Content')).default;
  const html = renderToStaticMarkup(h(Content, null, h('p', null, 'Introduction')));
  assert.doesNotMatch(html, /<h1|rel="alternate"/);
  assert.match(html, /Published 2026-02-05/);
  assert.match(html, /Document tools/);
});

test('metadata retains date deduplication, UTC Date values, reading time and author data', async () => {
  const frontMatter = {created: new Date('2026-02-05T23:30:00Z'), last_update: {date: '2026-02-05', author: 'Preserved author'}, reading_time: 6};
  const before = JSON.stringify(frontMatter);
  const {load} = await setup({...baseDoc, frontMatter}, 'en');
  const Meta = load(path.join(root, 'src/theme/DocMeta')).default;
  const html = renderToStaticMarkup(h(Meta));
  assert.equal(elements(html).filter(node => node.tagName === 'time').length, 1);
  assert.match(html, /dateTime="2026-02-05"/i);
  assert.match(html, /6 min read/);
  assert.equal(elements(html).filter(node => node.tagName === 'svg').length, 2);
  assert.equal(JSON.stringify(frontMatter), before);
  assert.doesNotMatch(html, /📅|🔄|⏱/u);
});

test('metadata with no fields renders nothing', async () => {
  const {load} = await setup({...baseDoc, frontMatter: {}});
  assert.equal(renderToStaticMarkup(h(load(path.join(root, 'src/theme/DocMeta')).default)), '');
});

test('current document source titles are unique and precede visible introductory content', async t => {
  const {unified} = await import(pathToFileURL(dependency.resolve('unified')));
  const {default: parse} = await import(pathToFileURL(dependency.resolve('remark-parse')));
  const matter = dependency('gray-matter');
  const parser = unified().use(parse);
  let titles = 0;
  for (const directory of ['docs', 'i18n/en/docusaurus-plugin-content-docs/current']) {
    for (const file of fs.readdirSync(path.join(root, directory), {recursive: true}).filter(name => /\.mdx?$/.test(name))) {
      const source = matter(fs.readFileSync(path.join(root, directory, file), 'utf8')).content;
      const tree = parser.parse(source);
      const headings = tree.children.filter(node => node.type === 'heading' && node.depth === 1);
      if (!headings.length) continue;
      titles += 1;
      assert.equal(headings.length, 1, file);
      // Imports in .md sources are paragraphs to remark-parse, but do not emit
      // visible content when Docusaurus compiles the document.
      const visible = tree.children.filter(node =>
        !/^\s*(?:import|export)\s/.test(source.slice(node.position.start.offset, node.position.end.offset)));
      assert.equal(visible[0], headings[0], `${directory}/${file}: source title must precede the introduction`);
    }
  }
  t.diagnostic(`Checked ${titles} documents with source H1 headings.`);
});
