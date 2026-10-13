import React, {useId, useMemo, useState} from 'react';
import {data, useLang, t as sharedT, fmt, VENDOR_COLOR, groupLabel} from './shared';
import styles from './MetricMatrix.module.css';

// Local fallback strings for keys agent A's shared.t may not provide. The
// component always calls `tr(lang, key)` which prefers shared.t and falls back
// here, so the matrix renders even if shared.js ships a smaller string table.
const LOCAL = {
  en: {
    matrix_title: 'Results by model',
    matrix_desc: 'One row per model. Pick a metric to compare the spread of its five runs; expand a row for the per-run detail.',
    metric_label: 'Metric',
    col_model: 'Model',
    col_range: 'Completed-run range',
    completed_of: 'completed',
    median: 'median',
    legend_done: 'Completed run',
    legend_median: 'Median',
    legend_timeout: 'Timed out (no completed value)',
    expand_runs: 'Show the five runs',
    run: 'Run',
    status: 'Status',
    iterations: 'Iterations',
    status_done: 'done',
    status_timeout: 'timeout',
    th_run_minutes: 'Minutes',
    th_llm_requests: 'LLM requests',
    th_output_tokens: 'Output tokens',
    th_total_tokens: 'Total tokens',
    th_cost: 'Cost',
    th_verdicts: 'Verifier',
    th_commits: 'Commits',
    th_self_terminated: 'Self-terminated',
    no_completed: 'No completed run',
    m_cost_usd: 'Cost (USD)',
    m_run_minutes: 'Run minutes',
    m_output_tokens: 'Output tokens',
    m_total_tokens: 'Total tokens',
    m_llm_requests: 'LLM requests',
    axis_log: 'log scale',
  },
  ko: {
    matrix_title: '모델별 결과',
    matrix_desc: '모델마다 한 행입니다. 지표를 선택해 5회 실행의 분포를 비교하고, 행을 펼치면 실행별 상세를 볼 수 있습니다.',
    metric_label: '지표',
    col_model: '모델',
    col_range: '완주 실행 범위',
    completed_of: '완주',
    median: '중앙값',
    legend_done: '완주한 실행',
    legend_median: '중앙값',
    legend_timeout: '타임아웃(완주 값 없음)',
    expand_runs: '5회 실행 보기',
    run: '실행',
    status: '상태',
    iterations: '반복',
    status_done: '완주',
    status_timeout: '타임아웃',
    th_run_minutes: '분',
    th_llm_requests: 'LLM 요청',
    th_output_tokens: '출력 토큰',
    th_total_tokens: '총 토큰',
    th_cost: '비용',
    th_verdicts: '검증자',
    th_commits: '커밋',
    th_self_terminated: '세션 자가종료',
    no_completed: '완주한 실행 없음',
    m_cost_usd: '비용(USD)',
    m_run_minutes: '실행 시간(분)',
    m_output_tokens: '출력 토큰',
    m_total_tokens: '총 토큰',
    m_llm_requests: 'LLM 요청',
    axis_log: '로그 스케일',
  },
};

function tr(lang, key) {
  // Prefer agent A's shared strings; fall back to the local map above.
  let v;
  try {
    v = sharedT(lang, key);
  } catch (e) {
    v = undefined;
  }
  if (v == null || v === key) return (LOCAL[lang] && LOCAL[lang][key]) || (LOCAL.en && LOCAL.en[key]) || key;
  return v;
}

// Metric definitions. `get` reads a value off a run object; `labelKey` resolves
// through tr(); `scale` is 'log' or 'linear'; `fmtVal` formats for display.
const METRICS = [
  {key: 'cost_usd', labelKey: 'm_cost_usd', scale: 'log', get: (r) => r.cost_usd, fmtVal: (v) => fmt.usd(v)},
  {key: 'run_minutes', labelKey: 'm_run_minutes', scale: 'linear', get: (r) => r.run_minutes, fmtVal: (v) => fmt.min(v)},
  {key: 'output_tokens', labelKey: 'm_output_tokens', scale: 'linear', get: (r) => r.output_tokens, fmtVal: (v, lang) => fmt.int(v, lang)},
  {key: 'total_tokens', labelKey: 'm_total_tokens', scale: 'log', get: (r) => r.total_tokens, fmtVal: (v, lang) => fmt.int(v, lang)},
  {key: 'llm_requests', labelKey: 'm_llm_requests', scale: 'linear', get: (r) => r.llm_requests, fmtVal: (v, lang) => fmt.int(v, lang)},
];

