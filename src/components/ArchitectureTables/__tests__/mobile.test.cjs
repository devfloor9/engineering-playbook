const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawn} = require('node:child_process');
const {root, shared, dependency, files, runtime, resolve} = require('./fixture-runtime.cjs');
const webpack = dependency('webpack');
const chromePath = process.env.EP65_CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const delay = ms => new Promise(r => setTimeout(r, ms));
function compile(config) {
  return new Promise((res, rej) => {
    const compiler = webpack(config);
    compiler.run((err, stats) => compiler.close(() => err || stats.hasErrors() ? rej(err || Error(stats.toString({all: false, errors: true}))) : res()));
  });
}
async function fixture(temp, locale) {
  const rt = runtime(locale);
  const markup = files.map((file, i) => `<article data-case="${path.basename(file, '.js')}"><div id="case-${i}">${rt.render(file, file.endsWith('InferenceThroughputChart.js') ? {locale} : {})}</div></article>`).join('\n');
  const folder = path.join(temp, locale);
  fs.mkdirSync(folder);
  const moduleFiles = new Map([...rt.modules.keys()].map((file, i) => [file, path.join(folder, `module-${i}.cjs`)]));
  const contextFile = path.join(folder, 'context.cjs');
  fs.writeFileSync(contextFile, `module.exports = () => ({i18n:{currentLocale:${JSON.stringify(locale)}}});`);
  for (const [file, code] of rt.modules) {
    const output = code.replace(/require\("([^"\n]+)"\)/g, (_, name) => {
      let target;
      if (name === '@docusaurus/useDocusaurusContext') target = contextFile;
      else if (name.startsWith('.')) {
        let actual = path.resolve(path.dirname(file), name);
        if (actual.startsWith(path.join(root, 'src/components/Figure')) || actual.startsWith(path.join(root, 'src/components/DataTableFrame'))) actual = path.join(shared, path.relative(path.join(root, 'src/components'), actual));
        target = moduleFiles.get(resolve(actual));
        assert.ok(target, actual);
      } else target = dependency.resolve(name);
      return `require(${JSON.stringify(target)})`;
    });
    fs.writeFileSync(moduleFiles.get(file), output);
  }
  const entry = path.join(folder, 'entry.cjs');
  fs.writeFileSync(entry, `const React = require(${JSON.stringify(dependency.resolve('react'))});
const {createRoot} = require(${JSON.stringify(dependency.resolve('react-dom/client'))});
const {flushSync} = require(${JSON.stringify(dependency.resolve('react-dom'))});
flushSync(() => {${files.map((file, i) => `createRoot(document.getElementById('case-${i}')).render(React.createElement(require(${JSON.stringify(moduleFiles.get(path.join(root, file)))}).default, ${JSON.stringify(file.endsWith('InferenceThroughputChart.js') ? {locale} : {})}));`).join('\n')}});
requestAnimationFrame(() => requestAnimationFrame(() => {window.fixtureReady = true;}));`);
  await compile({mode: 'development', devtool: false, entry, output: {path: folder, filename: 'bundle.js'}, cache: false, stats: 'errors-only', optimization: {minimize: false}});
  // Import URLs can contain semicolons (Google Fonts weights). Remove whole
  // import lines so the actual foundation declarations are parsed unchanged.
  const globalCss = fs.readFileSync(path.join(root, 'src/css/custom.css'), 'utf8').replace(/^@import[^\n]*$/gm, '');
  const infima = fs.readFileSync(dependency.resolve('infima/dist/css/default/default.css'), 'utf8');
  fs.writeFileSync(path.join(folder, 'index.html'), `<!doctype html><html lang="${locale}" data-theme="light"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>${infima}\n${globalCss}\n${[...rt.css.values()].join('\n')}
body{margin:0;background:var(--ep-surface);color:var(--ep-on-surface);font-family:system-ui,sans-serif}main{max-width:736px;margin:auto;padding:16px}article{min-width:0;margin:0 0 32px}article>div{min-width:0}</style></head><body><main class="theme-doc-markdown markdown">${markup}</main><script src="bundle.js"></script></body></html>`);
  return path.join(folder, 'index.html');
}
class CDP {
  constructor(socket) {
    this.socket = socket; this.sequence = 0; this.pending = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (!message.id) return;
      const pending = this.pending.get(message.id);
      this.pending.delete(message.id);
      if (message.error) pending.reject(Error(JSON.stringify(message.error))); else pending.resolve(message.result);
    });
  }
  send(method, params = {}, sessionId) {
    const id = ++this.sequence;
    return new Promise((resolve, reject) => {this.pending.set(id, {resolve, reject}); this.socket.send(JSON.stringify({id, method, params, sessionId}));});
  }
}
const inspect = `(() => {
  const errors = [], overflow = [], numeric = [];
  if (document.documentElement.scrollWidth > innerWidth + 1) errors.push('body overflow: ' + document.documentElement.scrollWidth);
  for (const table of document.querySelectorAll('table')) {
    const parent = table.closest('[role="region"]');
    if (!parent) {errors.push('missing scroller'); continue;}
    if (parent.scrollWidth > parent.clientWidth + 1) {
      overflow.push(table.getAttribute('aria-label'));
      if (parent.tabIndex !== 0) errors.push('overflow lacks keyboard focus');
      if (!parent.getAttribute('aria-describedby')) errors.push('overflow lacks hint');
    }
    if (getComputedStyle(table).minWidth !== '0px') errors.push('forced minimum table width');
    for (const cell of table.querySelectorAll('[data-numeric="true"]')) if (getComputedStyle(cell).textAlign !== 'right') numeric.push(cell.textContent);
  }
  for (const article of document.querySelectorAll('[data-case="ThroughputChart"], [data-case="InferenceThroughputChart"]')) {
    const bounds = article.getBoundingClientRect();
    for (const node of article.querySelectorAll('section *')) {
      const rect = node.getBoundingClientRect();
      if (rect.left < bounds.left - 1 || rect.right > bounds.right + 1) errors.push('chart clipping: ' + node.textContent);
      if (node.childNodes.length && [...node.childNodes].some(n => n.nodeType === Node.TEXT_NODE && n.textContent.trim()) && parseFloat(getComputedStyle(node).fontSize) < 14) errors.push('tiny text: ' + node.textContent);
    }
  }
  function rgb(color) { return (color.match(/[\\d.]+/g) || []).slice(0,3).map(Number); }
  function luminance(color) { return rgb(color).map(x=>{x/=255;return x<=0.04045?x/12.92:((x+0.055)/1.055)**2.4}).reduce((v,x,i)=>v+x*[0.2126,0.7152,0.0722][i],0); }
  function contrast(a,b) { const x=luminance(a),y=luminance(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05); }
  const textRatios=[], graphicRatios=[];
  for (const node of document.querySelectorAll('article *')) {
    if (node.closest('svg')) continue;
    if ([...node.childNodes].some(n=>n.nodeType===Node.TEXT_NODE&&n.textContent.trim())) {
      let parent=node, background;
      while(parent) { background=getComputedStyle(parent).backgroundColor; if(background!=='rgba(0, 0, 0, 0)'&&background!=='transparent') break; parent=parent.parentElement; }
      const ratio=contrast(getComputedStyle(node).color,background||getComputedStyle(document.body).backgroundColor);
      textRatios.push(ratio);
      if(ratio<4.5) errors.push('text contrast '+ratio.toFixed(2)+' ('+getComputedStyle(node).color+' / '+background+'): '+node.textContent.slice(0,50));
    }
    if (node.className && typeof node.className==='string' && node.className.endsWith('_bar')) {
      const ratio=contrast(getComputedStyle(node).backgroundColor,getComputedStyle(node.parentElement).backgroundColor);
      graphicRatios.push(ratio); if(ratio<3) errors.push('bar contrast '+ratio.toFixed(2));
    }
  }
  return {errors,numeric,overflow:overflow.length,tables:document.querySelectorAll('table').length,bars:graphicRatios.length,minTextContrast:Math.min(...textRatios),minBarContrast:Math.min(...graphicRatios)};
})()`;

