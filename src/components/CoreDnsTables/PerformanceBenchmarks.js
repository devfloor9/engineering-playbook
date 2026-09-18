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
    critical: '> 50ms / 5m',
    note: isKo ? '부록의 시험 임계치. 트래픽이 있을 때 평가하고 SLO에 맞게 조정' : 'Trial threshold used in the appendix. Evaluate with traffic and adjust to the SLO'
  }, {
    metric: isKo ? '처리량 (QPS/Pod)' : 'Throughput (QPS/Pod)',
    target: isKo ? '부하 시험으로 결정' : 'Determine by load test',
    critical: isKo ? '지연·포화 동반 증가' : 'Growth with latency/saturation',
    note: isKo ? '낮은 QPS만으로 장애를 판단하지 않음. 쿼리 구성과 리소스에 따라 용량이 달라짐' : 'Low QPS alone is not a failure. Capacity depends on query mix and resources'
  }, {
    metric: isKo ? '캐시 적중률' : 'Cache Hit Ratio',
    target: '> 80%',
    critical: '< 50%',
    note: isKo ? '반복 질의가 많은 워크로드의 시험값. TTL 30s가 이 적중률을 보장하지 않음' : 'Trial values for workloads with repeated queries. TTL 30s does not guarantee this hit ratio'
  }, {
    metric: isKo ? '오류율 (SERVFAIL)' : 'Error Rate (SERVFAIL)',
    target: '< 0.1%',
    critical: '> 1%',
    note: isKo ? '전체 응답 대비 SERVFAIL 비율의 시험값. 예상 NXDOMAIN 제외' : 'Trial SERVFAIL ratio over all responses. Excludes expected NXDOMAIN'
  }, {
    metric: isKo ? 'CPU 사용률' : 'CPU Utilization',
    target: '< 60%',
    critical: '> 80%',
    note: isKo ? 'CPU limit이 설정된 경우 그 값 대비 비율. 실제 throttling과 함께 평가' : 'Percent of the configured CPU limit, if present. Evaluate alongside actual throttling'
  }, {
    metric: isKo ? '메모리 사용률' : 'Memory Utilization',
    target: '< 120Mi',
    critical: '> 150Mi',
    note: isKo ? '실제 메모리 limit이 170Mi인 배포만의 예시. EKS 공통 기본값이나 측정 결과가 아님' : 'Example only for a deployment with an actual 170Mi limit. Not an EKS default or measured result'
  }];
  const tuning = [{
    param: 'max_concurrent',
    defaultVal: isKo ? 'v1.11.3: 생략 시 제한 없음' : 'v1.11.3: no cap when omitted',
    tuned: '2000',
    note: isKo ? '시험값. 업스트림 QPS × 응답 시간 + 여유분, 질의당 약 2KB 추가 메모리 고려' : 'Trial value. Size from upstream QPS × latency plus headroom; allow roughly 2KB per query'
  }, {
    param: 'Replica Count',
    defaultVal: isKo ? '현재 Deployment 확인' : 'Inspect current Deployment',
    tuned: isKo ? '노드 비례 자동' : 'Auto-proportional',
    note: isKo ? '지원되는 EKS 애드온 자동 확장 또는 Cluster Proportional Autoscaler 평가' : 'Evaluate supported EKS add-on autoscaling or Cluster Proportional Autoscaler'
  }, {
    param: 'lameduck',
    defaultVal: isKo ? 'v1.11.3: 생략 시 지연 없음' : 'v1.11.3: no delay when omitted',
    tuned: '5s',
    note: isKo ? '시험값. /ready와 endpoint 전파를 확인하고 Pod 종료 유예 시간에 여유 확보' : 'Trial value. Check /ready and endpoint propagation; allow headroom in the Pod grace period'
  }];
  const benchmarkColumns = isKo ? ['지표', '목표 예시', '조사 기준 예시', '적용 조건'] : ['Metric', 'Example target', 'Example investigation trigger', 'Scope'];
  const tuningColumns = isKo ? ['파라미터', '기준 구성', '시험값', '적용 조건'] : ['Parameter', 'Baseline scope', 'Trial value', 'Scope'];
  return <>
    <p>{isKo ? '아래 수치는 측정된 벤치마크나 공통 EKS 권장값이 아닙니다. 실제 워크로드와 SLO에 맞춰 검증할 예시입니다.' : 'These are examples to validate against your workload and SLO, not measured benchmarks or universal EKS recommendations.'}</p>
    <DataTableFrame title={isKo ? 'CoreDNS 성능 목표 예시' : 'Example CoreDNS performance targets'}>
      <table>
        <thead><tr>{benchmarkColumns.map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
        <tbody>{benchmarks.map(row => <tr key={row.metric}>
          <th scope="row">{row.metric}</th><td>{row.target}</td><td>{row.critical}</td><td>{row.note}</td>
        </tr>)}</tbody>
      </table>
    </DataTableFrame>
    <p>{isKo ? '플러그인 기본 동작 출처: ' : 'Plugin baseline sources: '}
      <a href="https://github.com/coredns/coredns/blob/v1.11.3/plugin/forward/forward.go">forward v1.11.3</a>
      {' · '}
      <a href="https://github.com/coredns/coredns/blob/v1.11.3/plugin/health/health.go">health v1.11.3</a>
    </p>
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