const GROUP_ORDER = ['F', 'C'];

function median(sortedNums) {
  const n = sortedNums.length;
  if (n === 0) return null;
  const mid = Math.floor(n / 2);
  return n % 2 ? sortedNums[mid] : (sortedNums[mid - 1] + sortedNums[mid]) / 2;
}

// Map a value to a 0..1 position on the shared axis, honouring the scale. For
// log scales, non-positive values are clamped to the domain minimum.
function toFraction(value, domain, scale) {
  const {min, max} = domain;
  if (max === min) return 0.5;
  if (scale === 'log') {
    const lo = Math.log10(Math.max(min, Number.MIN_VALUE));
    const hi = Math.log10(Math.max(max, Number.MIN_VALUE));
    if (hi === lo) return 0.5;
    const v = Math.log10(Math.max(value, min, Number.MIN_VALUE));
    return (v - lo) / (hi - lo);
  }
  return (value - min) / (max - min);
}

// Build 4 "nice-ish" tick values spanning the domain for the header axis.
function buildTicks(domain, scale) {
  const {min, max} = domain;
  if (!(max > min)) return [min];
  const count = 4;
  const ticks = [];
  if (scale === 'log') {
    const lo = Math.log10(Math.max(min, Number.MIN_VALUE));
    const hi = Math.log10(Math.max(max, Number.MIN_VALUE));
    for (let i = 0; i < count; i += 1) {
      ticks.push(10 ** (lo + ((hi - lo) * i) / (count - 1)));
    }
  } else {
    for (let i = 0; i < count; i += 1) {
      ticks.push(min + ((max - min) * i) / (count - 1));
    }
  }
  return ticks;
}

