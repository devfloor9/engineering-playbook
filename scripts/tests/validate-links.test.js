const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {spawnSync} = require('node:child_process');
const yaml = require('js-yaml');
const {extractDocument, createContext, checkInternalLink, normalizeExternal, classifyResponse,
  checkExternalLink, validate, markdownReport, exitCode, parseArgs, readPreviousReport} = require('../validate-links');

function fixture(t, {build = true, trailingSlash = false, baseUrl = '/playbook/'} = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'playbook-links-'));
  t.after(() => fs.rmSync(root, {recursive: true, force: true}));
  const config = {url: 'https://docs.example.org', baseUrl, trailingSlash,
    i18n: {defaultLocale: 'ko', locales: ['ko', 'en']}, presets: [['classic', {docs: {routeBasePath: 'docs'}, blog: false}]]};
  const put = (file, content) => {fs.mkdirSync(path.dirname(path.join(root, file)), {recursive: true}); fs.writeFileSync(path.join(root, file), content);};
  const md = '# Title\n\n## 반복 제목\n\n## 반복 제목\n\n## Custom {#Explicit-ID}\n\n<div id="widget" />\n';
  put('docs/start.md', md);
  put('docs/target.mdx', '---\nslug: /custom\n---\n' + md);
  put('docs/folder/index.md', md);
  put('docs/01-topic/02-detail.md', md);
  put('i18n/en/docusaurus-plugin-content-docs/current/start.md', md);
  put('i18n/en/docusaurus-plugin-content-docs/current/target.mdx', '---\nslug: /custom\n---\n' + md);
  put('static/img/space image.svg', '<svg/>');
  if (build) {
    const html = '<h1 id="title">Title</h1><h2 id="반복-제목">Repeat</h2><h2 id="반복-제목-1">Repeat</h2><h2 id="Explicit-ID">Custom</h2><div id="generated-widget"></div>';
    put('build/index.html', '<h1>Home</h1>');
    for (const route of ['docs/start', 'docs/custom', 'docs/folder', 'docs/topic/detail', 'en/docs/start', 'en/docs/custom', 'demo/generated']) {
      put(`build/${route}${trailingSlash ? '/index.html' : '.html'}`, html);
    }
    put('build/docs/old/index.html', `<meta http-equiv="refresh" content="0; url=${baseUrl}docs/custom">`);
    put('build/404.html', '<h1 id="oops">Not a route</h1>');
  }
  return {root, config, put, file: path.join(root, 'docs/start.md')};
}

test('Markdown extraction skips code/comments, resolves references and preserves source lines', async () => {
  const source = '---\ntitle: Example\n---\n\n[one](https://example.org/a_(b) "title")\n![image](./a.png)\n[ref][target]\n\n[target]: https://example.org/ref\n\n`[ignored](https://ignored.test)`\n\n```md\n[ignored](https://ignored.test)\n```\n<!-- [ignored](https://ignored.test) -->\n\n<Tabs>\n[inside](./inside.md)\n</Tabs>\n\n<a href="/html?a=1&amp;b=2">HTML</a>\n';
  const {links} = await extractDocument(source);
  assert.deepEqual(links.map(({url}) => url), ['https://example.org/a_(b)', './a.png', 'https://example.org/ref', './inside.md', '/html?a=1&b=2']);
  assert.equal(links[0].line, 5);
  assert.equal(links[1].line, 6);
  assert.equal(links[3].line, 19);
});

test('source heading IDs retain Unicode, duplicate suffixes, custom IDs and explicit elements', async () => {
  const {ids} = await extractDocument('# 한글 **제목**\n\n## 한글 제목\n\n## Other {#Case-ID}\n\n<div id="component-anchor" />\n\nSetext\n------\n');
  assert.deepEqual([...ids], ['한글-제목', '한글-제목-1', 'Case-ID', 'component-anchor', 'setext']);
});

