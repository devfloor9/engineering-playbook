import React from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, fmt, VENDOR_COLOR, groupLabel} from './shared';
import styles from './ModelComparison.module.css';

// Ranked-bar model comparison, laid out like a leaderboard: one panel per
// metric, rows sorted best first, the model name is the row label and the
// value is printed at the end of the bar. Because every name sits in its own
// row, no label can collide with a marker, another label or a connector line.

// Lower is better for every metric shown here.
const METRICS = [
  {
    key: 'cost_usd',
    format: (v) => fmt.usd(v),
    ko: {title: '실행당 비용', sub: '중앙값, 낮은 순', card: '최저 비용'},
    en: {title: 'Cost per run', sub: 'Median, cheapest first', card: 'Cheapest'},
  },
  {
    key: 'run_minutes',
    format: (v, lang) => `${fmt.min(v)}${lang === 'ko' ? '분' : ' min'}`,
    ko: {title: '실행 시간', sub: '중앙값, 빠른 순', card: '최단 시간'},
    en: {title: 'Run time', sub: 'Median, fastest first', card: 'Fastest'},
  },
  {
    key: 'output_tokens',
    format: (v) => `${(v / 1000).toFixed(1)}k`,
    ko: {title: '출력 토큰', sub: '중앙값, 적은 순', card: '최소 출력 토큰'},
    en: {title: 'Output tokens', sub: 'Median, fewest first', card: 'Fewest output tokens'},
  },
];

const LABELS = {
  ko: {
    title: '모델 비교: 비용, 실행 시간, 출력 토큰',
    desc: '지표마다 완주한 run의 중앙값으로 모델을 정렬했습니다. 세 지표 모두 값이 작을수록 좋습니다. 막대 길이는 해당 지표의 최댓값 대비 비율이고, 막대 색은 벤더, 이름 앞의 표식은 그룹(원=프론티어, 마름모=중국 오픈웨이트)입니다.',
    rank: '순위',
  },
  en: {
    title: 'Model comparison: cost, run time and output tokens',
    desc: 'Each panel ranks the models by the median over completed runs; lower is better for all three metrics. Bar length is relative to the largest value in that panel, bar color encodes vendor, and the marker before each name encodes group (circle = frontier, diamond = Chinese open-weight).',
    rank: 'Rank',
  },
};

function GroupMark({group, color}) {
  return (
    <svg className={styles.mark} viewBox="0 0 12 12" aria-hidden="true">
      {group === 'C'
        ? <path d="M6 1 L11 6 L6 11 L1 6 Z" fill={color} />
        : <circle cx="6" cy="6" r="5" fill={color} />}
    </svg>
  );
}

export default function RalphModelComparison() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;

  const models = data.models.filter((m) => m.stats
    && METRICS.every((x) => m.stats[x.key] && m.stats[x.key].med != null));

  const panels = METRICS.map((metric) => {
    const rows = [...models]
      .map((m) => ({m, v: m.stats[metric.key].med}))
      .sort((a, b) => a.v - b.v || a.m.name.localeCompare(b.m.name));
    const max = Math.max(...rows.map((r) => r.v));
    return {metric, rows, max, label: metric[lang] || metric.en};
  });

  const first = data.windows_utc.main[0].slice(0, 10);
  const last = data.windows_utc.fable51[1].slice(0, 10);
  const source = lang === 'ko'
    ? `이 보고서의 실측 ${data.totals.runs}회(Amazon Bedrock ${data.region}, ${first}~${last} UTC). 비용은 ${data.price_checked}에 확인한 단가로 계산했습니다.`
    : `This report's ${data.totals.runs} measured runs (Amazon Bedrock ${data.region}, ${first} to ${last} UTC); cost computed at prices checked on ${data.price_checked}.`;

  const dataFallback = (
    <details className={styles.details}>
      <summary>{t(lang, 'showData')}</summary>
      <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={L.title}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{t(lang, 'model')}</th>
              <th scope="col">{t(lang, 'group')}</th>
              {panels.map((p) => <th key={p.metric.key} scope="col">{p.label.title}</th>)}
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.name}</th>
                <td>{groupLabel(m.group, lang)}</td>
                {METRICS.map((x) => (
                  <td key={x.key} className={styles.num}>{x.format(m.stats[x.key].med, lang)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );

  return (
    <Figure title={L.title} description={L.desc} source={source} dataFallback={dataFallback}>
      {/* Highlight cards: the leader of each panel. */}
      <ul className={styles.cards}>
        {panels.map((p) => {
          const top = p.rows[0];
          return (
            <li key={p.metric.key} className={styles.card}>
              <div className={styles.cardLabel}>{p.label.card}</div>
              <div className={styles.cardModel}>
                <GroupMark group={top.m.group} color={VENDOR_COLOR[top.m.vendor] || 'var(--ep-chart-6)'} />
                {top.m.name}
              </div>
              <div className={styles.cardValue}>{p.metric.format(top.v, lang)}</div>
            </li>
          );
        })}
      </ul>

      {/* One ranked-bar panel per metric. */}
      <div className={styles.panels}>
        {panels.map((p) => (
          <section key={p.metric.key} className={styles.panel}
            aria-label={`${p.label.title} (${p.label.sub})`}>
            <div className={styles.panelTitle}>{p.label.title}</div>
            <div className={styles.panelSub}>{p.label.sub}</div>
            <ol className={styles.rows}>
              {p.rows.map((r, i) => {
                const color = VENDOR_COLOR[r.m.vendor] || 'var(--ep-chart-6)';
                const pct = Math.max((r.v / p.max) * 100, 1.5);
                return (
                  <li key={r.m.key} className={styles.row}>
                    <span className={styles.rank} aria-label={`${L.rank} ${i + 1}`}>{i + 1}</span>
                    <span className={styles.name}>
                      <GroupMark group={r.m.group} color={color} />
                      <span className={styles.nameText} title={r.m.name}>{r.m.name}</span>
                    </span>
                    <span className={styles.track} aria-hidden="true">
                      <span className={styles.bar} style={{width: `${pct}%`, background: color}} />
                    </span>
                    <span className={styles.value}>{p.metric.format(r.v, lang)}</span>
                  </li>
                );
              })}
            </ol>
          </section>
        ))}
      </div>

      {/* Vendor legend (color). */}
      <div className={styles.legend}>
        {[...new Set(models.map((m) => m.vendor))].map((v) => (
          <span key={v} className={styles.legendItem}>
            <span className={styles.swatch} style={{background: VENDOR_COLOR[v] || 'var(--ep-chart-6)'}} />
            {v}
          </span>
        ))}
      </div>
    </Figure>
  );
}
