const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {stripMdx} = require('../generate-llm-wiki');
const {StaticRenderer} = require('../llm-wiki-static');
const {adapters, stateProfiles} = require('../llm-wiki-profiles');
const {markdown} = require('../llm-wiki-markdown');
const root = path.resolve(__dirname, '../..');
const reference = path.join(root, 'docs/agentic-ai-platform/reference-architecture/index.md');
const figureImport = "import Figure from '@site/src/components/Figure';\n";

test('captioned draw.io figure keeps every graph node, edge, and source caption', () => {
  const source = fs.readFileSync(reference, 'utf8');
  const omitted = new Set(), renderedSources = [];
  const output = stripMdx(source, {filePath: reference, omitted, renderedSources});
  assert.deepEqual([...omitted], []);
  const graph = renderedSources.find(s => s.component === 'Figure');
  assert.deepEqual(graph.graph_counts, {vertices: 118, edges: 34});
  assert.ok(graph.source_files.includes('src/components/Figure/index.js'));
  for (const text of ['플랫폼 전체 구조', '원본 그림 열기', 'Source ID', 'Target ID']) assert.ok(output.includes(text), text);
  assert.ok(output.includes('fine%2520tunning%2520feature%29.drawio'));
});

test('Figure preserves its authored content and fallback without decorative SVG markup', () => {
  const output = stripMdx(`${figureImport}
import Icon from '@site/src/components/Icon';
<Figure title="Capacity" description="Measured conditions" source={<a href="/source">Evidence</a>} dataFallback={<p>12 GB</p>}>
  <p><Icon name="cpu" /> GPU memory</p>
</Figure>`, {filePath: reference});
  for (const text of ['Capacity', 'Measured conditions', '[Evidence](/source)', '12 GB', 'GPU memory']) assert.ok(output.includes(text));
  assert.ok(!output.includes('Export note'));
  assert.ok(!output.includes('<svg'));
});

test('Figure refuses remote, runtime, duplicate, and injected embedded content', () => {
  const source = fs.readFileSync(reference, 'utf8');
  const frame = source.match(/<iframe[\s\S]*?\/>/)[0];
  for (const body of [
    '<iframe src="https://example.com/private" />',
    '<iframe src={window.location.href} />',
    `${frame}${frame}`,
    `<div>${frame}</div>`,
    `${frame}<script>secret()</script>`,
    `${frame}<p>{process.env.SECRET}</p>`,
  ]) {
    const omitted = new Set();
    const output = stripMdx(`${figureImport}<Figure title="Example">${body}</Figure>`, {filePath: reference, omitted});
    assert.deepEqual([...omitted], ['Figure']);
    assert.ok(output.includes('Export note'));
    assert.ok(!output.includes('| Node ID |'));
  }
});

test('shared tables retain captions, all rows, and localized status text', () => {
  for (const locale of ['ko', 'en']) {
    const renderer = new StaticRenderer({root, locale, adapters, stateProfiles});
    const render = (name, expression) => markdown(renderer.expression(expression,
      new Map([['Table', {source: `@site/src/components/tables/${name}`, exported: 'default'}]]), reference));
    const base = render('BaseTable', '<Table caption="Explicit caption" title="Old title" description="Condition" headers={["Name","Value"]} rows={[{id:"a",cells:["A",1]},{id:"b",cells:["B",2]}]} paginated pageSize={1} />');
    for (const text of ['Explicit caption', 'Condition', '| A | 1 |', '| B | 2 |']) assert.ok(base.includes(text));
    assert.ok(!base.includes('Old title'));
    const metrics = render('MetricsTable', '<Table title="CPU metrics" headers={["Metric","Value"]} rows={[{id:"cpu",cells:["CPU",95]}]} currentValues={{CPU:95}} thresholds={{CPU:{warning:70,critical:90}}} />');
    assert.ok(metrics.includes(locale === 'ko' ? '심각' : 'Critical'));
    assert.ok(metrics.includes('95'));
    const troubleshooting = render('TroubleshootingTable', '<Table issues={[{id:"a",problem:"Failure",cause:"Queue full",solution:"Reduce concurrency",severity:"high"}]} defaultExpanded={false} />');
    for (const text of ['Failure', 'Queue full', 'Reduce concurrency', locale === 'ko' ? '높음' : 'High']) assert.ok(troubleshooting.includes(text));
  }
});
