// node scripts/tests/document-tools/serve-fixture.cjs
// Scoped browser fixture only: no Docusaurus build or dependency installation.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const {root, foundation, dependencyRoot, dependency} = require('./source-loader.cjs');
const webpack = dependency('webpack');
const output = fs.mkdtempSync(path.join(os.tmpdir(), 'document-tools-'));
const context = path.join(__dirname, 'browser-context.jsx');
const aliases = {
  '@site/src/components/Icon$': path.join(foundation, 'src/components/Icon'),
  '@site': root,
  '@theme/DocMeta$': path.join(root, 'src/theme/DocMeta'),
};
for (const [request, name, named = false] of [
  ['@docusaurus/useDocusaurusContext', 'useDocusaurusContext'],
  ['@docusaurus/useBaseUrl', 'useBaseUrl'],
  ['@docusaurus/useBrokenLinks', 'useBrokenLinks'],
  ['@docusaurus/Link', 'Link'], ['@docusaurus/Head', 'Head'],
  ['@theme/Heading', 'Heading'], ['@theme/MDXContent', 'MDXContent'],
  ['@docusaurus/router', 'useLocation', true],
  ['@docusaurus/plugin-content-docs/client', 'useDoc', true],
  ['@docusaurus/theme-common', 'ThemeClassNames', true],
]) {
  const file = path.join(output, `${name}.js`);
  fs.writeFileSync(file, `export {${name}${named ? '' : ' as default'}} from ${JSON.stringify(context)};`);
  aliases[`${request}$`] = file;
}
const compiler = webpack({
  mode: 'development', devtool: false,
  entry: path.join(__dirname, 'browser-fixture.jsx'),
  output: {path: output, filename: 'fixture.js'},
  resolve: {alias: aliases, modules: [path.join(dependencyRoot, 'node_modules')], extensions: ['.js', '.jsx']},
  module: {rules: [
    {test: /\.jsx?$/, exclude: /node_modules/, use: {
      loader: dependency.resolve('babel-loader'),
      options: {babelrc: false, configFile: false, presets: [dependency.resolve('@babel/preset-react')]},
    }},
    {test: /\.module\.css$/, use: path.join(__dirname, 'css-fixture-loader.cjs')},
  ]},
});

compiler.run((error, stats) => {
  compiler.close(() => {});
  if (error || stats.hasErrors()) {
    console.error(error || stats.toString({all: false, errors: true}));
    process.exitCode = 1;
    return;
  }
  if (process.argv.includes('--check')) {
    console.log('Document tools browser fixture compiled successfully.');
    return;
  }
  const reports = [];
  const html = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Document tools scoped verification</title>
<link rel="stylesheet" href="/foundation.css"><style>
*{box-sizing:border-box}body{margin:0;background:var(--ep-surface);color:var(--ep-on-surface);font-family:system-ui,sans-serif;line-height:1.8}
#fixture{max-width:784px;margin:auto;padding:16px 24px}h1{font-size:2.25rem;line-height:1.25;overflow-wrap:anywhere;margin:0 0 16px}h2{font-size:1.6rem}
#results{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 monospace;margin:24px;padding:12px;border:1px solid var(--ep-outline-variant)}
@media(max-width:500px){#fixture{padding:16px}h1{font-size:1.875rem}}
</style></head><body><main id="fixture"></main><pre id="results" aria-label="Verification results"></pre><script src="/fixture.js"></script></body></html>`;
  const matrix = `<!doctype html><html><head><meta charset="utf-8"><title>Document tools light/dark verification matrix</title></head><body style="font-family:system-ui;background:#eee;margin:16px">
<h1>Document tools verification</h1><p><a href="/?test=1">Run state and clipboard tests</a> · <a href="/?state=error">Manifest error/retry</a> · <a href="/?locale=en">English unsupported</a></p>
<div style="display:flex;gap:24px"><section><h2>Light · 320px</h2><iframe title="Light 320px" src="/?theme=light" width="320" height="860" style="border:0"></iframe></section>
<section><h2>Dark · 320px</h2><iframe title="Dark 320px" src="/?theme=dark" width="320" height="860" style="border:0"></iframe></section></div>
<h2>Light · 1280px</h2><iframe title="Light desktop" src="/?theme=light" width="1280" height="720" style="border:0"></iframe>
<h2>Dark · 1280px</h2><iframe title="Dark desktop" src="/?theme=dark" width="1280" height="720" style="border:0"></iframe></body></html>`;
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    if (request.method === 'POST' && url.pathname === '/results') {
      let body = '';
      request.on('data', chunk => { body += chunk; });
      request.on('end', () => {
        const report = JSON.parse(body);
        reports.push(report);
        fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(reports, null, 2));
        console.log(JSON.stringify(report));
        response.end('ok');
      });
    } else if (url.pathname === '/fixture.js') {
      response.setHeader('content-type', 'application/javascript');
      fs.createReadStream(path.join(output, 'fixture.js')).pipe(response);
    } else if (url.pathname === '/foundation.css') {
      response.setHeader('content-type', 'text/css');
      // External font imports are excluded from this isolated visual fixture.
      response.end(fs.readFileSync(path.join(foundation, 'src/css/custom.css'), 'utf8').replace(/^@import.*$/gm, ''));
    } else {
      response.setHeader('content-type', 'text/html; charset=utf-8');
      response.end(url.pathname === '/matrix' ? matrix : html);
    }
  });
  server.listen(0, '127.0.0.1', () => {
    console.log(`Fixture: http://127.0.0.1:${server.address().port}/matrix`);
    console.log(`Evidence: ${path.join(output, 'results.json')}`);
  });
});
