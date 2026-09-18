import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {useMDXComponents} from '@mdx-js/react';
import DocTools from '@site/src/components/DocTools';
import CopyButton from '@site/src/components/CopyButton';
import Content from '@site/src/theme/DocItem/Content';
import {forgetManifest} from '@site/src/components/DocTools/manifest';
import {TestContext} from './browser-context';

const nativeFetch = window.fetch.bind(window);
const params = new URLSearchParams(window.location.search);
const rootPath = '/engineering-playbook/';
const manifestPath = `${rootPath}llm-wiki/manifest.json`;
const origin = 'https://example.test';
const defaultContext = {
  doc: {
    contentTitle: 'AIDLC: AI-Driven Development Lifecycle',
    metadata: {title: 'AIDLC: AI-Driven Development Lifecycle', permalink: `${rootPath}docs/aidlc`},
    frontMatter: {created: '2026-02-05', last_update: {date: '2026-09-18', author: 'Preserved author'}, reading_time: 6},
  },
  site: {siteConfig: {url: origin, customFields: {documentationBaseUrl: rootPath}}, i18n: {currentLocale: 'ko'}},
};
const manifest = {
  language: 'ko',
  docs: [
    {url: `${origin}${rootPath}docs/aidlc`, md_url: `${origin}${rootPath}llm-wiki/aidlc/index.md`},
    {url: `${origin}${rootPath}docs/other`, md_url: `${origin}${rootPath}llm-wiki/other.md`},
  ],
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return {promise, resolve, reject};
};
const assert = (condition, message) => { if (!condition) throw new Error(message); };
const buttons = host => [...host.querySelectorAll('button')];
const named = (host, text) => buttons(host).find(button => button.textContent === text);
const text = host => host.textContent;
const clearManifest = () => forgetManifest(manifestPath);
const withLocale = locale => ({
  ...defaultContext,
  site: {...defaultContext.site, i18n: {currentLocale: locale}},
});
const withDoc = pathname => ({
  ...defaultContext,
  doc: {...defaultContext.doc, metadata: {...defaultContext.doc.metadata, permalink: pathname}},
});

function Body() {
  const {h1: Title} = useMDXComponents();
  return <>
    <header><Title id="aidlc-ai-driven-development-lifecycle">AIDLC: AI-Driven Development Lifecycle</Title></header>
    <p id="introduction">문서의 목적과 읽기 경로를 확인합니다. This introduction follows the title, metadata and document tools.</p>
    <h2 id="existing-section">기존 섹션 · Existing section</h2>
    <p>기존 본문과 제목 앵커를 유지합니다.</p>
  </>;
}

async function mount(element, context = defaultContext) {
  const host = document.getElementById('fixture');
  const root = createRoot(host);
  const render = async (nextElement = element, nextContext = context) => {
    await act(async () => root.render(<TestContext.Provider value={nextContext}>{nextElement}</TestContext.Provider>));
    // Response.json() consumes a browser stream; let that task finish in act.
    await act(async () => { await delay(0); });
  };
  await render();
  return {host, render, unmount: async () => act(() => root.unmount())};
}

