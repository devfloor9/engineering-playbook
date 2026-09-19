import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Figure from './Figure';
import ManualTable from './ArchitectureTables/ManualTable';
import CniMetricPanel from './CniMetricPanel';
import {scenarios} from './CniBenchmarkData';
import styles from './ThroughputChart.module.css';

export default function LatencyChart() {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  return (
    <div data-ep-theme="manual" className={styles.root}>
      <Figure
        title={isKo ? '보고된 TCP 송신 측 평균 RTT' : 'Reported TCP sender mean RTT'}
        description={isKo
          ? 'mean_rtt_us는 평균값입니다. 애플리케이션 응답 시간이나 p50·p99를 나타내지 않습니다.'
          : 'mean_rtt_us is a mean. It does not represent application response time or p50/p99 latency.'}
        source={isKo ? '2026-02-09 요약 JSON의 network.mean_rtt_us. 원본 iperf3 로그 미제공.'
          : 'network.mean_rtt_us in the 2026-02-09 summaries. Original iperf3 logs are unavailable.'}
        dataFallback={<ManualTable
          title={isKo ? '저장된 평균 RTT' : 'Stored mean RTT'}
          headers={[isKo ? '시나리오' : 'Scenario', isKo ? '평균 RTT (µs)' : 'Mean RTT (µs)']}
          rows={scenarios.map(s => [`${s.id}: ${s.label}`, s.rtt.toFixed(0)])} numericColumns={[1]} />}
      >
        <CniMetricPanel title={isKo ? '평균 RTT' : 'Mean RTT'} metric="rtt" unit="µs" maximum={6000} digits={0}
          note={isKo
            ? 'E의 기록이 가장 작지만 여러 설정이 동시에 바뀌었습니다. 특정 옵션의 효과나 재현 가능한 개선율은 이 기록만으로 입증되지 않습니다.'
            : 'E has the smallest stored value, but several settings changed together. These records do not establish an individual option’s effect or a reproducible improvement rate.'} />
      </Figure>
    </div>
  );
}
