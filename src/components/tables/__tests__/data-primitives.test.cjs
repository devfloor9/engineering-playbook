const assert = require('node:assert/strict');
const {test, before, after} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {spawn} = require('node:child_process');
const {createRequire} = require('node:module');
const root = path.resolve(__dirname, '../../../..');
const dependencyRoot = process.env.EP_TEST_DEPS || (fs.existsSync(path.join(root, 'node_modules'))
  ? path.join(root, 'node_modules') : path.resolve(root, '../integration/node_modules'));
const foundation = process.env.EP_FOUNDATION_ROOT || (fs.existsSync(path.join(root, 'src/components/Icon'))
  ? root : path.resolve(root, '../structure'));
const dependency = createRequire(path.join(dependencyRoot, '../package.json'));
const webpack = dependency('webpack');
let directory, server, browser, socket, request, evaluate, url;
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
const errors = [];

before(async () => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'ep-data-65-'));
  await new Promise((resolve, reject) => webpack({
    mode: 'development', devtool: false, context: root,
    entry: path.join(__dirname, 'fixture.jsx'),
    output: {path: directory, filename: 'fixture.js'},
    resolve: {extensions: ['.js', '.jsx', '.cjs'], modules: [dependencyRoot], alias: {
      '@site/src/components/Icon$': path.join(foundation, 'src/components/Icon/index.js'),
      '@site': root,
      '@docusaurus/useDocusaurusContext$': path.join(__dirname, 'context.cjs'),
      '@theme-original/Mermaid$': path.join(__dirname, 'mermaid.jsx'),
      '@theme-original/MDXComponents$': path.join(__dirname, 'mdx-original.cjs'),
    }},
    module: {rules: [
      {test: /\.jsx?$/, exclude: /node_modules/, use: {loader: dependency.resolve('babel-loader'), options: {
        babelrc: false, configFile: false, plugins: [[dependency.resolve('@babel/plugin-transform-react-jsx'), {runtime: 'classic'}]],
      }}},
      {test: /\.css$/, use: path.join(__dirname, 'css-loader.cjs')},
    ]},
    performance: {hints: false},
  }, (error, stats) => error || stats.hasErrors() ? reject(error || new Error(stats.toString({all: false, errors: true}))) : resolve()));
  server = http.createServer((req, res) => {
    if (req.url === '/fixture.js') { res.setHeader('Content-Type', 'text/javascript'); return res.end(fs.readFileSync(path.join(directory, 'fixture.js'))); }
    if (req.url === '/infima.css') { res.setHeader('Content-Type', 'text/css'); return res.end(fs.readFileSync(dependency.resolve('infima/dist/css/default/default.css'))); }
    if (req.url === '/foundation.css') { res.setHeader('Content-Type', 'text/css'); return res.end(fs.readFileSync(path.join(foundation, 'src/css/custom.css'), 'utf8').replace(/^@import.*$/gm, '')); }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/infima.css"><link rel="stylesheet" href="/foundation.css"><style>body{margin:0;font-family:system-ui}article{max-width:46rem;margin:auto;padding:16px;box-sizing:border-box}section{min-width:0}svg{max-width:100%}</style></head><body><div id="root"></div><script src="/fixture.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  const profile = path.join(directory, 'chrome');
  browser = spawn(process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
    '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=0', `--user-data-dir=${profile}`, 'about:blank',
  ], {stdio: 'ignore'});
  const portFile = path.join(profile, 'DevToolsActivePort');
  for (let tries = 0; !fs.existsSync(portFile); tries++) { if (tries > 100) throw new Error('Isolated Chrome did not start'); await delay(50); }
  const port = fs.readFileSync(portFile, 'utf8').split('\n')[0];
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  socket = new WebSocket(tabs.find(tab => tab.type === 'page').webSocketDebuggerUrl);
  await new Promise(resolve => socket.addEventListener('open', resolve, {once: true}));
  let serial = 0;
  const pending = new Map();
  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (message.method === 'Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.text);
    if (!message.id) return;
    const entry = pending.get(message.id);
    pending.delete(message.id);
    message.error ? entry.reject(new Error(message.error.message)) : entry.resolve(message.result);
  });
  request = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++serial; pending.set(id, {resolve, reject}); socket.send(JSON.stringify({id, method, params}));
  });
  evaluate = async expression => {
    const result = await request('Runtime.evaluate', {expression, returnByValue: true, awaitPromise: true});
    if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  };
  await request('Runtime.enable');
  await request('Page.enable');
  await load('en');
}, {timeout: 60000});

