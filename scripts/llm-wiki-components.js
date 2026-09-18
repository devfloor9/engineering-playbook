const metrics = require('../src/data/coredns-metrics.json');
const models = require('../src/data/moe-memory-models.json');
const parallelization = require('../src/data/moe-parallelization.json');
const path = require('node:path');
const {StaticRenderer, StaticGap} = require('./llm-wiki-static');
const {markdown} = require('./llm-wiki-markdown');
const {adapters, stateProfiles} = require('./llm-wiki-profiles');
const {sidebarCards} = require('./llm-wiki-navigation');
const {inlinePipeline} = require('./llm-wiki-diagrams');
const root = path.resolve(__dirname, '..');
const staticRenderer = new StaticRenderer({root, adapters, stateProfiles});
const sharedSources = {
  CoreDnsMetricsTable: ['src/components/CoreDnsTables/CoreDnsMetricsTable.js', 'src/data/coredns-metrics.json'],
  GpuMemoryRequirements: ['src/components/MoeModelTables/GpuMemoryRequirements.js', 'src/data/moe-memory-models.json'],
  ParallelizationStrategies: ['src/components/MoeModelTables/ParallelizationStrategies.js', 'src/data/moe-parallelization.json'],
};

function cell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, '<br />');
}

function table(headers, rows) {
  return [
    headers,
    headers.map(() => '---'),
    ...rows,
  ].map(row => `| ${row.map(cell).join(' | ')} |`).join('\n');
}

const renderers = {
  CoreDnsMetricsTable: () => [
    metrics.scope.ko,
    table(['메트릭', '타입', '시그널', '설명', 'PromQL'], metrics.rows.map(row => [
      `\`${row.name}\``, row.type, row.signal.ko, row.description.ko, `\`${row.query}\``,
    ])),
  ].join('\n\n'),
  GpuMemoryRequirements: () => [
    'MoE 가중치 크기 산술 추정 — 런타임 메모리 제외. B = 10⁹ parameters; GB = 10⁹ bytes.',
    table(
      ['모델', '총 파라미터 (B)', '활성 파라미터 (B)', '16-bit 가중치 (GB)', '8-bit 가중치 (GB)', '4-bit 가중치 (GB)'],
      models.map(model => [
        model.model, model.totalBillions, model.activeBillions,
        ...[2, 1, 0.5].map(bytes => Number((model.totalBillions * bytes).toFixed(1)).toLocaleString('en-US')),
      ]),
    ),
  ].join('\n\n'),
  ParallelizationStrategies: () => table(
    ['병렬화 전략', '설명', '장점', '단점'],
    parallelization.map(row => [
      row.strategy, row.description.ko, row.advantages.ko, row.disadvantages.ko,
    ]),
  ),
};

const componentModules = {
  CoreDnsMetricsTable: 'CoreDnsTables',
  GpuMemoryRequirements: 'MoeModelTables',
  ParallelizationStrategies: 'MoeModelTables',
};

// Component names are not unique across the site. Resolve the imported module
// and exported name before choosing a serializer, including local aliases.
function componentName(tag, imports = new Map()) {
  const binding = imports.get(tag);
  if (!binding) return null;
  const source = binding.source.replace(/\.jsx?$/, '');
  for (const [name, group] of Object.entries(componentModules)) {
    const base = `@site/src/components/${group}`;
    if ((source === base || source === `${base}/index`) && binding.exported === name) return name;
    if (source === `${base}/${name}` && binding.exported === 'default') return name;
  }
  if (source === '@site/src/components/DocCards' &&
      ['DocCard', 'DocCardGrid'].includes(binding.exported)) return binding.exported;
  if (source === '@theme/DocCardList' && binding.exported === 'default') return 'DocCardList';
  return null;
}

