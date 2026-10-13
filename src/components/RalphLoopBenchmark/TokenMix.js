import React, {useId} from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, fmt, groupLabel} from './shared';
import styles from './TokenMix.module.css';

// Fixed category colors (TASK-B): input chart-5, output chart-2,
// cache read chart-1, cache write chart-4. These are category series, not
// vendors, so they use a stable legended --ep-chart-* mapping.
const CATS = [
  {id: 'input', color: 'var(--ep-chart-5)', priceKey: 'input'},
  {id: 'output', color: 'var(--ep-chart-2)', priceKey: 'output'},
  {id: 'cacheRead', color: 'var(--ep-chart-1)', priceKey: 'cache_read'},
  {id: 'cacheWrite', color: 'var(--ep-chart-4)', priceKey: 'cache_write'},
];

// Figure-level copy and category names are not in shared.js, so keep them
// local (concise, polite Korean noun phrases; no particle after a computed name).
const LABELS = {
  ko: {
    title: '토큰 구성과 비용 구성',
    desc: '캐시 읽기는 캐시에 저장된 프롬프트 앞부분을 일반 입력보다 낮은 단가로 다시 읽는 토큰입니다.',
    source: 'Bedrock이 보고한 토큰(완주한 run의 중앙값) × 2026-10-12 기준 단가',
    tokenMix: '토큰 구성',
    costMix: '비용 구성(추정)',
    cats: {input: '입력', output: '출력', cacheRead: '캐시 읽기', cacheWrite: '캐시 쓰기'},
    cacheReadShort: '캐시 읽기',
    keyFact: `완주한 run의 전체 토큰 중 ${Math.round(data.highlights.cache_read_token_share * 100)}%가 캐시 읽기`,
    thModel: '모델',
    thTotal: '전체',
    thCrTokenShare: '캐시 읽기 토큰 비중',
    thCrCostShare: '캐시 읽기 비용 비중',
    ariaRow: (name) => `${name}: 왼쪽은 토큰 종류별 비중, 오른쪽은 비용 종류별 비중`,
    ariaChart: '모델별 토큰 구성과 비용 구성 100% 누적 막대',
  },
  en: {
    title: 'Token mix and cost mix',
    desc: 'A cache read is a prompt prefix re-read from the cache at a lower price than normal input.',
    source: 'Tokens reported by Bedrock (median of completed runs) × prices as of 2026-10-12',
    tokenMix: 'Token mix',
    costMix: 'Cost mix (estimate)',
    cats: {input: 'Input', output: 'Output', cacheRead: 'Cache read', cacheWrite: 'Cache write'},
    cacheReadShort: 'cache read',
    keyFact: `${Math.round(data.highlights.cache_read_token_share * 100)}% of all tokens in completed runs were cache reads`,
    thModel: 'Model',
    thTotal: 'Total',
    thCrTokenShare: 'Cache-read token share',
    thCrCostShare: 'Cache-read cost share',
    ariaRow: (name) => `${name}: left bar is token share by type, right bar is cost share by type`,
    ariaChart: 'Per-model token mix and cost mix as 100% stacked bars',
  },
};