test('isolated hydrated components reflow in KO/EN, light/dark, mobile/desktop and 200% text', {timeout: 90000}, async () => {
  assert.ok(fs.existsSync(chromePath), 'supply EP65_CHROME');
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ep65-browser-'));
  const output = process.env.EP65_ARTIFACTS ? path.resolve(process.env.EP65_ARTIFACTS) : null;
  if (output) fs.mkdirSync(output, {recursive: true});
  let chrome, cdp;
  try {
    const pages = {};
    for (const locale of ['ko', 'en']) pages[locale] = await fixture(temp, locale);
    const profile = path.join(temp, 'chrome');
    chrome = spawn(chromePath, ['--headless=new', '--remote-debugging-port=0', '--user-data-dir='+profile, '--no-first-run', '--no-default-browser-check', '--disable-background-networking', '--disable-component-update', 'about:blank'], {stdio: ['ignore','ignore','pipe']});
    const endpoint = await new Promise((resolve, reject) => {
      let stderr = '';
      chrome.stderr.on('data', chunk => {stderr += chunk; const url = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1]; if(url) resolve(url);});
      chrome.on('error', reject);
      chrome.on('exit', code => reject(Error('Chrome exited '+code)));
    });
    const socket = new WebSocket(endpoint);
    await new Promise((resolve, reject) => {socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
    cdp = new CDP(socket);
    const {targetId} = await cdp.send('Target.createTarget', {url:'about:blank'});
    const {sessionId} = await cdp.send('Target.attachToTarget', {targetId, flatten:true});
    const send = (method, params) => cdp.send(method,params,sessionId);
    await send('Page.enable');
    const evaluate = async expression => {
      const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
      if(result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
      return result.result.value;
    };
    const evidence=[];
    for(const locale of ['ko','en']) {
      await send('Page.navigate',{url:'file://'+pages[locale]});
      for(let n=0;n<100 && !await evaluate('window.fixtureReady === true');n++) await delay(50);
      assert.equal(await evaluate('window.fixtureReady === true'),true,'hydration completed');
      for(const theme of ['light','dark']) for(const [width,fontSize] of [[320,16],[390,16],[768,16],[1440,16],[320,32]]) {
        await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
        await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)};document.documentElement.style.fontSize='${fontSize}px';new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))`);
        // ResizeObserver measures after layout; allow React to commit the
        // resulting focus/hint state before asserting it.
        let result=await evaluate(inspect);
        for(let n=0;n<20&&result.errors.some(e=>e.startsWith('overflow lacks'));n++) {
          await delay(25);
          result=await evaluate(inspect);
        }
        const state={locale,theme,width,fontSize,...result};evidence.push(state);
        if (output && result.errors.length) {
          fs.writeFileSync(path.join(output,'failure.json'),JSON.stringify(state,null,2));
          const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
          fs.writeFileSync(path.join(output,'failure.png'),Buffer.from(screenshot.data,'base64'));
        }
        assert.deepEqual(result.errors,[],JSON.stringify(state));
        assert.deepEqual(result.numeric,[],JSON.stringify(state));
        assert.equal(result.bars,17);
        assert.ok(result.tables>=48);
        if(output&&locale==='en'&&fontSize===16&&width===320) {
          for(const name of ['LayerRoles','ThroughputChart','InferenceThroughputChart']) {
            await evaluate(`document.querySelector('[data-case="${name}"]').scrollIntoView()`);
            const screenshot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
            fs.writeFileSync(path.join(output,`${name}-${theme}-320.png`),Buffer.from(screenshot.data,'base64'));
          }
        }
      }
    }
    if(output) fs.writeFileSync(path.join(output,'validation.json'),JSON.stringify(evidence,null,2));
    console.log(JSON.stringify({states:evidence.length,tables:evidence[0].tables,minTextContrast:Math.min(...evidence.map(x=>x.minTextContrast)),minBarContrast:Math.min(...evidence.map(x=>x.minBarContrast))}));
  } finally {
    if(cdp) {await cdp.send('Browser.close').catch(()=>{});cdp.socket.close();}
    if(chrome) {chrome.kill();await delay(150);}
    fs.rmSync(temp,{recursive:true,force:true});
  }
});