export default function RalphMetricMatrix() {
  const lang = useLang();
  const uid = useId();
  const [metricKey, setMetricKey] = useState(METRICS[0].key);
  const metric = METRICS.find((m) => m.key === metricKey) || METRICS[0];

  const models = Array.isArray(data.models) ? data.models : [];
  const runs = Array.isArray(data.runs) ? data.runs : [];

  // Group runs by model key once per render.
  const runsByModel = useMemo(() => {
    const map = {};
    for (const r of runs) {
      (map[r.model] = map[r.model] || []).push(r);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => (a.n || 0) - (b.n || 0));
    }
    return map;
  }, [runs]);

  // Shared axis domain: min/max across every completed run for this metric.
  const domain = useMemo(() => {
    const vals = [];
    for (const r of runs) {
      if (r.status === 'done') {
        const v = metric.get(r);
        if (typeof v === 'number' && Number.isFinite(v)) vals.push(v);
      }
    }
    if (vals.length === 0) return {min: 0, max: 1, empty: true};
    let min = Math.min(...vals);
    let max = Math.max(...vals);
    if (min === max) {
      // Pad a degenerate domain so the bar has width.
      const pad = Math.abs(min) || 1;
      min -= pad * 0.5;
      max += pad * 0.5;
      if (metric.scale === 'log' && min <= 0) min = max / 10;
    }
    return {min, max, empty: false};
  }, [runs, metric]);

  const ticks = useMemo(() => buildTicks(domain, metric.scale), [domain, metric]);

  // Ordered model rows grouped F then C.
  const grouped = GROUP_ORDER
    .map((g) => ({group: g, rows: models.filter((m) => m.group === g)}))
    .filter((entry) => entry.rows.length > 0);

  const axisLabelId = `${uid}-axis`;

  return (
    <section className={styles.wrap} aria-labelledby={`${uid}-title`}>
      <div className={styles.header}>
        <h3 id={`${uid}-title`} className={styles.title}>{tr(lang, 'matrix_title')}</h3>
        <p className={styles.desc}>{tr(lang, 'matrix_desc')}</p>
      </div>

      <div className={styles.controls} role="group" aria-label={tr(lang, 'metric_label')}>
        <span className={styles.controlLabel}>{tr(lang, 'metric_label')}</span>
        <div className={styles.segmented}>
          {METRICS.map((m) => {
            const active = m.key === metricKey;
            return (
              <button
                key={m.key}
                type="button"
                className={styles.segBtn}
                aria-pressed={active}
                onClick={() => setMetricKey(m.key)}
              >
                {tr(lang, m.labelKey)}
                {m.scale === 'log' && <span className={styles.logTag}> ({tr(lang, 'axis_log')})</span>}
              </button>
            );
          })}
        </div>
      </div>

      <ul className={styles.legend} aria-hidden="false">
        <li className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.dotSwatch}`} />
          {tr(lang, 'legend_done')}
        </li>
        <li className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.medianSwatch}`} />
          {tr(lang, 'legend_median')}
        </li>
        <li className={styles.legendItem}>
          <span className={`${styles.legendSwatch} ${styles.timeoutSwatch}`} aria-hidden="true">×</span>
          {tr(lang, 'legend_timeout')}
        </li>
      </ul>

      <div className={styles.frame}>
        <div className={styles.scroller} role="region" tabIndex={0} aria-label={tr(lang, 'matrix_title')}>
          <div className={styles.matrix} role="table" aria-label={tr(lang, 'matrix_title')}>
            {/* Header row: model column + shared axis ticks. */}
            <div className={styles.axisRow} role="row">
              <div className={`${styles.cellModel} ${styles.axisModelHead}`} role="columnheader">
                {tr(lang, 'col_model')}
              </div>
              <div className={styles.cellRange} role="columnheader" id={axisLabelId}>
                <span className={styles.srOnly}>{tr(lang, 'col_range')}</span>
                <div className={styles.axisTicks} aria-hidden="true">
                  {domain.empty ? null : ticks.map((tv, i) => {
                    const frac = toFraction(tv, domain, metric.scale);
                    return (
                      <span
                        key={i}
                        className={styles.axisTick}
                        style={{left: `${(frac * 100).toFixed(2)}%`}}
                      >
                        {metric.fmtVal(tv, lang)}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            {grouped.map(({group, rows}) => (
              <React.Fragment key={group}>
                <div className={styles.groupRow} role="row">
                  <div className={styles.groupLabel} role="rowheader" aria-colspan={2}>
                    {groupLabel(group, lang)}
                  </div>
                </div>
                {rows.map((model) => (
                  <ModelRow
                    key={model.key}
                    model={model}
                    modelRuns={runsByModel[model.key] || []}
                    metric={metric}
                    domain={domain}
                    lang={lang}
                    axisLabelId={axisLabelId}
                  />
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ModelRow({model, modelRuns, metric, domain, lang, axisLabelId}) {
  const vendorColor = VENDOR_COLOR[model.vendor] || 'var(--ep-chart-6)';
  const completedRuns = modelRuns.filter((r) => r.status === 'done');
  const timeoutRuns = modelRuns.filter((r) => r.status !== 'done');

  const values = completedRuns
    .map((r) => metric.get(r))
    .filter((v) => typeof v === 'number' && Number.isFinite(v))
    .sort((a, b) => a - b);

  const hasData = values.length > 0 && !domain.empty;
  const rowMin = hasData ? values[0] : null;
  const rowMax = hasData ? values[values.length - 1] : null;
  const rowMed = hasData ? median(values) : null;

  const leftFrac = hasData ? toFraction(rowMin, domain, metric.scale) : 0;
  const rightFrac = hasData ? toFraction(rowMax, domain, metric.scale) : 0;
  const medFrac = hasData ? toFraction(rowMed, domain, metric.scale) : 0;

  return (
    <div className={styles.modelGroup} role="row">
      <details className={styles.details}>
        <summary className={styles.summary}>
          <span className={styles.cellModel}>
            <span className={styles.vendorDot} style={{background: vendorColor}} aria-hidden="true" />
            <span className={styles.modelName}>{model.name}</span>
            <span className={styles.completed}>
              {model.completed}/{model.runs} {tr(lang, 'completed_of')}
            </span>
          </span>
          <span className={styles.cellRange} aria-describedby={axisLabelId}>
            {hasData ? (
              <span className={styles.bar}>
                <span className={styles.axisGrid} aria-hidden="true" />
                <span
                  className={styles.rangeSpan}
                  style={{
                    left: `${(leftFrac * 100).toFixed(2)}%`,
                    width: `${Math.max(0, (rightFrac - leftFrac) * 100).toFixed(2)}%`,
                    background: vendorColor,
                  }}
                />
                {completedRuns.map((r) => {
                  const v = metric.get(r);
                  const frac = toFraction(v, domain, metric.scale);
                  return (
                    <span
                      key={r.id}
                      className={styles.runDot}
                      style={{left: `${(frac * 100).toFixed(2)}%`, borderColor: vendorColor}}
                      title={`${r.id}: ${metric.fmtVal(v, lang)}`}
                    />
                  );
                })}
                {timeoutRuns.map((r) => (
                  <span
                    key={r.id}
                    className={styles.timeoutMark}
                    aria-hidden="true"
                    title={`${r.id}: ${tr(lang, 'status_timeout')}`}
                  >
                    ×
                  </span>
                ))}
                <span
                  className={styles.medianTick}
                  style={{left: `${(medFrac * 100).toFixed(2)}%`}}
                  aria-hidden="true"
                />
                <span
                  className={styles.medianValue}
                  style={{left: `${(medFrac * 100).toFixed(2)}%`}}
                >
                  {tr(lang, 'median')} {metric.fmtVal(rowMed, lang)}
                </span>
              </span>
            ) : (
              <span className={styles.noData}>{tr(lang, 'no_completed')}</span>
            )}
          </span>
          <span className={styles.expandHint} aria-hidden="true">▸</span>
          <span className={styles.srOnly}>{tr(lang, 'expand_runs')}</span>
        </summary>

        <div className={styles.runsPanel}>
          <table className={styles.runsTable}>
            <caption className={styles.srOnly}>
              {model.name} — {tr(lang, 'expand_runs')}
            </caption>
            <thead>
              <tr>
                <th scope="col">{tr(lang, 'run')}</th>
                <th scope="col">{tr(lang, 'status')}</th>
                <th scope="col" data-numeric="true">{tr(lang, 'iterations')}</th>
                <th scope="col" data-numeric="true">{tr(lang, 'th_run_minutes')}</th>
                <th scope="col" data-numeric="true">{tr(lang, 'th_llm_requests')}</th>
                <th scope="col" data-numeric="true">{tr(lang, 'th_output_tokens')}</th>
                <th scope="col" data-numeric="true">{tr(lang, 'th_total_tokens')}</th>
                <th scope="col" data-numeric="true">{tr(lang, 'th_cost')}</th>
                <th scope="col">{tr(lang, 'th_verdicts')}</th>
                <th scope="col" data-numeric="true">{tr(lang, 'th_commits')}</th>
                <th scope="col" data-numeric="true">{tr(lang, 'th_self_terminated')}</th>
              </tr>
            </thead>
            <tbody>
              {modelRuns.map((r) => {
                const done = r.status === 'done';
                return (
                  <tr key={r.id}>
                    <th scope="row">{r.n}</th>
                    <td>
                      <span className={done ? styles.badgeDone : styles.badgeTimeout}>
                        {done ? tr(lang, 'status_done') : tr(lang, 'status_timeout')}
                      </span>
                    </td>
                    <td data-numeric="true">{r.iterations == null ? '—' : fmt.int(r.iterations, lang)}</td>
                    <td data-numeric="true">{r.run_minutes == null ? '—' : fmt.min(r.run_minutes)}</td>
                    <td data-numeric="true">{r.llm_requests == null ? '—' : fmt.int(r.llm_requests, lang)}</td>
                    <td data-numeric="true">{r.output_tokens == null ? '—' : fmt.int(r.output_tokens, lang)}</td>
                    <td data-numeric="true">{r.total_tokens == null ? '—' : fmt.int(r.total_tokens, lang)}</td>
                    <td data-numeric="true">{r.cost_usd == null ? '—' : fmt.usd(r.cost_usd)}</td>
                    <td>{Array.isArray(r.verifier_verdicts) && r.verifier_verdicts.length ? r.verifier_verdicts.join(' / ') : '—'}</td>
                    <td data-numeric="true">{r.commits == null ? '—' : fmt.int(r.commits, lang)}</td>
                    <td data-numeric="true">{r.self_terminated_sessions == null ? '—' : fmt.int(r.self_terminated_sessions, lang)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
