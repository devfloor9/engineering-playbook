// Markdown serializers for the RalphLoopBenchmark components (docs/benchmarks/ralph-loop-coding-agent-bedrock.md).
// They give the LLM wiki export and the reading-time estimate the same content the interactive components show,
// read from the same data file. Charts whose values are also in an adjacent Markdown table get a one-sentence
// description instead of a second copy of the numbers; the diagrams and the charts that replaced the page's former
// tables (method, lineup, token mix, roles, groups, prices) are serialized in full.
const data = require('../src/data/ralph-loop-bedrock.json');

const usd = v => `$${v.toFixed(3)}`;
const usd2 = v => `$${v.toFixed(2)}`;
const pct = v => `${Math.round(v * 100)}%`;
const int = v => Math.round(v).toLocaleString('en-US');
const price = v => (v == null ? '—' : `$${v}`);
const byKey = Object.fromEntries(data.models.map(m => [m.key, m]));
const name = key => byKey[key]?.name ?? key;
const M = data.method;

function cell(value) {
  return String(value).replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

function table(headers, rows) {
  return [headers, headers.map(() => '---'), ...rows].map(row => `| ${row.map(cell).join(' | ')} |`).join('\n');
}

const SCOPE = {
  ko: {auth: '인증', users: '사용자·프로필', articles: '글', comments: '댓글', favorites: '즐겨찾기', tags: '태그', feed: '피드'},
  en: {auth: 'Auth', users: 'Users & profiles', articles: 'Articles', comments: 'Comments', favorites: 'Favorites',
    tags: 'Tags', feed: 'Feed'},
};

const GROUP_METRICS = [
  {key: 'cost_usd', ko: '비용(run당)', en: 'Cost per run', f: usd},
  {key: 'output_tokens', ko: '출력 토큰', en: 'Output tokens', f: int},
  {key: 'total_tokens', ko: '전체 토큰', en: 'Total tokens', f: int},
  {key: 'llm_requests', ko: 'LLM 요청', en: 'LLM requests', f: int},
  {key: 'run_minutes', ko: 'run 시간(분)', en: 'Run time (min)', f: v => v.toFixed(1)},
];

function frontierCostRatio() {
  const costs = data.models.filter(m => m.group === 'F').map(m => m.stats.cost_usd.med);
  return Math.max(...costs) / Math.min(...costs);
}

function tokenMixRows() {
  return data.models.map(m => {
    const s = m.stats;
    return [m.name, int(s.input_tokens.med), int(s.output_tokens.med), int(s.cache_read_tokens.med),
      int(s.cache_write_tokens.med), int(s.total_tokens.med), pct(m.cache_read_token_share), pct(m.cache_read_cost_share)];
  });
}

function roleRows() {
  return data.models.map(m => {
    const s = m.stats;
    return [m.name, int(s.builder_requests.med), int(s.verifier_requests.med), usd(s.builder_cost_usd.med),
      usd(s.verifier_cost_usd.med), pct(m.verifier_cost_share), m.self_terminated_sessions];
  });
}

function priceRows() {
  // Same order as the PriceLadder component: output, input, cache read, cache write, all descending.
  const keys = ['output', 'input', 'cache_read', 'cache_write'];
  const rows = data.models.map((m, i) => ({m, i})).sort((a, b) => {
    for (const k of keys) {
      const d = (b.m.prices_usd_per_mtok[k] ?? -1) - (a.m.prices_usd_per_mtok[k] ?? -1);
      if (d !== 0) return d;
    }
    return a.i - b.i;
  }).map(x => x.m);
  return rows.map(m => {
    const p = m.prices_usd_per_mtok;
    return [m.name, `\`${m.model_id}\``, price(p.input), price(p.output), price(p.cache_read), price(p.cache_write)];
  });
}

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
    card: m => `- **${m.name}** (${data.group_labels[m.group].ko} · ${m.vendor}, run당 ${usd(m.stats.cost_usd.med)}): ${m.note.ko}`,
    method: () => [
      '다이어그램: 측정 방식',
      `- 과제: ${M.task.spec} 백엔드(${M.task.stack.join(', ')}). 구현 범위: ${M.task.scope.map(s => SCOPE.ko[s] || s).join(', ')}.`,
      `- 완주 조건(둘 다 충족): 빌더가 \`.ralph-done\`을 만들고, 공식 Hurl 채점이 ${M.grader.hurl_files}개 파일(요청 ${M.grader.requests}개)을 모두 통과합니다. 채점에 실패하면 \`.ralph-done\`을 지우고 다음 반복을 진행합니다.`,
      '- 한 번의 반복: 빌더(PROMPT-en.md로 구현, 2회차부터 REVIEW.md 먼저 읽기) → 검증자(Hurl 테스트를 직접 실행하고 REVIEW.md 작성) → 채점(공식 Hurl 테스트로 완주 판정). 미완주면 새 세션으로 다음 반복을 진행하며, 저장소만 이어집니다. 빌더와 검증자는 같은 모델입니다.',
      `- 가드레일: 반복 상한 ${M.limits.iterations_max}회, run 시간 상한 ${Math.round(M.limits.run_cap_sec / 60)}분, 멈춤 감지 ${M.limits.stall_sec}초, 비용 한도 run $${M.limits.cost_cap_usd.run} · 모델 $${M.limits.cost_cap_usd.model} · 전체 $${int(M.limits.cost_cap_usd.total)}.`,
      `- 격리와 실행: 에이전트 세션·채점마다 Docker 컨테이너 1개(${M.container.mem_gb} GB, CPU ${M.container.cpus}개, 프로세스 ${int(M.container.pids)}개). Bedrock 전용 단기 API 키(최대 ${M.credentials.token_ttl_min}분, ${M.credentials.refresh_min}분마다 갱신)만 넘기고 AWS 액세스 키는 넘기지 않았습니다. 최대 ${M.limits.parallel_models}개 모델을 병렬로, 한 모델의 ${M.limits.runs_per_model}회는 차례로 실행했습니다.`,
      `- 하네스: ${M.harness.agent} ${M.harness.version}, ${M.harness.api}, thinking ${M.harness.thinking}, 영어 프롬프트.`,
    ].join('\n'),
    lineup: () => {
      const f = data.models.filter(m => m.group === 'F'), c = data.models.filter(m => m.group === 'C');
      const badge = m => (data.lineup.retention_required.includes(m.key) ? ' (데이터 보존 aws_review 필요)' : '');
      const nm = data.lineup.not_measured, cat = data.lineup.catalog;
      return [
        '다이어그램: 측정한 모델. 모두 us-east-1에서 미국 교차 리전 추론 프로필(`us.` 모델 ID)로 호출했고, 2026-10-12에 모델 카드·계정 권한·실제 호출 3단계로 확인했습니다.',
        `- 그룹 1 프론티어, 실측 ${f.length}개: ${f.map(m => m.name + badge(m)).join(', ')}`,
        `- 그룹 2 중국 오픈웨이트, 실측 ${c.length}개: ${c.map(m => m.name + badge(m)).join(', ')}`,
        `- 측정 범위: us-east-1에서 호출할 수 있는 텍스트 생성 모델 중 ${f.length + c.length}개를 측정했습니다. Bedrock에는 이 밖에도 ${nm.map(x => x.name).join('·')} 등의 텍스트 생성 모델이 있지만 이번 측정에는 포함하지 않았습니다(${cat.checked} 기준).`,
      ].join('\n');
    },
    tokens: () => [
      `차트: 토큰 구성과 비용 구성(완주한 run의 중앙값). 완주한 run의 전체 토큰 중 ${pct(data.highlights.cache_read_token_share)}가 캐시 읽기였습니다. 캐시 읽기 비용 비중은 캐시 읽기 토큰 중앙값 × 단가를 run 비용 중앙값으로 나눈 근사치입니다.`,
      table(['모델', '입력(캐시 미적용)', '출력', '캐시 읽기', '캐시 쓰기', '합계', '캐시 읽기 토큰 비중', '캐시 읽기 비용 비중'], tokenMixRows()),
    ].join('\n\n'),
    roles: () => {
      const v = data.verdicts;
      const port = Object.entries(v.fail_port_by_model).map(([k, n]) => `${name(k)} ${n}`).join(', ');
      return [
        '차트: 빌더와 검증자의 분담(완주한 run의 중앙값). 자기 종료 세션은 에이전트가 자기 프로세스까지 종료해 exit 143으로 끝난 세션 수입니다.',
        table(['모델', '빌더 LLM 요청', '검증자 LLM 요청', '빌더 비용', '검증자 비용', '검증자 비중', '자기 종료 세션'], roleRows()),
        `검증자 판정(공식 채점을 통과한 반복 ${v.gate_pass}개): PASS ${v.pass}, PORT 환경 변수 미반영으로 FAIL ${v.fail_port}(${port}), 판정 없음(자기 종료) ${v.none}. 검증자가 PASS를 냈는데 채점에서 실패한 반복: ${v.false_pass}. 검증자 없는 비교군이 없어 검증자의 효과는 판단할 수 없습니다.`,
      ].join('\n\n');
    },
    groups: () => {
      const F = data.group_stats.F, C = data.group_stats.C;
      return [
        '차트: 그룹 비교. 그룹 값은 그룹에 속한 모델별 중앙값의 중앙값이고, 괄호는 그룹 안 모델 간 범위입니다.',
        table(['지표', `프론티어(${F.models}개)`, `중국 오픈웨이트(${C.models}개)`, '중국 오픈웨이트 ÷ 프론티어'],
          GROUP_METRICS.map(g => [g.ko, `${g.f(F[g.key].med)} (${g.f(F[g.key].min)}–${g.f(F[g.key].max)})`,
            `${g.f(C[g.key].med)} (${g.f(C[g.key].min)}–${g.f(C[g.key].max)})`, `${(C[g.key].med / F[g.key].med).toFixed(1)}×`])),
        `그룹 간 비용 차이(약 ${(C.cost_usd.med / F.cost_usd.med).toFixed(1)}배)보다 프론티어 안의 차이(약 ${Math.round(frontierCostRatio())}배)가 훨씬 큽니다. 그룹 2는 모델이 ${C.models}개뿐이고, 비교는 Bedrock 단가 기준입니다.`,
      ].join('\n\n');
    },
    prices: () => [
      `차트: 적용 단가(USD / 100만 토큰, us-east-1 엔드포인트의 미국 교차 리전 추론, ${data.price_checked} 확인). 출력 단가 순으로 정렬했습니다.`,
      table(['모델', 'Bedrock 모델 ID', '입력', '출력', '캐시 읽기', '캐시 쓰기'], priceRows()),
    ].join('\n\n'),
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
    card: m => `- **${m.name}** (${data.group_labels[m.group].en} · ${m.vendor}, ${usd(m.stats.cost_usd.med)} per run): ${m.note.en}`,
    method: () => [
      'Diagram: how each run works',
      `- Task: ${M.task.spec} backend (${M.task.stack.join(', ')}). Scope: ${M.task.scope.map(s => SCOPE.en[s] || s).join(', ')}.`,
      `- Completion (both must hold): the builder creates \`.ralph-done\`, and the official Hurl grader passes all ${M.grader.hurl_files} files (${M.grader.requests} requests). If grading fails, the harness deletes \`.ralph-done\` and runs another iteration.`,
      '- One iteration: builder (implements from PROMPT-en.md; from iteration 2 it reads REVIEW.md first) → verifier (runs the Hurl tests itself and writes REVIEW.md) → grader (decides completion with the official Hurl tests). If not complete, the next iteration starts in a new session; only the repository carries over. Builder and verifier use the same model.',
      `- Guardrails: up to ${M.limits.iterations_max} iterations, ${Math.round(M.limits.run_cap_sec / 60)}-minute run cap, ${M.limits.stall_sec}-second stall watchdog, cost caps $${M.limits.cost_cap_usd.run} per run · $${M.limits.cost_cap_usd.model} per model · $${int(M.limits.cost_cap_usd.total)} total.`,
      `- Isolation and execution: one Docker container per agent session and per grading pass (${M.container.mem_gb} GB, ${M.container.cpus} CPUs, ${int(M.container.pids)} processes). Containers received only a Bedrock-only short-term API key (max ${M.credentials.token_ttl_min} min, refreshed every ${M.credentials.refresh_min} min), no AWS access keys. Up to ${M.limits.parallel_models} models ran in parallel; the ${M.limits.runs_per_model} runs of one model ran in sequence.`,
      `- Harness: ${M.harness.agent} ${M.harness.version}, ${M.harness.api}, thinking ${M.harness.thinking}, English prompts.`,
    ].join('\n'),
    lineup: () => {
      const f = data.models.filter(m => m.group === 'F'), c = data.models.filter(m => m.group === 'C');
      const badge = m => (data.lineup.retention_required.includes(m.key) ? ' (requires data retention aws_review)' : '');
      const nm = data.lineup.not_measured, cat = data.lineup.catalog;
      return [
        'Diagram: models measured. All were called in us-east-1 through US cross-Region inference profiles (`us.` model IDs), checked on 2026-10-12 in three steps: model cards, account permissions and a live call.',
        `- Group 1 frontier, measured (${f.length}): ${f.map(m => m.name + badge(m)).join(', ')}`,
        `- Group 2 Chinese open-weight, measured (${c.length}): ${c.map(m => m.name + badge(m)).join(', ')}`,
        `- Scope: ${f.length + c.length} of the text-generation models callable in us-east-1 were measured. Bedrock also offers other text-generation models, e.g. ${nm.map(x => x.name).join(', ')}, which were not included (checked ${cat.checked}).`,
      ].join('\n');
    },
    tokens: () => [
      `Chart: token mix and cost mix (medians of completed runs). ${pct(data.highlights.cache_read_token_share)} of all tokens in completed runs were cache reads. The cache-read cost share approximates median cache-read tokens × price divided by the median run cost.`,
      table(['Model', 'Input (uncached)', 'Output', 'Cache read', 'Cache write', 'Total', 'Cache-read token share', 'Cache-read cost share'], tokenMixRows()),
    ].join('\n\n'),
    roles: () => {
      const v = data.verdicts;
      const port = Object.entries(v.fail_port_by_model).map(([k, n]) => `${name(k)} ${n}`).join(', ');
      return [
        'Chart: builder and verifier split (medians of completed runs). Self-terminated sessions are sessions in which the agent killed its own process (exit 143).',
        table(['Model', 'Builder LLM requests', 'Verifier LLM requests', 'Builder cost', 'Verifier cost', 'Verifier share', 'Self-terminated sessions'], roleRows()),
        `Verifier verdicts (${v.gate_pass} iterations that passed the official grader): PASS ${v.pass}, FAIL because of the PORT environment variable ${v.fail_port} (${port}), no verdict (self-terminated) ${v.none}. Iterations where the verifier said PASS but grading failed: ${v.false_pass}. There is no control group without a verifier, so its effect cannot be determined.`,
      ].join('\n\n');
    },
    groups: () => {
      const F = data.group_stats.F, C = data.group_stats.C;
      return [
        'Chart: group comparison. A group value is the median of its models\' medians; parentheses give the range across the group\'s models.',
        table(['Metric', `Frontier (${F.models})`, `Chinese open-weight (${C.models})`, 'Chinese open-weight ÷ frontier'],
          GROUP_METRICS.map(g => [g.en, `${g.f(F[g.key].med)} (${g.f(F[g.key].min)}–${g.f(F[g.key].max)})`,
            `${g.f(C[g.key].med)} (${g.f(C[g.key].min)}–${g.f(C[g.key].max)})`, `${(C[g.key].med / F[g.key].med).toFixed(1)}×`])),
        `The cost spread inside the frontier group (about ${Math.round(frontierCostRatio())}×) is far larger than the gap between groups (about ${(C.cost_usd.med / F.cost_usd.med).toFixed(1)}×). Group 2 has only ${C.models} models, and the comparison uses Bedrock prices.`,
      ].join('\n\n');
    },
    prices: () => [
      `Chart: prices applied (USD per million tokens, US cross-Region inference from the us-east-1 endpoint, checked ${data.price_checked}), sorted by output price.`,
      table(['Model', 'Bedrock model ID', 'Input', 'Output', 'Cache read', 'Cache write'], priceRows()),
    ].join('\n\n'),
  },
};

