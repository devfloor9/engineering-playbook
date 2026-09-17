import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DataTableFrame from '../DataTableFrame';
const PerformanceBenchmarks = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const benchmarks = [{
    metric: isKo ? '쿼리 지연 (P99)' : 'Query Latency (P99)',
    target: '< 50ms',
    critical: '> 100ms',
    note: isKo ? '99%의 DNS 쿼리가 50ms 이내 완료' : '99% of DNS queries complete within 50ms'
  }, {
    metric: isKo ? '처리량 (QPS/Pod)' : 'Throughput (QPS/Pod)',
    target: '> 10K',
    critical: '< 5K',
    note: isKo ? 'Pod당 초당 10,000 쿼리 이상 처리' : 'Process 10,000+ queries per second per Pod'
  }, {
    metric: isKo ? '캐시 적중률' : 'Cache Hit Ratio',
    target: '> 80%',
    critical: '< 50%',
    note: isKo ? 'TTL 30s 기준, 80% 이상 캐시 활용' : '80%+ cache utilization with TTL 30s baseline'
  }, {
    metric: isKo ? '오류율 (SERVFAIL)' : 'Error Rate (SERVFAIL)',
    target: '< 0.1%',
    critical: '> 1%',
    note: isKo ? 'SERVFAIL 응답 비율 0.1% 미만 유지' : 'Keep SERVFAIL response ratio under 0.1%'
  }, {
    metric: isKo ? 'CPU 사용률' : 'CPU Utilization',
    target: '< 60%',
    critical: '> 80%',
    note: isKo ? 'CPU 제한 도달 시 스로틀링으로 DNS 지연 발생' : 'CPU throttling at limit causes DNS latency'
  }, {
    metric: isKo ? '메모리 사용률' : 'Memory Utilization',
    target: '< 120Mi',
    critical: '> 150Mi',
    note: isKo ? 'EKS 기본 제한 170Mi. 150Mi 초과 시 경보 설정' : 'EKS default limit 170Mi. Alert above 150Mi'
  }];
  const tuning = [{
    param: 'max_concurrent',
    defaultVal: '1000',
    tuned: '2000+',
    note: isKo ? '동시 질의 한계. 메모리 2KB × 동시 질의 수 고려' : 'Concurrent query limit. Consider memory 2KB × concurrent queries'
  }, {
    param: 'Replica Count',
    defaultVal: '2',
    tuned: isKo ? '노드 비례 자동' : 'Auto-proportional',
    note: isKo ? 'Cluster Proportional Autoscaler 적용' : 'Apply Cluster Proportional Autoscaler'
  }, {
    param: 'lameduck',
    defaultVal: '5s',
    tuned: '30s',
    note: isKo ? '롤링 업데이트 시 DNS 실패 방지' : 'Prevent DNS failures during rolling updates'
  }];
  const benchmarkColumns = isKo ? ['지표', '목표', '임계', '설명'] : ['Metric', 'Target', 'Critical', 'Note'];
  const tuningColumns = isKo ? ['파라미터', '기본값', '조정값', '설명'] : ['Parameter', 'Default', 'Tuned', 'Note'];
  return <>
    <DataTableFrame title={isKo ? 'CoreDNS 성능 목표' : 'CoreDNS performance targets'}>
      <table>
        <thead><tr>{benchmarkColumns.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{benchmarks.map(row => <tr key={row.metric}>
          <th scope="row">{row.metric}</th><td>{row.target}</td><td>{row.critical}</td><td>{row.note}</td>
        </tr>)}</tbody>
      </table>
    </DataTableFrame>
    <DataTableFrame title={isKo ? 'CoreDNS 튜닝 파라미터' : 'CoreDNS tuning parameters'}>
      <table>
        <thead><tr>{tuningColumns.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{tuning.map(row => <tr key={row.param}>
          <th scope="row"><code>{row.param}</code></th><td>{row.defaultVal}</td><td>{row.tuned}</td><td>{row.note}</td>
        </tr>)}</tbody>
      </table>
    </DataTableFrame>
    <p><strong>{isKo ? '벤치마크 도구: ' : 'Benchmark tool: '}</strong>
      <code>dnsperf -s {'<COREDNS_IP>'} -d queries.txt -c 10 -T 10</code>
      {isKo ? '으로 CoreDNS QPS 및 레이턴시를 측정할 수 있습니다.' : ' to measure CoreDNS QPS and latency.'}
    </p>
  </>;
};
export default PerformanceBenchmarks;
