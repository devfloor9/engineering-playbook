// Shared helpers for the RalphLoopBenchmark package (OWNER: agent A).
// Agents B and C import from here but must not edit this file.
//
// Public API (do not change the signatures — other files depend on them):
//   data                       the benchmark JSON (numbers come only from here)
//   useLang()                  -> 'ko' | 'en'
//   t(lang, key)               -> localized UI string
//   fmt                        -> { usd, usd2, int, min, pct }
//   VENDOR_COLOR               -> vendor name -> CSS var() series color
//   groupLabel(group, lang)    -> localized group label from data.group_labels
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import data from '@site/src/data/ralph-loop-bedrock.json';

export {data};

/**
 * Current locale as 'ko' | 'en'. Anything that is not Korean falls back to
 * English so a new locale never renders blank labels. SSR-safe: reads the
 * locale from the Docusaurus context, never from window/document.
 */
export function useLang() {
  const {i18n} = useDocusaurusContext();
  return i18n.currentLocale === 'ko' ? 'ko' : 'en';
}

// Every visible UI string the package needs, in both locales. Keys consumed by
// CostTimeScatter and MetricMatrix are included here too so those components
// resolve against one table.
const STRINGS = {
  ko: {
    // KPI strip
    completedRuns: '완주',
    cheapest: '최저가 모델',
    priciest: '최고가 모델',
    costRatio: '비용 격차 (최대/최소)',
    cacheReadShare: '캐시 읽기 토큰 비중',
    totalSpend: '총 지출',
    // metrics / card fields
    cost: '비용',
    runMinutes: '실행 시간(분)',
    outputTokens: '출력 토큰',
    totalTokens: '전체 토큰',
    llmRequests: 'LLM 요청',
    median: '중앙값',
    range: '범위',
    frontier: '프론티어',
    chineseOpenWeight: '중국 오픈웨이트',
    logScale: '로그 스케일',
    perRun: '실행당',
    source: '출처',
    showData: '데이터 보기',
    model: '모델',
    group: '그룹',
    completed: '완주',
    notCompleted: '미완주',
    iterations: '반복',
    verifier: '검증자',
    commits: '커밋',
    selfTerminated: '자체 종료 세션',
    // card extras
    vendor: '벤더',
    costRank: '비용 순위',
    cacheReadTokens: '캐시 읽기 토큰',
    builder: '빌더',
    verifierCostShare: '검증자 비용 비중',
    of: '중',
    rankOf: '위 / 전체',
    // chart labels consumed by CostTimeScatter
    scatterTitle: '모델별 실행당 비용과 실행 시간',
    scatterDesc: '가로축은 실행당 비용(로그 스케일), 세로축은 실행 시간(분)이며, 점은 중앙값입니다.',
    axisCost: '실행당 비용 (USD, 로그 스케일)',
    axisMinutes: '실행 시간 (분)',
  },
  en: {
    completedRuns: 'Completed',
    cheapest: 'Cheapest model',
    priciest: 'Priciest model',
    costRatio: 'Cost ratio (max/min)',
    cacheReadShare: 'Cache-read token share',
    totalSpend: 'Total spend',
    cost: 'Cost',
    runMinutes: 'Run minutes',
    outputTokens: 'Output tokens',
    totalTokens: 'Total tokens',
    llmRequests: 'LLM requests',
    median: 'Median',
    range: 'Range',
    frontier: 'Frontier',
    chineseOpenWeight: 'Chinese open-weight',
    logScale: 'Log scale',
    perRun: 'per run',
    source: 'Source',
    showData: 'Show data',
    model: 'Model',
    group: 'Group',
    completed: 'Completed',
    notCompleted: 'Not completed',
    iterations: 'Iterations',
    verifier: 'Verifier',
    commits: 'Commits',
    selfTerminated: 'Self-terminated sessions',
    vendor: 'Vendor',
    costRank: 'Cost rank',
    cacheReadTokens: 'Cache-read tokens',
    builder: 'Builder',
    verifierCostShare: 'Verifier cost share',
    of: 'of',
    rankOf: 'of',
    // chart labels consumed by CostTimeScatter
    scatterTitle: 'Cost per run vs. run time by model',
    scatterDesc: 'Horizontal axis is cost per run (log scale), vertical axis is run minutes; each point is the median.',
    axisCost: 'Cost per run (USD, log scale)',
    axisMinutes: 'Run minutes',
  },
};

/**
 * Localized UI string. Falls back to the English value, then to the key
 * itself, so a missing translation is visible rather than blank.
 */
export function t(lang, key) {
  const table = STRINGS[lang] || STRINGS.en;
  if (key in table) return table[key];
  if (key in STRINGS.en) return STRINGS.en[key];
  return key;
}

// Number formatters. Locale-aware integer grouping; costs/minutes use fixed
// precision so columns line up with tabular-nums.
export const fmt = {
  usd: v => `$${v.toFixed(3)}`, // per-run costs
  usd2: v => `$${v.toFixed(2)}`, // totals
  int: (v, lang) => Math.round(v).toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US'),
  min: v => v.toFixed(1), // minutes
  pct: v => `${Math.round(v * 100)}%`,
};

// Vendor -> design-token series color. Keep in sync with --ep-chart-* usage.
export const VENDOR_COLOR = {
  Anthropic: 'var(--ep-chart-1)',
  OpenAI: 'var(--ep-chart-2)',
  'Moonshot AI': 'var(--ep-chart-3)',
  'Z.AI': 'var(--ep-chart-4)',
};

/** Localized group label ('F' | 'C') from data.group_labels, English fallback. */
export function groupLabel(group, lang) {
  const entry = data.group_labels && data.group_labels[group];
  if (!entry) return group;
  return entry[lang] || entry.en || group;
}
