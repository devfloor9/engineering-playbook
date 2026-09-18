// Contract examples for the coordinator. Adapters are injected in this test
// process only; no exporter or Foundation source is changed or copied.
const assert = require('node:assert/strict');
const {test} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const root = path.resolve(__dirname, '../../../..');
const dependencies = process.env.EP_TEST_DEPS || (fs.existsSync(path.join(root, 'node_modules'))
  ? path.join(root, 'node_modules') : path.resolve(root, '../integration/node_modules'));
process.env.NODE_PATH = [dependencies, process.env.NODE_PATH].filter(Boolean).join(path.delimiter);
Module._initPaths();
const {StaticRenderer, StaticGap, element, native} = require('../../../../scripts/llm-wiki-static');
const {adapters, stateProfiles} = require('../../../../scripts/llm-wiki-profiles');
const {markdown} = require('../../../../scripts/llm-wiki-markdown');
const {readImports, jsxBlock} = require('../../../../scripts/llm-wiki-source');
const foundation = process.env.EP_FOUNDATION_ROOT || (fs.existsSync(path.join(root, 'src/components/Icon'))
  ? root : path.resolve(root, '../structure'));

const proposedProfiles = {
  ...adapters,
  'src/components/tables/BaseTable.js': props => {
    if (!Array.isArray(props.headers) || !Array.isArray(props.rows)) throw new StaticGap('Table headers/rows are not static arrays');
    if (props.rows.some(row => !Array.isArray(row.cells) || row.cells.length !== props.headers.length)) throw new StaticGap('Table row width does not match headers');
    return [
    ...(props.description != null ? [element('p', {}, [props.description])] : []),
    element('table', {}, [
      ...((props.caption ?? props.title) != null ? [element('caption', {}, [props.caption ?? props.title])] : []),
      element('thead', {}, [element('tr', {}, props.headers.map(header => element('th', {}, [header])))]),
      element('tbody', {}, props.rows.map(row => element('tr', {}, row.cells.map(cell => element('td', {}, [cell]))))),
    ]),
    ];
  },
  'src/components/Figure/index.js': props => element('figure', {}, [
    element('figcaption', {}, [props.title]),
    element('p', {}, [props.description]),
    element('p', {}, [props.source]),
    props.children, props.dataFallback,
  ]),
  'src/components/tables/TroubleshootingTable.js': (props, renderer) => {
    const labels = renderer.locale === 'ko'
      ? {low: '낮음', medium: '중간', high: '높음', critical: '심각'}
      : {low: 'Low', medium: 'Medium', high: 'High', critical: 'Critical'};
    return props.issues.map(issue => element('section', {}, [
      element('p', {}, [issue.problem, ' ', labels[issue.severity] || '']),
      element('p', {}, [issue.cause]), element('p', {}, [issue.solution]),
    ]));
  },
};
function renderer(locale = 'en') {
  const render = new StaticRenderer({root, locale, adapters: {...proposedProfiles}, stateProfiles});
  const originalResolve = render.resolve.bind(render);
  const icon = path.join(foundation, 'src/components/Icon/index.js');
  render.resolve = (source, from) => source === '@site/src/components/Icon' ? icon : originalResolve(source, from);
  render.adapters[render.relative(icon)] = () => null;
  // Proposed safe intrinsic needed by MetricsTable, scoped to this test only.
  const originalGlobals = render.globals.bind(render);
  render.globals = file => {
    const scope = originalGlobals(file);
    scope.get('Number').isFinite = native(([value]) => Number.isFinite(value));
    return scope;
  };
  return render;
}
function exportFixture(source, expression, locale) {
  const render = renderer(locale);
  return markdown(render.expression(expression, new Map([['T', {source, exported: 'default'}]]), path.join(root, 'docs/fixture.mdx')));
}

test('BaseTable proposed profile exports captions, description and all rows without paging/sort keys', () => {
  const rows = Array.from({length: 12}, (_, index) => ({id: String(index), cells: [`Row ${index}`, `${index} GB`], sortValues: ['hidden-key', index]}));
  const output = exportFixture('@site/src/components/tables/BaseTable', `<T title="Old title" caption="Explicit caption" description="Source conditions" headers={["Model","Memory"]} rows={${JSON.stringify(rows)}} paginated pageSize={2} sortable searchable />`);
  assert.ok(output.includes('Explicit caption'));
  assert.ok(output.includes('Source conditions'));
  assert.ok(!output.includes('Old title'));
  assert.ok(!output.includes('hidden-key'));
  for (let index = 0; index < rows.length; index++) assert.ok(output.includes(`| Row ${index} | ${index} GB |`));
});

