import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Figure from './Figure';
import Icon from './Icon';
import ManualTable from './ArchitectureTables/ManualTable';
import styles from './ThroughputChart.module.css';

const scenarios = [
  { id: 'A', label: 'VPC CNI', color: 'var(--ep-chart-1)', tcp: 12.41, udp: 10.00 },
  { id: 'B', label: 'Cilium+kp', color: 'var(--ep-chart-2)', tcp: 12.34, udp: 7.92 },
  { id: 'C', label: 'kp-less', color: 'var(--ep-chart-3)', tcp: 12.34, udp: 7.92 },
  { id: 'D', label: 'ENI', color: 'var(--ep-chart-4)', tcp: 12.41, udp: 10.00 },
  { id: 'E', label: 'ENI+Tuned', color: 'var(--ep-chart-5)', tcp: 12.40, udp: 7.96 },
];
const nicLimit = 12.5;
const maxValue = 14;

function Bar({value, color, label, scenarioId, lossLabel}) {
  return (
    <div className={styles.row}>
      <div className={styles.label}>{scenarioId}: {label}</div>
      <div className={styles.value}>{value.toFixed(2)} Gbps</div>
      <div className={styles.track} aria-hidden="true">
        <div className={styles.bar} data-loss={lossLabel ? 'true' : undefined}
          style={{width: `${(value / maxValue) * 100}%`, backgroundColor: lossLabel ? 'var(--ep-error)' : color}} />
      </div>
      {lossLabel && <div className={styles.status} data-status="error">
        <Icon name="alert-triangle" size={16} /> {lossLabel}
      </div>}
    </div>
  );
}

export default function ThroughputChart() {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const lossLabel = isKo ? '20% 손실' : '20% loss';
  return (
    <div data-ep-theme="manual" className={styles.root}>
      <Figure
        title={isKo ? 'CNI 구성별 TCP·UDP 처리량' : 'TCP and UDP Throughput by CNI Configuration'}
        description={isKo
          ? 'A–E 시나리오의 처리량 비교입니다. 두 막대 그래프의 눈금 범위는 0–14 Gbps입니다. UDP는 패킷 손실률과 함께 해석해야 합니다.'
          : 'Throughput comparison for scenarios A–E. Both bar charts use a 0–14 Gbps scale. Interpret UDP throughput together with packet loss.'}
        source="iperf3 · 10s duration · m6i.xlarge (12.5 Gbps baseline) · Median of 3+ runs"
        dataFallback={<ManualTable
          title={isKo ? '처리량 원본 데이터' : 'Throughput Data'}
          headers={[isKo ? '시나리오' : 'Scenario', 'TCP (Gbps)', 'UDP (Gbps)', isKo ? 'UDP 손실 관측' : 'UDP Loss Observation']}
          rows={scenarios.map(s => [
            `${s.id}: ${s.label}`, s.tcp.toFixed(2), s.udp.toFixed(2),
            s.id === 'A' || s.id === 'D'
              ? <span className={styles.status} data-status="error"><Icon name="alert-triangle" size={16} /> {lossLabel}</span>
              : (isKo ? '이 차트에 손실 수치 미제공' : 'Loss value not supplied in this chart'),
          ])}
          numericColumns={[1, 2]} />}
      >
        <section className={styles.section} aria-label={isKo ? 'TCP 처리량' : 'TCP Throughput'}>
          <p className={styles.sectionTitle}>{isKo ? 'TCP 처리량 (Gbps)' : 'TCP Throughput (Gbps)'}</p>
          <p className={styles.note}>{isKo ? 'NIC 한도: ' : 'NIC limit: '}{nicLimit} Gbps</p>
          {scenarios.map(s => <Bar key={`tcp-${s.id}`} value={s.tcp} color={s.color} label={s.label} scenarioId={s.id} />)}
          <p className={styles.note}>{isKo
            ? '모든 시나리오가 NIC 대역폭(~12.4 Gbps)에 도달했습니다. TCP 처리량은 CNI 구성 간 차별 요소가 아닙니다.'
            : 'All scenarios saturated at NIC bandwidth (~12.4 Gbps). TCP throughput is not a differentiator across CNI configurations.'}</p>
        </section>
        <section className={styles.section} aria-label={isKo ? 'UDP 처리량' : 'UDP Throughput'}>
          <p className={styles.sectionTitle}>{isKo ? 'UDP 처리량 (Gbps)' : 'UDP Throughput (Gbps)'}</p>
          <p className={styles.note}>{isKo ? '높음 ≠ 우수 · 손실률 확인' : 'Higher ≠ better · check loss rate'}</p>
          {scenarios.map(s => <Bar key={`udp-${s.id}`} value={s.udp} color={s.color} label={s.label} scenarioId={s.id}
            lossLabel={s.id === 'A' || s.id === 'D' ? lossLabel : undefined} />)}
          <p className={styles.note}>{isKo
            ? '손실 경고가 표시된 막대는 높은 처리량과 20%+ 패킷 손실을 나타냅니다(Bandwidth Manager 미사용). 원시 처리량이 높아도 실제 데이터 전송량은 더 낮습니다.'
            : 'Bars marked with a loss warning indicate high throughput with 20%+ packet loss (no Bandwidth Manager). Effective data transfer is lower despite higher raw throughput.'}</p>
        </section>
      </Figure>
    </div>
  );
}
