import React, {useId} from 'react';
import Figure from '@site/src/components/Figure';
import {data, useLang, t, fmt, groupLabel} from './shared';
import styles from './RoleSplit.module.css';

// Fixed category colors (TASK-B): builder chart-1, verifier chart-4.
const ROLE = {
  builder: 'var(--ep-chart-1)',
  verifier: 'var(--ep-chart-4)',
};
// Verdict panel colors: pass success, PORT-fail warning, no verdict outline.
const VERDICT = {
  pass: 'var(--ep-success)',
  failPort: 'var(--ep-warning)',
  none: 'var(--ep-outline)',
};

// Figure-level copy and UI strings not in shared.js. Concise, polite Korean
// noun phrases; no particle directly after a computed model name.
const LABELS = {
  ko: {
    title: '빌더와 검증자의 분담',
    desc: '막대 전체는 모델별 run당 비용 중앙값이고, 주황색 부분은 그중 검증자 비용 중앙값입니다. 모든 행이 같은 USD 축을 써서 막대 길이가 비용 크기를 나타냅니다. 아래 패널은 공식 채점을 통과한 반복에서 검증자가 낸 판정입니다.',
    source: 'Bedrock이 보고한 토큰 × 단가(완주한 run의 중앙값), 검증자 판정은 REVIEW.md',
    builder: '빌더',
    verifier: '검증자',
    axis: '실행당 비용 (USD)',
    reqFmt: (b, v) => `빌더 ${b} / 검증자 ${v}`,
    shareFmt: (p) => `검증자 ${p}`,
    selfTermBadge: (n) => `자기 종료 세션 ${n}`,
    footnote: '자기 종료 세션: 에이전트가 자신의 프로세스를 종료(exit 143)한 경우로, pi가 프롬프트를 명령행 인자로 받기 때문에 발생합니다.',
    verdictHead: '검증자 판정 (공식 채점을 통과한 반복)',
    vPass: 'PASS',
    vFailPort: 'PORT 환경변수 미반영으로 FAIL',
    vNone: '판정 없음 / 자기 종료',
    falsePass: (n) => `검증자 PASS인데 채점에서 실패한 반복: ${n}`,
    portFailModels: 'PORT FAIL 모델',
    caveat: '검증자 없는 비교군이 없어 효과는 판단 불가',
    thModel: '모델',
    thBuilderReq: '빌더 요청',
    thVerifierReq: '검증자 요청',
    thBuilderCost: '빌더 비용',
    thVerifierCost: '검증자 비용',
    thVerifierShare: '검증자 비중',
    thSelfTerm: '자기 종료 세션',
    ariaChart: '모델별 빌더/검증자 비용 분담 막대',
    ariaVerdict: '검증자 판정 100% 누적 막대',
  },
  en: {
    title: 'Builder and verifier split',
    desc: 'Each whole bar is the model\u2019s median cost per run; the orange part is the verifier\u2019s median cost within it. All rows share one USD axis, so bar length shows cost. The panel below shows the verifier verdicts in iterations that passed the official grader.',
    source: 'Tokens reported by Bedrock × prices (median of completed runs); verifier verdicts from REVIEW.md',
    builder: 'Builder',
    verifier: 'Verifier',
    axis: 'Cost per run (USD)',
    reqFmt: (b, v) => `builder ${b} / verifier ${v}`,
    shareFmt: (p) => `verifier ${p}`,
    selfTermBadge: (n) => `${n} self-terminated session${n === 1 ? '' : 's'}`,
    footnote: 'Self-terminated session: an agent killed its own process (exit 143) because pi receives the prompt as a command-line argument.',
    verdictHead: 'Verifier verdicts (iterations that passed the official grader)',
    vPass: 'PASS',
    vFailPort: 'FAIL because of the PORT env var',
    vNone: 'No verdict / self-terminated',
    falsePass: (n) => `Iterations where the verifier said PASS but grading failed: ${n}`,
    portFailModels: 'PORT FAIL models',
    caveat: 'No control group without a verifier, so its effect cannot be determined',
    thModel: 'Model',
    thBuilderReq: 'Builder requests',
    thVerifierReq: 'Verifier requests',
    thBuilderCost: 'Builder cost',
    thVerifierCost: 'Verifier cost',
    thVerifierShare: 'Verifier share',
    thSelfTerm: 'Self-terminated sessions',
    ariaChart: 'Per-model builder/verifier cost split bars',
    ariaVerdict: 'Verifier verdict 100% stacked bar',
  },
};

function nameOf(key) {
  const m = data.models.find((x) => x.key === key);
  return m ? m.name : key;
}