test('real specialized table sources export values, captions, units and localized statuses', () => {
  for (const locale of ['ko', 'en']) {
    const spec = exportFixture('@site/src/components/tables/SpecificationTable', '<T title="Requirements" description="Provided condition" headers={["Model","Memory"]} data={[["Small",2],["Medium",10],["Large",20]]} units={{1:"GB"}} thresholds={{1:{warning:10,danger:20}}} />', locale);
    for (const value of ['Requirements', 'Provided condition', '2 GB', '10 GB', '20 GB', ...(locale === 'ko' ? ['정상', '경고', '위험'] : ['Normal', 'Warning', 'Danger'])]) assert.ok(spec.includes(value), value);
    const comparison = exportFixture('@site/src/components/tables/ComparisonTable', '<T title="Options" headers={["Option","Value"]} rows={[{id:"a",cells:["A",12],recommended:true},{id:"b",cells:["B",24]}]} recommendedId="b" />', locale);
    assert.ok(comparison.includes('Options'));
    assert.equal(comparison.split(locale === 'ko' ? '추천' : 'Recommended').length - 1, 2);
    assert.ok(comparison.includes('| 12 |')); assert.ok(comparison.includes('| 24 |'));
  }
});

test('DataTableFrame and Figure preserve their supplied metadata and complete native fallback data', () => {
  const frame = exportFixture('@site/src/components/DataTableFrame', '<T title="Frame title" description="Frame conditions"><table><caption>Native caption</caption><thead><tr><th>Value</th></tr></thead><tbody><tr><td>123 GB</td></tr></tbody></table></T>');
  for (const value of ['Frame title', 'Frame conditions', 'Native caption', '123 GB']) assert.ok(frame.includes(value));
  const figure = exportFixture('@site/src/components/Figure', '<T title="Figure title" description="Only author description" source={<a href="/original">Original source</a>} dataFallback={<p>All fallback data: 123 GB</p>}><p>Graphic alternative</p></T>');
  for (const value of ['Figure title', 'Only author description', '[Original source](/original)', 'All fallback data: 123 GB', 'Graphic alternative']) assert.ok(figure.includes(value));
});

test('MetricsTable intrinsic and exhaustive troubleshooting profile keep every value and status', () => {
  for (const locale of ['ko', 'en']) {
    const metrics = exportFixture('@site/src/components/tables/MetricsTable', '<T title="Metrics" headers={["Metric","Value"]} rows={[{id:"cpu",cells:["CPU",95]}]} currentValues={{CPU:95}} thresholds={{CPU:{warning:70,critical:90}}} />', locale);
    for (const value of ['Metrics', 'CPU', '95', locale === 'ko' ? '심각' : 'Critical']) assert.ok(metrics.includes(value));
    const issues = exportFixture('@site/src/components/tables/TroubleshootingTable', '<T issues={[{id:"a",problem:"Problem A",cause:"Cause A",solution:"Solution A",severity:"high"},{id:"b",problem:"Problem B",cause:"Cause B",solution:"Solution B",severity:"critical"}]} />', locale);
    for (const value of ['Problem A', 'Cause A', 'Solution A', 'Problem B', 'Cause B', 'Solution B', locale === 'ko' ? '심각' : 'Critical']) assert.ok(issues.includes(value));
  }
});

test('all shared-table occurrences in the three existing ko/en manuals export without omissions using the proposed contract', () => {
  const manuals = [
    'agentic-ai-platform/model-serving/inference-frameworks/vllm-model-serving.md',
    'agentic-ai-platform/model-serving/gpu-infrastructure/gpu-resource-management.md',
    'agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack.md',
  ];
  let occurrences = 0;
  for (const locale of ['ko', 'en']) {
    for (const manual of manuals) {
      const file = path.join(root, locale === 'ko' ? 'docs' : 'i18n/en/docusaurus-plugin-content-docs/current', manual);
      const {lines, imports} = readImports(fs.readFileSync(file, 'utf8'));
      for (let index = 0; index < lines.length; index++) {
        const tag = lines[index].trim().match(/^<(ComparisonTable|SpecificationTable)\b/)?.[1];
        if (!tag) continue;
        const block = jsxBlock(lines, index);
        assert.ok(block, `${manual}:${index + 1}`);
        const output = markdown(renderer(locale).expression(block.text, imports, file));
        assert.ok(output.includes('|'), `${manual}:${index + 1}`);
        assert.ok(!output.includes('[object Object]'));
        occurrences++;
        index = block.end;
      }
    }
  }
  assert.equal(occurrences, 30);
});
