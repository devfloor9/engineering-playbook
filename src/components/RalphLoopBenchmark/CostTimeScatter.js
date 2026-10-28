import React, {useId, useState} from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, fmt, VENDOR_COLOR, groupLabel} from './shared';
import styles from './CostTimeScatter.module.css';

// Cost-per-run versus run-time scatter. Visual encoding:
//   color  = vendor (VENDOR_COLOR), shape = group (circle frontier, diamond
//            Chinese open-weight), both repeated 1:1 in the legend;
//   emphasis = the Pareto-optimal models (no other model is cheaper AND
//            faster) are drawn saturated with a ring and a bold label, and a
//            dashed step line joins them; every other model is drawn muted;
//   hover/focus on a point, or on a vendor in the legend, highlights it and
//            dims the rest; the active point also shows its 5-run min–max
//            range on both axes and a tooltip with the numbers.
// The LLM wiki export does not interpret this file (scripts/llm-wiki-ralph.js
// serializes the chart), so it may use any runtime feature.

// --- Geometry (user units; the SVG scales via viewBox + width:100%). ---
const W = 720;
const H = 460;
const M = {top: 24, right: 40, bottom: 56, left: 64};
const PLOT_W = W - M.left - M.right;
const PLOT_H = H - M.top - M.bottom;

// Label metrics for the 12px monospace label font (≈0.6em advance per glyph).
const MARKER_R = 5;
const MARKER_R_HI = 6.5;
const CHAR_W = 7.8; // 0.6em JetBrains Mono = 7.2; extra headroom for font fallback
const CJK_W = 12.6; // Hangul/CJK glyphs fall back to a proportional font (≈1em)
const LABEL_H = 14;
const GAP = 4; // breathing room between a label box and anything else

/** Approximate rendered width of a 12px string, counting CJK glyphs as 1em. */
function textWidth(s) {
  let w = 0;
  for (const ch of String(s)) w += ch.codePointAt(0) > 0x2e7f ? CJK_W : CHAR_W;
  return w;
}

function labelBox(lx, ly, w, anchor) {
  const x0 = anchor === 'end' ? lx - w : anchor === 'middle' ? lx - w / 2 : lx;
  return {x0, x1: x0 + w, y0: ly - LABEL_H / 2, y1: ly + LABEL_H / 2};
}

function overlaps(a, b) {
  return a.x0 < b.x1 + GAP && b.x0 < a.x1 + GAP && a.y0 < b.y1 + GAP && b.y0 < a.y1 + GAP;
}

// Candidate placements relative to the marker: [dx, dy, anchor].
// Order matters: nearest, most natural positions first.
function candidates() {
  const d = MARKER_R_HI + 5;
  const v = LABEL_H / 2 + MARKER_R_HI + 3;
  const out = [
    [d, 0, 'start'], [-d, 0, 'end'], [0, -v, 'middle'], [0, v, 'middle'],
    [d - 2, -v + 2, 'start'], [d - 2, v - 2, 'start'],
    [-d + 2, -v + 2, 'end'], [-d + 2, v - 2, 'end'],
  ];
  // Farther rings (these get a short connector line back to the marker).
  for (const r of [1.8, 2.6, 3.4]) {
    out.push([d * r, -v * r * 0.8, 'start'], [d * r, v * r * 0.8, 'start'],
      [-d * r, -v * r * 0.8, 'end'], [-d * r, v * r * 0.8, 'end'],
      [0, -v * r, 'middle'], [0, v * r, 'middle']);
  }
  return out;
}