async function testSuite() {
  window.IS_REACT_ACT_ENVIRONMENT = true;
  const reports = [];
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  let writes;
  const setClipboard = fn => Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: fn}});
  async function test(name, run) {
    writes = [];
    setClipboard(async value => { writes.push(value); });
    clearManifest();
    window.fetch = async () => Response.json(manifest);
    try { await run(); reports.push({name, passed: true}); }
    catch (error) { reports.push({name, passed: false, error: error.message}); }
  }

  await test('loading keeps link/guide available; supported exposes four SVG/text actions', async () => {
    const pending = deferred();
    window.fetch = () => pending.promise;
    const page = await mount(<DocTools />);
    try {
      assert(text(page.host).includes('지원 여부'), 'loading status');
      assert(page.host.querySelectorAll('[role="group"] button, [role="group"] a').length === 2, 'initial actions');
      assert(!page.host.querySelector('details'), 'no closed disclosure');
      await act(async () => pending.resolve(Response.json(manifest)));
      const actions = [...page.host.querySelectorAll('[role="group"] button, [role="group"] a')];
      assert(actions.length === 4, 'all four actions');
      assert(actions.every(action => action.querySelector('svg') && action.textContent.trim()), 'SVG and text');
      assert(page.host.querySelector('a[target="_blank"]').textContent.includes('새 탭'), 'new tab announcement');
    } finally { await page.unmount(); }
  });
  await test('link copy preserves canonical permalink and current fragment', async () => {
    history.replaceState(null, '', '#existing-section');
    const page = await mount(<DocTools />);
    try {
      await act(async () => named(page.host, '링크 복사').click());
      assert(writes[0] === `${origin}${rootPath}docs/aidlc#existing-section`, 'canonical fragment');
      assert(text(page.host).includes('링크 복사: 복사했습니다.'), 'identified live status');
    } finally { await page.unmount(); }
  });
  await test('English mismatch stays unsupported without Korean fallback', async () => {
    const page = await mount(<DocTools />, withLocale('en'));
    try {
      assert(text(page.host).includes('Markdown export is not available'), 'unsupported status');
      assert(!page.host.querySelector('a[target="_blank"]'), 'no fallback link');
      assert(!/[가-힣]/u.test(text(page.host)), 'English labels only');
      assert(page.host.querySelector('a').pathname === `${rootPath}en/ai-docs`, 'localized guide');
    } finally { await page.unmount(); }
  });
  await test('manifest error has retry and recovers to supported', async () => {
    let requests = 0;
    window.fetch = async () => {
      if (++requests === 1) throw new Error('offline');
      return Response.json(manifest);
    };
    const page = await mount(<DocTools />);
    try {
      assert(text(page.host).includes('불러오지 못했습니다'), 'error differs from unsupported');
      await act(async () => named(page.host, '다시 시도').click());
      assert(requests === 2 && page.host.querySelector('a[target="_blank"]'), 'retry fetch recovered');
    } finally { await page.unmount(); }
  });
  await test('legacy text/label/ariaLabel API and asynchronous getText precedence', async () => {
    const pending = deferred();
    const page = await mount(<CopyButton text="unused" getText={() => pending.promise} label="Copy query" ariaLabel="Copy exact query" />);
    try {
      const button = named(page.host, 'Copy query');
      assert(button.getAttribute('aria-label') === 'Copy exact query', 'ariaLabel preserved');
      assert(!button.querySelector('svg'), 'icon optional in idle');
      await act(async () => { button.click(); button.click(); });
      assert(button.disabled && text(page.host).includes('복사 중'), 'pending');
      await act(async () => pending.resolve('sum(rate(query[5m]))'));
      assert(writes.length === 1 && writes[0] === 'sum(rate(query[5m]))', 'async source once');
      assert(button.textContent === 'Copy query', 'label retained after success');
      assert(page.host.querySelectorAll('[role="status"]').length === 1, 'one polite announcement');
    } finally { await page.unmount(); }
  });
  await test('clipboard rejection is announced and the same button retries', async () => {
    let calls = 0;
    setClipboard(async value => { if (++calls === 1) throw new Error('denied'); writes.push(value); });
    const page = await mount(<CopyButton text="query" label="Copy query" />, withLocale('en'));
    try {
      await act(async () => named(page.host, 'Copy query').click());
      assert(text(page.host).includes('Copy failed'), 'failure announced');
      await act(async () => named(page.host, 'Copy query').click());
      assert(writes[0] === 'query' && text(page.host).includes('Copied.'), 'retry success');
      await act(async () => { await delay(3050); });
      assert(!text(page.host).includes('Copied.'), 'success reset timer');
    } finally { await page.unmount(); }
  });
  await test('document navigation clears pending status and ignores late source resolution', async () => {
    const pending = deferred();
    const page = await mount(<CopyButton getText={() => pending.promise} label="Copy query" />);
    try {
      await act(async () => named(page.host, 'Copy query').click());
      await page.render(<CopyButton text="new document" label="Copy query" />, withDoc(`${rootPath}docs/other`));
      assert(!named(page.host, 'Copy query').disabled && !text(page.host).includes('복사 중'), 'new document idle');
      await act(async () => pending.resolve('stale document'));
      assert(writes.length === 0, 'no stale clipboard write');
      await act(async () => named(page.host, 'Copy query').click());
      assert(writes[0] === 'new document', 'new document value');
    } finally { await page.unmount(); }
  });
  await test('unmount before getText resolves prevents a later clipboard write', async () => {
    const pending = deferred();
    const page = await mount(<CopyButton getText={() => pending.promise} />);
    await act(async () => buttons(page.host)[0].click());
    await page.unmount();
    await act(async () => pending.resolve('stale'));
    assert(writes.length === 0 && !page.host.textContent, 'safe unmount');
  });
  await test('unmount while clipboard write is pending safely ignores completion', async () => {
    const pending = deferred();
    setClipboard(() => pending.promise);
    const page = await mount(<CopyButton text="query" />);
    await act(async () => buttons(page.host)[0].click());
    await page.unmount();
    await act(async () => pending.resolve());
    assert(!page.host.textContent, 'no late state');
  });
  await test('missing clipboard and invalid async text become recoverable errors', async () => {
    const page = await mount(<CopyButton getText={async () => null} />, withLocale('en'));
    try {
      await act(async () => buttons(page.host)[0].click());
      assert(text(page.host).includes('Copy failed') && writes.length === 0, 'invalid value');
      Object.defineProperty(navigator, 'clipboard', {configurable: true, value: undefined});
      await page.render(<CopyButton text="query" />, withDoc(`${rootPath}docs/other`));
      await act(async () => buttons(page.host)[0].click());
      assert(text(page.host).includes('복사하지 못했습니다'), 'missing clipboard');
    } finally { await page.unmount(); }
  });
  await test('a late manifest response resolves only the current document URL', async () => {
    const pending = deferred();
    window.fetch = () => pending.promise;
    const page = await mount(<DocTools />);
    try {
      await page.render(<DocTools />, withDoc(`${rootPath}docs/other`));
      await act(async () => pending.resolve(Response.json(manifest)));
      assert(page.host.querySelector('a[target="_blank"]').pathname === `${rootPath}llm-wiki/other.md`, 'new URL only');
    } finally { await page.unmount(); }
  });
  if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
  else delete navigator.clipboard;
  window.fetch = nativeFetch;
  window.IS_REACT_ACT_ENVIRONMENT = false;
  const result = document.getElementById('results');
  result.textContent = `${reports.filter(report => report.passed).length}/${reports.length} browser tests passed\n` +
    reports.map(report => `${report.passed ? 'PASS' : 'FAIL'} ${report.name}${report.error ? `: ${report.error}` : ''}`).join('\n');
  await nativeFetch('/results', {method: 'POST', body: JSON.stringify({suite: 'state', reports})});
}

