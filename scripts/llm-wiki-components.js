const metrics = require('../src/data/coredns-metrics.json');
const models = require('../src/data/moe-memory-models.json');

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
};

// Only serialize the default, prop-free form whose data is shared with the site.
function renderComponent(line) {
  const match = line.trim().match(/^<([A-Z][A-Za-z0-9]*)\s*\/>$/);
  if (!match || !Object.hasOwn(renderers, match[1])) return null;
  return {name: match[1], markdown: renderers[match[1]]()};
}

module.exports = {renderComponent, supportedComponents: Object.keys(renderers)};
