import React, {useId} from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, fmt} from './shared';
import styles from './SameModelChart.module.css';

// Three series share one axis; each has a fixed --ep-chart token so the colors
// are stable across light and dark themes. Label keys resolve against agent A's
// shared string table (publishedRun / thisRun / builderOnly).
const SERIES = [
  {id: 'published', color: 'var(--ep-chart-2)', labelKey: 'publishedRun'},
  {id: 'median', color: 'var(--ep-chart-1)', labelKey: 'thisRun'},
  {id: 'builder', color: 'var(--ep-chart-4)', labelKey: 'builderOnly'},
];

// Figure-level title/description and the x-axis label are not in shared.js, so
// this component keeps its own KO/EN copy rather than inventing t() keys that
// would be echoed back verbatim.
const LABELS = {
  ko: {
    title: '동일 모델 비용 비교 (덤벨 차트)',
    desc: '모델별로 공개된 단일 에이전트 pi 실행 비용(Bedrock 가격 재산정), 이번 측정의 중앙값 비용, 빌더 전용 중앙값 비용을 한 축에서 비교합니다. 행 끝의 배수는 이번 측정 중앙값을 공개 비용으로 나눈 값입니다.',
    axis: '실행당 비용 (USD)',
    model: '모델',
    ratio: '배수(이번/공개)',
  },
  en: {
    title: 'Same-model cost comparison (dumbbell)',
    desc: 'For each model, compares the published single-agent pi run cost (re-priced at Bedrock prices), this measurement\u2019s median cost, and the builder-only median on one axis. The multiplier at the end of each row is this median divided by the published cost.',
    axis: 'Cost per run (USD)',
    model: 'Model',
    ratio: 'Ratio (this/published)',
  },
};

// Layout in user units; SVG scales via viewBox + width:100%.
const W = 720;
const ROW_H = 34;
const M = {top: 16, right: 150, bottom: 44, left: 150};
const PLOT_W = W - M.left - M.right;

function niceLinearTicks(min, max, count = 5) {
  const span = Math.max(max - min, 1e-9);
  const rawStep = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const norm = rawStep / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.floor(min / step) * step;
  const end = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = start; v <= end + step / 2; v += step) ticks.push(Math.round(v * 1e6) / 1e6);
  return {ticks, lo: start, hi: end};
}

function logTicks(min, max) {
  const loExp = Math.floor(Math.log10(min));
  const hiExp = Math.ceil(Math.log10(max));
  const major = [];
  for (let e = loExp; e <= hiExp; e += 1) major.push(Math.pow(10, e));
  return {major, lo: Math.pow(10, loExp), hi: Math.pow(10, hiExp)};
}

function decadeLabel(v) {
  if (v >= 1) return `$${Math.round(v)}`;
  const digits = Math.round(-Math.log10(v));
  return `$${v.toFixed(digits)}`;
}