async function load(locale) {
  await request('Page.navigate', {url: `${url}/?locale=${locale}`});
  for (let i = 0; i < 100; i++) {
    if (await evaluate('!!document.querySelector("#authored figcaption")')) { await delay(80); return; }
    await delay(30);
  }
  throw new Error('Fixture did not mount');
}
async function key(name, code = name, virtual = 13) {
  await request('Input.dispatchKeyEvent', {type: 'keyDown', key: name, code, windowsVirtualKeyCode: virtual,
    ...(name === 'Enter' ? {text: '\r', unmodifiedText: '\r'} : name === ' ' ? {text: ' ', unmodifiedText: ' '} : {})});
  await request('Input.dispatchKeyEvent', {type: 'keyUp', key: name, code, windowsVirtualKeyCode: virtual});
  await delay(50);
}
after(async () => {
  if (process.env.EP_KEEP_TEST_ARTIFACTS) console.log(`Artifacts: ${directory}`);
  socket?.close(); browser?.kill();
  if (server) await new Promise(resolve => server.close(resolve));
  await delay(200);
  if (directory && !process.env.EP_KEEP_TEST_ARTIFACTS) fs.rmSync(directory, {recursive: true, force: true});
});

test('native captions and scoped headers name the table in SSR and browser', async () => {
  assert.equal(await evaluate('window.h1Preserved'), true);
  assert.equal(await evaluate('window.srDoc = new DOMParser().parseFromString(window.ssr,"text/html"); window.srDoc.querySelector("table").getAttribute("aria-labelledby") === window.srDoc.querySelector("figcaption").id'), true);
  assert.equal(await evaluate('document.querySelector("#frame table").getAttribute("aria-describedby") === document.querySelector("#frame [class*=description]").id'), true);
  assert.equal(await evaluate('document.querySelector("#all caption").textContent'), 'All rows');
  assert.equal(await evaluate('document.querySelectorAll("#all th[scope=row]").length'), 3);
  assert.equal(await evaluate('document.querySelectorAll("#all button, #comparison button").length'), 0);
  assert.equal(await evaluate('document.querySelectorAll("#spec h4").length'), 0);
});

test('Markdown tables preserve attributes and infer only a contextual name', async () => {
  assert.equal(await evaluate('document.querySelector("#markdown-short").getAttribute("aria-label")'), 'Small data');
  assert.equal(await evaluate('document.querySelector("#short tbody th").getAttribute("scope")'), 'row');
  assert.equal(await evaluate('document.querySelector("#short thead th").getAttribute("scope")'), 'col');
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#short td")).textAlign'), 'right');
});

test('nested frames produce one scroller with all captions and descriptions intact', async () => {
  assert.equal(await evaluate('document.querySelectorAll("#nested [role=region]").length'), 1);
  assert.equal(await evaluate('document.querySelectorAll("#nested figure").length'), 1);
  assert.equal(await evaluate('document.querySelector("#nested caption").textContent'), 'Inner caption');
  assert.equal(await evaluate('document.querySelector("#nested table").getAttribute("aria-labelledby").includes(document.querySelector("#nested figcaption").id)'), true);
});

test('numeric and ReactNode sorting uses native Enter and Space buttons', async () => {
  await evaluate('document.querySelectorAll("#sort thead button")[1].focus()');
  await key('Enter');
  assert.deepEqual(await evaluate('[...document.querySelectorAll("#sort tbody tr")].map(r=>r.cells[1].textContent)'), ['-1', '2']);
  assert.equal(await evaluate('document.querySelectorAll("#sort th")[1].getAttribute("aria-sort")'), 'ascending');
  await key(' ', 'Space', 32);
  assert.deepEqual(await evaluate('[...document.querySelectorAll("#sort tbody tr")].map(r=>r.cells[1].textContent)'), ['10', '2']);
  await evaluate('document.querySelectorAll("#sort thead button")[0].focus()');
  await key('Enter');
  assert.deepEqual(await evaluate('[...document.querySelectorAll("#sort tbody th")].map(r=>r.textContent)'), ['Alpha', 'Beta']);
  await evaluate('document.querySelectorAll("#sort thead button")[2].focus()');
  await key('Enter');
  assert.deepEqual(await evaluate('[...document.querySelectorAll("#sort tbody tr")].map(r=>r.cells[2].textContent)'), ['minus one', 'two']);
  assert.deepEqual(await evaluate('window.originalRows.map(row=>row.id)'), ['a', 'b', 'c']);
});

