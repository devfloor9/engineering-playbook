// Markdown serializers for the RalphLoopBenchmark components (docs/benchmarks/ralph-loop-coding-agent-bedrock.md).
// They give the LLM wiki export and the reading-time estimate the same content the interactive components show,
// read from the same data file. Charts whose values are also in an adjacent Markdown table get a one-sentence
// description instead of a second copy of the numbers.
const data = require('../src/data/ralph-loop-bedrock.json');

const usd = v => `$${v.toFixed(3)}`;
const usd2 = v => `$${v.toFixed(2)}`;
const pct = v => `${Math.round(v * 100)}%`;
const byKey = Object.fromEntries(data.models.map(m => [m.key, m]));
const name = key => byKey[key]?.name ?? key;

const TEXT = {
  ko: {
    kpi: h => [
      `- 완주한 run: ${data.totals.completed}/${data.totals.runs} (${data.totals.models}개 모델 × 5회)`,
      `- run당 비용이 가장 낮은 모델: ${name(h.cheapest)} ${usd(byKey[h.cheapest].stats.cost_usd.med)} (중앙값)`,
      `- run당 비용이 가장 높은 모델: ${name(h.priciest)} ${usd(byKey[h.priciest].stats.cost_usd.med)} (중앙값)`,
      `- 최고·최저 모델의 비용 차이: 약 ${Math.round(h.cost_ratio_max_min)}배`,
      `- 전체 토큰 중 캐시 읽기 비중: ${pct(h.cache_read_token_share)}`,
      `- 총 실행 비용(계산값): ${usd2(data.totals.spend_usd.total)} (폐기한 1차 실행 ${usd2(data.totals.spend_usd.discarded_first_attempt)} 포함)`,
    ].join('\n'),
    scatter: '차트: 모델별 run당 비용 중앙값(가로, 로그 눈금)과 run 시간 중앙값(세로)입니다. 같은 값이 아래 "모델별 결과" 표에 있습니다.',
    matrix: '차트: 모델별 run당 비용, run 시간, 출력 토큰, 전체 토큰, LLM 요청의 5회 최소–최대 범위와 중앙값입니다. 중앙값과 범위는 바로 아래 표에, run별 값은 `src/data/ralph-loop-bedrock.json`에 있습니다.',
    same: '차트: 같은 pi 하네스로 실행한 공개 run의 Bedrock 단가 환산 비용, 이번 실측 비용, 빌더 몫 비용입니다. 같은 값이 바로 아래 표에 있습니다.',
    card: m => `- **${m.name}** (${data.group_labels[m.group].ko} · ${m.vendor}, run당 ${usd(m.stats.cost_usd.med)}): ${m.note.ko}`,
  },
  en: {
    kpi: h => [
      `- Completed runs: ${data.totals.completed}/${data.totals.runs} (${data.totals.models} models × 5)`,
      `- Lowest cost per run: ${name(h.cheapest)} ${usd(byKey[h.cheapest].stats.cost_usd.med)} (median)`,
      `- Highest cost per run: ${name(h.priciest)} ${usd(byKey[h.priciest].stats.cost_usd.med)} (median)`,
      `- Cost ratio between the most and least expensive model: about ${Math.round(h.cost_ratio_max_min)}×`,
      `- Cache-read share of all tokens: ${pct(h.cache_read_token_share)}`,
      `- Total spend (calculated): ${usd2(data.totals.spend_usd.total)} (including the discarded first attempt, ${usd2(data.totals.spend_usd.discarded_first_attempt)})`,
    ].join('\n'),
    scatter: 'Chart: median cost per run (horizontal, log scale) against median run time (vertical) for each model. The same values are in the "Results by model" table below.',
    matrix: 'Chart: minimum–maximum range and median over five runs of cost per run, run time, output tokens, total tokens and LLM requests for each model. Medians and ranges are in the table below; per-run values are in `src/data/ralph-loop-bedrock.json`.',
    same: 'Chart: re-priced cost of the published pi run, this measurement\'s cost and the builder-only cost for each model. The same values are in the table below.',
    card: m => `- **${m.name}** (${data.group_labels[m.group].en} · ${m.vendor}, ${usd(m.stats.cost_usd.med)} per run): ${m.note.en}`,
  },
};

const lang = renderer => (renderer.locale === 'en' ? 'en' : 'ko');

function ralphRenderers(renderer) {
  const t = () => TEXT[lang(renderer)];
  return {
    RalphKpiStrip: () => t().kpi(data.highlights),
    RalphCostTimeScatter: () => t().scatter,
    RalphMetricMatrix: () => t().matrix,
    RalphSameModelChart: () => t().same,
    RalphModelCards: () => data.models.map(m => t().card(m)).join('\n'),
  };
}

const RALPH_COMPONENTS = ['RalphKpiStrip', 'RalphCostTimeScatter', 'RalphMetricMatrix', 'RalphSameModelChart', 'RalphModelCards'];
const RALPH_FILES = {
  RalphKpiStrip: 'KpiStrip.js', RalphCostTimeScatter: 'CostTimeScatter.js', RalphMetricMatrix: 'MetricMatrix.js',
  RalphSameModelChart: 'SameModelChart.js', RalphModelCards: 'ModelCards.js',
};
const ralphSources = Object.fromEntries(RALPH_COMPONENTS.map(n => [n, [
  `src/components/RalphLoopBenchmark/${RALPH_FILES[n]}`, 'src/components/RalphLoopBenchmark/shared.js',
  'src/data/ralph-loop-bedrock.json',
]]));

module.exports = {ralphRenderers, ralphSources, RALPH_COMPONENTS};
