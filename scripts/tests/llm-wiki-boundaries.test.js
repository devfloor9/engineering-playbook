const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {stripMdx, rewriteLinks} = require('../generate-llm-wiki');
const {StaticRenderer, StaticGap, element} = require('../llm-wiki-static');
const {markdown} = require('../llm-wiki-markdown');
const {rewriteMarkdownLinks} = require('../llm-wiki-links');
const {renderComponent} = require('../llm-wiki-components');
const root = path.resolve(__dirname, '../..');
const tableImport = "import {SpecificationTable} from '@site/src/components/tables';";

test('complete JSX spans preserve trailing prose, comparisons in props and the next import', () => {
  const source = `${tableImport}
Before
<SpecificationTable
 headers={['a > b', 'code']}
 data={[[1, <code>a &lt; b</code>]]}
/> trailing prose
After
import Other from './dynamic';
<Other value={load()} />
Last`;
  const output = stripMdx(source);
  assert.match(output, /a \\> b/);
  assert.match(output, /`a < b`/);
  assert.match(output, /trailing prose/);
  assert.match(output, /After/);
  assert.match(output, /Export note.*Other/);
  assert.ok(output.endsWith('Last'));
  assert.ok(!output.includes('load()'));
});

test('mixed fence lengths, nested examples and indented code survive verbatim', () => {
  const code = [
    '````markdown', '```jsx', '<Unknown />', '', '', '', '```', 'import X from "./sample";', '````',
    '~~~jsx', '<Other />', '~~~~',
    '    <Indented />',
  ].join('\n');
  assert.equal(stripMdx(code), code);
});

test('inline imported components preserve surrounding prose and leave inline-code examples unchanged', () => {
  const source = `import {LayerRoles as Layers} from '@site/src/components/ArchitectureTables';
Before <Layers /> after. Example: \`<Layers />\`.
`;
  const output = stripMdx(source);
  assert.ok(output.includes('Before '));
  assert.ok(output.includes(' after. Example: `<Layers />`.'));
  assert.ok(output.includes('Layer 6: Experience & Channels'));
  assert.equal((output.match(/런타임 레이어/g) || []).length, 1);
});

test('ESM exports are removed at their boundary without leaking functions into article prose', () => {
  const source = `export const Widget = () => {
 return <div>dynamic</div>;
}; // implementation
Keep this paragraph.
<Widget />
Keep the next paragraph.`;
  const output = stripMdx(source);
  assert.ok(!output.includes('return <div>'));
  assert.ok(!output.includes('export const'));
  assert.ok(output.includes('Keep this paragraph.'));
  assert.ok(output.includes('Keep the next paragraph.'));
  assert.match(output, /Export note.*Widget/);
});

test('source-qualified namespace and renamed exports resolve real data without name heuristics', () => {
  const output = stripMdx("import * as Tables from '@site/src/components/ArchitectureTables';\n<Tables.LayerRoles />");
  assert.ok(output.includes('Layer 6: Experience & Channels'));
  assert.ok(!output.includes('Export note'));
  const collision = stripMdx("import {LayerRoles} from './unrelated';\n<LayerRoles />");
  assert.match(collision, /Export note/);
  const one = stripMdx("import {MonitoringMetrics} from '@site/src/components/NemoTables';\n<MonitoringMetrics />");
  const two = stripMdx("import {MonitoringMetrics} from '@site/src/components/MoeModelTables';\n<MonitoringMetrics />");
  assert.notEqual(one, two);
});

test('literal tables retain units, recommendations, multiline values and every row beyond UI pagination', () => {
  const rows = Array.from({length: 15}, (_, i) => [i + 1, `row-${i + 1}`]);
  const output = stripMdx(`${tableImport}\n<SpecificationTable headers={['Memory', 'Name']} data={${JSON.stringify(rows)}} units={{0: 'GB'}} paginated pageSize={3} />`);
  for (let i = 1; i <= 15; i++) assert.ok(output.includes(`${i} GB | row-${i} |`));
  const comparison = stripMdx(`import {ComparisonTable} from '@site/src/components/tables';
<ComparisonTable headers={['Name', 'Description']} recommendedId="a" rows={[{id:'a',cells:['Alpha','one\\ntwo']}, {id:'b',cells:['Beta','a | b']}]} />`);
  assert.ok(comparison.includes('추천'));
  assert.ok(comparison.includes('one<br />two'));
  assert.ok(comparison.includes('a \\| b'));
});

test('unresolved props, spreads, state and external embeds remain explicit gaps', () => {
  for (const jsx of [
    '<SpecificationTable headers={fetchRows()} data={[]} />',
    '<SpecificationTable {...runtimeProps} />',
    '<iframe src="https://example.com/live" />',
    '<canvas />',
  ]) {
    const omitted = new Set(), diagnostics = [];
    const output = stripMdx(`${tableImport}\n${jsx}\nAfter`, {omitted, diagnostics});
    assert.equal(omitted.size, 1);
    assert.equal(diagnostics.length, 1);
    assert.match(output, /Export note/);
    assert.ok(output.endsWith('After'));
  }
});