test('ReactNode search, paging and empty states retain source data', async () => {
  await evaluate('document.querySelector("#sort input").focus()');
  await request('Input.insertText', {text: 'Alpha'}); await delay(50);
  assert.equal(await evaluate('document.querySelectorAll("#sort tbody tr").length'), 1);
  assert.equal(await evaluate('document.querySelector("#sort tbody th").textContent'), 'Alpha');
  await request('Input.insertText', {text: 'missing'}); await delay(50);
  assert.equal(await evaluate('document.querySelector("#sort tbody td").textContent'), 'No matching rows.');
  await load('en');
  await evaluate('document.querySelector("#sort nav button:last-child").click()'); await delay(50);
  assert.equal(await evaluate('document.querySelector("#sort tbody th").textContent'), 'Gamma');
  assert.equal(await evaluate('document.querySelector("#sort nav button:last-child").disabled'), true);
});

test('safe value access never stringifies opaque elements or treats empty values as zero', async () => {
  assert.deepEqual(await evaluate('[window.numericValue(""), window.numericValue("12GB"), window.numericValue("2e3"), window.numericValue(Infinity)]'), [null, null, 2000, null]);
  assert.equal(await evaluate('document.querySelector("#spec-node td").textContent'), '12 GB');
  assert.equal(await evaluate('document.body.textContent.includes("[object Object]")'), false);
  assert.equal(await evaluate('getComputedStyle(document.querySelector("#all tbody td")).textAlign'), 'right');
});

test('status and recommendation text is visible in both locales, including source row flags', async () => {
  for (const locale of ['en', 'ko']) {
    await load(locale);
    const text = await evaluate('document.querySelector("#spec").textContent');
    for (const label of locale === 'ko' ? ['정상', '경고', '위험'] : ['Normal', 'Warning', 'Danger']) assert.ok(text.includes(label));
    assert.ok((await evaluate('document.querySelector("#comparison").textContent')).includes(locale === 'ko' ? '추천' : 'Recommended'));
    assert.ok((await evaluate('document.querySelector("#metrics").textContent')).includes(locale === 'ko' ? '심각' : 'Critical'));
    assert.equal(await evaluate('document.querySelectorAll("#spec tbody tr").length'), 3);
  }
  await load('en');
});

test('short tables reflow; wide tables keep keyboard scrolling and guidance at 320/390/768/1440', async () => {
  for (const width of [320, 390, 768, 1440]) {
    await request('Emulation.setDeviceMetricsOverride', {width, height: 900, deviceScaleFactor: 1, mobile: false});
    await delay(80);
    assert.equal(await evaluate('document.documentElement.scrollWidth <= window.innerWidth'), true, `body overflow ${width}`);
    assert.equal(await evaluate('document.querySelector("#short [role=region]").hasAttribute("tabindex")'), false, `short table overflow ${width}`);
    const wide = await evaluate('document.querySelector("#wide [role=region]").scrollWidth > document.querySelector("#wide [role=region]").clientWidth');
    if (wide) {
      assert.equal(await evaluate('document.querySelector("#wide [role=region]").tabIndex'), 0);
      assert.equal(await evaluate('document.querySelector("#wide [role=region]").getAttribute("aria-describedby").split(" ").length'), 2);
    }
    assert.equal(await evaluate('parseFloat(getComputedStyle(document.querySelector("#short td")).fontSize) >= 14.4'), true);
  }
  await request('Emulation.setDeviceMetricsOverride', {width: 320, height: 900, deviceScaleFactor: 1, mobile: false}); await delay(60);
  await evaluate('document.querySelector("#wide [role=region]").focus()');
  await key('ArrowRight', 'ArrowRight', 39); await delay(100);
  assert.ok(await evaluate('document.querySelector("#wide [role=region]").scrollLeft > 0'));
});

