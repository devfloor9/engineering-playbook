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

test('the rendered document copy action uses the configured public category URL', () => {
  const React = dependency('react');
  const {renderToStaticMarkup} = dependency('react-dom/server');
  const h = React.createElement;
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', {
    configurable: true, value: {location: {hash: '#existing-section'}},
  });
  try {
    const load = sourceLoader({
      '@docusaurus/useDocusaurusContext': () => ({
        i18n: {currentLocale: 'ko'},
        siteConfig: {url: siteUrl, trailingSlash: false,
          customFields: {documentationBaseUrl: '/engineering-playbook/'}},
      }),
      '@docusaurus/plugin-content-docs/client': {useDoc: () => ({
        metadata: {permalink: '/engineering-playbook/docs/agentic-ai-platform/'},
      })},
      '@docusaurus/useBaseUrl': url => `/engineering-playbook${url}`,
      '@docusaurus/Link': ({to, ...props}) => h('a', {...props, href: to}),
      '@theme/DocMeta': () => null,
      '../CopyButton': ({getText}) => h('output', null, getText()),
    });
    const DocTools = load(path.join(root, 'src/components/DocTools/index.js')).default;
    const html = renderToStaticMarkup(h(DocTools));
    assert.match(html, /<output>https:\/\/devfloor9\.github\.io\/engineering-playbook\/docs\/agentic-ai-platform#existing-section<\/output>/);
    assert.doesNotMatch(html, /agentic-ai-platform\/#existing-section/);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, 'window', previousWindow);
    else delete globalThis.window;
  }
});
