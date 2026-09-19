// Real-renderer regression for CSS that changes Mermaid's measurement geometry.
// Default: current custom.css. For an explicit red run, EP_MERMAID_CSS_FILE may
// point to an existing old CSS snapshot; assertions and graphs remain unchanged.
// No build, downloads, installs, existing browser session or source writes.
const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {spawn} = require('node:child_process');
const {createRequire} = require('node:module');
const {createHash} = require('node:crypto');

const root = path.resolve(__dirname, '../..');
const dependency = createRequire(path.join(root, 'package.json'));
const MermaidWebSocket = globalThis.WebSocket || dependency('ws');
const mermaidBundle = dependency.resolve('mermaid/dist/mermaid.min.js');
const mermaidVersion = dependency('mermaid/package.json').version;
const infima = dependency.resolve('infima/dist/css/default/default.css');
const cssFile = process.env.EP_MERMAID_CSS_FILE
  ? path.resolve(process.env.EP_MERMAID_CSS_FILE)
  : path.join(root, 'src/css/custom.css');
const rawCss = fs.readFileSync(cssFile, 'utf8');
// Same offline-font convention as the existing data-primitives harness. All
// declaration rules are preserved; remote/local font imports are not fetched.
const fixtureCss = rawCss.replace(/^\s*@import[^\n]*;\s*$/gm, '');
const cssHash = createHash('sha256').update(rawCss).digest('hex');
const documents = {
  ko: 'docs/rosa/rosa-demo-installation.md',
  en: 'i18n/en/docusaurus-plugin-content-docs/current/rosa/rosa-demo-installation.md',
};
const graphs = Object.fromEntries(Object.entries(documents).map(([locale, filename]) => {
  const text = fs.readFileSync(path.join(root, filename), 'utf8');
  const blocks = [...text.matchAll(/^```mermaid[^\n]*\n([\s\S]*?)^```[ \t]*$/gm)]
    .map(match => match[1]);
  assert.ok(blocks.length, `${filename}: no authored Mermaid graph found`);
  return [locale, blocks];
}));
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

function chromeExecutable() {
  const locations = process.env.CHROME_BIN ? [process.env.CHROME_BIN] : [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    ...(process.env.PATH || '').split(path.delimiter).flatMap(dir =>
      ['google-chrome', 'chromium', 'chromium-browser'].map(name => path.join(dir, name))),
  ];
  const executable = locations.find(file => {
    try { fs.accessSync(file, fs.constants.X_OK); return true; } catch { return false; }
  });
  assert.ok(executable, 'Chrome/Chromium is required; set CHROME_BIN. This test does not skip or install it.');
  return executable;
}

// Executed in the isolated page. Expected labels come from the actual authored
// graph's parsed vertices/subgraphs, independently of the resulting SVG.
async function renderFixture(input) {
  const caseKey = location.search;
  window.__layoutResult = {done: false, caseKey};
  try {
    await document.fonts.ready;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced !== (input.motion === 'reduce')) throw new Error('Motion media preference was not set before first render');
    if (!matchMedia(`(prefers-color-scheme: ${input.theme})`).matches) throw new Error('Color media preference mismatch');
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      themeVariables: {fontFamily: 'Inter, Pretendard Variable, sans-serif'},
    });
    const parsed = await mermaid.mermaidAPI.getDiagramFromText(input.graph);
    const groups = parsed.db.getSubGraphs();
    const groupIds = new Set(groups.map(group => group.id));
    const vertices = [...parsed.db.getVertices().values()]
      .filter(vertex => !groupIds.has(vertex.id));
    if (!vertices.length || !groups.length) throw new Error('Authored ROSA graph lost its nodes or nested groups');
    const normalize = value => {
      const element = typeof value === 'string' ? document.createElement('span') : value.cloneNode(true);
      if (typeof value === 'string') element.innerHTML = value;
      element.querySelectorAll('br').forEach(br => br.replaceWith(document.createTextNode(' ')));
      return element.textContent.replace(/\s+/g, ' ').trim();
    };
    const expectedLabels = [
      ...vertices.map(vertex => normalize(vertex.text || vertex.id)),
      ...groups.map(group => normalize(group.title || group.id)),
    ].sort();
    // Deliberately omit a container: Docusaurus renders/measures under body and
    // only then inserts the returned SVG into its themed figure.
    const rendered = await mermaid.render('mermaid-svg-layout-regression', input.graph);
    const host = document.getElementById('diagram');
    host.innerHTML = rendered.svg;
    await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const svg = host.querySelector('svg');
    if (!svg) throw new Error('Renderer returned no SVG');
    const labels = [...svg.querySelectorAll('.nodeLabel')];
    const box = svg.getBBox();
    const view = svg.viewBox.baseVal;
    const inverse = svg.getScreenCTM().inverse();
    const labelGeometry = labels.map(label => {
      const rect = label.getBoundingClientRect();
      const p1 = new DOMPoint(rect.left, rect.top).matrixTransform(inverse);
      const p2 = new DOMPoint(rect.right, rect.bottom).matrixTransform(inverse);
      return {
        text: normalize(label),
        x: Math.min(p1.x, p2.x), y: Math.min(p1.y, p2.y),
        width: Math.abs(p2.x - p1.x), height: Math.abs(p2.y - p1.y),
        visible: getComputedStyle(label).visibility !== 'hidden' &&
          getComputedStyle(label).display !== 'none',
      };
    });
    window.__layoutResult = {
      done: true, caseKey, reduced, theme: document.documentElement.dataset.theme,
      expectedLabels, actualLabels: labels.map(normalize).sort(),
      expectedNodes: vertices.length, actualNodes: svg.querySelectorAll('.node').length,
      bbox: {x: box.x, y: box.y, width: box.width, height: box.height},
      viewBox: {x: view.x, y: view.y, width: view.width, height: view.height},
      labelGeometry,
    };
  } catch (error) {
    window.__layoutResult = {done: true, caseKey, error: error.stack || String(error)};
  }
}

