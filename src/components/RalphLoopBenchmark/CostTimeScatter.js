import React, {useId} from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, fmt, VENDOR_COLOR, groupLabel} from './shared';
import styles from './CostTimeScatter.module.css';

// --- Geometry (user units; the SVG scales via viewBox + width:100%). ---
const W = 720;
const H = 460;
const M = {top: 24, right: 150, bottom: 56, left: 64};
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

// Vendors appear in a stable, data-driven order for the legend.
function vendorsInOrder(models) {
  const seen = [];
  for (const m of models) if (!seen.includes(m.vendor)) seen.push(m.vendor);
  return seen;
}

// Nice linear ticks for the y-axis (run minutes). Deterministic, no deps.
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

// Decade ticks for the log x-axis plus minor (2..9) ticks within each decade.
function logTicks(min, max) {
  const loExp = Math.floor(Math.log10(min));
  const hiExp = Math.ceil(Math.log10(max));
  const major = [];
  const minor = [];
  for (let e = loExp; e <= hiExp; e += 1) {
    major.push(Math.pow(10, e));
    for (let k = 2; k <= 9; k += 1) minor.push(k * Math.pow(10, e));
  }
  return {major, minor, lo: Math.pow(10, loExp), hi: Math.pow(10, hiExp)};
}

function decadeLabel(v) {
  // $0.01, $0.1, $1, $10, $100 ...
  if (v >= 1) return `$${Math.round(v)}`;
  const digits = Math.round(-Math.log10(v));
  return `$${v.toFixed(digits)}`;
}

// Chart-specific titles/descriptions and axis labels. shared.js (agent A) owns
// the common UI strings (source, showData, group labels); these figure-level
// labels are not in that table, so this component keeps its own KO/EN copy
// rather than inventing keys that t() would echo back verbatim.
const LABELS = {
  ko: {
    title: '모델별 실행당 비용과 실행 시간',
    desc: '가로축은 실행당 비용(중앙값, 로그 스케일), 세로축은 실행 시간(분, 중앙값)입니다. 색은 벤더, 모양은 그룹(원=프론티어, 마름모=중국 오픈웨이트)을 나타냅니다. 가는 선은 각 축의 최소~최대 범위입니다.',
    axisCost: '실행당 비용 (USD, 로그 스케일)',
    axisMinutes: '실행 시간 (분)',
    model: '모델',
    vendor: '벤더',
    group: '그룹',
    colCost: '실행당 비용(중앙값)',
    colMinutes: '실행 시간(분, 중앙값)',
  },
  en: {
    title: 'Cost per run versus run time by model',
    desc: 'The x-axis is median cost per run on a log scale; the y-axis is median run time in minutes. Color encodes vendor and marker shape encodes group (circle = frontier, diamond = Chinese open-weight). Thin whiskers show each axis min–max range.',
    axisCost: 'Cost per run (USD, log scale)',
    axisMinutes: 'Run minutes',
    model: 'Model',
    vendor: 'Vendor',
    group: 'Group',
    colCost: 'Cost/run (median)',
    colMinutes: 'Run minutes (median)',
  },
};