const lang = renderer => (renderer.locale === 'en' ? 'en' : 'ko');

function ralphRenderers(renderer) {
  const t = () => TEXT[lang(renderer)];
  return {
    RalphKpiStrip: () => t().kpi(data.highlights),
    RalphCostTimeScatter: () => t().scatter,
    RalphMetricMatrix: () => t().matrix,
    RalphModelCards: () => data.models.map(m => t().card(m)).join('\n'),
    RalphMethodFlow: () => t().method(),
    RalphLineupMap: () => t().lineup(),
    RalphTokenMix: () => t().tokens(),
    RalphRoleSplit: () => t().roles(),
    RalphGroupCompare: () => t().groups(),
    RalphPriceLadder: () => t().prices(),
  };
}

const RALPH_FILES = {
  RalphKpiStrip: 'KpiStrip.js', RalphCostTimeScatter: 'CostTimeScatter.js', RalphMetricMatrix: 'MetricMatrix.js',
  RalphModelCards: 'ModelCards.js', RalphMethodFlow: 'MethodFlow.js',
  RalphLineupMap: 'LineupMap.js', RalphTokenMix: 'TokenMix.js', RalphRoleSplit: 'RoleSplit.js',
  RalphGroupCompare: 'GroupCompare.js', RalphPriceLadder: 'PriceLadder.js',
};
const RALPH_COMPONENTS = Object.keys(RALPH_FILES);
const ralphSources = Object.fromEntries(RALPH_COMPONENTS.map(n => [n, [
  `src/components/RalphLoopBenchmark/${RALPH_FILES[n]}`, 'src/components/RalphLoopBenchmark/shared.js',
  'src/data/ralph-loop-bedrock.json',
]]));

module.exports = {ralphRenderers, ralphSources, RALPH_COMPONENTS};