for (const trailingSlash of [false, true]) {
  test(`built routes resolve base URL, locales, fragments and generated pages (trailingSlash=${trailingSlash})`, async t => {
    const f = fixture(t, {trailingSlash});
    const context = await createContext(f);
    const valid = ['/docs/custom', '/playbook/docs/custom', '/playbook/docs/custom?mode=1#Explicit-ID',
      './target.mdx#Explicit-ID', './target.mdx#generated-widget', '/target.mdx#Explicit-ID',
      '@site/docs/target.mdx', '/docs/target.mdx', 'target.mdx', '/playbook/docs/folder/', '/demo/generated',
      '/playbook/en/docs/custom#Explicit-ID', '/img/space%20image.svg?v=1',
      '#%EB%B0%98%EB%B3%B5-%EC%A0%9C%EB%AA%A9-1', '/playbook/docs/old#generated-widget', '#top'];
    for (const link of valid) assert.equal(checkInternalLink(link, f.file, context).exists, true, link);
    assert.equal(checkInternalLink('/playbook/docs/custom#widget', f.file, context).category, 'missing_fragment');
    assert.equal(checkInternalLink('/playbook/docs/missing', f.file, context).category, 'missing_route');
    assert.equal(checkInternalLink('/playbook/docs/custom#wrong', f.file, context).category, 'missing_fragment');
    assert.equal(checkInternalLink('/playbook/404', f.file, context).category, 'missing_route');
    assert.equal(checkInternalLink('/playbook/zh/docs/custom', f.file, context).category, 'missing_route');
    assert.equal(checkInternalLink('./missing.md', f.file, context).category, 'missing_source');
    const en = path.join(f.root, 'i18n/en/docusaurus-plugin-content-docs/current/start.md');
    assert.equal(checkInternalLink('./target.mdx#Explicit-ID', en, context).target, '/playbook/en/docs/custom' + (trailingSlash ? '/' : ''));
    assert.equal(checkInternalLink('/docs/custom#Explicit-ID', en, context).target, '/playbook/en/docs/custom');
    assert.equal(checkInternalLink('https://docs.example.org/docs/custom', f.file, context).category, 'missing_route');
    const relative = trailingSlash ? '../custom#Explicit-ID' : './custom#Explicit-ID';
    assert.equal(checkInternalLink(relative, f.file, context).exists, true);
  });
}

test('root deployment, numbered source paths and generated metadata slugs are supported', async t => {
  const f = fixture(t, {baseUrl: '/'});
  f.put('.docusaurus/docusaurus-plugin-content-docs/default/source.json', JSON.stringify({source: '@site/docs/target.mdx', permalink: '/docs/metadata-slug'}));
  f.put('build/docs/metadata-slug.html', '<h2 id="built-only">Heading</h2>');
  const context = await createContext(f);
  assert.equal(checkInternalLink('/docs/topic/detail', f.file, context).exists, true);
  assert.equal(checkInternalLink('./target.mdx#built-only', f.file, context).target, '/docs/metadata-slug');
});

test('build is authoritative and does not fall back to a source-only page or heading', async t => {
  const f = fixture(t);
  f.put('docs/unbuilt.md', '# Unbuilt');
  const context = await createContext(f);
  assert.equal(checkInternalLink('./unbuilt.md', f.file, context).category, 'missing_route');
  assert.equal(checkInternalLink('./target.mdx#widget', f.file, context).category, 'missing_fragment');
});

test('source fallback gives useful positives and explicit unverified results', async t => {
  const f = fixture(t, {build: false});
  const context = await createContext(f);
  assert.equal(context.hasBuild, false);
  assert.equal(checkInternalLink('./target.mdx#Explicit-ID', f.file, context).evidence, 'source');
  assert.equal(checkInternalLink('./target.mdx#generated-widget', f.file, context).category, 'unverified');
  assert.equal(checkInternalLink('/demo/generated', f.file, context).category, 'unverified');
  assert.equal(checkInternalLink('/docs/folder', f.file, context).exists, true);
  assert.match(context.warnings[0].reason, /Source fallback/);
});