function placeLabels(points, obstacles = []) {
  // Labels may run into the right margin (up to the SVG edge), not past it.
  const bounds = {x0: M.left + 2, x1: W - 2, y0: M.top + 2, y1: M.top + PLOT_H - 2};
  const r = MARKER_R_HI + 3; // keep clear of the frontier ring too
  const markerBoxes = points.map((p) => ({
    key: p.key, x0: p.cx - r, x1: p.cx + r, y0: p.cy - r, y1: p.cy + r,
  }));
  // Crowding = number of other markers within 60 units; most crowded first.
  const crowd = (p) => points.filter((q) => q !== p && Math.hypot(q.cx - p.cx, q.cy - p.cy) < 60).length;
  const order = [...points].sort((a, b) => crowd(b) - crowd(a) || a.cy - b.cy || a.cx - b.cx);
  // Obstacles (e.g. the frontier line's segments) count as already-taken boxes.
  const taken = [...obstacles];
  const result = new Map();
  const cands = candidates();
  // Distance from a marker center to the nearest point of a label box.
  const distToBox = (x, y, b) => Math.hypot(Math.max(b.x0 - x, 0, x - b.x1), Math.max(b.y0 - y, 0, y - b.y1));
  for (const p of order) {
    const w = textWidth(p.name);
    const others = points.filter((q) => q.key !== p.key);
    let best = null;
    // Pass 1 also demands clear ownership: no other marker may be nearly as
    // close to the label as its own marker, or the label reads as that
    // marker's. Pass 2 drops that rule when nothing satisfies it.
    for (const strict of [true, false]) {
      for (let i = 0; i < cands.length && !best; i += 1) {
        const [dx, dy, anchor] = cands[i];
        const lx = p.cx + dx;
        const ly = p.cy + dy;
        const box = labelBox(lx, ly, w, anchor);
        if (box.x0 < bounds.x0 || box.x1 > bounds.x1 || box.y0 < bounds.y0 || box.y1 > bounds.y1) continue;
        if (taken.some((t) => overlaps(box, t))) continue;
        if (markerBoxes.some((m) => m.key !== p.key && overlaps(box, m))) continue;
        if (strict && others.length) {
          const own = distToBox(p.cx, p.cy, box);
          const nearestOther = Math.min(...others.map((q) => distToBox(q.cx, q.cy, box)));
          if (nearestOther < own + 10) continue;
        }
        best = {lx, ly, anchor, box, far: i >= 8};
      }
      if (best) break;
    }
    if (!best) {
      // Last resort: keep the label right of the marker, clamped into the plot.
      const anchor = p.cx + w + 12 > bounds.x1 ? 'end' : 'start';
      const lx = anchor === 'end' ? p.cx - 10 : p.cx + 10;
      best = {lx, ly: p.cy, anchor, box: labelBox(lx, p.cy, w, anchor), far: false};
    }
    taken.push(best.box);
    // Connector ends at the label box edge nearest the marker.
    const connector = best.far ? {
      x: Math.min(Math.max(p.cx, best.box.x0), best.box.x1),
      y: Math.min(Math.max(p.cy, best.box.y0), best.box.y1),
    } : null;
    result.set(p.key, {...p, lx: best.lx, ly: best.ly, anchor: best.anchor, connector});
  }
  return points.map((p) => result.get(p.key));
}

/**
 * Pareto-optimal points for "lower cost AND lower time": walking the points
 * from cheapest to most expensive, a point is on the frontier when it is
 * faster than every cheaper point. Returned in cost order.
 */
function paretoFrontier(points) {
  const sorted = [...points].sort((a, b) => a.cost - b.cost || a.minutes - b.minutes);
  const out = [];
  let fastest = Infinity;
  for (const p of sorted) {
    if (p.minutes < fastest) {
      out.push(p);
      fastest = p.minutes;
    }
  }
  return out;
}

/** Step path through the frontier points: across at the slower time, then down. */
function frontierPath(frontier) {
  if (frontier.length < 2) return null;
  let d = `M ${frontier[0].cx} ${frontier[0].cy}`;
  for (let i = 1; i < frontier.length; i += 1) {
    d += ` H ${frontier[i].cx} V ${frontier[i].cy}`;
  }
  return d;
}

/** Thin boxes around each horizontal/vertical frontier segment, used to keep labels off the line. */
function frontierBoxes(frontier) {
  const pad = 3;
  const boxes = [];
  for (let i = 1; i < frontier.length; i += 1) {
    const a = frontier[i - 1];
    const b = frontier[i];
    boxes.push({x0: Math.min(a.cx, b.cx) - pad, x1: Math.max(a.cx, b.cx) + pad, y0: a.cy - pad, y1: a.cy + pad});
    boxes.push({x0: b.cx - pad, x1: b.cx + pad, y0: Math.min(a.cy, b.cy) - pad, y1: Math.max(a.cy, b.cy) + pad});
  }
  return boxes;
}