export default function RalphRoleSplit() {
  const lang = useLang();
  const L = LABELS[lang] || LABELS.en;
  const baseId = useId().replace(/[^a-zA-Z0-9_-]/g, '');

  // Shared linear axis. The whole bar is the median run cost (the value every other chart shows); the verifier
  // segment is the verifier's median cost and the builder segment is the rest. Medians of the two parts do not add
  // up exactly to the run median, so this keeps the bar total consistent with the results table. The data table
  // below still lists the builder and verifier medians separately.
  const rows = data.models.map((m) => {
    const total = m.stats.cost_usd.med;
    const v = Math.min(m.stats.verifier_cost_usd.med, total);
    return {
      key: m.key,
      name: m.name,
      group: m.group,
      builder: total - v,
      verifier: v,
      builderMed: m.stats.builder_cost_usd.med,
      total,
      verifierShare: m.verifier_cost_share,
      builderReq: m.stats.builder_requests.med,
      verifierReq: m.stats.verifier_requests.med,
      selfTerm: m.self_terminated_sessions,
    };
  });
  const axisMax = rows.reduce((a, r) => Math.max(a, r.total), 0) || 1;
  const groups = ['F', 'C'];

  // Verdict panel figures.
  const vd = data.verdicts;
  const verdictTotal = vd.gate_pass || 1;
  const verdictSegs = [
    {id: 'pass', color: VERDICT.pass, count: vd.pass, label: L.vPass},
    {id: 'failPort', color: VERDICT.failPort, count: vd.fail_port, label: L.vFailPort},
    {id: 'none', color: VERDICT.none, count: vd.none, label: L.vNone},
  ];
  const portModels = Object.entries(vd.fail_port_by_model || {})
    .map(([k, n]) => `${nameOf(k)} (${n})`)
    .join(', ');

  const hasSelfTerm = rows.some((r) => r.selfTerm > 0);

  const dataFallback = (
    <details className={styles.details}>
      <summary>{t(lang, 'showData')}</summary>
      <div className={styles.tableScroll} role="region" tabIndex={0} aria-label={L.ariaChart}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">{L.thModel}</th>
              <th scope="col">{L.thBuilderReq}</th>
              <th scope="col">{L.thVerifierReq}</th>
              <th scope="col">{L.thBuilderCost}</th>
              <th scope="col">{L.thVerifierCost}</th>
              <th scope="col">{L.thVerifierShare}</th>
              <th scope="col">{L.thSelfTerm}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((g) => (
              <React.Fragment key={g}>
                <tr>
                  <th scope="rowgroup" colSpan={7} className={styles.groupCell}>
                    {groupLabel(g, lang)}
                  </th>
                </tr>
                {rows.filter((r) => r.group === g).map((r) => (
                  <tr key={r.key}>
                    <th scope="row">{r.name}</th>
                    <td className={styles.num}>{fmt.int(r.builderReq, lang)}</td>
                    <td className={styles.num}>{fmt.int(r.verifierReq, lang)}</td>
                    <td className={styles.num}>{fmt.usd(r.builderMed)}</td>
                    <td className={styles.num}>{fmt.usd(r.verifier)}</td>
                    <td className={styles.num}>{fmt.pct(r.verifierShare)}</td>
                    <td className={styles.num}>{fmt.int(r.selfTerm, lang)}</td>
                  </tr>
                ))}
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
      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{background: ROLE.builder}} />
          {L.builder}
        </span>
        <span className={styles.legendItem}>
          <span className={styles.swatch} style={{background: ROLE.verifier}} />
          {L.verifier}
        </span>
        <span className={styles.axisNote}>{L.axis}</span>
      </div>

      {/* Part a: per-model builder/verifier bars on a shared USD axis. */}
      <div className={styles.rows}>
        {groups.map((g) => (
          <React.Fragment key={g}>
            <div className={styles.groupRow}>{groupLabel(g, lang)}</div>
            {rows.filter((r) => r.group === g).map((r) => {
              const barId = `${baseId}-${r.key}`;
              const bPct = (r.builder / axisMax) * 100;
              const vPct = (r.verifier / axisMax) * 100;
              return (
                <div className={styles.row} key={r.key}>
                  <div className={styles.rowLabel}>
                    <span className={styles.modelName}>{r.name}</span>
                    <span className={styles.reqText}>
                      {L.reqFmt(fmt.int(r.builderReq, lang), fmt.int(r.verifierReq, lang))}
                    </span>
                    {r.selfTerm > 0 && (
                      <span className={styles.badge}>{L.selfTermBadge(r.selfTerm)}</span>
                    )}
                  </div>
                  <div className={styles.barCell}>
                    <span id={barId} className={styles.srOnly}>
                      {`${r.name}: ${fmt.usd(r.total)}, ${L.verifier} ${fmt.usd(r.verifier)} (${fmt.pct(r.verifierShare)})`}
                    </span>
                    <div className={styles.track} role="img" aria-labelledby={barId}>
                      <span className={styles.seg} style={{width: `${bPct}%`, background: ROLE.builder}} />
                      <span className={styles.seg} style={{width: `${vPct}%`, background: ROLE.verifier}} />
                    </div>
                    <span className={styles.barValue}>
                      {fmt.usd(r.total)}
                      <span className={styles.barShare}>{L.shareFmt(fmt.pct(r.verifierShare))}</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {hasSelfTerm && <p className={styles.footnote}>{L.footnote}</p>}

      {/* Part b: verifier verdict panel. */}
      <div className={styles.verdict}>
        <div className={styles.verdictHead}>{L.verdictHead}</div>
        <div className={styles.verdictBar} role="img" aria-label={L.ariaVerdict}>
          {verdictSegs.map((s) => {
            const pct = (s.count / verdictTotal) * 100;
            if (pct <= 0) return null;
            return (
              <span
                key={s.id}
                className={styles.verdictSeg}
                style={{width: `${pct}%`, background: s.color}}
              />
            );
          })}
        </div>
        <div className={styles.verdictLegend}>
          {verdictSegs.map((s) => (
            <span key={s.id} className={styles.legendItem}>
              <span className={styles.swatch} style={{background: s.color}} />
              {`${s.label}: ${fmt.int(s.count, lang)}`}
            </span>
          ))}
        </div>
        <p className={styles.verdictLine}>{L.falsePass(fmt.int(vd.false_pass, lang))}</p>
        {portModels && (
          <p className={styles.verdictLine}>{`${L.portFailModels}: ${portModels}`}</p>
        )}
        <p className={styles.caveat}>{L.caveat}</p>
      </div>
    </Figure>
  );
}