export default function RalphSameModelChart() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const titleId = `${baseId}-title`;

  // One row per model that has a published pi run to compare against.
  const rows = data.models
    .filter((m) => m.published_pi_run && m.published_pi_run.cost_usd != null
      && m.stats && m.stats.cost_usd && m.stats.cost_usd.med != null)
    .map((m) => ({
      key: m.key,
      name: m.name,
      published: m.published_pi_run.cost_usd,
      median: m.stats.cost_usd.med,
      builder: m.stats.builder_cost_usd && m.stats.builder_cost_usd.med != null
        ? m.stats.builder_cost_usd.med : null,
      ratio: m.stats.cost_usd.med / m.published_pi_run.cost_usd,
    }));

  // Gather every plotted value to size the axis.
  const values = [];
  for (const r of rows) {
    values.push(r.published, r.median);
    if (r.builder != null) values.push(r.builder);
  }
  const vMin = values.length ? Math.min(...values) : 0;
  const vMax = values.length ? Math.max(...values) : 1;

  // Linear if everything sits within 0-2 USD, otherwise log (brief rule).
  const useLog = vMin <= 0 || vMax > 2 || vMin < 0.01;
  const axis = useLog
    ? logTicks(Math.max(vMin, 1e-4), vMax)
    : niceLinearTicks(0, vMax, 5);

  let xScale;
  if (useLog) {
    const logLo = Math.log10(axis.lo);
    const logHi = Math.log10(axis.hi);
    xScale = (v) => M.left + ((Math.log10(Math.max(v, axis.lo)) - logLo) / (logHi - logLo)) * PLOT_W;
  } else {
    xScale = (v) => M.left + ((v - axis.lo) / (axis.hi - axis.lo)) * PLOT_W;
  }

  const PLOT_H = rows.length * ROW_H;
  const H = M.top + PLOT_H + M.bottom;
  const rowY = (i) => M.top + i * ROW_H + ROW_H / 2;

  const ariaLabel = lang === 'ko'
    ? `동일 모델 비용 비교 덤벨 차트. 공개된 단일 에이전트 pi 실행 비용, 이번 측정의 중앙값, 빌더 전용 중앙값을 비교. ${rows.length}개 모델.`
    : `Dumbbell chart comparing, per model, the published single-agent pi run cost, this measurement's median cost, and the builder-only median. ${rows.length} models.`;

  // Figure prints the "Source:" prefix itself, so this is only the body.
  const ref = data.reference;
  const source = lang === 'ko'
    ? <>공개 run은 {ref.author.ko}님의 <a href={ref.repo}>공개 저장소</a>에 있는 토큰 수에, 이번 측정은 이 보고서의 실측 토큰 수에 Amazon Bedrock {data.region} 단가({data.price_checked} 확인)를 곱한 값입니다.</>
    : <>Published runs: token counts from the <a href={ref.repo}>public repository</a> by {ref.author.en}; this measurement: this report's measured tokens. Both priced at Amazon Bedrock {data.region} prices checked on {data.price_checked}.</>;

  const dataFallback = (
    <details className={styles.details}>
      <summary>{t(lang, 'showData')}</summary>
      <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={ariaLabel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{L.model}</th>
              <th scope="col">{t(lang, 'publishedRun')}</th>
              <th scope="col">{t(lang, 'thisRun')}</th>
              <th scope="col">{t(lang, 'builderOnly')}</th>
              <th scope="col">{L.ratio}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.name}</th>
                <td className={styles.num}>{fmt.usd(r.published)}</td>
                <td className={styles.num}>{fmt.usd(r.median)}</td>
                <td className={styles.num}>{r.builder != null ? fmt.usd(r.builder) : '—'}</td>
                <td className={styles.num}>{`${r.ratio.toFixed(2)}x`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );

  return (
    <Figure
      title={L.title}
      description={L.desc}
      source={source}
      dataFallback={dataFallback}
    >
      <div className={styles.scrollWrap}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby={titleId}
        >
          <title id={titleId}>{ariaLabel}</title>

          {/* Vertical gridlines + x ticks. */}
          {axis.ticks ? axis.ticks.map((v) => {
            const x = xScale(v);
            return (
              <g key={`g${v}`}>
                <line x1={x} y1={M.top} x2={x} y2={M.top + PLOT_H} className={styles.grid} />
                <text x={x} y={M.top + PLOT_H + 18} className={styles.tickLabel}
                  textAnchor="middle">{fmt.usd2(v)}</text>
              </g>
            );
          }) : axis.major.map((v) => {
            const x = xScale(v);
            return (
              <g key={`g${v}`}>
                <line x1={x} y1={M.top} x2={x} y2={M.top + PLOT_H} className={styles.grid} />
                <text x={x} y={M.top + PLOT_H + 18} className={styles.tickLabel}
                  textAnchor="middle">{decadeLabel(v)}</text>
              </g>
            );
          })}

          {/* Axis title. */}
          <text x={M.left + PLOT_W / 2} y={H - 8} className={styles.axisTitle}
            textAnchor="middle">{L.axis}</text>

          {/* Rows: connecting bar + three markers + name + ratio. */}
          {rows.map((r, i) => {
            const y = rowY(i);
            const pts = [
              {id: 'published', v: r.published},
              {id: 'median', v: r.median},
              ...(r.builder != null ? [{id: 'builder', v: r.builder}] : []),
            ];
            const xs = pts.map((p) => xScale(p.v));
            const barLo = Math.min(...xs);
            const barHi = Math.max(...xs);
            return (
              <g key={r.key}>
                <text x={M.left - 10} y={y} className={styles.rowLabel}
                  textAnchor="end" dominantBaseline="middle">{r.name}</text>
                <line x1={barLo} y1={y} x2={barHi} y2={y} className={styles.connector} />
                {pts.map((p) => {
                  const color = SERIES.find((s) => s.id === p.id).color;
                  return (
                    <circle key={p.id} cx={xScale(p.v)} cy={y} r={5} fill={color}
                      stroke="var(--ep-surface-container-lowest)" strokeWidth="1" />
                  );
                })}
                <text x={M.left + PLOT_W + 10} y={y} className={styles.ratioLabel}
                  dominantBaseline="middle">{`${r.ratio.toFixed(2)}x`}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Legend explaining the three markers. */}
      <div className={styles.legend}>
        {SERIES.map((s) => (
          <span key={s.id} className={styles.legendItem}>
            <span className={styles.swatch} style={{background: s.color}} />
            {t(lang, s.labelKey)}
          </span>
        ))}
      </div>
    </Figure>
  );
}
