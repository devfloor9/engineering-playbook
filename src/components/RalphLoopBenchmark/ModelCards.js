// RalphModelCards: pick up to three models (search by vendor or model name)
// and compare them side by side, one column per model and one row per field.
// Replaces the former grid of fourteen stand-alone cards, which could not be
// read as a comparison. Renders without props and is SSR-safe: the default
// selection is computed from the data, and nothing touches window/document.
//
// The LLM wiki export does not interpret this file; scripts/llm-wiki-ralph.js
// serializes every model from the same data file instead.
import React, {useId, useMemo, useState} from 'react';
import {data, useLang, t, fmt, VENDOR_COLOR, groupLabel} from './shared';
import styles from './ModelCards.module.css';

const MAX_SELECTED = 3;
const X = '\u00d7';

const LABELS = {
  ko: {
    searchLabel: '개발사 또는 모델명 검색',
    searchPlaceholder: '예: OpenAI, Claude, Kimi',
    pickTitle: '비교할 모델 선택',
    selected: (n) => `${n}/${MAX_SELECTED}개 선택`,
    hintFull: `${MAX_SELECTED}개가 선택되어 있습니다. 하나를 해제하면 다른 모델을 추가할 수 있습니다.`,
    hint: `최대 ${MAX_SELECTED}개까지 나란히 비교합니다. 처음에는 개발사 순서대로 각 개발사의 첫 모델 ${MAX_SELECTED}개가 선택되어 있습니다.`,
    noMatch: (q) => `"${q}"에 맞는 모델이 없습니다.`,
    empty: '비교할 모델을 위에서 선택하세요.',
    remove: (name) => `${name} 제거`,
    field: '항목',
    best: '최적',
    bestNote: '"최적"은 선택한 모델 중 가장 좋은 값(비용·시간·토큰·요청은 낮을수록, 완주는 높을수록)입니다. 값은 완주한 run의 중앙값이고 괄호 안은 최소–최대입니다.',
    vendorGroup: '개발사 · 그룹',
    modelId: 'Bedrock 모델 ID',
    iterationsNote: '반복 횟수는 run 순서대로이며 ×는 미완주 run입니다.',
    rankOf: (rank, total) => `${total}개 중 ${rank}위 (낮은 순)`,
    unit: {min: '분'},
    note: '비고',
    clear: '모두 해제',
  },
  en: {
    searchLabel: 'Search by vendor or model name',
    searchPlaceholder: 'e.g. OpenAI, Claude, Kimi',
    pickTitle: 'Choose models to compare',
    selected: (n) => `${n} of ${MAX_SELECTED} selected`,
    hintFull: `${MAX_SELECTED} models are selected. Deselect one to add another.`,
    hint: `Compare up to ${MAX_SELECTED} models side by side. Initially the first model of each of the first ${MAX_SELECTED} vendors is selected.`,
    noMatch: (q) => `No model matches "${q}".`,
    empty: 'Select models above to compare them.',
    remove: (name) => `Remove ${name}`,
    field: 'Field',
    best: 'best',
    bestNote: '"best" marks the best value among the selected models (lower is better for cost, time, tokens and requests; higher for completed runs). Values are medians over completed runs, with the minimum–maximum in parentheses.',
    vendorGroup: 'Vendor · group',
    modelId: 'Bedrock model ID',
    iterationsNote: 'Iterations are listed in run order; × marks a run that did not complete.',
    rankOf: (rank, total) => `${rank} of ${total} (1 = cheapest)`,
    unit: {min: ' min'},
    note: 'Note',
    clear: 'Clear all',
  },
};

/** Default selection: the first model of each vendor in data order, up to MAX_SELECTED. */
function defaultSelection() {
  const seen = new Set();
  const out = [];
  for (const m of data.models) {
    if (seen.has(m.vendor)) continue;
    seen.add(m.vendor);
    out.push(m.key);
    if (out.length === MAX_SELECTED) break;
  }
  return out;
}

/** Case- and whitespace-insensitive match on vendor, model name or Bedrock model ID. */
function matches(model, query) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [model.name, model.vendor, model.model_id].some((s) => String(s).toLowerCase().includes(q));
}

/**
 * Render a note string that may contain backtick-quoted code spans
 * (e.g. "set `PORT` first") as text with real <code> elements. Odd-indexed
 * segments after splitting on backticks are the quoted code.
 */
function renderNote(text) {
  const parts = String(text).split('`');
  return parts.map((part, i) =>
    i % 2 === 1
      ? <code key={i}>{part}</code>
      : <React.Fragment key={i}>{part}</React.Fragment>,
  );
}

/** "median (min–max)" for a {med,min,max} stat, or × when there is no median. */
function medRange(stat, format) {
  if (!stat || stat.med == null) return X;
  const med = format(stat.med);
  if (stat.min == null || stat.max == null) return med;
  return `${med} (${format(stat.min)}\u2013${format(stat.max)})`;
}

