import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Figure from './Figure';
import ManualTable from './ArchitectureTables/ManualTable';
import CniMetricPanel from './CniMetricPanel';
import {scenarios} from './CniBenchmarkData';
import styles from './ThroughputChart.module.css';

export default function HttpPerformanceChart() {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  return (
    <div data-ep-theme="manual" className={styles.root}>
      <Figure
        title={isKo ? '서로 다른 두 HTTP 부하 실행의 요약' : 'Summaries from two different HTTP load runs'}
        description={isKo
          ? 'p99는 목표 1,000 QPS 실행, 처리량은 속도 제한 없는 실행의 값입니다. 두 값을 동일 부하에서 얻은 결과처럼 조합하지 않습니다.'
          : 'p99 comes from the 1,000-QPS target run; throughput comes from the uncapped run. They are not paired observations at the same load.'}
        source={isKo ? '2026-02-09 요약 JSON의 http.qps_1000과 http.qps_max. 오류별·반복별 원본 로그 미제공.'
          : 'http.qps_1000 and http.qps_max in the 2026-02-09 summaries. Error and replicate logs are unavailable.'}
        dataFallback={<ManualTable
          title={isKo ? '저장된 HTTP 결과' : 'Stored HTTP results'}
          headers={[isKo ? '시나리오' : 'Scenario', 'p99 @ 1,000 QPS (ms)', isKo ? '속도 제한 없는 실행 (QPS)' : 'Uncapped run (QPS)']}
          rows={scenarios.map(s => [`${s.id}: ${s.label}`, s.p99.toFixed(2), s.qps.toFixed(1)])} numericColumns={[1, 2]} />}
      >
        <CniMetricPanel title="p99 @ 1,000 QPS" metric="p99" unit="ms" maximum={12}
          note={isKo ? 'D는 8.75 ms, E는 9.89 ms입니다. 기존 본문이 E에 인용한 8.75 ms를 바로잡았습니다.'
            : 'D reports 8.75 ms; E reports 9.89 ms. The earlier report incorrectly attributed 8.75 ms to E.'} />
        <CniMetricPanel title={isKo ? '속도 제한 없는 실행의 처리량' : 'Throughput in the uncapped run'} metric="qps" unit="QPS" maximum={5000} digits={1}
          note={isKo ? '0부터 시작하는 동일 눈금을 사용합니다. 이 한 번의 부하 설정으로 시스템의 최대 지속 처리량을 정할 수 없습니다.'
            : 'The common axis starts at zero. This load setting alone does not establish maximum sustainable throughput.'} />
      </Figure>
    </div>
  );
}
