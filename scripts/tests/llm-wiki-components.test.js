const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {stripMdx} = require('../generate-llm-wiki');
const metrics = require('../../src/data/coredns-metrics.json');

test('CoreDNS export retains all eight rows and exact copyable queries', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../docs/eks-best-practices/networking-performance/coredns-monitoring-optimization.md'), 'utf8');
  const serialized = new Set();
  const output = stripMdx(source, {serialized});
  assert.equal(metrics.rows.length, 8);
  assert.ok(serialized.has('CoreDnsMetricsTable'));
  for (const row of metrics.rows) {
    assert.ok(output.includes(`\`${row.query}\``), row.name);
    assert.ok(output.includes(row.description.ko), row.name);
  }
  assert.ok(output.includes('coredns_panics_total'));
  assert.ok(output.includes(metrics.scope.ko));
});

test('MoE export states weight units and keeps precision arithmetic', () => {
  const output = stripMdx('<GpuMemoryRequirements />');
  assert.match(output, /런타임 메모리 제외/);
  assert.match(output, /DeepSeek-V3 \(main model\) \| 671 \| 37 \| 1,342 \| 671 \| 335.5/);
  assert.match(output, /Kimi K2.5 \| 1000 \| 32 \| 2,000 \| 1,000 \| 500/);
});

test('unhandled components disclose omissions without leaking JSX props', () => {
  const omitted = new Set();
  const output = stripMdx('Before\n<ExampleTable\n  data={{secret: "not article text"}}\n/>\nAfter', {
    sourceUrl: 'https://example.com/docs/page', omitted,
  });
  assert.deepEqual([...omitted], ['ExampleTable']);
  assert.match(output, /Export note:.*ExampleTable/);
  assert.match(output, /\[web version\]\(https:\/\/example.com\/docs\/page\)/);
  assert.ok(!output.includes('secret'));
  assert.ok(output.endsWith('After'));
});

test('code fences and Markdown tab content survive component handling', () => {
  const source = '```jsx\n<CoreDnsMetricsTable />\n```\n<Tabs>\n<TabItem value="example">\n## A tab\n\nKeep this paragraph.\n</TabItem>\n</Tabs>';
  const output = stripMdx(source);
  assert.match(output, /```jsx\n<CoreDnsMetricsTable \/>\n```/);
  assert.match(output, /## A tab\n\nKeep this paragraph/);
  assert.ok(!output.includes('Export note'));
});

test('custom props do not silently select default component data', () => {
  const omitted = new Set();
  const output = stripMdx('<CoreDnsMetricsTable variant="custom" />', {omitted});
  assert.ok(omitted.has('CoreDnsMetricsTable'));
  assert.match(output, /Export note/);
  assert.ok(!output.includes('coredns_panics_total'));
});
