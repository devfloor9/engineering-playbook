const assert = require('node:assert/strict');
const {test, after} = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const {collectDocs, isIncluded, stripMdx} = require('../generate-llm-wiki');
const {readImports, jsxBlock, fenceMarker} = require('../llm-wiki-source');
const {renderComponent, renderNavigation, staticRenderer} = require('../llm-wiki-components');
const {flatten, fromHtml, plain, markdown, descendants} = require('../llm-wiki-markdown');
const {reactOracle} = require('./helpers/llm-wiki-react-oracle');

const root = path.resolve(__dirname, '../..');
const oracle = reactOracle(root);
after(() => oracle.close());
const normalize = text => text.replace(/\\([\\`*_[\]<>|])/g, '$1')
  .replace(/<br\s*\/?>/g, '').replace(/[`*]/g, '').replace(/\s+/g, '');

function blocks(file) {
  const {lines, imports, declarations} = readImports(fs.readFileSync(file, 'utf8'));
  const result = [];
  let fence = null;
  for (let i = 0; i < lines.length; i++) {
    const marker = fenceMarker(lines[i], fence);
    fence = marker.fence;
    if (fence || marker.boundary || !/^<[A-Z]/.test(lines[i])) continue;
    if (/^<(Tabs|TabItem)\b/.test(lines[i])) continue;
    const block = jsxBlock(lines, i);
    assert.ok(block, `JSX boundary in ${file}:${i + 1}`);
    result.push({...block, imports, declarations, file});
    i = block.end;
  }
  return result;
}

function visibleText(tree) {
  return flatten(tree).flatMap(node => {
    if (typeof node !== 'object') return typeof node === 'string' && node.trim() ? [node] : [];
    if (['button', 'svg', 'style', 'script', 'select', 'input'].includes(node.tag) ||
        node.props['aria-hidden'] === true || node.props['aria-hidden'] === 'true') return [];
    return visibleText(node.children);
  });
}

const corpus = collectDocs(path.join(root, 'docs')).filter(isIncluded).sort();
const occurrences = corpus.flatMap(blocks);
const qualified = new Set();
const replacements = require('./fixtures/llm-wiki-reviewed-replacements.json');
const replacementBySlug = new Map(replacements.map(replacement => [replacement.slug, replacement]));
const priorInventory = require('../llm-wiki-issue-52-inventory.json').inventory;
const retiredReactOccurrences = replacements.flatMap(replacement =>
  priorInventory.find(page => page.slug === replacement.slug)?.components.filter(component =>
    replacement.components[component.component] && component.methods.includes('static-source')) || []);
const retiredSources = new Set(retiredReactOccurrences.flatMap(component => component.sources));

test('committed baseline HTML fixtures retain table values, captions and navigation metadata', () => {
  const fixtures = require('./fixtures/llm-wiki-52-html.json');
  for (const fixture of fixtures) {
    const tree = fromHtml(fs.readFileSync(path.join(__dirname, 'fixtures', fixture.file), 'utf8'));
    if (fixture.navigation) {
      const file = path.join(root, fixture.page.replace(/^docs\//, 'docs/').replace(/\.html$/, '/index.md'));
      const output = stripMdx(fs.readFileSync(file, 'utf8'), {filePath: file});
      for (const a of descendants(tree, 'a')) {
        assert.ok(output.includes(a.props.href.replace('/engineering-playbook', '')));
        for (const label of [...descendants(a.children, 'h2'), ...descendants(a.children, 'p')]) {
          assert.ok(output.includes(label.props.title));
        }
      }
    } else {
      const result = renderComponent('<Fixture />', new Map([
        ['Fixture', {source: fixture.module, exported: fixture.exported}],
      ]));
      for (const value of visibleText(tree)) assert.ok(normalize(result.markdown).includes(normalize(value)), `${fixture.file}: ${value}`);
    }
  }
});

test('baseline omissions are serialized or have explicit reviewed content replacements', () => {
  const {auditCoverage} = require('../audit-llm-wiki');
  const baseline = require('./fixtures/llm-wiki-52-baseline.json');
  assert.equal(baseline.doc_count, 222);
  assert.equal(baseline.docs.length, 58);
  assert.equal(new Set(baseline.docs.flatMap(d => d.content_coverage.omitted_components)).size, 169);
  const docs = corpus.map(file => {
    const omitted = new Set(), renderedSources = [];
    stripMdx(fs.readFileSync(file, 'utf8'), {filePath: file, omitted, renderedSources});
    return {slug: path.relative(path.join(root, 'docs'), file).replace(/\.mdx?$/, ''), content_coverage: {
      omitted_components: [...omitted], rendered_sources: renderedSources,
    }};
  });
  const manifest = {docs, doc_count: docs.length, component_coverage: {supported_sources: []}};
  const report = auditCoverage(baseline, manifest);
  assert.equal(report.remaining.length, 0);
  assert.equal(replacementBySlug.size, replacements.length, 'Reviewed replacement pages must be unique');
  const replacementText = new Map(replacements.map(replacement => {
    const file = path.join(root, 'docs', `${replacement.slug}.md`);
    return [replacement.slug, stripMdx(fs.readFileSync(file, 'utf8'), {filePath: file})];
  }));
  const reviewed = new Set();
  for (const page of report.inventory) for (const component of page.components) {
    const replacement = replacementBySlug.get(page.slug);
    if (replacement?.components[component.component]) {
      assert.equal(component.status, 'source-changed', 'A reviewed replacement must remain visible in the audit');
      const prior = priorInventory.find(entry => entry.slug === page.slug)
        ?.components.find(entry => entry.component === component.component);
      const source = replacement.source.replace('{component}', component.component);
      const exported = replacement.export === 'named' ? component.component : 'default';
      assert.deepEqual(prior?.sources, [`${source}#${exported}`], 'Retirement must identify a previously serialized source');
      assert.ok(prior?.methods.length, 'A retirement must identify its previous serialization method');
      for (const value of replacement.components[component.component]) {
        assert.ok(normalize(replacementText.get(page.slug)).includes(normalize(value)), `Missing reviewed replacement: ${component.component}: ${value}`);
      }
      reviewed.add(`${page.slug}#${component.component}`);
      continue;
    }
    assert.equal(component.status, 'serialized', `${page.slug}: ${component.component}`);
    assert.ok(component.sources.length, component.component);
    assert.ok(component.methods.length, component.component);
  }
  assert.deepEqual([...reviewed].sort(), replacements.flatMap(replacement =>
    Object.keys(replacement.components).map(component => `${replacement.slug}#${component}`)).sort());
});

test('every supported corpus component retains independently rendered React text, table cells and links', async t => {
  let checked = 0;
  for (const occurrence of occurrences) {
    const {text, imports, file, declarations} = occurrence;
    const context = {filePath: file, declarations, diagnostics: []};
    const result = renderNavigation(text, imports, context) || renderComponent(text, imports, context);
    assert.ok(result, `${path.relative(root, file)} ${text.slice(0, 80)}: ${JSON.stringify(context.diagnostics)}`);
    if (result.names || result.method === 'shared-data' || result.method === 'static-html-source' ||
        result.method === 'source-adapter') continue; // Dedicated data parity below.
    const source = result.source;
    qualified.add(source);
    await t.test(`${path.relative(root, file)}: ${source}`, () => {
      const html = oracle.render(text, imports, file);
      const tree = fromHtml(html);
      const output = normalize(result.markdown);
      for (const value of visibleText(tree)) assert.ok(output.includes(normalize(value)), `Missing rendered text: ${value}`);
      // Ordered cells protect column association, including duplicate numbers.
      for (const row of descendants(tree, 'tr')) {
        const cells = flatten(row.children).filter(n => n?.tag === 'th' || n?.tag === 'td');
        let position = -1;
        for (const cell of cells) {
          const value = normalize(plain(cell.children));
          const next = output.indexOf(value, position + 1);
          assert.ok(next >= 0, `Missing or reordered cell: ${plain(cell.children)}`);
          position = next;
        }
      }
      for (const a of descendants(tree, 'a')) {
        if (a.props.href) assert.ok(result.markdown.includes(a.props.href.replace(/[()]/g, c => c === '(' ? '%28' : '%29')), `Missing link: ${a.props.href}`);
      }
    });
    checked++;
  }
  // Keep the original coverage floors. A retirement counts only when the separate
  // baseline test verifies its source identity and the replacement's exported text.
  assert.ok(checked + retiredReactOccurrences.length >= 160,
    `Expected broad corpus coverage; got ${checked} rendered and ${retiredReactOccurrences.length} reviewed replacements`);
  const accountedSources = new Set([...qualified, ...retiredSources]);
  assert.ok(accountedSources.size >= 150,
    `Expected distinct source coverage; got ${accountedSources.size} active or explicitly retired sources`);
});

test('source adapters preserve every static item, hidden detail, YAML body and rating', () => {
  const adapters = [
    ['GatewayApiTables/RoadmapTimeline', 'phases'],
    ['GatewayApiTables/GammaSupportTable', 'items'],
    ['GatewayApiBenefits', 'benefits'],
    ['EastWestTrafficTables/LatencyCostComparison', 'options'],
  ];
  for (const [module, dataset] of adapters) {
    const imports = new Map([['Example', {source: `@site/src/components/${module}`, exported: 'default'}]]);
    const rendered = renderComponent('<Example />', imports);
    assert.ok(rendered, module);
    const file = staticRenderer.resolve(`@site/src/components/${module}`, path.join(root, 'docs/index.md'));
    const scope = staticRenderer.componentScope(file);
    const values = scope.get(dataset);
    const output = normalize(rendered.markdown);
    function check(value, key = '') {
      if (['color', 'icon', 'statusColor', 'bg', 'badgeColor'].includes(key)) return;
      if (Array.isArray(value)) return value.forEach(item => check(item));
      if (value && typeof value === 'object') {
        if (value.kind === 'element') return visibleText(value).forEach(text => check(text));
        if ('ko' in value) return check(value.ko);
        return Object.entries(value).forEach(([k, v]) => check(v, k));
      }
      if (typeof value === 'string' || typeof value === 'number') {
        assert.ok(output.includes(normalize(String(value))), `${module} lost ${key}: ${value}`);
      }
    }
    check(values);
    if (dataset === 'options') for (const option of values) {
      assert.ok(rendered.markdown.includes(`${option.latencyScore}/5`));
      assert.ok(rendered.markdown.includes(`${option.costScore}/5`));
    }
  }
  const relevance = renderComponent('<Relevance locale="ko" />', new Map([
    ['Relevance', {source: '@site/src/components/AimlRelevanceChart', exported: 'default'}],
  ]));
  const relevanceFile = path.join(root, 'src/components/AimlRelevanceChart.js');
  const workloads = staticRenderer.componentScope(relevanceFile, {locale: 'ko'}).get('t').workloads;
  assert.equal(workloads.length, 6);
  for (const workload of workloads) {
    assert.ok(relevance.markdown.includes(workload.label));
    assert.ok(relevance.markdown.includes(String(workload.pct)));
    assert.ok(relevance.markdown.includes(workload.reason));
  }
  assert.ok(relevance.markdown.includes('not measured workload percentages'));
});

test('previously uncounted draw.io iframe preserves every vertex, edge endpoint, group and label', () => {
  const {parseFragment} = require('parse5');
  const file = path.join(root, 'docs/agentic-ai-platform/reference-architecture/index.md');
  const serialized = [], omitted = new Set();
  const output = stripMdx(fs.readFileSync(file, 'utf8'), {filePath: file, renderedSources: serialized, omitted});
  assert.equal(omitted.size, 0);
  const entry = serialized.find(s => s.method === 'static-drawio-source');
  assert.deepEqual(entry.graph_counts, {vertices: 118, edges: 34});
  const xml = fs.readFileSync(path.join(root, entry.source), 'utf8');
  for (const [tag] of xml.matchAll(/<mxCell\b(?:"[^"]*"|'[^']*'|[^'">])*>/g)) {
    const c = Object.fromEntries(parseFragment(tag).childNodes[0].attrs.map(a => [a.name, a.value]));
    if (c.vertex === '1') assert.ok(output.includes(`| ${c.id} | ${c.parent} |`), `Missing vertex/group ${c.id}`);
    if (c.edge === '1') assert.ok(output.includes(`| ${c.id} | ${c.parent} | ${c.source || '(unspecified)'} | ${c.target || '(unspecified)'} |`), `Missing edge ${c.id}`);
    for (const text of visibleText(fromHtml(c.value || ''))) assert.ok(normalize(output).includes(normalize(text)), `Missing label ${text}`);
  }
  assert.ok(!output.includes('<iframe'));
});

test('OpenClaw equivalent retains all 22 boxes, 11 directed polylines and 28 labels from the drawing source', () => {
  const {walk} = require('../llm-wiki-diagrams');
  const imports = new Map([['Diagram', {source: '@site/src/components/OpenClawArchitecture', exported: 'default'}]]);
  const result = renderComponent('<Diagram />', imports);
  assert.ok(result);
  let draw;
  walk(staticRenderer.ast(path.join(root, 'src/components/OpenClawArchitecture.js')), n => {
    if (n.type === 'FunctionDeclaration' && n.id?.name === 'drawAll') draw = n;
  });
  const calls = draw.body.body.map(n => n.expression);
  assert.equal(calls.filter(n => n.callee.name === 'rRect').length, 22);
  assert.equal(calls.filter(n => n.callee.name === 'addArrow').length, 11);
  assert.equal(calls.filter(n => n.callee.name === 'addText').length, 28);
  for (const call of calls.filter(n => n.callee.name === 'addText')) {
    assert.ok(normalize(result.markdown.replace(/<br \/>/g, '')).includes(normalize(call.arguments[2].value)));
  }
  for (const call of calls.filter(n => n.callee.name === 'addArrow')) {
    const points = call.arguments[0].elements.map(p => p.elements.map(n => n.value));
    assert.ok(result.markdown.includes(points.map(p => `(${p.join(', ')})`).join(' → ')));
  }
});

test('inline architecture retains static HTML content and never exports ESM or executes its scripts', () => {
  const file = path.join(root, 'docs/agentic-ai-platform/reference-architecture/inference-gateway/setup/index.md');
  const output = stripMdx(fs.readFileSync(file, 'utf8'), {filePath: file});
  const html = fromHtml(fs.readFileSync(path.join(root, 'static/agentic-platform-architecture.html'), 'utf8'));
  for (const text of visibleText(descendants(html, 'main'))) assert.ok(normalize(output).includes(normalize(text)), text);
  assert.ok(output.includes('↓'));
  assert.ok(output.includes('Interactive architecture'));
  assert.ok(!output.includes('postMessage'));
  assert.ok(!output.includes('export const'));
});

test('all source navigation lists retain static destinations, descriptions and legacy fragments', () => {
  let cards = 0;
  for (const occurrence of occurrences) {
    const {text, imports, file} = occurrence;
    const result = renderNavigation(text, imports, {filePath: file});
    if (!result) continue;
    assert.ok(result.markdown.includes('](/docs/') || result.markdown.includes('](https://'));
    assert.ok(!result.markdown.includes('undefined'));
    cards++;
  }
  assert.ok(cards >= 34);
  const file = path.join(root, 'docs/eks-best-practices/operations-reliability/eks-pod-health-lifecycle.md');
  const output = stripMdx(fs.readFileSync(file, 'utf8'), {filePath: file});
  const sections = require('../../src/data/pod-lifecycle-legacy-sections.json');
  for (const [id, section] of Object.entries(sections)) {
    assert.ok(output.includes(`#${encodeURIComponent(id)}`));
    assert.ok(output.includes(`${section.path}#`));
    assert.ok(output.includes(section.title));
  }
});

// Optional, read-only parity against an existing site build. No build is run.
test('existing baseline HTML retains the independently rendered static component text', {
  skip: !process.env.LLM_WIKI_BASELINE_HTML,
}, () => {
  const build = process.env.LLM_WIKI_BASELINE_HTML;
  const baselinePages = new Map();
  function baselinePage(relative) {
    if (!baselinePages.has(relative)) {
      const htmlFile = path.join(build, 'docs', relative + '.html');
      assert.ok(fs.existsSync(htmlFile), htmlFile);
      const tree = fromHtml(fs.readFileSync(htmlFile, 'utf8'));
      baselinePages.set(relative, {tree, text: normalize(plain(tree))});
    }
    return baselinePages.get(relative);
  }
  let checked = 0;
  for (const occurrence of occurrences) {
    const {text, imports, file} = occurrence;
    const result = renderComponent(text, imports, {filePath: file, declarations: occurrence.declarations});
    if (!result || result.method !== 'static-source' || result.names ||
        result.source_files.some(f => /FeatureComparisonMatrix|SolutionOverviewMatrix/.test(f))) continue;
    const relative = path.relative(path.join(root, 'docs'), file).replace(/\.mdx?$/, '').replace(/\/index$/, '');
    const baseline = baselinePage(relative).text;
    for (const value of visibleText(fromHtml(oracle.render(text, imports, file)))) {
      assert.ok(baseline.includes(normalize(value)), `${relative} baseline mismatch: ${value}`);
    }
    checked++;
  }
  for (const replacement of replacements) {
    const baseline = baselinePage(replacement.slug).text;
    for (const [component, values] of Object.entries(replacement.components)) {
      for (const value of values) {
        // Markdown table separators have no text node in rendered HTML.
        const expected = normalize(value).replaceAll('|', '');
        assert.ok(baseline.includes(expected),
          `${replacement.slug}: missing rendered replacement for ${component}: ${value}`);
      }
    }
  }
  assert.ok(checked + retiredReactOccurrences.length >= 150,
    `Expected rendered corpus coverage; got ${checked} components and ${retiredReactOccurrences.length} reviewed replacements`);
  // Check every navigation destination against the cards in each real page,
  // not just a count of serialized component names.
  const navigationPages = new Map();
  for (const {text, imports, file} of occurrences) {
    const result = renderNavigation(text, imports, {filePath: file});
    if (result) navigationPages.set(file, (navigationPages.get(file) || '') + '\n' + result.markdown);
  }
  for (const [file, output] of navigationPages) {
    const relative = path.relative(path.join(root, 'docs'), file).replace(/\.mdx?$/, '').replace(/\/index$/, '');
    const tree = baselinePage(relative).tree;
    const cards = descendants(tree, 'a').filter(a => /card/i.test(a.props.class || ''));
    assert.ok(cards.length, `No baseline navigation cards: ${relative}`);
    for (const card of cards) {
      assert.ok(output.includes(card.props.href.replace('/engineering-playbook', '')), `${relative}: ${card.props.href}`);
      for (const title of descendants(card.children, 'h2')) if (title.props.title) {
        assert.ok(normalize(output).includes(normalize(title.props.title)), `${relative}: ${title.props.title}`);
      }
    }
  }
});