async function startHarness() {
  let browser, socket, server, directory;
  const pending = new Map();
  const runtimeErrors = [];
  let serial = 0;
  const close = async () => {
    for (const item of pending.values()) { clearTimeout(item.timer); item.reject(new Error('Harness closed')); }
    pending.clear();
    socket?.close();
    if (browser && browser.exitCode === null) {
      browser.kill();
      await Promise.race([new Promise(resolve => browser.once('exit', resolve)), delay(1500)]);
      if (browser.exitCode === null && browser.signalCode === null) browser.kill('SIGKILL');
    }
    socket?.terminate?.();
    server?.closeAllConnections();
    if (server) await new Promise(resolve => server.close(resolve));
    if (directory) fs.rmSync(directory, {recursive: true, force: true, maxRetries: 3, retryDelay: 100});
  };
  try {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-mermaid-layout-'));
    server = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://fixture.invalid');
      const serve = (type, content) => { res.setHeader('Content-Type', type); res.end(content); };
      if (url.pathname === '/mermaid.js') return serve('text/javascript', fs.readFileSync(mermaidBundle));
      if (url.pathname === '/custom.css') return serve('text/css', fixtureCss);
      if (url.pathname === '/infima.css') return serve('text/css', fs.readFileSync(infima));
      if (url.pathname === '/favicon.ico') { res.writeHead(204); return res.end(); }
      if (url.pathname !== '/') { res.writeHead(404); return res.end('Not found'); }
      const locale = url.searchParams.get('locale');
      const theme = url.searchParams.get('theme');
      const motion = url.searchParams.get('motion');
      const graph = graphs[locale]?.[Number(url.searchParams.get('graph'))];
      if (!graph || !['light', 'dark'].includes(theme) || !['no-preference', 'reduce'].includes(motion)) {
        res.writeHead(400); return res.end('Invalid fixture case');
      }
      res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; font-src 'none'; img-src 'self' data:");
      const input = JSON.stringify({graph, theme, motion}).replace(/</g, '\\u003c');
      serve('text/html; charset=utf-8', `<!doctype html><html lang="${locale}" data-theme="${theme}"><head>
        <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
        <link rel="stylesheet" href="/infima.css"><link rel="stylesheet" href="/custom.css">
        <style>article{max-width:60rem;margin:auto;padding:1rem}#diagram{max-width:100%}</style>
        </head><body><article class="markdown theme-doc-markdown"><figure data-ep-theme="manual">
        <div id="diagram" class="docusaurus-mermaid-container"></div></figure></article>
        <script src="/mermaid.js"></script><script>(${renderFixture.toString()})(${input})</script></body></html>`);
    });
    await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
    const origin = `http://127.0.0.1:${server.address().port}`;
    const profile = path.join(directory, 'chrome');
    browser = spawn(chromeExecutable(), [
      '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
      '--disable-background-networking', '--remote-debugging-port=0',
      `--user-data-dir=${profile}`, 'about:blank',
    ], {stdio: 'ignore'});
    let launchError;
    browser.once('error', error => { launchError = error; });
    const portFile = path.join(profile, 'DevToolsActivePort');
    const startupDeadline = Date.now() + 15000;
    while (!fs.existsSync(portFile)) {
      if (launchError) throw launchError;
      if (browser.exitCode !== null || Date.now() > startupDeadline) throw new Error('Isolated Chrome failed to start within 15s');
      await delay(50);
    }
    const port = Number(fs.readFileSync(portFile, 'utf8').split('\n')[0]);
    const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`, {signal: AbortSignal.timeout(5000)})).json();
    const tab = tabs.find(item => item.type === 'page');
    assert.ok(tab, 'Isolated Chrome exposes no page');
    socket = new MermaidWebSocket(tab.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP socket open timeout')), 5000);
      socket.addEventListener('open', () => { clearTimeout(timer); resolve(); }, {once: true});
      socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('CDP socket failed')); }, {once: true});
    });
    socket.addEventListener('message', event => {
      const message = JSON.parse(String(event.data));
      if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text);
      if (!message.id) return;
      const item = pending.get(message.id);
      if (!item) return;
      clearTimeout(item.timer); pending.delete(message.id);
      message.error ? item.reject(new Error(message.error.message)) : item.resolve(message.result);
    });
    const request = (method, params = {}) => new Promise((resolve, reject) => {
      const id = ++serial;
      const timer = setTimeout(() => { pending.delete(id); reject(new Error(`CDP timeout: ${method}`)); }, 10000);
      pending.set(id, {resolve, reject, timer});
      socket.send(JSON.stringify({id, method, params}));
    });
    const evaluate = async expression => {
      const result = await request('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    };
    await request('Page.enable');
    await request('Runtime.enable');
    await request('Emulation.setDeviceMetricsOverride', {width: 1280, height: 900, deviceScaleFactor: 1, mobile: false});
    return {close, request, evaluate, origin, runtimeErrors};
  } catch (error) {
    await close();
    throw error;
  }
}

function assertGeometry(result, label) {
  assert.equal(result.error, undefined, `${label}: renderer error: ${result.error}`);
  assert.ok(result.actualNodes > 0, `${label}: empty diagram`);
  assert.equal(result.actualNodes, result.expectedNodes, `${label}: missing or extra nodes`);
  assert.deepEqual(result.actualLabels, result.expectedLabels, `${label}: all authored node/group labels must survive`);
  const {bbox: box, viewBox: view} = result;
  for (const [name, rect] of Object.entries({bbox: box, viewBox: view})) {
    assert.ok(Object.values(rect).every(Number.isFinite), `${label}: nonfinite ${name}`);
    assert.ok(rect.width > 0 && rect.height > 0, `${label}: empty ${name}`);
  }
  // One SVG user unit tolerates rounding; there are no expected pixel dimensions.
  const contains = rect => rect.x >= view.x - 1 && rect.y >= view.y - 1 &&
    rect.x + rect.width <= view.x + view.width + 1 &&
    rect.y + rect.height <= view.y + view.height + 1;
  assert.ok(contains(box), `${label}: viewBox clips actual bounds: ${JSON.stringify({view, box})}`);
  for (const rect of result.labelGeometry) {
    assert.ok(rect.visible && rect.width > 0 && rect.height > 0, `${label}: invisible/empty label ${rect.text}`);
    assert.ok(contains(rect), `${label}: clipped label ${rect.text}`);
  }
}

test('authored ROSA graphs keep all labels and geometry under production motion CSS', {timeout: 90000}, async t => {
  const harness = await startHarness();
  t.diagnostic(`Mermaid ${mermaidVersion}; CSS SHA-256 ${cssHash}; ${process.env.EP_MERMAID_CSS_FILE ? 'explicit CSS snapshot override' : 'current repository CSS'}`);
  try {
    for (const [locale, blocks] of Object.entries(graphs)) {
      for (const [index] of blocks.entries()) {
        for (const theme of ['light', 'dark']) {
          for (const motion of ['no-preference', 'reduce']) {
            const label = `${locale} graph ${index + 1}, ${theme}, ${motion}`;
            await t.test(label, {timeout: 12000}, async () => {
              harness.runtimeErrors.length = 0;
              // Establish media before navigating: rendering must never start with
              // the previous case's preference or a warmed SVG/renderer singleton.
              await harness.request('Emulation.setEmulatedMedia', {features: [
                {name: 'prefers-color-scheme', value: theme},
                {name: 'prefers-reduced-motion', value: motion},
              ]});
              const query = new URLSearchParams({locale, graph: String(index), theme, motion});
              await harness.request('Page.navigate', {url: `${harness.origin}/?${query}`});
              const deadline = Date.now() + 10000;
              let result;
              while (Date.now() < deadline) {
                result = await harness.evaluate('window.__layoutResult || null');
                if (result?.done && result.caseKey === `?${query}`) break;
                await delay(25);
              }
              assert.ok(result?.done && result.caseKey === `?${query}`, `${label}: current document's real renderer did not complete within 10s`);
              assert.deepEqual(harness.runtimeErrors, [], `${label}: uncaught browser errors`);
              assertGeometry(result, label);
              assert.equal(result.reduced, motion === 'reduce', `${label}: wrong media during first render`);
              assert.equal(result.theme, theme, `${label}: wrong document theme`);
            });
          }
        }
      }
    }
  } finally {
    await harness.close();
  }
});
