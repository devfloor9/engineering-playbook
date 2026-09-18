const metrics = require('../src/data/coredns-metrics.json');
const models = require('../src/data/moe-memory-models.json');
const parallelization = require('../src/data/moe-parallelization.json');

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

// Only serialize the prop-free form whose data is shared with the site.
function renderComponent(line, imports) {
  const match = line.trim().match(/^<([A-Z][A-Za-z0-9]*)\s*\/>$/);
  if (!match) return null;
  const name = componentName(match[1], imports);
  if (!Object.hasOwn(renderers, name)) return null;
  return {name, markdown: renderers[name]()};
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
function renderNavigation(block, imports) {
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
  return cards.length ? {names: ['DocCardGrid', 'DocCard'], markdown: cards.join('\n')} : null;
}

module.exports = {
  renderComponent, renderNavigation, componentName,
  supportedComponents: Object.keys(renderers),
  supportedNavigationComponents: ['DocCardGrid', 'DocCard'],
};