// Deterministic compact token formatter (no toLocaleString/Intl compact).
// ko groups by 만 (10,000); en by K/M. Keeps 3 significant-ish digits.
function compactTokens(v, lang) {
  if (lang === 'ko') {
    if (v >= 1e8) return `${(v / 1e8).toFixed(v >= 1e9 ? 0 : 1)}억`;
    if (v >= 1e4) return `${Math.round(v / 1e4)}만`;
    return `${Math.round(v)}`;
  }
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${Math.round(v / 1e3)}K`;
  return `${Math.round(v)}`;
}

// Build the two normalized distributions for one model.
function modelMix(m) {
  const s = m.stats;
  const counts = {
    input: s.input_tokens.med,
    output: s.output_tokens.med,
    cacheRead: s.cache_read_tokens.med,
    cacheWrite: s.cache_write_tokens.med,
  };
  const tokenSum = CATS.reduce((a, c) => a + counts[c.id], 0);
  const cost = {};
  for (const c of CATS) cost[c.id] = counts[c.id] * m.prices_usd_per_mtok[c.priceKey] / 1e6;
  const costSum = CATS.reduce((a, c) => a + cost[c.id], 0);
  const tokenShare = {};
  const costShare = {};
  for (const c of CATS) {
    tokenShare[c.id] = tokenSum > 0 ? counts[c.id] / tokenSum : 0;
    costShare[c.id] = costSum > 0 ? cost[c.id] / costSum : 0;
  }
  // Largest cost category for the inline cost label.
  let topCost = CATS[0].id;
  for (const c of CATS) if (costShare[c.id] > costShare[topCost]) topCost = c.id;
  return {counts, tokenSum, tokenShare, costShare, topCost};
}

function Bar({dist, cats, titleId}) {
  return (
    <div className={styles.bar} role="img" aria-labelledby={titleId}>
      {cats.map((c) => {
        const pct = dist[c.id] * 100;
        if (pct <= 0) return null;
        return (
          <span
            key={c.id}
            className={styles.seg}
            style={{width: `${pct}%`, background: c.color}}
          />
        );
      })}
    </div>
  );
}

export default function RalphTokenMix() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  // Rows grouped F then C, with a group label row inserted at each boundary.
  const groups = ['F', 'C'];
  const rowsByGroup = groups.map((g) => ({
    group: g,
    models: data.models.filter((m) => m.group === g).map((m) => ({m, mix: modelMix(m)})),
  }));

  const legend = (
    <div className={styles.legend}>
      {CATS.map((c) => (
        <span key={c.id} className={styles.legendItem}>
          <span className={styles.swatch} style={{background: c.color}} />
          {L.cats[c.id]}
        </span>
      ))}
    </div>
  );

  const dataFallback = (
    <details className={styles.details}>
      <summary>{t(lang, 'showData')}</summary>
      <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={L.ariaChart}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{L.thModel}</th>
              <th scope="col">{L.cats.input}</th>
              <th scope="col">{L.cats.output}</th>
              <th scope="col">{L.cats.cacheRead}</th>
              <th scope="col">{L.cats.cacheWrite}</th>
              <th scope="col">{L.thTotal}</th>
              <th scope="col">{L.thCrTokenShare}</th>
              <th scope="col">{L.thCrCostShare}</th>
            </tr>
          </thead>
          <tbody>
            {rowsByGroup.map(({group, models}) => (
              <React.Fragment key={group}>
                <tr>
                  <th scope="rowgroup" colSpan={8} className={styles.groupCell}>
                    {groupLabel(group, lang)}
                  </th>
                </tr>
                {models.map(({m}) => {
                  const s = m.stats;
                  return (
                    <tr key={m.key}>
                      <th scope="row">{m.name}</th>
                      <td className={styles.num}>{fmt.int(s.input_tokens.med, lang)}</td>
                      <td className={styles.num}>{fmt.int(s.output_tokens.med, lang)}</td>
                      <td className={styles.num}>{fmt.int(s.cache_read_tokens.med, lang)}</td>
                      <td className={styles.num}>{fmt.int(s.cache_write_tokens.med, lang)}</td>
                      <td className={styles.num}>{fmt.int(s.total_tokens.med, lang)}</td>
                      <td className={styles.num}>{fmt.pct(m.cache_read_token_share)}</td>
                      <td className={styles.num}>{fmt.pct(m.cache_read_cost_share)}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
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
      source={L.source}
      dataFallback={dataFallback}
    >
      <p className={styles.keyFact}>{L.keyFact}</p>
      {legend}
      <div className={styles.colHead} aria-hidden="true">
        <span className={styles.colHeadLabel} />
        <span className={styles.colHeadBar}>{L.tokenMix}</span>
        <span className={styles.colHeadBar}>{L.costMix}</span>
      </div>
      <div className={styles.rows}>
        {rowsByGroup.map(({group, models}) => (
          <React.Fragment key={group}>
            <div className={styles.groupRow}>{groupLabel(group, lang)}</div>
            {models.map(({m, mix}) => {
              const tokId = `${baseId}-${m.key}-tok`;
              const costId = `${baseId}-${m.key}-cost`;
              // Printed values use the reported medians (same numbers as the tables); the bar widths use the shares of
              // the summed part medians, which round to the same percentages.
              const crPct = Math.round(m.cache_read_token_share * 100);
              const topPct = Math.round(mix.costShare[mix.topCost] * 100);
              return (
                <div className={styles.row} key={m.key}>
                  <div className={styles.rowLabel}>
                    <span className={styles.modelName}>{m.name}</span>
                    <span className={styles.modelTotal}>
                      {lang === 'ko'
                        ? `전체 ${compactTokens(m.stats.total_tokens.med, lang)} 토큰`
                        : `${compactTokens(m.stats.total_tokens.med, lang)} tokens total`}
                    </span>
                  </div>
                  <div className={styles.barCell}>
                    <span id={tokId} className={styles.srOnly}>
                      {`${m.name} ${L.tokenMix}`}
                    </span>
                    <Bar dist={mix.tokenShare} cats={CATS} titleId={tokId} />
                    <span className={styles.barValue}>
                      {`${L.cacheReadShort} ${crPct}%`}
                    </span>
                  </div>
                  <div className={styles.barCell}>
                    <span id={costId} className={styles.srOnly}>
                      {`${m.name} ${L.costMix}`}
                    </span>
                    <Bar dist={mix.costShare} cats={CATS} titleId={costId} />
                    <span className={styles.barValue}>
                      {`${L.cats[mix.topCost]} ${topPct}%`}
                    </span>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </Figure>
  );
}
