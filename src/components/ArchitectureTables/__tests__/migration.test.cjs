const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {root, shared, dependency, files, runtime, authoredData, parse} = require('./fixture-runtime.cjs');
const parse5 = dependency('parse5');
const baseline = process.env.EP65_BASELINE || '0eff69cd';
function all(node, name) { return [node.tagName === name ? node : [], ...(node.childNodes || []).map(child => all(child, name))].flat(Infinity); }
function text(node) { return node.nodeName === '#text' ? node.value : (node.childNodes || []).map(text).join(' '); }
const attr = (node, key) => node.attrs?.find(a => a.name === key)?.value;
const normalize = value => value.replace(/\\([`|_*\[\]])/g, '$1').replace(/\*\*/g, '').replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '').replace(/\s+/g, ' ').trim();
function strings(value) { return typeof value === 'string' ? [value] : value && typeof value === 'object' ? Object.values(value).flatMap(strings) : []; }
for (const locale of ['ko', 'en']) {
  const rt = runtime(locale);
  for (const file of files) {
    test(`${locale}: ${file} preserves authored data and semantic output`, () => {
      const source = fs.readFileSync(path.join(root, file), 'utf8');
      parse(source, {sourceType: 'module', plugins: ['jsx']});
      const before = execFileSync('git', ['show', `${baseline}:${file}`], {cwd: root, encoding: 'utf8'});
      const oldData = authoredData(before, locale), newData = authoredData(source, locale);
      for (const [name, value] of Object.entries(oldData)) {
        if (name === 'i18n') {
          for (const lang of ['ko', 'en']) for (const [key, label] of Object.entries(value[lang])) assert.equal(newData[name][lang][key], label);
        } else assert.deepEqual(newData[name], value, name);
      }
      const html = rt.render(file, file.endsWith('InferenceThroughputChart.js') ? {locale} : {});
      const tree = parse5.parseFragment(html), tables = all(tree, 'table');
      assert.ok(tables.length, 'native fallback/table required');
      assert.match(html, /data-ep-theme="manual"/);
      assert.doesNotMatch(text(tree), /[\p{Extended_Pictographic}\uFE0F]/u);
      for (const table of tables) {
        assert.ok(attr(table, 'aria-label') || attr(table, 'aria-labelledby') || all(table, 'caption').length, 'table name');
        const head = all(table, 'thead')[0], body = all(table, 'tbody')[0];
        const headers = all(head, 'th');
        assert.ok(headers.length);
        headers.forEach(th => assert.equal(attr(th, 'scope'), 'col'));
        const identities = [];
        for (const row of all(body, 'tr')) {
          const cells = (row.childNodes || []).filter(n => ['td', 'th'].includes(n.tagName));
          assert.equal(cells.length, headers.length, 'column count');
          assert.equal(cells[0].tagName, 'th');
          assert.equal(attr(cells[0], 'scope'), 'row');
          identities.push(normalize(text(cells[0])));
        }
        assert.equal(new Set(identities).size, identities.length, 'unique row identities');
      }
      if (!file.endsWith('ThroughputChart.js')) {
        const visible = normalize(text(tree));
        for (const value of strings(oldData)) assert.ok(visible.includes(normalize(value)), `missing visible text: ${value}`);
      }
      assert.doesNotMatch(source, /linear-gradient|#[0-9a-f]{6}\b|\}cc/iu);
    });
  }
}
test('InferenceThroughputChart retains default and unknown locale fallback', () => {
  const rt = runtime('ko');
  assert.match(rt.render('src/components/InferenceThroughputChart.js'), /Higher is better/);
  assert.match(rt.render('src/components/InferenceThroughputChart.js', {locale: 'unknown'}), /Higher is better/);
});

test('numeric headers, loss meaning, source conditions, and all chart values remain visible', () => {
  const rt = runtime('en');
  const tcp = parse5.parseFragment(rt.render('src/components/ThroughputChart.js'));
  const table = all(tcp, 'table')[0];
  assert.equal(all(table, 'tbody').flatMap(n => all(n, 'tr')).length, 5);
  assert.match(text(tcp), /20%\+ packet loss/);
  assert.match(text(tcp), /10s duration.*12.5 Gbps baseline.*Median of 3\+ runs/);
  assert.match(text(table), /Loss value not supplied/);
  for (const row of all(all(table, 'tbody')[0], 'tr')) for (const td of all(row, 'td').slice(0, 2)) assert.equal(attr(td, 'data-numeric'), 'true');
  const inference = parse5.parseFragment(rt.render('src/components/InferenceThroughputChart.js'));
  assert.equal(all(all(inference, 'table')[0], 'tbody').flatMap(n => all(n, 'tr')).length, 7);
  for (const value of ['4,200', '1,800', '1,400', '3,500', '2,800', '2,200', 'tokens/sec']) assert.ok(text(inference).includes(value));
});

test('bounded static exporter evaluates every locale with the coordinated foundation adapters', () => {
  // Isolated copies only: the real exporter and shared dependency tree stay read-only.
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'ep65-export-'));
  try {
    for (const dir of ['ArchitectureTables', 'AgenticChallengesTables', 'AgenticSolutionsTables', 'DecisionFrameworkTables', 'Icon']) {
      fs.cpSync(path.join(root, 'src/components', dir), path.join(temp, 'src/components', dir), {recursive: true, filter: file => !file.includes('__tests__')});
    }
    for (const file of ['ThroughputChart.js', 'InferenceThroughputChart.js', 'ThroughputChart.module.css']) fs.copyFileSync(path.join(root, 'src/components', file), path.join(temp, 'src/components', file));
    for (const dir of ['DataTableFrame', 'Figure']) fs.cpSync(path.join(shared, dir), path.join(temp, 'src/components', dir), {recursive: true});
    // Resolve exporter dependencies from integration without creating node_modules.
    const Module = require('node:module');
    const previous = process.env.NODE_PATH;
    process.env.NODE_PATH = path.dirname(dependency.resolve('@babel/parser/package.json')).replace(/\/@babel\/parser$/, '');
    Module._initPaths();
    const {StaticRenderer, element} = require(path.join(root, 'scripts/llm-wiki-static'));
    const {adapters} = require(path.join(root, 'scripts/llm-wiki-profiles'));
    const {markdown} = require(path.join(root, 'scripts/llm-wiki-markdown'));
    process.env.NODE_PATH = previous || '';
    Module._initPaths();
    const contracts = {...adapters,
      'src/components/Icon/index.js': () => null,
      'src/components/Figure/index.js': props => element('figure', {}, [props.children,
        element('figcaption', {}, [props.title, props.description, props.source]), props.dataFallback]),
    };
    for (const locale of ['ko', 'en']) for (const file of files) {
      const renderer = new StaticRenderer({root: temp, locale, adapters: contracts});
      const imported = renderer.imported('@site/' + file, 'default', path.join(temp, 'fixture.md'));
      const output = markdown(renderer.call(imported, [{locale}]));
      assert.ok(output.length > 40, file);
      assert.match(output, /\|/, file);
      assert.doesNotMatch(output, /<svg|\[object Object\]|Export note/, file);
      const data = authoredData(fs.readFileSync(path.join(root, file), 'utf8'), locale);
      if (!file.endsWith('ThroughputChart.js')) for (const value of strings(data)) {
        assert.ok(normalize(output).includes(normalize(value)), `${file}: export missing ${value}`);
      }
      if (file.endsWith('InferenceThroughputChart.js')) {
        for (const value of ['4,200', '1,800', '1,400', '3,500', '2,800', '2,200', 'tokens/sec']) assert.ok(output.includes(value), value);
      }
      if (file.endsWith('/ThroughputChart.js')) for (const value of ['12.41', '12.34', '12.40', '10.00', '7.92', '7.96', '20%', '20%+', '3+ runs']) assert.ok(output.includes(value), value);
    }
  } finally { fs.rmSync(temp, {recursive: true, force: true}); }
});
