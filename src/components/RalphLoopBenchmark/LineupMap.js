import React from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, VENDOR_COLOR, groupLabel} from './shared';
import styles from './LineupMap.module.css';

// Component-specific copy, kept local like SameModelChart.
const LABELS = {
  ko: {
    title: '비교 대상 모델과 제외 사유',
    desc: '실측한 프론티어·중국 오픈웨이트 모델과, 제외한 모델의 사유를 묶어서 보여줍니다.',
    col1Suffix: '실측',
    col2Suffix: '실측',
    excludedHeading: '제외',
    retentionBadge: '데이터 보존 aws_review 필요',
    notInRefBadge: '원 리포트에 없음',
    intro: '모두 us-east-1에서 미국 교차 리전 추론 프로필(us. 모델 ID)로 호출 \u00b7 2026-10-12에 모델 카드\u00b7계정 권한\u00b7실제 호출 3단계로 확인',
    reasonNo: 'Bedrock 미제공',
    reasonNoGlm: 'Bedrock 미제공 \u2192 GLM 5.3으로 대체',
    reasonG: '어느 그룹에도 속하지 않음',
    reasonX: '가중치 공개 여부 미확인',
    source: 'Amazon Bedrock 사용자 가이드(모델 카드, 리전별 제공 표), 2026-10-12 확인',
    // data table
    tStatusMeasured: '실측',
    tStatusExcluded: '제외',
    thModel: '모델',
    thGroup: '그룹',
    thStatus: '상태',
    thReason: '사유',
    dash: '\u2014',
  },
  en: {
    title: 'Models compared and why others were excluded',
    desc: 'Groups the frontier and Chinese open-weight models measured, alongside the models excluded and why.',
    col1Suffix: 'measured',
    col2Suffix: 'measured',
    excludedHeading: 'Excluded',
    retentionBadge: 'Requires data retention aws_review',
    notInRefBadge: 'Not in the reference report',
    intro: 'All called in us-east-1 through US cross-Region inference profiles (us. model IDs) \u00b7 checked on 2026-10-12 in three steps: model cards, account permissions, a live call',
    reasonNo: 'Not on Bedrock',
    reasonNoGlm: 'Not on Bedrock; GLM 5.3 measured instead',
    reasonG: 'Neither group',
    reasonX: 'Open-weight status not verified',
    source: 'Amazon Bedrock User Guide (model cards, Region availability), checked 2026-10-12',
    tStatusMeasured: 'Measured',
    tStatusExcluded: 'Excluded',
    thModel: 'Model',
    thGroup: 'Group',
    thStatus: 'Status',
    thReason: 'Reason',
    dash: '\u2014',
  },
};

// Build the reason line(s) for an excluded model from its availability/class.
function excludedReasons(item, L) {
  const parts = [];
  if (item.availability === 'no_glm') parts.push(L.reasonNoGlm);
  else if (item.availability === 'no') parts.push(L.reasonNo);
  if (item.class === 'G') parts.push(L.reasonG);
  else if (item.class === 'X') parts.push(L.reasonX);
  return parts;
}

export default function RalphLineupMap() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;

  const frontier = data.models.filter((m) => m.group === 'F');
  const chinese = data.models.filter((m) => m.group === 'C');
  const excluded = (data.lineup && data.lineup.excluded) || [];
  const retention = new Set((data.lineup && data.lineup.retention_required) || []);
  const notInRef = new Set((data.lineup && data.lineup.not_in_reference) || []);

  const col1Head = `${groupLabel('F', lang)} ${frontier.length}${lang === 'ko' ? '개 ' : ' '}${L.col1Suffix}`;
  const col2Head = `${groupLabel('C', lang)} ${chinese.length}${lang === 'ko' ? '개 ' : ' '}${L.col2Suffix}`;
  const col3Head = `${L.excludedHeading} ${excluded.length}${lang === 'ko' ? '개' : ''}`;

  const dataFallback = (
    <details className={styles.details}>
      <summary>{t(lang, 'showData')}</summary>
      <div className={styles.tableScroll} role="region" tabIndex={0}
        aria-label={lang === 'ko' ? '모델 목록: 그룹, 상태, 사유' : 'Model list: group, status, reason'}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{L.thModel}</th>
              <th scope="col">{L.thGroup}</th>
              <th scope="col">{L.thStatus}</th>
              <th scope="col">{L.thReason}</th>
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
                <td>{notInRef.has(m.key) ? L.notInRefBadge : L.dash}</td>
              </tr>
            ))}
            {excluded.map((item) => (
              <tr key={item.name}>
                <th scope="row">{item.name}</th>
                <td>{item.vendor}</td>
                <td>{L.tStatusExcluded}</td>
                <td>{excludedReasons(item, L).join(' \u00b7 ') || L.dash}</td>
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
                  {notInRef.has(m.key) && (
                    <span className={styles.badge}>{L.notInRefBadge}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Excluded */}
        <section className={styles.column} aria-label={col3Head}>
          <div className={styles.colHead}>{col3Head}</div>
          <ul className={styles.chipList}>
            {excluded.map((item) => (
              <li key={item.name} className={styles.chip}>
                <span className={`${styles.dot} ${styles.dotNeutral}`} aria-hidden="true" />
                <span className={styles.chipBody}>
                  <span className={styles.chipName}>{item.name}</span>
                  <span className={styles.chipVendor}>{item.vendor}</span>
                  {excludedReasons(item, L).map((r) => (
                    <span key={r} className={styles.reason}>{r}</span>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>

      </div>
    </Figure>
  );
}