test('static interpreter rejects host globals, prototype access, runtime hooks and unbounded execution', () => {
  const renderer = new StaticRenderer({root});
  for (const expression of [
    'process.env', 'require("node:fs")', 'fetch("https://example.com")',
    '/(a+)+$/', '"12.5".match(runtimeRegex)',
    '({}).constructor', '({})["__proto__"]', 'String.constructor("return process")()',
    'import("node:fs")', 'new Function("return process")()',
    '(()=>{while(true) {}})()', '(()=>{for(let i=0;i<5000;i++) {} return 1;})()',
    '(()=>{const loop=()=>loop();return loop();})()', '"x".repeat(100000000)',
    '<div style={{width: fetch("https://example.com/live")}}>Static caption</div>',
  ]) {
    renderer.reset();
    assert.throws(() => renderer.expression(expression), StaticGap, expression);
  }
  renderer.reset();
  const imports = new Map([['useState', {source: 'react', exported: 'useState'}]]);
  assert.throws(() => renderer.expression('useState(0)', imports), /Interactive state/);
});

test('module resolution rejects traversal, executable module statements and missing exports', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-wiki-static-test-'));
  try {
    fs.writeFileSync(path.join(directory, 'unsafe.js'), 'globalThis.__llmWikiProbe = true; export default () => <p>Unsafe</p>;');
    fs.writeFileSync(path.join(directory, 'safe.js'), 'export default () => <p>Safe</p>;');
    fs.symlinkSync(path.join(root, 'scripts/llm-wiki-static.js'), path.join(directory, 'outside.js'));
    const renderer = new StaticRenderer({root: directory});
    assert.throws(() => renderer.imported('./unsafe', 'default', path.join(directory, 'entry.js')), /Module side effect/);
    assert.equal(globalThis.__llmWikiProbe, undefined);
    assert.throws(() => renderer.imported('./safe', 'missing', path.join(directory, 'entry.js')), /Missing export/);
    assert.throws(() => renderer.imported('../outside', 'default', path.join(directory, 'entry.js')), /outside repository/);
    assert.throws(() => renderer.imported('./outside', 'default', path.join(directory, 'entry.js')), /symlink outside/);
  } finally { fs.rmSync(directory, {recursive: true, force: true}); }
});

test('unprofiled collapsed content never reports a partial static success', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'llm-wiki-state-test-'));
  try {
    fs.writeFileSync(path.join(directory, 'widget.js'), `import {useState} from 'react';
export default function Widget() {
 const [open] = useState(false);
 return <div>Summary{open && <table><tr><td>Hidden data</td></tr></table>}</div>;
}`);
    const renderer = new StaticRenderer({root: directory});
    assert.throws(() => renderer.expression('<Widget />',
      new Map([['Widget', {source: './widget.js', exported: 'default'}]]), path.join(directory, 'entry.js')), /Interactive state/);
  } finally { fs.rmSync(directory, {recursive: true, force: true}); }
});

test('table spans, code delimiters, labels and links preserve their semantic boundaries', () => {
  const tree = element('table', {}, [
    element('tr', {}, [element('th', {colSpan: 2}, ['Group'])]),
    element('tr', {}, [element('td', {}, ['A']), element('td', {}, [element('a', {href: '/docs/a'}, ['B'])])]),
  ]);
  assert.match(markdown(tree), /<th colspan="2">Group<\/th>/);
  assert.match(markdown(tree), /href="\/docs\/a"/);
  assert.equal(markdown(element('code', {}, ['a`b'])), '``a`b``');
  assert.equal(markdown(element('a', {href: '/docs/a(b)'}, ['[A]'])), '[\\[A\\]](/docs/a%28b%29)');
  assert.throws(() => markdown(element('svg', {'aria-label': 'Architecture'}, [])), /SVG geometry/);
});

test('only parsed Markdown destinations change, including image/reference links and queries', async () => {
  const source = [
    '[guide](./guide.mdx?view=one#part "A title")',
    '[code `[` label](/docs/code-label)',
    '![image](/img/a(b).svg "Image")',
    '[reference][doc]',
    '', '[doc]: /docs/intro "Reference title"', '',
    '`[example](/docs/code)`',
    '````markdown', '[nested](/docs/fenced)', '```', '[still code](/docs/fenced2)', '````',
    '    [indented](/docs/code)',
    'Prose <InlineExample /> stays unchanged.',
  ].join('\n');
  const output = await rewriteMarkdownLinks(source, url => url.startsWith('/') ? `https://example.com${url}` : url.replace('.mdx', '.md'));
  assert.ok(output.includes('[guide](./guide.md?view=one#part "A title")'));
  assert.ok(output.includes('[code `[` label](https://example.com/docs/code-label)'));
  assert.ok(output.includes('![image](https://example.com/img/a(b).svg "Image")'));
  assert.ok(output.includes('[doc]: https://example.com/docs/intro "Reference title"'));
  for (const example of ['`[example](/docs/code)`', '[nested](/docs/fenced)', '[still code](/docs/fenced2)', '    [indented](/docs/code)']) assert.ok(output.includes(example));
});

test('export link rewriting does not duplicate the site base or lose included-document relations', async () => {
  const file = path.join(root, 'docs/agentic-ai-platform/index.md');
  const included = new Set([path.join(root, 'docs/agentic-ai-platform/model-serving/index.md')]);
  const source = '[models](./model-serving/index.md#gpu)\n[asset](/engineering-playbook/img/test.svg)\n`[code](/docs/intro)`';
  const result = await rewriteLinks(source, file, included);
  assert.deepEqual(result.related, ['agentic-ai-platform/model-serving/index']);
  assert.ok(result.rewritten.includes('https://devfloor9.github.io/engineering-playbook/img/test.svg'));
  assert.ok(!result.rewritten.includes('/engineering-playbook/engineering-playbook'));
  assert.ok(result.rewritten.includes('`[code](/docs/intro)`'));
});