// Vendors appear in a stable, data-driven order for the legend, each with the
// set of groups its models belong to (normally exactly one).
function vendorsInOrder(models) {
  const out = [];
  for (const m of models) {
    let v = out.find((x) => x.vendor === m.vendor);
    if (!v) {
      v = {vendor: m.vendor, groups: []};
      out.push(v);
    }
    if (!v.groups.includes(m.group)) v.groups.push(m.group);
  }
  return out;
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

// Chart-specific titles/descriptions and axis labels. shared.js owns the
// common UI strings (source, showData, group labels); these figure-level
// labels are not in that table, so this component keeps its own KO/EN copy.
const LABELS = {
  ko: {
    title: '모델별 실행당 비용과 실행 시간',
    desc: '가로축은 실행당 비용(중앙값, 로그 스케일), 세로축은 실행 시간(분, 중앙값)입니다. 색은 개발사, 모양은 그룹(원=프론티어, 마름모=중국 오픈웨이트)입니다. 테두리가 있는 큰 점은 파레토 최적 모델, 즉 비용과 시간이 모두 더 낮은 모델이 없는 모델이고, 점선은 이 모델들을 잇는 파레토 경계입니다. 점이나 범례의 개발사를 가리키면 해당 모델이 강조되고, 점을 가리키면 5회 실행의 최소–최대 범위와 값이 표시됩니다.',
    axisCost: '실행당 비용 (USD, 로그 스케일)',
    axisMinutes: '실행 시간 (분)',
    model: '모델',
    vendor: '개발사',
    group: '그룹',
    pareto: '파레토 최적',
    colCost: '실행당 비용(중앙값)',
    colMinutes: '실행 시간(분, 중앙값)',
    legendFrontierLine: '파레토 경계',
    legendFrontierPoint: '파레토 최적 모델',
    legendOther: '그 외 모델',
    legendHint: '개발사를 누르면 해당 모델만 강조합니다.',
    tipCost: '비용',
    tipMinutes: '시간',
    tipRange: '5회 범위',
    minutes: '분',
    yes: '예',
    no: '아니요',
  },
  en: {
    title: 'Cost per run versus run time by model',
    desc: 'The x-axis is median cost per run on a log scale; the y-axis is median run time in minutes. Color encodes vendor and marker shape encodes group (circle = frontier, diamond = Chinese open-weight). The large ringed points are the Pareto-optimal models, meaning no other model is both cheaper and faster, and the dashed step line is the Pareto frontier that joins them. Hover or focus a point, or a vendor in the legend, to highlight it; the active point also shows its five-run min–max range and the numbers.',
    axisCost: 'Cost per run (USD, log scale)',
    axisMinutes: 'Run minutes',
    model: 'Model',
    vendor: 'Vendor',
    group: 'Group',
    pareto: 'Pareto-optimal',
    colCost: 'Cost/run (median)',
    colMinutes: 'Run minutes (median)',
    legendFrontierLine: 'Pareto frontier',
    legendFrontierPoint: 'Pareto-optimal model',
    legendOther: 'Other models',
    legendHint: 'Click a vendor to highlight only its models.',
    tipCost: 'Cost',
    tipMinutes: 'Time',
    tipRange: '5-run range',
    minutes: 'min',
    yes: 'yes',
    no: 'no',
  },
};

/** Marker shape at (cx, cy): circle for frontier (F), diamond for Chinese open-weight (C). */
function markerShape(group, cx, cy, r, props) {
  if (group === 'C') {
    const d = `M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`;
    return <path d={d} {...props} />;
  }
  return <circle cx={cx} cy={cy} r={r} {...props} />;
}

export default function RalphCostTimeScatter() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const titleId = `${baseId}-title`;

  // Interaction state. `active` is the hovered/focused model key; a vendor can
  // be pinned by clicking it in the legend and previewed by hovering it.
  const [active, setActive] = useState(null);
  const [hoverVendor, setHoverVendor] = useState(null);
  const [pinnedVendor, setPinnedVendor] = useState(null);
  const vendorFilter = hoverVendor || pinnedVendor;

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

  const frontier = paretoFrontier(points);
  const frontierKeys = new Set(frontier.map((p) => p.key));
  const frontierD = frontierPath(frontier);

  // --- Deterministic direct labelling (no long leader lines). ---
  // Each label is placed right beside its own marker. Candidate positions are
  // tried in a fixed order (right, left, above, below, then the diagonals and
  // farther offsets) and the first one that stays inside the plot and does not
  // overlap an already-placed label or any marker wins. Only when a label had
  // to move away from its marker is a short connector drawn. Labels are placed
  // densest-first so crowded clusters get the best positions. The frontier
  // line's segments are obstacles too, so no label sits on the dashed line.
  const placed = placeLabels(points, frontierBoxes(frontier));

  // Emphasis per point: 'hi' (saturated, large), 'base' (muted) or 'dim'
  // (faded because something else is highlighted).
  const emphasis = (p) => {
    if (active) return p.key === active ? 'hi' : 'dim';
    if (vendorFilter) return p.vendor === vendorFilter ? 'hi' : 'dim';
    return frontierKeys.has(p.key) ? 'hi' : 'base';
  };

  const vendors = vendorsInOrder(models);
  const color = (vendor) => VENDOR_COLOR[vendor] || 'var(--ep-chart-6)';

  const ariaLabel = lang === 'ko'
    ? `모델별 실행당 비용(로그 축, 가로)과 실행 시간(분, 세로) 산점도. ${models.length}개 모델. 파레토 최적: ${frontier.map((p) => p.name).join(', ')}.`
    : `Scatter plot of cost per run (log x-axis) versus run time in minutes (y-axis) for ${models.length} models. Pareto-optimal: ${frontier.map((p) => p.name).join(', ')}.`;

  const pointLabel = (p) => {
    const cost = `${fmt.usd(p.cost)} (${fmt.usd(p.costMin)}\u2013${fmt.usd(p.costMax)})`;
    const minutes = `${fmt.min(p.minutes)} (${fmt.min(p.minutesMin)}\u2013${fmt.min(p.minutesMax)}) ${L.minutes}`;
    return `${p.name}, ${p.vendor}, ${groupLabel(p.group, lang)}. ${L.tipCost} ${cost}. ${L.tipMinutes} ${minutes}.`;
  };

  // Tooltip for the active point, kept inside the SVG so it scales with it.
  const activePoint = active ? points.find((p) => p.key === active) : null;
  let tooltip = null;
  if (activePoint) {
    const p = activePoint;
    const lines = [
      p.name,
      `${p.vendor} \u00b7 ${groupLabel(p.group, lang)}${frontierKeys.has(p.key) ? ` \u00b7 ${L.pareto}` : ''}`,
      `${L.tipCost}: ${fmt.usd(p.cost)}  (${L.tipRange} ${fmt.usd(p.costMin)}\u2013${fmt.usd(p.costMax)})`,
      `${L.tipMinutes}: ${fmt.min(p.minutes)} ${L.minutes}  (${L.tipRange} ${fmt.min(p.minutesMin)}\u2013${fmt.min(p.minutesMax)})`,
    ];
    const pad = 10;
    const lineH = 17;
    const w = Math.max(...lines.map(textWidth)) + pad * 2;
    const h = lines.length * lineH + pad * 2 - 4;
    const gap = MARKER_R_HI + 12;
    const clampY = (y) => Math.max(M.top, Math.min(y, M.top + PLOT_H - h));
    const clampX = (x) => Math.max(M.left, Math.min(x, W - 2 - w));
    // Try right, left, below, above of the marker; prefer a spot that fits
    // inside the drawing and does not cover the model's own label.
    const label = placed.find((q) => q.key === p.key);
    const labelBoxA = label ? labelBox(label.lx, label.ly, textWidth(label.name), label.anchor) : null;
    const options = [
      {x: p.cx + gap, y: clampY(p.cy - h / 2)},
      {x: p.cx - gap - w, y: clampY(p.cy - h / 2)},
      {x: clampX(p.cx - w / 2), y: p.cy + gap},
      {x: clampX(p.cx - w / 2), y: p.cy - gap - h},
    ];
    const fits = (o) => o.x >= M.left && o.x + w <= W - 2 && o.y >= M.top && o.y + h <= M.top + PLOT_H;
    const clear = (o) => !labelBoxA || !overlaps({x0: o.x, x1: o.x + w, y0: o.y, y1: o.y + h}, labelBoxA);
    const spot = options.find((o) => fits(o) && clear(o)) || options.find(fits)
      || {x: clampX(p.cx + gap), y: clampY(p.cy - h / 2)};
    tooltip = {x: spot.x, y: spot.y, w, h, lines, pad, lineH, color: color(p.vendor)};
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
              <th scope="col">{L.pareto}</th>
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
                <td>{frontierKeys.has(p.key) ? L.yes : L.no}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );

  const clearActive = () => setActive(null);

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
          role="group"
          aria-labelledby={titleId}
          onMouseLeave={clearActive}
          onKeyDown={(e) => { if (e.key === 'Escape') clearActive(); }}
        >
          <title id={titleId}>{ariaLabel}</title>

          {/* Plot background: a tap/click here clears a touch-selected point. */}
          <rect x={M.left} y={M.top} width={PLOT_W} height={PLOT_H} className={styles.plotBg}
            onClick={clearActive} />

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

          {/* Pareto frontier: a dashed step line through the Pareto-optimal models. */}
          {frontierD && (
            <path d={frontierD} className={`${styles.frontierLine} ${active || vendorFilter ? styles.dim : ''}`} />
          )}

          {/* Min–max range of the active model only, in its vendor color. */}
          {activePoint && (
            <g className={styles.rangeActive} style={{color: tooltip.color}}>
              <line x1={xScale(activePoint.costMin)} y1={activePoint.cy}
                x2={xScale(activePoint.costMax)} y2={activePoint.cy} />
              <line x1={xScale(activePoint.costMin)} y1={activePoint.cy - 4}
                x2={xScale(activePoint.costMin)} y2={activePoint.cy + 4} />
              <line x1={xScale(activePoint.costMax)} y1={activePoint.cy - 4}
                x2={xScale(activePoint.costMax)} y2={activePoint.cy + 4} />
              <line x1={activePoint.cx} y1={yScale(activePoint.minutesMin)}
                x2={activePoint.cx} y2={yScale(activePoint.minutesMax)} />
              <line x1={activePoint.cx - 4} y1={yScale(activePoint.minutesMin)}
                x2={activePoint.cx + 4} y2={yScale(activePoint.minutesMin)} />
              <line x1={activePoint.cx - 4} y1={yScale(activePoint.minutesMax)}
                x2={activePoint.cx + 4} y2={yScale(activePoint.minutesMax)} />
            </g>
          )}

          {/* Short connectors, only for labels displaced from their marker. */}
          {placed.filter((p) => p.connector).map((p) => (
            <line key={`l${p.key}`} x1={p.cx} y1={p.cy} x2={p.connector.x} y2={p.connector.y}
              className={`${styles.leader} ${emphasis(p) === 'dim' ? styles.dim : ''}`} />
          ))}

          {/* Markers: muted by default, saturated + ringed when emphasized. */}
          {points.map((p) => {
            const e = emphasis(p);
            const c = color(p.vendor);
            const r = e === 'hi' ? MARKER_R_HI : MARKER_R;
            const cls = `${styles.marker} ${e === 'hi' ? styles.markerHi : e === 'dim' ? styles.dim : styles.markerBase}`;
            return (
              <g key={`p${p.key}`} className={cls} style={{color: c}}>
                {e === 'hi' && markerShape(p.group, p.cx, p.cy, r + 4, {className: styles.ring})}
                {markerShape(p.group, p.cx, p.cy, r, {className: styles.markerFill})}
              </g>
            );
          })}

          {/* Labels: a surface-colored halo keeps text legible over grid and lines. */}
          {placed.map((p) => {
            const e = emphasis(p);
            const cls = `${styles.pointLabel} ${e === 'hi' ? styles.pointLabelHi : e === 'dim' ? styles.dim : ''}`;
            return (
              <text key={`t${p.key}`} x={p.lx} y={p.ly} className={cls}
                textAnchor={p.anchor} dominantBaseline="middle">{p.name}</text>
            );
          })}

          {/* Invisible, larger hit targets drawn last so they win pointer events.
              Each is focusable and describes its model for assistive tech. */}
          {points.map((p) => (
            <circle
              key={`h${p.key}`}
              cx={p.cx}
              cy={p.cy}
              r={14}
              className={styles.hit}
              tabIndex={0}
              role="img"
              aria-label={pointLabel(p)}
              onMouseEnter={() => setActive(p.key)}
              onMouseLeave={clearActive}
              onFocus={() => setActive(p.key)}
              onBlur={clearActive}
              onClick={(e) => { e.stopPropagation(); setActive(p.key); }}
            />
          ))}

          {/* Tooltip for the active point. */}
          {tooltip && (
            <g className={styles.tooltip} transform={`translate(${tooltip.x} ${tooltip.y})`}>
              <rect width={tooltip.w} height={tooltip.h} rx="6" ry="6" className={styles.tooltipBox} />
              <rect width="4" height={tooltip.h} rx="2" ry="2" fill={tooltip.color} />
              {tooltip.lines.map((line, i) => (
                <text key={i} x={tooltip.pad + 2} y={tooltip.pad + tooltip.lineH * i + 10}
                  className={i === 0 ? styles.tooltipTitle : styles.tooltipText}>{line}</text>
              ))}
            </g>
          )}
        </svg>
      </div>

      {/* Legend. Vendor items use the same marker shape and color as the plot;
          clicking a vendor pins the highlight, hovering previews it. */}
      <div className={styles.legend}>
        <div className={styles.legendGroup} role="group" aria-label={L.vendor}>
          {vendors.map(({vendor, groups}) => {
            const pressed = pinnedVendor === vendor;
            return (
              <button
                key={vendor}
                type="button"
                className={styles.legendBtn}
                aria-pressed={pressed}
                style={{color: color(vendor)}}
                onMouseEnter={() => setHoverVendor(vendor)}
                onMouseLeave={() => setHoverVendor(null)}
                onFocus={() => setHoverVendor(vendor)}
                onBlur={() => setHoverVendor(null)}
                onClick={() => setPinnedVendor(pressed ? null : vendor)}
              >
                {groups.map((g) => (
                  <svg key={g} className={styles.legendIcon} viewBox="0 0 20 20" aria-hidden="true">
                    {markerShape(g, 10, 10, 6, {className: styles.legendMarker})}
                  </svg>
                ))}
                <span className={styles.legendText}>{vendor}</span>
                <span className={styles.legendSub}>{groups.map((g) => groupLabel(g, lang)).join(' / ')}</span>
              </button>
            );
          })}
        </div>
        <div className={styles.legendGroup}>
          <span className={styles.legendItem}>
            <svg className={styles.legendIcon} viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="9" className={styles.legendRing} />
              <circle cx="10" cy="10" r="5.5" className={styles.legendNeutral} />
            </svg>
            {L.legendFrontierPoint}
          </span>
          <span className={styles.legendItem}>
            <svg className={styles.legendIcon} viewBox="0 0 20 20" aria-hidden="true">
              <path d="M2 14 H10 V6 H18" className={styles.legendDash} />
            </svg>
            {L.legendFrontierLine}
          </span>
          <span className={styles.legendItem}>
            <svg className={styles.legendIcon} viewBox="0 0 20 20" aria-hidden="true">
              <circle cx="10" cy="10" r="4.5" className={styles.legendNeutralMuted} />
            </svg>
            {L.legendOther}
          </span>
        </div>
        <span className={styles.legendHint}>{L.legendHint}</span>
      </div>
    </Figure>
  );
}
