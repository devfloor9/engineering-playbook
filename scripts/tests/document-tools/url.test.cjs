const assert = require('node:assert/strict');
const {test} = require('node:test');
const path = require('node:path');
const {root, dependency, sourceLoader} = require('./source-loader.cjs');
const {canonicalDocumentUrl} = sourceLoader()(path.join(root, 'src/components/DocTools/url.js'));
const siteUrl = 'https://devfloor9.github.io';

test('copied category URLs follow the no-trailing-slash deployment rule in both locales', () => {
  for (const prefix of ['', 'en/']) {
    const route = `/engineering-playbook/${prefix}docs/agentic-ai-platform`;
    assert.equal(canonicalDocumentUrl({permalink: `${route}/`, siteUrl, trailingSlash: false}),
      `${siteUrl}${route}`);
  }
});

test('copied URLs preserve leaf paths and encoded fragments without double encoding', () => {
  const permalink = '/engineering-playbook/docs/agentic-ai-platform/model-serving';
  const hash = '#%EC%9A%94%EC%95%BD';
  assert.equal(canonicalDocumentUrl({permalink, siteUrl, trailingSlash: false, hash}),
    `${siteUrl}${permalink}${hash}`);
});

test('root URLs and deployments without the no-slash rule retain their path', () => {
  assert.equal(canonicalDocumentUrl({permalink: '/', siteUrl, trailingSlash: false}), `${siteUrl}/`);
  for (const trailingSlash of [true, undefined]) {
    assert.equal(canonicalDocumentUrl({permalink: '/manual/docs/category/', siteUrl, trailingSlash}),
      `${siteUrl}/manual/docs/category/`);
  }
});

test('both locales render metadata before two actions and copy the public category URL with the current fragment', () => {
  const React = dependency('react');
  const {renderToStaticMarkup} = dependency('react-dom/server');
  const {parseFragment} = dependency('parse5');
  const h = React.createElement;
  const nodeText = node => node.nodeName === '#text' ? node.value : (node.childNodes || []).map(nodeText).join('');
  const attr = (node, name) => node.attrs?.find(item => item.name === name)?.value;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true, value: {location: {hash: '#before-render'}},
  });
  try {
    for (const locale of ['ko', 'en']) {
      const baseUrl = `/engineering-playbook/${locale === 'en' ? 'en/' : ''}`;
      const route = `${baseUrl}docs/agentic-ai-platform`;
      let getCopyText;
      globalThis.window.location.hash = '#before-render';
      const load = sourceLoader({
        '@docusaurus/useDocusaurusContext': () => ({
          i18n: {currentLocale: locale},
          siteConfig: {url: siteUrl, trailingSlash: false,
            customFields: {documentationBaseUrl: '/engineering-playbook/'}},
        }),
        '@docusaurus/plugin-content-docs/client': {useDoc: () => ({
          metadata: {permalink: `${route}/`},
          frontMatter: {created: '2026-02-05', last_update: {date: '2026-09-18', author: 'Preserved author'}, reading_time: 6},
        })},
        '@docusaurus/useBaseUrl': url => `${baseUrl}${url.replace(/^\//, '')}`,
        '@docusaurus/Link': ({to, ...props}) => h('a', {...props, href: to}),
        '../CopyButton': ({getText, label}) => {
          getCopyText = getText;
          return h('button', {type: 'button'}, label);
        },
      });
      const DocTools = load(path.join(root, 'src/components/DocTools/index.js')).default;
      const html = renderToStaticMarkup(h(DocTools));
      const nodes = [];
      function visit(node) {
        if (node.tagName) nodes.push(node);
        node.childNodes?.forEach(visit);
      }
      visit(parseFragment(html));
      const actions = nodes.filter(node => ['button', 'a'].includes(node.tagName));
      assert.deepEqual(actions.map(node => [node.tagName, nodeText(node)]), locale === 'ko'
        ? [['button', '링크 복사'], ['a', 'AI용 문서 안내']]
        : [['button', 'Copy link'], ['a', 'AI documentation guide']]);
      assert.equal(attr(actions[1], 'href'), `${baseUrl}ai-docs`);
      const dates = nodes.filter(node => node.tagName === 'time');
      assert.equal(dates.length, 2);
      assert.ok(dates.every(node => nodes.indexOf(node) < nodes.indexOf(actions[0])), 'dates precede actions');
      const reading = locale === 'ko' ? '6분 읽기' : '6 min read';
      assert.ok(html.includes(reading) && html.indexOf(reading) < html.indexOf('<button'), 'reading time precedes actions');
      assert.doesNotMatch(html, /Markdown|<details/);
      // The stub omits CopyButton's own live region; DocTools must add none.
      assert.equal(nodes.filter(node => attr(node, 'role') === 'status' || attr(node, 'aria-live')).length, 0);
      if (locale === 'en') assert.doesNotMatch(nodeText(parseFragment(html)), /[가-힣]/u);
      assert.equal(typeof getCopyText, 'function');
      globalThis.window.location.hash = '#existing-section';
      assert.equal(getCopyText(), `${siteUrl}${route}#existing-section`);
    }
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
  }
});