export default function RalphCostTimeScatter() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const titleId = `${baseId}-title`;

  // Only models with a measured median cost and run time can be plotted.
  const models = data.models.filter(
    (m) => m.stats && m.stats.cost_usd && m.stats.cost_usd.med != null
      && m.stats.run_minutes && m.stats.run_minutes.med != null,
  );

  const costs = models.map((m) => m.stats.cost_usd.med);
  const mins = models.map((m) => m.stats.run_minutes.med);
  const costMin = Math.min(...costs);
  const costMax = Math.max(...costs);
  const minMax = Math.max(...mins);

  const xAxis = logTicks(costMin, costMax);
  const yAxis = niceLinearTicks(0, minMax, 5);

  const logLo = Math.log10(xAxis.lo);
  const logHi = Math.log10(xAxis.hi);
  const xScale = (v) => M.left + ((Math.log10(v) - logLo) / (logHi - logLo)) * PLOT_W;
  const yScale = (v) => M.top + PLOT_H - ((v - yAxis.lo) / (yAxis.hi - yAxis.lo)) * PLOT_H;

  // Plotted points, each with its screen position and metadata.
  const points = models.map((m) => ({
    key: m.key,
    name: m.name,
    vendor: m.vendor,
    group: m.group,
    cost: m.stats.cost_usd.med,
    costMin: m.stats.cost_usd.min,
    costMax: m.stats.cost_usd.max,
    minutes: m.stats.run_minutes.med,
    minutesMin: m.stats.run_minutes.min,
    minutesMax: m.stats.run_minutes.max,
    cx: xScale(m.stats.cost_usd.med),
    cy: yScale(m.stats.run_minutes.med),
  }));

  // --- Deterministic label collision avoidance. ---
  // Sort by y, assign each label a target y, then push labels apart so no two
  // overlap. Leader lines connect a label back to its point when it moved.
  const LABEL_H = 15;
  const labelOrder = [...points].sort((a, b) => a.cy - b.cy || a.cx - b.cx);
  const minY = M.top + LABEL_H / 2;
  const maxY = M.top + PLOT_H - LABEL_H / 2;
  const placed = [];
  let prevBottom = minY - LABEL_H;
  for (const p of labelOrder) {
    let ly = Math.max(p.cy, prevBottom + LABEL_H);
    if (ly > maxY) ly = maxY;
    placed.push({...p, ly});
    prevBottom = ly;
  }
  // Second pass upward in case the clamp at maxY created overlaps.
  for (let i = placed.length - 2; i >= 0; i -= 1) {
    if (placed[i + 1].ly - placed[i].ly < LABEL_H) {
      placed[i].ly = Math.max(minY, placed[i + 1].ly - LABEL_H);
    }
  }
  const labelX = M.left + PLOT_W + 10;

  const vendors = vendorsInOrder(models);
  const groups = ['F', 'C'].filter((g) => models.some((m) => m.group === g));

  const ariaLabel = lang === 'ko'
    ? `모델별 실행당 비용(로그 축, 가로)과 실행 시간(분, 세로) 산점도. ${models.length}개 모델.`
    : `Scatter plot of cost per run (log x-axis) versus run time in minutes (y-axis) for ${models.length} models.`;

  // Marker renderer: circle for frontier (F), diamond for Chinese open-weight (C).
  function marker(p, r) {
    const color = VENDOR_COLOR[p.vendor] || 'var(--ep-chart-6)';
    if (p.group === 'C') {
      const d = `M ${p.cx} ${p.cy - r} L ${p.cx + r} ${p.cy} L ${p.cx} ${p.cy + r} L ${p.cx - r} ${p.cy} Z`;
      return <path d={d} fill={color} stroke="var(--ep-surface-container-lowest)" strokeWidth="1" />;
    }
    return <circle cx={p.cx} cy={p.cy} r={r} fill={color}
      stroke="var(--ep-surface-container-lowest)" strokeWidth="1" />;
  }

  // Figure prints the "Source:" prefix itself, so this is only the body.
  const first = data.windows_utc.main[0].slice(0, 10);
  const last = data.windows_utc.fable51[1].slice(0, 10);
  const source = lang === 'ko'
    ? `이 보고서의 실측 ${data.totals.runs}회(Amazon Bedrock ${data.region}, ${first}~${last} UTC). 비용은 ${data.price_checked}에 확인한 단가로 계산했습니다.`
    : `This report's ${data.totals.runs} measured runs (Amazon Bedrock ${data.region}, ${first} to ${last} UTC); cost computed at prices checked on ${data.price_checked}.`;

  const dataFallback = (
    <details className={styles.details}>
      <summary>{t(lang, 'showData')}</summary>
      <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={ariaLabel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{L.model}</th>
              <th scope="col">{L.vendor}</th>
              <th scope="col">{L.group}</th>
              <th scope="col">{L.colCost}</th>
              <th scope="col">{L.colMinutes}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((p) => (
              <tr key={p.key}>
                <th scope="row">{p.name}</th>
                <td>{p.vendor}</td>
                <td>{groupLabel(p.group, lang)}</td>
                <td className={styles.num}>{fmt.usd(p.cost)}</td>
                <td className={styles.num}>{fmt.min(p.minutes)}</td>
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

          {/* Y gridlines + ticks (run minutes, linear). */}
          {yAxis.ticks.map((v) => {
            const y = yScale(v);
            return (
              <g key={`y${v}`}>
                <line x1={M.left} y1={y} x2={M.left + PLOT_W} y2={y}
                  className={styles.grid} />
                <text x={M.left - 8} y={y} className={styles.tickLabel}
                  textAnchor="end" dominantBaseline="middle">{fmt.min(v)}</text>
              </g>
            );
          })}

          {/* X minor ticks (log). */}
          {xAxis.minor.filter((v) => v >= xAxis.lo && v <= xAxis.hi).map((v) => (
            <line key={`xm${v}`} x1={xScale(v)} y1={M.top + PLOT_H}
              x2={xScale(v)} y2={M.top + PLOT_H + 4} className={styles.tickMinor} />
          ))}

          {/* X major decade ticks + labels (log). */}
          {xAxis.major.map((v) => {
            const x = xScale(v);
            return (
              <g key={`x${v}`}>
                <line x1={x} y1={M.top} x2={x} y2={M.top + PLOT_H} className={styles.grid} />
                <line x1={x} y1={M.top + PLOT_H} x2={x} y2={M.top + PLOT_H + 7}
                  className={styles.tickMajor} />
                <text x={x} y={M.top + PLOT_H + 20} className={styles.tickLabel}
                  textAnchor="middle">{decadeLabel(v)}</text>
              </g>
            );
          })}

          {/* Axis titles. */}
          <text x={M.left + PLOT_W / 2} y={H - 10} className={styles.axisTitle}
            textAnchor="middle">{L.axisCost}</text>
          <text transform={`translate(16 ${M.top + PLOT_H / 2}) rotate(-90)`}
            className={styles.axisTitle} textAnchor="middle">{L.axisMinutes}</text>

          {/* Min-max whiskers (nice-to-have), drawn behind the markers. */}
          {points.map((p) => (
            <g key={`w${p.key}`} className={styles.whisker}>
              <line x1={xScale(p.costMin)} y1={p.cy} x2={xScale(p.costMax)} y2={p.cy} />
              <line x1={p.cx} y1={yScale(p.minutesMin)} x2={p.cx} y2={yScale(p.minutesMax)} />
            </g>
          ))}

          {/* Leader lines for labels that were pushed off their point. */}
          {placed.map((p) => (
            <line key={`l${p.key}`} x1={p.cx} y1={p.cy} x2={labelX - 4} y2={p.ly}
              className={styles.leader} />
          ))}

          {/* Markers. */}
          {points.map((p) => (
            <g key={`p${p.key}`}>{marker(p, 5)}</g>
          ))}

          {/* Labels (collision-avoided). */}
          {placed.map((p) => (
            <text key={`t${p.key}`} x={labelX} y={p.ly} className={styles.pointLabel}
              dominantBaseline="middle">{p.name}</text>
          ))}
        </svg>
      </div>

      {/* Legend: vendors (color) + groups (shape). */}
      <div className={styles.legend}>
        <div className={styles.legendGroup}>
          {vendors.map((v) => (
            <span key={v} className={styles.legendItem}>
              <span className={styles.swatch} style={{background: VENDOR_COLOR[v] || 'var(--ep-chart-6)'}} />
              {v}
            </span>
          ))}
        </div>
        <div className={styles.legendGroup}>
          {groups.map((g) => (
            <span key={g} className={styles.legendItem}>
              <svg className={styles.shapeIcon} viewBox="0 0 16 16" aria-hidden="true">
                {g === 'C'
                  ? <path d="M8 2 L14 8 L8 14 L2 8 Z" className={styles.shapeFill} />
                  : <circle cx="8" cy="8" r="6" className={styles.shapeFill} />}
              </svg>
              {groupLabel(g, lang)}
            </span>
          ))}
        </div>
      </div>
    </Figure>
  );
}
