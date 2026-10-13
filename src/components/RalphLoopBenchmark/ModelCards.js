// RalphModelCards (OWNER: agent A): one card per model, grouped by `group`
// (frontier 'F' first), each with a vendor color accent. Renders without props.
// SSR-safe: no window/document access.
import React from 'react';
import {data, useLang, t, fmt, VENDOR_COLOR, groupLabel} from './shared';
import styles from './styles.module.css';

const GROUP_ORDER = ['F', 'C'];

/** Order models: frontier group first, then by declared data.models order. */
function orderedModels() {
  const byGroup = new Map();
  data.models.forEach((m, i) => {
    if (!byGroup.has(m.group)) byGroup.set(m.group, []);
    byGroup.get(m.group).push({model: m, index: i});
  });
  const groups = [
    ...GROUP_ORDER.filter(g => byGroup.has(g)),
    ...[...byGroup.keys()].filter(g => !GROUP_ORDER.includes(g)),
  ];
  const out = [];
  for (const g of groups) {
    byGroup.get(g).sort((a, b) => a.index - b.index).forEach(e => out.push(e.model));
  }
  return out;
}

/**
 * Render a note string that may contain backtick-quoted code spans
 * (e.g. "set `PORT` first") as text with real <code> elements. We split on
 * backticks instead of using dangerouslySetInnerHTML: odd-indexed segments
 * are the quoted code. An unbalanced trailing backtick stays plain text.
 */
function renderNote(text) {
  const parts = String(text).split('`');
  return parts.map((part, i) =>
    i % 2 === 1
      ? <code key={i}>{part}</code>
      : <React.Fragment key={i}>{part}</React.Fragment>,
  );
}

/** Format a {med,min,max} stat as "median (min–max)", or the x fallback. */
function medRange(stat, format, lang, nullText) {
  if (!stat || stat.med == null) return nullText;
  const med = format(stat.med, lang);
  if (stat.min == null || stat.max == null) return med;
  return `${med} (${format(stat.min, lang)}\u2013${format(stat.max, lang)})`;
}

function ModelCard({model, lang, total}) {
  const s = model.stats;
  const accent = VENDOR_COLOR[model.vendor] || 'var(--ep-outline-variant)';
  const groupName = groupLabel(model.group, lang);

  // iterations: array per run; null entries are incomplete runs -> render 'x'.
  const iterations = Array.isArray(model.iterations)
    ? model.iterations.map(v => (v == null ? '\u00d7' : v)).join(', ')
    : '\u00d7';

  const intFmt = (v, l) => fmt.int(v, l);
  const minFmt = v => fmt.min(v);
  const usdFmt = v => fmt.usd(v);
  const xFallback = '\u00d7';

  // Builder/verifier request split, medians only.
  const br = s.builder_requests && s.builder_requests.med != null ? fmt.int(s.builder_requests.med, lang) : xFallback;
  const vr = s.verifier_requests && s.verifier_requests.med != null ? fmt.int(s.verifier_requests.med, lang) : xFallback;
  const llm = s.llm_requests && s.llm_requests.med != null ? fmt.int(s.llm_requests.med, lang) : xFallback;

  const rows = [
    {label: t(lang, 'cost'), value: medRange(s.cost_usd, usdFmt, lang, xFallback)},
    {
      label: t(lang, 'costRank'),
      value: lang === 'ko'
        ? `${fmt.int(total, lang)}개 중 ${fmt.int(model.cost_rank, lang)}위 (낮은 순)`
        : `${fmt.int(model.cost_rank, lang)} of ${fmt.int(total, lang)} (1 = cheapest)`,
    },
    {label: t(lang, 'outputTokens'), value: medRange(s.output_tokens, intFmt, lang, xFallback)},
    {label: t(lang, 'totalTokens'), value: medRange(s.total_tokens, intFmt, lang, xFallback)},
    {label: t(lang, 'cacheReadTokens'), value: medRange(s.cache_read_tokens, intFmt, lang, xFallback)},
    {label: t(lang, 'runMinutes'), value: medRange(s.run_minutes, minFmt, lang, xFallback)},
    {label: t(lang, 'llmRequests'), value: `${llm} (${t(lang, 'builder')} ${br} / ${t(lang, 'verifier')} ${vr})`},
    {
      label: t(lang, 'completed'),
      value: `${fmt.int(model.completed, lang)}/${fmt.int(model.runs, lang)}`,
    },
    {label: t(lang, 'iterations'), value: iterations},
    {
      label: t(lang, 'verifierCostShare'),
      value: model.verifier_cost_share != null ? fmt.pct(model.verifier_cost_share) : xFallback,
    },
  ];

  const note = model.note && model.note[lang] ? model.note[lang] : (model.note && model.note.en) || null;

  return (
    <li className={styles.card} style={{'--card-accent': accent}}>
      <div className={styles.cardHead}>
        <h3 className={styles.cardName}>{model.name}</h3>
        <span className={styles.chip + ' ' + styles.chipAccent} style={{'--chip-accent': accent}}>
          {groupName} · {model.vendor}
        </span>
      </div>
      <div className={styles.mono}>{model.model_id}</div>
      <dl className={styles.cardStats}>
        {rows.map(row => (
          <React.Fragment key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </React.Fragment>
        ))}
      </dl>
      {note != null && <p className={styles.note}>{renderNote(note)}</p>}
    </li>
  );
}

export default function RalphModelCards() {
  const lang = useLang();
  const models = orderedModels();
  const total = data.models.length;
  return (
    <ul className={styles.grid}>
      {models.map(model => (
        <ModelCard key={model.key} model={model} lang={lang} total={total} />
      ))}
    </ul>
  );
}
