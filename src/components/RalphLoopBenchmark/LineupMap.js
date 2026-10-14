import React from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, VENDOR_COLOR, groupLabel} from './shared';
import styles from './LineupMap.module.css';

// Component-specific copy, kept local.
const LABELS = {
  ko: {
    title: '측정한 모델',
    desc: '실측한 프론티어·중국 오픈웨이트 모델과, Bedrock에 있지만 이번에 측정하지 않은 모델의 예를 보여줍니다.',
    col1Suffix: '실측',
    col2Suffix: '실측',
    notMeasuredHeading: '측정 안 함(예)',
    retentionBadge: '데이터 보존 aws_review 필요',
    intro: '모두 us-east-1에서 미국 교차 리전 추론 프로필(us. 모델 ID)로 호출 \u00b7 2026-10-12에 모델 카드\u00b7계정 권한\u00b7실제 호출 3단계로 확인',
    scope: (n, checked) => `"측정 안 함(예)" 열은 Bedrock에 있지만 이번에 측정하지 않은 모델의 일부 예입니다(${checked} Bedrock 문서 기준).`,
    source: 'Amazon Bedrock 사용자 가이드(모델 카드, 리전별 제공 표), 2026-10-12·2026-10-14 확인',
    // data table
    tStatusMeasured: '실측',
    tStatusNotMeasured: '측정 안 함',
    thModel: '모델',
    thGroup: '그룹',
    thStatus: '상태',
    thNote: '비고',
    dash: '\u2014',
  },
  en: {
    title: 'Models measured',
    desc: 'The frontier and Chinese open-weight models measured, alongside examples of models that are on Bedrock but were not measured this time.',
    col1Suffix: 'measured',
    col2Suffix: 'measured',
    notMeasuredHeading: 'Not measured (examples)',
    retentionBadge: 'Requires data retention aws_review',
    intro: 'All called in us-east-1 through US cross-Region inference profiles (us. model IDs) \u00b7 checked on 2026-10-12 in three steps: model cards, account permissions, a live call',
    scope: (n, checked) => `The "Not measured (examples)" column lists some of the models that are on Bedrock but were not measured (Bedrock documentation, checked ${checked}).`,
    source: 'Amazon Bedrock User Guide (model cards, Region availability), checked 2026-10-12 and 2026-10-14',
    tStatusMeasured: 'Measured',
    tStatusNotMeasured: 'Not measured',
    thModel: 'Model',
    thGroup: 'Group',
    thStatus: 'Status',
    thNote: 'Note',
    dash: '\u2014',
  },
};

export default function RalphLineupMap() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;

  const frontier = data.models.filter((m) => m.group === 'F');
  const chinese = data.models.filter((m) => m.group === 'C');
  const notMeasured = (data.lineup && data.lineup.not_measured) || [];
  const catalog = (data.lineup && data.lineup.catalog) || {};
  const retention = new Set((data.lineup && data.lineup.retention_required) || []);
  const measuredCount = frontier.length + chinese.length;

  const col1Head = `${groupLabel('F', lang)} ${frontier.length}${lang === 'ko' ? '개 ' : ' '}${L.col1Suffix}`;
  const col2Head = `${groupLabel('C', lang)} ${chinese.length}${lang === 'ko' ? '개 ' : ' '}${L.col2Suffix}`;
  const col3Head = L.notMeasuredHeading;

  const dataFallback = (
    <details className={styles.details}>
      <summary>{t(lang, 'showData')}</summary>
      <div className={styles.tableScroll} role="region" tabIndex={0}
        aria-label={lang === 'ko' ? '모델 목록: 그룹, 상태, 비고' : 'Model list: group, status, note'}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{L.thModel}</th>
              <th scope="col">{L.thGroup}</th>
              <th scope="col">{L.thStatus}</th>
              <th scope="col">{L.thNote}</th>
            </tr>
          </thead>
          <tbody>
            {frontier.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.name}</th>
                <td>{groupLabel('F', lang)}</td>
                <td>{L.tStatusMeasured}</td>
                <td>{retention.has(m.key) ? L.retentionBadge : L.dash}</td>
              </tr>
            ))}
            {chinese.map((m) => (
              <tr key={m.key}>
                <th scope="row">{m.name}</th>
                <td>{groupLabel('C', lang)}</td>
                <td>{L.tStatusMeasured}</td>
                <td>{L.dash}</td>
              </tr>
            ))}
            {notMeasured.map((item) => (
              <tr key={item.name}>
                <th scope="row">{item.name}</th>
                <td>{item.vendor}</td>
                <td>{L.tStatusNotMeasured}</td>
                <td>{L.dash}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );

  return (
    <Figure title={L.title} description={L.desc} source={L.source} dataFallback={dataFallback}>
      <p className={styles.intro}>{L.intro}</p>
      <div className={styles.columns}>

        {/* Group 1: frontier, measured */}
        <section className={styles.column} aria-label={col1Head}>
          <div className={styles.colHead}>{col1Head}</div>
          <ul className={styles.chipList}>
            {frontier.map((m) => (
              <li key={m.key} className={styles.chip}>
                <span className={styles.dot} style={{background: VENDOR_COLOR[m.vendor] || 'var(--ep-outline)'}}
                  aria-hidden="true" />
                <span className={styles.chipBody}>
                  <span className={styles.chipName}>{m.name}</span>
                  {retention.has(m.key) && (
                    <span className={styles.badge}>{L.retentionBadge}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Group 2: Chinese open-weight, measured */}
        <section className={styles.column} aria-label={col2Head}>
          <div className={styles.colHead}>{col2Head}</div>
          <ul className={styles.chipList}>
            {chinese.map((m) => (
              <li key={m.key} className={styles.chip}>
                <span className={styles.dot} style={{background: VENDOR_COLOR[m.vendor] || 'var(--ep-outline)'}}
                  aria-hidden="true" />
                <span className={styles.chipBody}>
                  <span className={styles.chipName}>{m.name}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Not measured (examples) */}
        <section className={styles.column} aria-label={col3Head}>
          <div className={styles.colHead}>{col3Head}</div>
          <ul className={styles.chipList}>
            {notMeasured.map((item) => (
              <li key={item.name} className={styles.chip}>
                <span className={`${styles.dot} ${styles.dotNeutral}`} aria-hidden="true" />
                <span className={styles.chipBody}>
                  <span className={styles.chipName}>{item.name}</span>
                  <span className={styles.chipVendor}>{item.vendor}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

      </div>
      <p className={styles.intro}>{L.scope(measuredCount, catalog.checked)}</p>
    </Figure>
  );
}
