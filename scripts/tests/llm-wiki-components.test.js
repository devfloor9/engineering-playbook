const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {stripMdx} = require('../generate-llm-wiki');
const metrics = require('../../src/data/coredns-metrics.json');
const parallelization = require('../../src/data/moe-parallelization.json');
const moeImport = "import { GpuMemoryRequirements, ParallelizationStrategies } from '@site/src/components/MoeModelTables';";
const cardImport = "import { DocCard, DocCardGrid } from '@site/src/components/DocCards';";

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
  const output = stripMdx(`${moeImport}\n<GpuMemoryRequirements />`);
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
  const output = stripMdx("import { CoreDnsMetricsTable } from '@site/src/components/CoreDnsTables';\n<CoreDnsMetricsTable variant=\"custom\" />", {omitted});
  assert.ok(omitted.has('CoreDnsMetricsTable'));
  assert.match(output, /Export note/);
  assert.ok(!output.includes('coredns_panics_total'));
});

test('shared parallelization data reaches the Markdown table without dropping tradeoffs', () => {
  const output = stripMdx(`${moeImport}\n<ParallelizationStrategies />`);
  for (const row of parallelization) {
    for (const value of [row.strategy, row.description.ko, row.advantages.ko, row.disadvantages.ko]) {
      assert.ok(output.includes(value), value);
    }
  }
  const component = fs.readFileSync(path.join(__dirname, '../../src/components/MoeModelTables/ParallelizationStrategies.js'), 'utf8');
  assert.match(component, /import parallelization from '\.\.\/\.\.\/data\/moe-parallelization\.json'/);
  assert.match(component, /parallelization\.map/);
});

test('component resolution uses the imported module, not a matching local name', () => {
  for (const source of [
    '<GpuMemoryRequirements />',
    "import GpuMemoryRequirements from './OtherTable';\n<GpuMemoryRequirements />",
    "import { GpuMemoryRequirements } from '@site/src/components/OtherTables';\n<GpuMemoryRequirements />",
    `\`\`\`js\n${moeImport}\n\`\`\`\n<GpuMemoryRequirements />`,
  ]) {
    const output = stripMdx(source);
    assert.match(output, /Export note/);
    assert.ok(!output.includes('335.5'));
  }
});

test('named aliases, multiline imports and direct default imports resolve the same data', () => {
  for (const declaration of [
    "import {\n  GpuMemoryRequirements as Weights,\n} from '@site/src/components/MoeModelTables';",
    "import Weights from '@site/src/components/MoeModelTables/GpuMemoryRequirements.js';",
  ]) {
    const serialized = new Set();
    const output = stripMdx(`${declaration}\n<Weights />`, {serialized});
    assert.ok(serialized.has('GpuMemoryRequirements'));
    assert.match(output, /335.5/);
    assert.ok(!output.includes('import'));
  }
});

test('trailing import comments cannot borrow another module for a serializer', () => {
  const source = `import { GpuMemoryRequirements as Weights } from '@site/src/components/OtherTables'; // Same local name
import { ParallelizationStrategies } from '@site/src/components/MoeModelTables';
<Weights />
<ParallelizationStrategies />`;
  const omitted = new Set();
  const serialized = new Set();
  const output = stripMdx(source, {omitted, serialized});
  assert.ok(omitted.has('Weights'));
  assert.ok(!output.includes('335.5'));
  assert.deepEqual([...serialized], ['ParallelizationStrategies']);
});

test('side-effect imports cannot remove intervening prose or code fences', () => {
  const source = `import './styles.css';
Keep this explanation.

\`\`\`js
import { GpuMemoryRequirements } from './example';
\`\`\`

${moeImport}
<GpuMemoryRequirements />`;
  const output = stripMdx(source);
  assert.ok(output.includes('Keep this explanation.'));
  assert.ok(output.includes("import { GpuMemoryRequirements } from './example';"));
  assert.ok(output.includes('335.5'));
  assert.ok(!output.includes('styles.css'));
});

test('multiline import comments stay within their own declaration', () => {
  const source = `import {
  /* Shared data */ GpuMemoryRequirements as Weights,
} from '@site/src/components/MoeModelTables'; // Import comment
Keep the paragraph.
<Weights />`;
  const output = stripMdx(source);
  assert.ok(output.includes('Keep the paragraph.'));
  assert.ok(output.includes('335.5'));
  assert.ok(!output.includes('Import comment'));
});

test('static navigation preserves each card title, destination and description', () => {
  const file = path.join(__dirname, '../../docs/agentic-ai-platform/index.md');
  const source = fs.readFileSync(file, 'utf8');
  const serialized = new Set();
  const navigation = new Set();
  const omitted = new Set();
  const output = stripMdx(source, {serialized, navigation, omitted});
  assert.deepEqual([...navigation].sort(), ['DocCard', 'DocCardGrid']);
  assert.ok(serialized.has('DocCardGrid'));
  assert.equal(omitted.size, 0);
  const cards = [...source.matchAll(/<DocCard\s+to="([^"]+)"\s+icon="[^"]+"\s+title="([^"]+)"\s+description="([^"]+)"/g)];
  assert.equal(cards.length, 4);
  for (const [, destination, title, description] of cards) {
    assert.ok(output.includes(`[${title}](${destination}) — ${description}`));
  }
  assert.ok(!output.includes('color='));
});

test('navigation aliases work and Markdown metacharacters remain literal', () => {
  const source = `import { DocCard as Card, DocCardGrid as Grid } from '@site/src/components/DocCards';
<Grid columns={2}>
<Card to="/docs/a(b)" title="A [guide]" description="Read \`flags\` &amp; examples." />
</Grid>`;
  assert.match(stripMdx(source), /- \[A \\\[guide\\\]\]\(\/docs\/a%28b%29\) — Read \\\`flags\\\` & examples\./);
});

test('dynamic navigation stays omitted and is counted separately', () => {
  const source = `import DocCardList from '@theme/DocCardList';
<DocCardList items={useCurrentSidebarCategory().items} />`;
  const omitted = new Set();
  const omittedNavigation = new Set();
  const output = stripMdx(source, {omitted, omittedNavigation});
  assert.deepEqual([...omitted], ['DocCardList']);
  assert.deepEqual([...omittedNavigation], ['DocCardList']);
  assert.match(output, /Export note/);
  assert.ok(!output.includes('useCurrentSidebarCategory'));
});

test('unsupported card expressions omit the whole grid without a partial success', () => {
  for (const attribute of ['to={buildPath()}', 'to="/docs/example" description={loadDescription()}', 'to="/docs/example" {...props}']) {
    const source = `${cardImport}
<DocCardGrid>
<DocCard to="/docs/valid" title="Valid" />
<DocCard ${attribute} title="Dynamic" />
</DocCardGrid>
After`;
    const serialized = new Set();
    const omittedNavigation = new Set();
    const output = stripMdx(source, {serialized, omittedNavigation});
    assert.equal(serialized.size, 0);
    assert.ok(omittedNavigation.has('DocCardGrid'));
    assert.match(output, /Export note/);
    assert.ok(!output.includes('[Valid]'));
    assert.ok(output.endsWith('After'));
  }
});

// Keep the established npm test:llm-wiki entry point; no root package changes.
require('./llm-wiki-boundaries.test');
require('./llm-wiki-parity.test');