async function preview() {
  const theme = params.get('theme') || 'light';
  document.documentElement.dataset.theme = theme;
  const locale = params.get('locale') || 'ko';
  const state = params.get('state') || 'supported';
  window.fetch = async () => {
    if (state === 'error') throw new Error('fixture offline');
    if (state === 'loading') return new Promise(() => {});
    return Response.json(manifest);
  };
  const context = locale === 'en' ? withLocale('en') : defaultContext;
  createRoot(document.getElementById('fixture')).render(
    <TestContext.Provider value={context}><Content><Body /></Content></TestContext.Provider>);
  await delay(150);
  const actions = [...document.querySelectorAll('[role="group"] a, [role="group"] button')];
  const report = {
    theme, locale, state, viewport: innerWidth,
    noOverflow: document.documentElement.scrollWidth <= innerWidth,
    minActionHeight: Math.min(...actions.map(action => action.getBoundingClientRect().height)),
    graphicalLabels: actions.every(action => action.querySelector('svg') && action.textContent.trim()),
    oneH1: document.querySelectorAll('h1').length === 1,
    anchor: !!document.getElementById('aidlc-ai-driven-development-lifecycle'),
    focusOutline: getComputedStyle(actions[0]).getPropertyValue('--ep-focus-ring'),
  };
  document.getElementById('results').textContent = JSON.stringify(report, null, 2);
  await nativeFetch('/results', {method: 'POST', body: JSON.stringify({suite: 'layout', report})});
}

if (params.has('test')) testSuite();
else preview();