/** Group marker: circle for frontier (F), diamond for Chinese open-weight (C). */
function GroupMark({group, color}) {
  return (
    <svg className={styles.mark} viewBox="0 0 12 12" aria-hidden="true">
      {group === 'C'
        ? <path d="M6 1 L11 6 L6 11 L1 6 Z" fill={color} />
        : <circle cx="6" cy="6" r="5" fill={color} />}
    </svg>
  );
}

function vendorColor(vendor) {
  return VENDOR_COLOR[vendor] || 'var(--ep-chart-6)';
}

/**
 * Comparison rows. `value(m)` returns the display string; `metric(m)` returns
 * the number used for the "best" mark and the proportional bar (null = none);
 * `better` says which direction wins.
 */
function buildRows(lang, L, total) {
  const intFmt = (v) => fmt.int(v, lang);
  const minFmt = (v) => `${fmt.min(v)}${L.unit.min}`;
  const med = (m, key) => (m.stats[key] && m.stats[key].med != null ? m.stats[key].med : null);
  return [
    {
      key: 'vendor',
      label: L.vendorGroup,
      value: (m) => `${m.vendor} \u00b7 ${groupLabel(m.group, lang)}`,
    },
    {
      key: 'model_id',
      label: L.modelId,
      value: (m) => m.model_id,
      mono: true,
    },
    {
      key: 'cost_usd',
      label: t(lang, 'cost'),
      value: (m) => medRange(m.stats.cost_usd, fmt.usd),
      metric: (m) => med(m, 'cost_usd'),
      better: 'low',
      bar: true,
    },
    {
      key: 'cost_rank',
      label: t(lang, 'costRank'),
      value: (m) => L.rankOf(fmt.int(m.cost_rank, lang), fmt.int(total, lang)),
      metric: (m) => m.cost_rank,
      better: 'low',
    },
    {
      key: 'run_minutes',
      label: t(lang, 'runMinutes'),
      value: (m) => medRange(m.stats.run_minutes, minFmt),
      metric: (m) => med(m, 'run_minutes'),
      better: 'low',
      bar: true,
    },
    {
      key: 'output_tokens',
      label: t(lang, 'outputTokens'),
      value: (m) => medRange(m.stats.output_tokens, intFmt),
      metric: (m) => med(m, 'output_tokens'),
      better: 'low',
      bar: true,
    },
    {
      key: 'total_tokens',
      label: t(lang, 'totalTokens'),
      value: (m) => medRange(m.stats.total_tokens, intFmt),
      metric: (m) => med(m, 'total_tokens'),
      better: 'low',
      bar: true,
    },
    {
      key: 'cache_read_tokens',
      label: t(lang, 'cacheReadTokens'),
      value: (m) => medRange(m.stats.cache_read_tokens, intFmt),
      metric: (m) => med(m, 'cache_read_tokens'),
      bar: true,
    },
    {
      key: 'llm_requests',
      label: t(lang, 'llmRequests'),
      value: (m) => {
        const s = m.stats;
        const llm = med(m, 'llm_requests');
        const br = med(m, 'builder_requests');
        const vr = med(m, 'verifier_requests');
        const parts = [llm == null ? X : intFmt(llm)];
        parts.push(`(${t(lang, 'builder')} ${br == null ? X : intFmt(br)} / ${t(lang, 'verifier')} ${vr == null ? X : intFmt(vr)})`);
        return s ? parts.join(' ') : X;
      },
      metric: (m) => med(m, 'llm_requests'),
      better: 'low',
      bar: true,
    },
    {
      key: 'completed',
      label: t(lang, 'completed'),
      value: (m) => `${fmt.int(m.completed, lang)}/${fmt.int(m.runs, lang)}`,
      metric: (m) => (m.runs ? m.completed / m.runs : null),
      better: 'high',
    },
    {
      key: 'iterations',
      label: t(lang, 'iterations'),
      value: (m) => (Array.isArray(m.iterations)
        ? m.iterations.map((v) => (v == null ? X : v)).join(', ')
        : X),
    },
    {
      key: 'verifier_cost_share',
      label: t(lang, 'verifierCostShare'),
      value: (m) => (m.verifier_cost_share != null ? fmt.pct(m.verifier_cost_share) : X),
    },
    {
      key: 'note',
      label: L.note,
      value: (m) => {
        const note = m.note && (m.note[lang] || m.note.en);
        return note ? renderNote(note) : null;
      },
      prose: true,
    },
  ];
}

/** Index of the best metric among the selected models, or -1 when there is no clear winner. */
function bestIndex(values, better) {
  if (!better) return -1;
  const nums = values.filter((v) => v != null);
  if (nums.length < 2) return -1;
  const target = better === 'low' ? Math.min(...nums) : Math.max(...nums);
  if (Math.min(...nums) === Math.max(...nums)) return -1; // all equal: nothing to mark
  return values.indexOf(target);
}

