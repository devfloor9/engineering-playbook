// RalphKpiStrip (OWNER: agent A): a compact responsive row of KPI tiles
// computed entirely from the benchmark JSON. Renders without props.
// SSR-safe: no window/document access.
import React from 'react';
import {data, useLang, t, fmt} from './shared';
import styles from './styles.module.css';

/** Look up a model record by its key. */
function modelByKey(key) {
  return data.models.find(m => m.key === key);
}

/** Localized model name, falling back to the key if the record is missing. */
function modelName(key) {
  const m = modelByKey(key);
  return m ? m.name : key;
}

export default function RalphKpiStrip() {
  const lang = useLang();
  const {totals, highlights} = data;

  const cheapest = modelByKey(highlights.cheapest);
  const priciest = modelByKey(highlights.priciest);
  const cheapestCost = cheapest && cheapest.stats.cost_usd ? cheapest.stats.cost_usd.med : null;
  const priciestCost = priciest && priciest.stats.cost_usd ? priciest.stats.cost_usd.med : null;

  // Each tile: a label (localized) plus a formatted value and optional subline.
  const tiles = [
    {
      key: 'completed',
      label: t(lang, 'completedRuns'),
      value: `${fmt.int(totals.completed, lang)}/${fmt.int(totals.runs, lang)}`,
      sub: lang === 'ko' ? `${fmt.int(totals.models, lang)}개 모델` : `${fmt.int(totals.models, lang)} models`,
    },
    {
      key: 'cheapest',
      label: t(lang, 'cheapest'),
      value: modelName(highlights.cheapest),
      sub: cheapestCost != null ? `${t(lang, 'median')} ${fmt.usd(cheapestCost)} ${t(lang, 'perRun')}` : null,
    },
    {
      key: 'priciest',
      label: t(lang, 'priciest'),
      value: modelName(highlights.priciest),
      sub: priciestCost != null ? `${t(lang, 'median')} ${fmt.usd(priciestCost)} ${t(lang, 'perRun')}` : null,
    },
    {
      key: 'ratio',
      label: t(lang, 'costRatio'),
      value: `${highlights.cost_ratio_max_min.toLocaleString(lang === 'ko' ? 'ko-KR' : 'en-US')}\u00d7`,
    },
    {
      key: 'cacheShare',
      label: t(lang, 'cacheReadShare'),
      value: fmt.pct(highlights.cache_read_token_share),
    },
    {
      key: 'spend',
      label: t(lang, 'totalSpend'),
      value: fmt.usd2(totals.spend_usd.total),
      sub: lang === 'ko'
        ? `집계 실행 ${fmt.usd2(totals.spend_usd.results)} + 폐기한 1차 실행 ${fmt.usd2(totals.spend_usd.discarded_first_attempt)}`
        : `results ${fmt.usd2(totals.spend_usd.results)} + discarded first attempt ${fmt.usd2(totals.spend_usd.discarded_first_attempt)}`,
    },
  ];

  return (
    <ul className={styles.kpiStrip}>
      {tiles.map(tile => (
        <li key={tile.key} className={styles.kpi}>
          <span className={styles.kpiLabel}>{tile.label}</span>
          <span className={styles.kpiValue}>{tile.value}</span>
          {tile.sub != null && <span className={styles.kpiSub}>{tile.sub}</span>}
        </li>
      ))}
    </ul>
  );
}