test('local directories and path traversal cannot masquerade as files', async t => {
  const f = fixture(t);
  fs.mkdirSync(path.join(f.root, 'static/img/empty'));
  const context = await createContext(f);
  assert.equal(checkInternalLink('/img/empty', f.file, context).exists, false);
  assert.equal(checkInternalLink('../../../../etc/passwd', f.file, context).exists, false);
});

test('redirect fragments are checked at the built destination and loops fail', async t => {
  const f = fixture(t);
  f.put('build/docs/loop.html', '<meta http-equiv="refresh" content="0; url=/playbook/docs/loop">');
  const context = await createContext(f);
  assert.equal(checkInternalLink('/docs/old#missing', f.file, context).category, 'missing_fragment');
  assert.equal(checkInternalLink('/docs/loop', f.file, context).category, 'redirect_error');
});

test('external categories keep missing pages separate from authorization and transient failures', () => {
  for (const [status, expected] of [[200, 'valid'], [204, 'valid'], [301, 'redirect'], [404, 'missing_page'], [410, 'missing_page'],
    [401, 'authentication_required'], [407, 'authentication_required'], [403, 'forbidden_or_bot_protection'],
    [429, 'rate_limited'], [503, 'transient_error'], [400, 'http_error']]) assert.equal(classifyResponse(status), expected);
  assert.equal(classifyResponse(200, {'cf-mitigated': 'challenge'}), 'bot_protection');
  assert.equal(classifyResponse(200, {}, '<title>Just a moment...</title>'), 'bot_protection');
  assert.equal(normalizeExternal('https://EXAMPLE.org:443/a?q=1#heading'), 'https://example.org/a?q=1');
  assert.notEqual(normalizeExternal('https://example.org/a?q=1'), normalizeExternal('https://example.org/a?q=2'));
});