export default function RalphModelCards() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;
  const uid = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const searchId = `${uid}-search`;
  const [query, setQuery] = useState('');
  const [selectedKeys, setSelectedKeys] = useState(defaultSelection);

  const byKey = useMemo(() => new Map(data.models.map((m) => [m.key, m])), []);
  const total = data.models.length;
  const selected = selectedKeys.map((k) => byKey.get(k)).filter(Boolean);
  const full = selected.length >= MAX_SELECTED;

  // Vendor groups in data order, each with the models that match the query.
  const vendorGroups = useMemo(() => {
    const groups = [];
    for (const m of data.models) {
      if (!matches(m, query)) continue;
      let g = groups.find((x) => x.vendor === m.vendor);
      if (!g) {
        g = {vendor: m.vendor, models: []};
        groups.push(g);
      }
      g.models.push(m);
    }
    return groups;
  }, [query]);

  const toggle = (key) => {
    setSelectedKeys((prev) => {
      if (prev.includes(key)) return prev.filter((k) => k !== key);
      if (prev.length >= MAX_SELECTED) return prev;
      return [...prev, key];
    });
  };

  const rows = useMemo(() => buildRows(lang, L, total), [lang, L, total]);

  return (
    <section className={styles.wrap} aria-label={L.pickTitle}>
      {/* Picker: search box, selection counter, vendor-grouped toggle chips. */}
      <div className={styles.picker}>
        <div className={styles.searchRow}>
          <label className={styles.searchLabel} htmlFor={searchId}>{L.searchLabel}</label>
          <input
            id={searchId}
            className={styles.search}
            type="search"
            value={query}
            placeholder={L.searchPlaceholder}
            autoComplete="off"
            onChange={(e) => setQuery(e.target.value)}
          />
          <span className={styles.count} aria-live="polite">{L.selected(selected.length)}</span>
          {selected.length > 0 && (
            <button type="button" className={styles.clear} onClick={() => setSelectedKeys([])}>
              {L.clear}
            </button>
          )}
        </div>
        <p className={styles.hint}>{full ? L.hintFull : L.hint}</p>

        {vendorGroups.length === 0 ? (
          <p className={styles.noMatch}>{L.noMatch(query.trim())}</p>
        ) : (
          <div className={styles.vendorGroups}>
            {vendorGroups.map((g) => {
              const color = vendorColor(g.vendor);
              return (
                <div key={g.vendor} className={styles.vendorGroup} style={{'--chip-accent': color}}>
                  <div className={styles.vendorName}>
                    <span className={styles.vendorDot} aria-hidden="true" />
                    {g.vendor}
                    <span className={styles.vendorGroupLabel}>{groupLabel(g.models[0].group, lang)}</span>
                  </div>
                  <div className={styles.chips}>
                    {g.models.map((m) => {
                      const on = selectedKeys.includes(m.key);
                      return (
                        <button
                          key={m.key}
                          type="button"
                          className={styles.chip}
                          aria-pressed={on}
                          disabled={!on && full}
                          onClick={() => toggle(m.key)}
                          title={m.model_id}
                        >
                          <GroupMark group={m.group} color={color} />
                          <span>{m.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comparison: one column per selected model, one row per field. */}
      {selected.length === 0 ? (
        <p className={styles.empty}>{L.empty}</p>
      ) : (
        <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={L.pickTitle}>
          <table className={styles.table} style={{'--cols': selected.length}}>
            <thead>
              <tr>
                <th scope="col" className={styles.fieldHead}>{L.field}</th>
                {selected.map((m) => {
                  const color = vendorColor(m.vendor);
                  return (
                    <th key={m.key} scope="col" className={styles.modelHead} style={{'--col-accent': color}}>
                      <div className={styles.modelHeadInner}>
                        <span className={styles.modelName}>
                          <GroupMark group={m.group} color={color} />
                          {m.name}
                        </span>
                        <button
                          type="button"
                          className={styles.remove}
                          aria-label={L.remove(m.name)}
                          onClick={() => toggle(m.key)}
                        >
                          {X}
                        </button>
                      </div>
                      <div className={styles.modelVendor}>{m.vendor}</div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const metrics = row.metric ? selected.map((m) => row.metric(m)) : null;
                const best = metrics ? bestIndex(metrics, row.better) : -1;
                const max = metrics && row.bar ? Math.max(...metrics.filter((v) => v != null)) : null;
                return (
                  <tr key={row.key}>
                    <th scope="row" className={styles.fieldCell}>{row.label}</th>
                    {selected.map((m, i) => {
                      const content = row.value(m);
                      const isBest = i === best;
                      const classes = [styles.cell];
                      if (row.mono) classes.push(styles.mono);
                      if (row.prose) classes.push(styles.prose);
                      if (isBest) classes.push(styles.best);
                      const v = metrics ? metrics[i] : null;
                      const pct = max && v != null && max > 0 ? Math.max((v / max) * 100, 1.5) : null;
                      return (
                        <td key={m.key} className={classes.join(' ')}>
                          <span className={styles.cellValue}>
                            {content == null ? X : content}
                            {isBest && <span className={styles.bestTag}>{L.best}</span>}
                          </span>
                          {pct != null && (
                            <span className={styles.track} aria-hidden="true">
                              <span className={styles.bar} style={{width: `${pct}%`, background: vendorColor(m.vendor)}} />
                            </span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className={styles.footnote}>{L.bestNote} {L.iterationsNote}</p>
    </section>
  );
}
