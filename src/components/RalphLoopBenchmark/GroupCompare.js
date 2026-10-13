import React, {useId} from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, fmt, VENDOR_COLOR, groupLabel} from './shared';
import styles from './GroupCompare.module.css';

// Component-specific copy. Kept local (as SameModelChart does) because these
// strings are not in the shared t() table. Korean: concise polite noun
// phrases, no particle directly after a computed name.
const LABELS = {
  ko: {
    title: '그룹 비교: 중국 오픈웨이트 vs 프론티어',
    desc: '그룹 값은 각 모델 중앙값들의 중앙값입니다. 타일의 큰 숫자는 중국 오픈웨이트 그룹 값을 프론티어 그룹 값으로 나눈 배수입니다.',
    tilesHeading: '중국 오픈웨이트 ÷ 프론티어',
    takeaway: (groupR, frontierR) =>
      `그룹 간 차이(약 ${groupR}배)보다 프론티어 안의 차이(약 ${frontierR}배)가 훨씬 큽니다. 비용은 모델 단위로 판단해야 합니다.`,
    caveat: '중국 오픈웨이트 그룹은 모델이 2개뿐이라 그룹 값의 신뢰도가 낮습니다. 비용은 Amazon Bedrock 단가 기준이며, 자체 호스팅은 다루지 않습니다.',
    source: '이 보고서의 실측, 완주한 run의 중앙값',
    stripTitle: '모델별 실행당 비용 (로그 스케일)',
    axisCost: '실행당 비용 (USD, 로그 스케일)',
    frontierBand: '프론티어 범위 (최소–최대)',
    metric: '지표',
    ratioCol: '배수 (중국 ÷ 프론티어)',
    minMax: '최소–최대',
  },
  en: {
    title: 'Group comparison: Chinese open-weight vs frontier',
    desc: 'The group value is the median of the model medians. Each tile\u2019s big number is the Chinese open-weight group value divided by the frontier group value.',
    tilesHeading: 'Chinese open-weight \u00f7 frontier',
    takeaway: (groupR, frontierR) =>
      `The spread inside the frontier group (about ${frontierR}\u00d7) is far larger than the gap between groups (about ${groupR}\u00d7), so cost has to be judged per model.`,
    caveat: 'The Chinese open-weight group has only two models, so its group value is less reliable. Costs are Amazon Bedrock prices only; self-hosting is not covered.',
    source: 'This report\u2019s measurements, median over completed runs',
    stripTitle: 'Median cost per run by model (log scale)',
    axisCost: 'Cost per run (USD, log scale)',
    frontierBand: 'Frontier range (min\u2013max)',
    metric: 'Metric',
    ratioCol: 'Ratio (Chinese \u00f7 frontier)',
    minMax: 'Min\u2013max',
  },
};

// Metrics shown as ratio tiles, in brief order. `fmtVal` turns a group value
// into display text; `unit` is appended for the time metric.
const METRICS = [
  {key: 'cost_usd', labelKo: '비용', labelEn: 'Cost', kind: 'usd'},
  {key: 'output_tokens', labelKo: '출력 토큰', labelEn: 'Output tokens', kind: 'int'},
  {key: 'total_tokens', labelKo: '전체 토큰', labelEn: 'Total tokens', kind: 'int'},
  {key: 'llm_requests', labelKo: 'LLM 요청', labelEn: 'LLM requests', kind: 'int'},
  {key: 'run_minutes', labelKo: 'run 시간', labelEn: 'Run time', kind: 'min'},
];

function fmtGroupValue(kind, v, lang) {
  if (kind === 'usd') return fmt.usd(v);
  if (kind === 'int') return fmt.int(v, lang);
  if (kind === 'min') return `${fmt.min(v)}${lang === 'ko' ? '분' : ' min'}`;
  return String(v);
}

// Cost strip geometry (user units; SVG scales via viewBox).
const W = 720;
const M = {top: 30, right: 20, bottom: 44, left: 20};
const PLOT_W = W - M.left - M.right;
const AXIS_LO = 0.01;
const AXIS_HI = 10;
const LOG_LO = Math.log10(AXIS_LO);
const LOG_HI = Math.log10(AXIS_HI);

function xFor(v) {
  const clamped = Math.min(Math.max(v, AXIS_LO), AXIS_HI);
  return M.left + ((Math.log10(clamped) - LOG_LO) / (LOG_HI - LOG_LO)) * PLOT_W;
}

