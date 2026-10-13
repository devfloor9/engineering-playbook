import React, {useId} from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, VENDOR_COLOR} from './shared';
import styles from './PriceLadder.module.css';

// Component-specific copy; not in the shared t() table.
const LABELS = {
  ko: {
    title: '적용 단가',
    desc: `us-east-1 엔드포인트에서 미국 교차 리전 추론으로 호출할 때의 단가이며, ${data.price_checked}에 확인했습니다. 막대는 출력 단가(로그 눈금)입니다.`,
    header: '단가 (USD / 100만 토큰)',
    input: '입력',
    output: '출력',
    cacheRead: '캐시 읽기',
    cacheWrite: '캐시 쓰기',
    model: '모델',
    barLabel: '출력 단가 (로그 스케일)',
    sourcePrefix: 'Amazon Bedrock 요금 페이지와 모델 카드, ',
    sourceLink: 'Amazon Bedrock 요금',
    checked: ' 확인',
  },
  en: {
    title: 'Prices applied',
    desc: `US cross-Region inference prices from the us-east-1 endpoint, checked on ${data.price_checked}. The bar shows the output price on a log scale.`,
    header: 'Price (USD per million tokens)',
    input: 'Input',
    output: 'Output',
    cacheRead: 'Cache read',
    cacheWrite: 'Cache write',
    model: 'Model',
    barLabel: 'Output price (log scale)',
    sourcePrefix: 'Amazon Bedrock pricing page and model cards, checked ',
    sourceLink: 'Amazon Bedrock pricing',
    checked: '',
  },
};

const BEDROCK_PRICING_URL = 'https://aws.amazon.com/bedrock/pricing/';

// Output-price bar axis (log scale). Prices span $0.55 to $55.
const BAR_LO = 0.5;
const BAR_HI = 60;
const LOG_LO = Math.log10(BAR_LO);
const LOG_HI = Math.log10(BAR_HI);

function barPct(v) {
  const clamped = Math.min(Math.max(v, BAR_LO), BAR_HI);
  return ((Math.log10(clamped) - LOG_LO) / (LOG_HI - LOG_LO)) * 100;
}

// Price per million tokens, exactly as applied (e.g. $0.275, $0.011, $0.1375, $11): rounding to cents would
// misstate the price used for the cost calculation. Up to 4 decimals, trailing zeros dropped.
function fmtPrice(v) {
  if (v == null) return '—';
  return `$${Number(v.toFixed(4))}`;
}

export default function RalphPriceLadder() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  // Sort by output price desc, then input price desc; ties keep data order
  // (stable sort on an index-tagged copy).
  const rows = data.models
    .map((m, i) => ({
      i,
      key: m.key,
      name: m.name,
      vendor: m.vendor,
      modelId: m.model_id,
      p: m.prices_usd_per_mtok,
    }))
    .sort((a, b) => {
      // Output, then input, cache read and cache write (all descending), so models with identical prices are
      // always adjacent and the tie marker below can group them. Full ties keep data order.
      for (const k of ['output', 'input', 'cache_read', 'cache_write']) {
        const d = (b.p[k] ?? -1) - (a.p[k] ?? -1);
        if (d !== 0) return d;
      }
      return a.i - b.i;
    });

  // Mark groups of adjacent rows that share the exact same four prices, so the
  // shared background makes the tie visible (brief requirement).
  const priceKey = (p) => `${p.input}|${p.output}|${p.cache_read}|${p.cache_write}`;
  const groupId = [];
  let gid = 0;
  rows.forEach((r, idx) => {
    if (idx > 0 && priceKey(r.p) === priceKey(rows[idx - 1].p)) {
      groupId[idx] = groupId[idx - 1];
    } else {
      groupId[idx] = gid++;
    }
  });
  // A group is "tied" only if more than one row shares it.
  const groupCount = {};
  groupId.forEach((g) => { groupCount[g] = (groupCount[g] || 0) + 1; });

  const ariaLabel = lang === 'ko'
    ? `모델별 적용 단가 표. 입력, 출력, 캐시 읽기, 캐시 쓰기 단가(100만 토큰당 USD)와 출력 단가 로그 스케일 막대. ${rows.length}개 모델, 출력 단가 내림차순.`
    : `Table of applied prices per model: input, output, cache-read and cache-write prices (USD per million tokens) with a log-scale bar for the output price. ${rows.length} models, sorted by output price descending.`;

  const chip = (label, value) => (
    <span className={styles.chip}>
      <span className={styles.chipLabel}>{label}</span>
      <span className={styles.chipValue}>{fmtPrice(value)}</span>
    </span>
  );

  const source = (
    <>
      {L.sourcePrefix}{data.price_checked}{L.checked}
      {' — '}
      <a href={BEDROCK_PRICING_URL}>{L.sourceLink}</a>
    </>
  );

  const dataFallback = (
    <details className={styles.details}>
      <summary>{t(lang, 'showData')}</summary>
      <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={ariaLabel}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{L.model}</th>
              <th scope="col">{L.input}</th>
              <th scope="col">{L.output}</th>
              <th scope="col">{L.cacheRead}</th>
              <th scope="col">{L.cacheWrite}</th>
              <th scope="col">{t(lang, 'model')} ID</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <th scope="row">{r.name}</th>
                <td className={styles.num}>{fmtPrice(r.p.input)}</td>
                <td className={styles.num}>{fmtPrice(r.p.output)}</td>
                <td className={styles.num}>{fmtPrice(r.p.cache_read)}</td>
                <td className={styles.num}>{fmtPrice(r.p.cache_write)}</td>
                <td className={styles.mono}>{r.modelId}</td>
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
      <div className={styles.colHeader}>{L.header}</div>
      <ul className={styles.ladder} aria-label={ariaLabel}>
        {rows.map((r, idx) => {
          const color = VENDOR_COLOR[r.vendor] || 'var(--ep-chart-6)';
          const tied = groupCount[groupId[idx]] > 1;
          const groupEven = groupId[idx] % 2 === 0;
          return (
            <li
              key={r.key}
              className={`${styles.row} ${tied ? styles.rowTied : ''} ${tied && groupEven ? styles.rowTiedAlt : ''}`}
            >
              <div className={styles.nameCell}>
                <div className={styles.name}>{r.name}</div>
                <div className={styles.modelId}>{r.modelId}</div>
              </div>

              <div className={styles.chips}>
                {chip(L.input, r.p.input)}
                {chip(L.output, r.p.output)}
                {chip(L.cacheRead, r.p.cache_read)}
                {chip(L.cacheWrite, r.p.cache_write)}
              </div>

              <div
                className={styles.barCell}
                role="img"
                aria-label={`${r.name} ${L.output}: ${fmtPrice(r.p.output)}`}
              >
                <div className={styles.barTrack}>
                  <div
                    className={styles.barFill}
                    style={{width: `${barPct(r.p.output)}%`, background: color}}
                  />
                </div>
                <span className={styles.barValue}>{fmtPrice(r.p.output)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </Figure>
  );
}
