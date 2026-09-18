import React, {act} from 'react';
import {createRoot} from 'react-dom/client';
import {useMDXComponents} from '@mdx-js/react';
import DocTools from '@site/src/components/DocTools';
import CopyButton from '@site/src/components/CopyButton';
import Content from '@site/src/theme/DocItem/Content';
import {TestContext} from './browser-context';

const nativeFetch = window.fetch.bind(window);
const params = new URLSearchParams(window.location.search);
const rootPath = '/engineering-playbook/';
const origin = 'https://example.test';
const defaultContext = {
  doc: {
    contentTitle: 'AIDLC: AI-Driven Development Lifecycle',
    metadata: {title: 'AIDLC: AI-Driven Development Lifecycle', permalink: `${rootPath}docs/aidlc`},
    frontMatter: {created: '2026-02-05', last_update: {date: '2026-09-18', author: 'Preserved author'}, reading_time: 6},
  },
  site: {siteConfig: {url: origin, trailingSlash: false, customFields: {documentationBaseUrl: rootPath}}, i18n: {currentLocale: 'ko'}},
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
const withLocale = locale => ({
  ...defaultContext,
  site: {...defaultContext.site, i18n: {currentLocale: locale}},
});
const withDoc = (pathname, context = defaultContext) => ({
  ...context,
  doc: {...context.doc, metadata: {...context.doc.metadata, permalink: pathname}},
});
const labels = locale => locale === 'ko'
  ? {copy: '링크 복사', guide: 'AI용 문서 안내', reading: '6분 읽기', copied: '링크 복사: 복사했습니다.'}
  : {copy: 'Copy link', guide: 'AI documentation guide', reading: '6 min read', copied: 'Copy link: Copied.'};
const actionsIn = host => [...host.querySelectorAll('button, a')];
function metadataBeforeActions(host, firstAction, locale) {
  const dates = [...host.querySelectorAll('time')];
  const reading = [...host.querySelectorAll('span')].find(node => node.textContent === labels(locale).reading);
  return dates.length === 2 && reading && firstAction &&
    [...dates, reading].every(node => node.compareDocumentPosition(firstAction) & Node.DOCUMENT_POSITION_FOLLOWING);
}

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
  };
  await render();
  return {host, render, unmount: async () => act(() => root.unmount())};
}

async function testSuite() {
  window.IS_REACT_ACT_ENVIRONMENT = true;
  const reports = [];
  const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  let writes, requests;
  const setClipboard = fn => Object.defineProperty(navigator, 'clipboard', {configurable: true, value: {writeText: fn}});
  async function test(name, run) {
    writes = [];
    requests = [];
    setClipboard(async value => { writes.push(value); });
    window.fetch = async url => {
      requests.push(String(url));
      throw new Error('The article toolbar must not fetch a manifest or Markdown.');
    };
    try {
      await run();
      assert(requests.length === 0, `unexpected toolbar requests: ${requests.join(', ')}`);
      reports.push({name, passed: true});
    }
    catch (error) { reports.push({name, passed: false, error: error.message}); }
  }

  for (const locale of ['ko', 'en']) {
    await test(`${locale}: metadata precedes exactly two localized actions without content requests or toolbar status`, async () => {
      const page = await mount(<DocTools />, withLocale(locale));
      try {
        const expected = labels(locale);
        const actions = actionsIn(page.host);
        assert(actions.length === 2, 'only Copy link and AI guide');
        assert(actions.map(action => action.textContent.trim()).join('|') === `${expected.copy}|${expected.guide}`, 'localized action labels and order');
        assert(actions[0].tagName === 'BUTTON' && actions[1].tagName === 'A', 'copy button and guide link');
        assert(actions.every(action => action.querySelector('svg') && action.textContent.trim()), 'SVG and text');
        assert(metadataBeforeActions(page.host, actions[0], locale), 'dates and reading time precede actions');
        assert(actions[1].pathname === `${rootPath}${locale === 'en' ? 'en/' : ''}ai-docs`, 'localized guide destination');
        assert(!page.host.querySelector('details, a[target="_blank"]'), 'no removed Markdown disclosure or link');
        assert(!text(page.host).includes('Markdown'), 'no Markdown action or loading/error text');
        const status = [...page.host.querySelectorAll('[role="status"]')];
        const copyControl = actions[0].closest('[data-state]');
        assert(status.length === 1 && copyControl?.contains(status[0]) && status[0].textContent === '', 'only empty clipboard feedback remains');
        if (locale === 'en') assert(!/[가-힣]/u.test(text(page.host)), 'English labels only');
      } finally { await page.unmount(); }
    });
  }
  await test('link copy normalizes a category permalink and preserves its current fragment', async () => {
    for (const locale of ['ko', 'en']) {
      const pathname = `${rootPath}${locale === 'en' ? 'en/' : ''}docs/aidlc`;
      history.replaceState(null, '', '#before-mount');
      const page = await mount(<DocTools />, withDoc(`${pathname}/`, withLocale(locale)));
      try {
        history.replaceState(null, '', '#existing-section');
        await act(async () => named(page.host, labels(locale).copy).click());
        assert(writes.at(-1) === `${origin}${pathname}#existing-section`, 'canonical URL with click-time fragment');
        assert(text(page.host).includes(labels(locale).copied), 'identified localized clipboard status');
      } finally { await page.unmount(); }
    }
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
  const requests = [];
  window.fetch = async url => {
    requests.push(String(url));
    throw new Error('The article toolbar must not fetch a manifest or Markdown.');
  };
  const context = locale === 'en' ? withLocale('en') : defaultContext;
  createRoot(document.getElementById('fixture')).render(
    <TestContext.Provider value={context}><Content><Body /></Content></TestContext.Provider>);
  await delay(150);
  const host = document.getElementById('fixture');
  const actions = actionsIn(host);
  const expected = labels(locale);
  const copyControl = actions[0]?.closest('[data-state]');
  const statuses = [...host.querySelectorAll('[role="status"]')];
  const report = {
    theme, locale, viewport: innerWidth,
    actionCount: actions.length,
    localizedActions: actions.map(action => action.textContent.trim()).join('|') === `${expected.copy}|${expected.guide}`,
    guideDestination: actions[1]?.pathname === `${rootPath}${locale === 'en' ? 'en/' : ''}ai-docs`,
    metadataBeforeActions: !!metadataBeforeActions(host, actions[0], locale),
    noContentRequests: requests.length === 0,
    noMarkdownControls: !text(host).includes('Markdown'),
    clipboardFeedbackOnly: statuses.length === 1 && !!copyControl?.contains(statuses[0]) && statuses[0].textContent === '',
    noOverflow: document.documentElement.scrollWidth <= innerWidth,
    minActionHeight: Math.min(...actions.map(action => action.getBoundingClientRect().height)),
    graphicalLabels: actions.every(action => action.querySelector('svg') && action.textContent.trim()),
    oneH1: document.querySelectorAll('h1').length === 1,
    anchor: !!document.getElementById('aidlc-ai-driven-development-lifecycle'),
    focusOutline: actions[0] ? getComputedStyle(actions[0]).getPropertyValue('--ep-focus-ring') : null,
  };
  document.getElementById('results').textContent = JSON.stringify(report, null, 2);
  await nativeFetch('/results', {method: 'POST', body: JSON.stringify({suite: 'layout', report})});
}

if (params.has('test')) testSuite();
else preview();