// Keep the established shared-data serializers, then interpret other actual
// source bindings. Supplying props never silently selects a prop-free default.
function renderComponent(line, imports, context = {}) {
  const match = line.trim().match(/^<([A-Z][A-Za-z0-9]*)\s*\/>$/);
  if (match) {
    const name = componentName(match[1], imports);
    if (Object.hasOwn(renderers, name)) {
      const binding = imports.get(match[1]);
      return {name, markdown: renderers[name](), method: 'shared-data',
        source: `${binding.source}#${binding.exported}`,
        source_files: [...sharedSources[name], ...(context.filePath ? [staticRenderer.relative(context.filePath)] : [])].sort()};
    }
  }
  const tag = line.trim().match(/^<([A-Z][\w.]*)\b/)?.[1];
  let binding = imports.get(tag);
  if (tag?.includes('.')) {
    const [namespace, exported, extra] = tag.split('.');
    const namespaceBinding = imports.get(namespace);
    if (!extra && namespaceBinding?.exported === '*') binding = {...namespaceBinding, exported};
  }
  staticRenderer.reset();
  if (context.filePath) staticRenderer.files.add(context.filePath);
  try {
    if (!binding) {
      if (tag && new RegExp(`^<${tag.replaceAll('.', '\\.')}\\s*/>$`).test(line.trim())) return inlinePipeline(tag, {...context, renderer: staticRenderer});
      return null;
    }
    const resolved = staticRenderer.resolve(binding.source, context.filePath || path.join(root, 'docs/unknown.md'));
    if (!resolved || !staticRenderer.relative(resolved).startsWith('src/components/')) return null;
    const fn = staticRenderer.imported(binding.source, binding.exported, context.filePath || path.join(root, 'docs/unknown.md'));
    // Unknown props on a prop-free component must not select default data.
    if (fn?.kind === 'closure' && !fn.node.params.length && !/^<[A-Z][\w.]*\s*\/>$/.test(line.trim())) {
      throw new StaticGap('Component does not declare these props');
    }
    const tree = staticRenderer.expression(line, imports, context.filePath);
    const output = markdown(tree);
    if (!output) throw new StaticGap('No static content was rendered');
    const name = binding.exported === 'default' ? (path.basename(resolved) === 'index.js' ? path.basename(path.dirname(resolved)) : path.basename(resolved).replace(/\.jsx?$/, '')) : binding.exported;
    return {
      name,
      ...(fn?.sourceFile === path.join(root, 'src/components/LegacySectionLinks/index.js') ? {names: [name]} : {}),
      markdown: output,
      method: fn?.kind === 'native' ? 'source-adapter' : 'static-source',
      source: `${binding.source}#${binding.exported}`,
      source_files: [...staticRenderer.files].map(file => staticRenderer.relative(file)).sort(),
    };
  } catch (error) {
    if (!(error instanceof StaticGap)) throw error;
    if (context.diagnostics) context.diagnostics.push({component: tag, source: binding ? `${binding.source}#${binding.exported}` : context.filePath, reason: error.message});
    return null;
  }
}

function staticAttributes(text, allowed) {
  const values = {};
  const attribute = /\s+([A-Za-z]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{(\d+)\})/y;
  let offset = 0;
  while (text.slice(offset).trim()) {
    attribute.lastIndex = offset;
    const match = attribute.exec(text);
    if (!match || !allowed.includes(match[1]) || Object.hasOwn(values, match[1])) return null;
    values[match[1]] = match[2] ?? match[3] ?? Number(match[4]);
    offset = attribute.lastIndex;
  }
  return values;
}

function label(text) {
  return text.replace(/&(?:amp|quot|apos|lt|gt);/g, entity => ({
    '&amp;': '&', '&quot;': '"', '&apos;': "'", '&lt;': '<', '&gt;': '>',
  })[entity]).replace(/[\\[\]*_`]/g, '\\$&').replace(/\s+/g, ' ');
}

// Navigation uses literal MDX attributes as its shared source. Expressions,
// spreads and unknown children stay omitted rather than being evaluated.
function renderNavigation(block, imports, context = {}) {
  if (context.filePath && /^<\w+\s*(?:items=|\s*\/>)/.test(block)) {
    staticRenderer.reset();
    staticRenderer.files.add(context.filePath);
    try {
      const rendered = sidebarCards(block, imports, {...context, renderer: staticRenderer});
      if (rendered) return rendered;
    } catch (error) {
      if (!(error instanceof StaticGap)) throw error;
      context.diagnostics?.push({component: block.match(/^<(\w+)/)?.[1], reason: error.message});
      return null;
    }
  }
  const grid = block.match(/^<([A-Z][A-Za-z0-9]*)([^>]*)>([\s\S]*)<\/\1>\s*$/);
  if (!grid || componentName(grid[1], imports) !== 'DocCardGrid') return null;
  if (!staticAttributes(grid[2], ['columns'])) return null;
  const cards = [];
  const child = /\s*<([A-Z][A-Za-z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)\/>/y;
  let offset = 0;
  while (grid[3].slice(offset).trim()) {
    child.lastIndex = offset;
    const match = child.exec(grid[3]);
    if (!match || componentName(match[1], imports) !== 'DocCard') return null;
    const attrs = staticAttributes(match[2], ['to', 'title', 'description', 'icon', 'color']);
    if (!attrs || typeof attrs.to !== 'string' || typeof attrs.title !== 'string' ||
        (attrs.description !== undefined && typeof attrs.description !== 'string') ||
        !/^(\/docs\/|https?:\/\/)/.test(attrs.to)) return null;
    const target = attrs.to.replace(/\s/g, c => encodeURIComponent(c)).replace(/\(/g, '%28').replace(/\)/g, '%29');
    cards.push(`- [${label(attrs.title)}](${target})${attrs.description ? ` — ${label(attrs.description)}` : ''}`);
    offset = child.lastIndex;
  }
  return cards.length ? {
    names: ['DocCardGrid', 'DocCard'], markdown: cards.join('\n'), method: 'static-props',
    source: '@site/src/components/DocCards#DocCardGrid',
    source_files: ['src/components/DocCards.js', ...(context.filePath ? [staticRenderer.relative(context.filePath)] : [])],
  } : null;
}

module.exports = {
  renderComponent, renderNavigation, componentName,
  supportedComponents: Object.keys(renderers),
  supportedNavigationComponents: ['DocCardGrid', 'DocCard', 'DocCardList', 'LegacySectionLinks'],
  staticRenderer,
};
