import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Figure from './Figure';
import ManualTable from './ArchitectureTables/ManualTable';
import CniMetricPanel from './CniMetricPanel';
import {scenarios} from './CniBenchmarkData';
import styles from './ThroughputChart.module.css';

export default function ThroughputChart() {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  return (
    <div data-ep-theme="manual" className={styles.root}>
      <Figure
        title={isKo ? 'CNI 구성별 보고된 TCP·UDP 처리량' : 'Reported TCP and UDP throughput by CNI configuration'}
        description={isKo
          ? '막대의 범위는 모두 0–14 Gbps입니다. UDP 처리량은 손실률과 함께 읽어야 합니다. 반복 실행 로그가 없어 오차 범위는 알 수 없습니다.'
          : 'Both charts use a 0–14 Gbps scale. Read UDP throughput alongside loss. Per-run logs are unavailable, so uncertainty cannot be estimated.'}
        source={isKo
          ? '2026-02-09 scenario-*.json 요약 파일 5개. 원본 로그·반복 횟수·실행 구성 미검증.'
          : 'Five scenario-*.json summaries dated 2026-02-09. Raw logs, repeat counts and effective configuration are unverified.'}
        dataFallback={<ManualTable
          title={isKo ? '저장된 처리량과 손실률' : 'Stored throughput and loss'}
          headers={[isKo ? '시나리오' : 'Scenario', 'TCP (Gbps)', 'UDP (Gbps)', isKo ? 'UDP 손실률 (%)' : 'UDP loss (%)']}
          rows={scenarios.map(s => [`${s.id}: ${s.label}`, s.tcp.toFixed(2), s.udp.toFixed(2), s.loss.toFixed(2)])}
          numericColumns={[1, 2, 3]} />}
      >
        <CniMetricPanel title={isKo ? 'TCP 처리량' : 'TCP throughput'} metric="tcp" unit="Gbps" maximum={14}
          note={isKo
            ? '저장된 값은 12.34–12.41 Gbps입니다. 이 좁은 범위만으로 다른 트래픽에서도 구성이 동등하다고 결론 내릴 수 없습니다.'
            : 'Stored values range from 12.34 to 12.41 Gbps. This narrow range does not establish equivalence for other traffic patterns.'} />
        <CniMetricPanel title={isKo ? 'UDP 처리량' : 'UDP throughput'} metric="udp" unit="Gbps" maximum={14}
          note={isKo
            ? 'A와 D의 손실률은 각각 20.39%, 20.42%입니다. 송신·수신 원본 로그 없이 처리량 필드에서 손실을 다시 차감하거나 무손실 처리량으로 해석하지 않습니다.'
            : 'A and D report 20.39% and 20.42% loss. Without sender and receiver logs, do not subtract loss again from this field or treat it as loss-free throughput.'} />
      </Figure>
    </div>
  );
}