test('HTTP checks follow redirects, use GET, detect timeouts and require no live internet', async t => {
  const methods = [];
  const server = http.createServer((req, res) => {
    methods.push(req.method);
    if (req.url === '/hang') return;
    if (req.url === '/redirect') {res.writeHead(302, {Location: '/ok'}); res.end(); return;}
    if (req.url === '/stale') {res.writeHead(301, {Location: '/missing'}); res.end(); return;}
    if (req.url === '/loop') {res.writeHead(302, {Location: '/loop'}); res.end(); return;}
    if (req.url === '/no-location') {res.writeHead(302); res.end(); return;}
    if (req.url === '/bot') {res.writeHead(200, {'cf-mitigated': 'challenge'}); res.end('challenge'); return;}
    res.writeHead(req.url === '/missing' ? 404 : 200); res.end('OK');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  t.after(() => {server.closeAllConnections(); return new Promise(resolve => server.close(resolve));});
  const base = `http://127.0.0.1:${server.address().port}`;
  const options = {timeoutMs: 200, allowLocal: true};
  for (const [route, category] of [['/ok', 'valid'], ['/redirect', 'redirect'], ['/stale', 'missing_page'],
    ['/loop', 'redirect_error'], ['/no-location', 'redirect_error'], ['/bot', 'bot_protection'], ['/hang', 'timeout']]) {
    assert.equal((await checkExternalLink(base + route, options)).category, category, route);
  }
  const redirect = await checkExternalLink(base + '/redirect', options);
  assert.equal(redirect.redirects.length, 1);
  assert.equal(redirect.finalUrl, base + '/ok');
  assert.ok(methods.every(method => method === 'GET'));
});

test('malformed URLs, empty YouTube placeholders and network failures are explicit', async () => {
  assert.equal((await checkExternalLink('https://[')).category, 'invalid_url');
  assert.equal((await checkExternalLink('https://www.youtube.com/watch?v=')).category, 'invalid_placeholder');
  assert.equal((await checkExternalLink('http://localhost:8080')).category, 'excluded_example');
  assert.equal((await checkExternalLink('https://real.org/', {request: async () => ({error: 'ENOTFOUND'})})).category, 'network_error');
  assert.equal((await checkExternalLink('https://real.org/', {request: async () => ({statusCode: 302, headers: {location: '/next'}}), maxRedirects: 0})).category, 'redirect_error');
});

test('external opt-in, deduplication and advisory reporting preserve findings and query identity', async t => {
  const f = fixture(t);
  f.put('docs/start.md', '[one](https://real.org/a#one)\n[two](https://real.org/a#two)\n[query](https://real.org/a?q=1)\n[internal](/docs/custom)\n');
  let requests = 0;
  const request = async () => {requests++; return {statusCode: 404};};
  const offline = await validate({...f, request});
  assert.equal(requests, 0);
  assert.equal(offline.summary.externalUnique, 2);
  assert.equal(offline.summary.externalCategories.not_checked, 2);
  const report = await validate({...f, external: true, advisory: true, request});
  assert.equal(requests, 2);
  assert.equal(report.summary.externalOccurrences, 3);
  assert.equal(report.summary.externalActionable, 2);
  assert.equal(report.external[0].occurrences.length, 2);
  assert.equal(report.status, 'findings');
  assert.equal(exitCode(report, {advisory: true}), 0);
  assert.equal(exitCode(report, {}), 1);
  assert.match(markdownReport(report), /not that links are valid/);
  assert.match(markdownReport(report), /missing_page/);
  assert.match(markdownReport(report), /docs\/start.md:1/);
  const externalOnly = await validate({...f, externalOnly: true, external: true, request});
  assert.equal(externalOnly.summary.internalChecked, 0);
});

test('prior report rechecks only distinct HTTP failures that remain referenced', async t => {
  const f = fixture(t);
  f.put('prior.md', '* [404] <https://real.org/a> (at 1:1)\n* [403] <https://real.org/a>\n* [TIMEOUT] <https://real.org/removed>\n* [ERROR] <file:///docs/custom>');
  f.put('docs/start.md', '[a](https://real.org/a#fragment)\n[b](https://real.org/new)');
  assert.equal(readPreviousReport(path.join(f.root, 'prior.md')).size, 2);
  let requests = 0;
  const report = await validate({...f, external: true, externalFromReport: path.join(f.root, 'prior.md'), request: async () => {requests++; return {statusCode: 404};}});
  assert.equal(requests, 1);
  assert.deepEqual(report.scope.previousNoLongerReferenced, ['https://real.org/removed']);
});

test('CLI validation and workflow keep operational failures separate from advisory findings', () => {
  assert.deepEqual(parseArgs(['--external-only', '--advisory', '--concurrency', '4']), {externalOnly: true, advisory: true, concurrency: 4, external: true});
  assert.throws(() => parseArgs(['--concurrency', '0']), /positive integer/);
  assert.throws(() => parseArgs(['--json']), /Missing value/);
  assert.throws(() => parseArgs(['--unknown']), /Unknown argument/);
  const cli = spawnSync(process.execPath, [path.join(__dirname, '../validate-links.js'), '--unknown'], {encoding: 'utf8'});
  assert.equal(cli.status, 2);
  const workflow = yaml.load(fs.readFileSync(path.join(__dirname, '../../.github/workflows/link-check.yml'), 'utf8'));
  const steps = workflow.jobs['link-check'].steps;
  assert.ok(steps.some(step => step.run?.includes('--external-only --advisory')));
  assert.ok(steps.some(step => step.run?.includes('GITHUB_STEP_SUMMARY')));
  assert.ok(steps.some(step => step.with?.path?.includes('link-check-report.json')));
  assert.ok(!steps.some(step => step.uses?.includes('lychee')));
  assert.ok(workflow.on.push.paths.includes('i18n/**'));
});