function decadeLabel(v) {
  if (v >= 1) return `$${Math.round(v)}`;
  const digits = Math.round(-Math.log10(v));
  return `$${v.toFixed(digits)}`;
}

export default function RalphGroupCompare() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const titleId = `${baseId}-title`;

  const gs = data.group_stats;
  const fLabel = groupLabel('F', lang);
  const cLabel = groupLabel('C', lang);

  // Ratio tiles: C median / F median per metric.
  const tiles = METRICS.map((m) => {
    const fMed = gs.F[m.key].med;
    const cMed = gs.C[m.key].med;
    const ratio = cMed / fMed;
    return {
      key: m.key,
      label: lang === 'ko' ? m.labelKo : m.labelEn,
      ratio,
      fText: fmtGroupValue(m.kind, fMed, lang),
      cText: fmtGroupValue(m.kind, cMed, lang),
    };
  });

  // Cost strip: every model's median cost as a dot. Frontier min/max band from
  // the frontier model medians; Chinese models highlighted.
  const fModels = data.models.filter((m) => m.group === 'F' && m.stats
    && m.stats.cost_usd && m.stats.cost_usd.med != null);
  const fMeds = fModels.map((m) => m.stats.cost_usd.med);
  const fMin = Math.min(...fMeds);
  const fMax = Math.max(...fMeds);
  const frontierRatio = fMax / fMin; // ~130x; computed from frontier model medians.

  const dots = data.models
    .filter((m) => m.stats && m.stats.cost_usd && m.stats.cost_usd.med != null)
    .map((m) => ({
      key: m.key,
      name: m.name,
      vendor: m.vendor,
      group: m.group,
      med: m.stats.cost_usd.med,
    }))
    .sort((a, b) => a.med - b.med);

  // Alternate labels above/below the axis to avoid collisions.
  const AXIS_Y = M.top + 26;
  const DOT_R = 5;

  const ariaLabel = lang === 'ko'
    ? `모델별 실행당 비용 로그 스케일 점 그래프. ${dots.length}개 모델. 프론티어 범위와 중국 오픈웨이트 2개 모델을 표시.`
    : `Log-scale dot plot of median cost per run for ${dots.length} models, with the frontier range band and the two Chinese open-weight models highlighted.`;

  const decades = [0.01, 0.1, 1, 10];

  // Data table: group_stats medians and ranges.
  const dataFallback = (
    <details className={styles.details}>
      <summary>{t(lang, 'showData')}</summary>
      <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={L.title}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{L.metric}</th>
              <th scope="col">{fLabel} {t(lang, 'median')}</th>
              <th scope="col">{fLabel} {L.minMax}</th>
              <th scope="col">{cLabel} {t(lang, 'median')}</th>
              <th scope="col">{cLabel} {L.minMax}</th>
              <th scope="col">{L.ratioCol}</th>
            </tr>
          </thead>
          <tbody>
            {METRICS.map((m) => {
              const f = gs.F[m.key];
              const c = gs.C[m.key];
              return (
                <tr key={m.key}>
                  <th scope="row">{lang === 'ko' ? m.labelKo : m.labelEn}</th>
                  <td className={styles.num}>{fmtGroupValue(m.kind, f.med, lang)}</td>
                  <td className={styles.num}>
                    {fmtGroupValue(m.kind, f.min, lang)}–{fmtGroupValue(m.kind, f.max, lang)}
                  </td>
                  <td className={styles.num}>{fmtGroupValue(m.kind, c.med, lang)}</td>
                  <td className={styles.num}>
                    {fmtGroupValue(m.kind, c.min, lang)}–{fmtGroupValue(m.kind, c.max, lang)}
                  </td>
                  <td className={styles.num}>{(c.med / f.med).toFixed(1)}×</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </details>
  );

  return (
    <Figure
      title={L.title}
      description={L.desc}
      source={L.source}
      dataFallback={dataFallback}
    >
      <div className={styles.tilesHeading}>{L.tilesHeading}</div>
      <ul className={styles.tiles}>
        {tiles.map((tile) => (
          <li key={tile.key} className={styles.tile}>
            <div className={styles.ratio}>{tile.ratio.toFixed(1)}×</div>
            <div className={styles.tileLabel}>{tile.label}</div>
            <div className={styles.tileValues}>
              <span className={styles.tileValue}>
                <span className={styles.valueTag}>{fLabel}</span> {tile.fText}
              </span>
              <span className={styles.tileValue}>
                <span className={styles.valueTag}>{cLabel}</span> {tile.cText}
              </span>
            </div>
          </li>
        ))}
      </ul>

      <div className={styles.stripTitle}>{L.stripTitle}</div>
      <div className={styles.scrollWrap} role="region" tabIndex={0} aria-label={ariaLabel}>
        <svg
          className={styles.svg}
          viewBox={`0 0 ${W} ${AXIS_Y + 44}`}
          preserveAspectRatio="xMidYMid meet"
          role="img"
          aria-labelledby={titleId}
        >
          <title id={titleId}>{ariaLabel}</title>

          {/* Frontier min–max band. */}
          <rect
            x={xFor(fMin)}
            y={AXIS_Y - 10}
            width={Math.max(xFor(fMax) - xFor(fMin), 1)}
            height={20}
            className={styles.band}
            rx="3"
          />

          {/* Axis line + decade ticks. */}
          <line x1={M.left} y1={AXIS_Y} x2={M.left + PLOT_W} y2={AXIS_Y} className={styles.axis} />
          {decades.map((v) => {
            const x = xFor(v);
            return (
              <g key={`d${v}`}>
                <line x1={x} y1={AXIS_Y - 6} x2={x} y2={AXIS_Y + 6} className={styles.tick} />
                <text x={x} y={AXIS_Y + 24} className={styles.tickLabel} textAnchor="middle">
                  {decadeLabel(v)}
                </text>
              </g>
            );
          })}

          {/* Dots on the axis: shape = group, color = vendor, number = rank
              (keyed to the ranked list below so no axis labels can collide). */}
          {dots.map((d, i) => {
            const x = xFor(d.med);
            const color = VENDOR_COLOR[d.vendor] || 'var(--ep-chart-6)';
            const isC = d.group === 'C';
            return (
              <g key={d.key}>
                {isC ? (
                  <rect
                    x={x - DOT_R}
                    y={AXIS_Y - DOT_R}
                    width={DOT_R * 2}
                    height={DOT_R * 2}
                    fill={color}
                    transform={`rotate(45 ${x} ${AXIS_Y})`}
                    stroke="var(--ep-on-surface)"
                    strokeWidth="1.5"
                  />
                ) : (
                  <circle
                    cx={x}
                    cy={AXIS_Y}
                    r={DOT_R}
                    fill={color}
                    stroke="var(--ep-surface-container-lowest)"
                    strokeWidth="1"
                  />
                )}
                <text
                  x={x}
                  y={i % 2 === 0 ? AXIS_Y - 12 : AXIS_Y + 20}
                  className={styles.dotRank}
                  textAnchor="middle"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Ranked list keyed to the dot numbers; overlap-free at any width. */}
      <ol className={styles.rankList}>
        {dots.map((d, i) => {
          const isC = d.group === 'C';
          return (
            <li key={d.key} className={isC ? styles.rankItemC : styles.rankItem}>
              <span className={styles.rankNum}>{i + 1}</span>
              <span className={styles.rankName}>{d.name}</span>
              <span className={styles.rankCost}>{fmt.usd(d.med)}</span>
            </li>
          );
        })}
      </ol>

      {/* Legend: markers for the two groups + frontier band. */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <svg width="16" height="12" aria-hidden="true">
            <circle cx="6" cy="6" r="5" fill="var(--ep-chart-1)" />
          </svg>
          {fLabel}
        </span>
        <span className={styles.legendItem}>
          <svg width="16" height="14" aria-hidden="true">
            <rect x="2" y="2" width="8" height="8" fill="var(--ep-chart-3)"
              transform="rotate(45 6 6)" stroke="var(--ep-on-surface)" strokeWidth="1.5" />
          </svg>
          {cLabel}
        </span>
        <span className={styles.legendItem}>
          <span className={styles.bandSwatch} />
          {L.frontierBand}
        </span>
      </div>

      <p className={styles.takeaway}>
        {L.takeaway(
          (gs.C.cost_usd.med / gs.F.cost_usd.med).toFixed(1),
          Math.round(frontierRatio),
        )}
      </p>
      <p className={styles.caveat}>{L.caveat}</p>
    </Figure>
  );
}