test('light/dark manual roots preserve chart categories, readable captions and 44px controls', async () => {
  for (const theme of ['light', 'dark']) {
    await evaluate(`document.documentElement.setAttribute('data-theme', '${theme}')`);
    const colors = await evaluate('[...document.querySelectorAll("#mermaid rect")].map(n=>getComputedStyle(n).fill)');
    assert.notEqual(colors[0], colors[1]);
    assert.equal(await evaluate('parseFloat(getComputedStyle(document.querySelector("#figure figcaption")).fontSize) >= 14'), true);
    assert.equal(await evaluate('[...document.querySelectorAll("#sort button,#mermaid button,#troubleshooting button")].every(button=>button.getBoundingClientRect().height >= 44)'), true);
    assert.equal(await evaluate('window.probe=document.createElement("span");window.probe.style.color="var(--ep-outline)";document.body.append(window.probe);window.matches=getComputedStyle(document.querySelector("#mermaid button")).borderTopColor===getComputedStyle(window.probe).color;window.probe.remove();window.matches'), true);
  }
  assert.equal(await evaluate('document.querySelector("#figure figure").lastElementChild.tagName'), 'FIGCAPTION');
  assert.ok((await evaluate('document.querySelector("#figure").textContent')).includes('Source: Source label'));
  assert.equal(await evaluate('document.querySelector("#figure tbody td").textContent'), '12');
  assert.equal(await evaluate('document.querySelector("#iframe iframe").getBoundingClientRect().height'), 480);
  assert.equal(await evaluate('document.querySelector("#iframe iframe").getBoundingClientRect().width <= document.querySelector("#iframe figure").clientWidth'), true);
});

test('200% text still reflows and every ARIA reference resolves', async () => {
  await evaluate('document.documentElement.style.fontSize="200%"');
  await delay(80);
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'), true);
  assert.equal(await evaluate('[...document.querySelectorAll("[aria-labelledby],[aria-describedby],[aria-controls]")].every(node=>["aria-labelledby","aria-describedby","aria-controls"].every(attr=>(node.getAttribute(attr)||"").split(/\\s+/).filter(Boolean).every(id=>document.getElementById(id))))'), true);
  await evaluate('document.documentElement.style.fontSize=""');
});

test('Mermaid uses source accessibility metadata or surrounding section, without invented descriptions', async () => {
  assert.equal(await evaluate('document.querySelector("#mermaid figcaption").textContent'), 'Request path — diagram');
  assert.equal(await evaluate('document.querySelector("#mermaid svg").getAttribute("aria-label")'), 'Request path — diagram');
  assert.ok((await evaluate('document.querySelector("#authored figcaption").textContent')).includes('Provided graph description.\nSecond line.'));
  assert.equal(await evaluate('document.querySelector("#authored svg title").textContent'), 'Provided graph title');
  assert.deepEqual(await evaluate('window.mermaidMetadata("flowchart LR\\naccTitle: A\\naccDescr: B\\nA-->B")'), {title: 'A', description: 'B'});
});

test('native Mermaid dialog opens by keyboard, zooms, fits, closes with Escape and returns focus', async () => {
  await evaluate('document.querySelector("#mermaid button").focus()');
  await key('Enter');
  assert.equal(await evaluate('document.querySelector("#mermaid dialog").open'), true);
  assert.equal(await evaluate('document.activeElement.textContent'), 'Close');
  assert.equal(await evaluate('document.body.style.overflow'), 'hidden');
  await evaluate('[...document.querySelectorAll("#mermaid dialog button")].find(b=>b.textContent==="Zoom in").click()'); await delay(60);
  assert.equal(await evaluate('document.querySelector("#mermaid output").textContent'), '125%');
  await evaluate('[...document.querySelectorAll("#mermaid dialog button")].find(b=>b.textContent==="Fit to screen").click()'); await delay(60);
  assert.ok(await evaluate('parseInt(document.querySelector("#mermaid output").textContent) < 100'));
  await key('Escape', 'Escape', 27);
  assert.equal(await evaluate('!!document.querySelector("#mermaid dialog")'), false);
  assert.equal(await evaluate('document.activeElement === document.querySelector("#mermaid button")'), true);
  assert.equal(await evaluate('document.body.style.overflow'), '');
});

test('troubleshooting details keep all text and support native Space activation', async () => {
  assert.ok((await evaluate('document.querySelector("#troubleshooting").textContent')).includes('Original solution'));
  await evaluate('document.querySelector("#troubleshooting button").focus()');
  await key(' ', 'Space', 32);
  assert.equal(await evaluate('document.querySelector("#troubleshooting button").getAttribute("aria-expanded")'), 'true');
  assert.equal(await evaluate('document.querySelector("#troubleshooting [id*=details]:not(button)").hidden'), false);
  assert.deepEqual(errors, []);
  const screenshot = await request('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
  fs.writeFileSync(path.join(directory, 'mobile-dark.png'), Buffer.from(screenshot.data, 'base64'));
  await evaluate('document.querySelector("#comparison").scrollIntoView()');
  const tables = await request('Page.captureScreenshot', {format: 'png', captureBeyondViewport: false});
  fs.writeFileSync(path.join(directory, 'tables-mobile-dark.png'), Buffer.from(tables.data, 'base64'));
});
