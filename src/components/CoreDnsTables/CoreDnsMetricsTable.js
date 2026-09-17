import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CopyButton from '../CopyButton';
import styles from './CoreDnsMetricsTable.module.css';
const CoreDnsMetricsTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const metrics = [{
    name: 'coredns_dns_requests_total',
    type: 'Counter',
    signal: isKo ? '트래픽' : 'Throughput',
    signalColor: '#3b82f6',
    description: isKo ? 'DNS 요청 총 수 (프로토콜/타입별). rate()로 QPS 산출' : 'Total DNS requests (by proto/type). Use rate() for QPS',
    query: 'rate(coredns_dns_requests_total[5m])'
  }, {
    name: 'coredns_dns_request_duration_seconds',
    type: 'Histogram',
    signal: isKo ? '지연' : 'Latency',
    signalColor: '#f59e0b',
    description: isKo ? 'DNS 처리 시간 분포. P99 > 100ms 시 업스트림/리소스 점검' : 'DNS processing time distribution. Check upstream/resources if P99 > 100ms',
    query: 'histogram_quantile(0.99, rate(coredns_dns_request_duration_seconds_bucket[5m]))'
  }, {
    name: 'coredns_dns_responses_total',
    type: 'Counter',
    signal: isKo ? '오류' : 'Errors',
    signalColor: '#ef4444',
    description: isKo ? 'DNS 응답 코드별 분포. SERVFAIL/NXDOMAIN 비율 추적' : 'DNS response code distribution. Track SERVFAIL/NXDOMAIN ratios',
    query: 'rate(coredns_dns_responses_total{rcode="SERVFAIL"}[5m])'
  }, {
    name: 'coredns_cache_hits_total',
    type: 'Counter',
    signal: isKo ? '캐시' : 'Cache',
    signalColor: '#059669',
    description: isKo ? '캐시 적중 수 (success/denial). 캐시 히트율 산출에 활용' : 'Cache hits (success/denial). Used to calculate cache hit ratio',
    query: 'rate(coredns_cache_hits_total[5m])'
  }, {
    name: 'coredns_cache_misses_total',
    type: 'Counter',
    signal: isKo ? '캐시' : 'Cache',
    signalColor: '#059669',
    description: isKo ? '캐시 미스 수. 히트율 = hits / (hits + misses)' : 'Cache misses. Hit ratio = hits / (hits + misses)',
    query: 'rate(coredns_cache_misses_total[5m])'
  }, {
    name: 'coredns_forward_requests_total',
    type: 'Counter',
    signal: isKo ? '포워드' : 'Forward',
    signalColor: '#6366f1',
    description: isKo ? '업스트림 DNS 전달 요청 수. 캐시 미스 시 발생' : 'Upstream DNS forwarded requests. Triggered on cache miss',
    query: 'rate(coredns_forward_requests_total[5m])'
  }, {
    name: 'coredns_forward_responses_total',
    type: 'Counter',
    signal: isKo ? '포워드' : 'Forward',
    signalColor: '#6366f1',
    description: isKo ? '업스트림 DNS 응답 수 (rcode별). 업스트림 오류 모니터링' : 'Upstream DNS responses (by rcode). Monitor upstream errors',
    query: 'rate(coredns_forward_responses_total[5m])'
  }, {
    name: 'coredns_panics_total',
    type: 'Counter',
    signal: isKo ? '안정성' : 'Stability',
    signalColor: '#dc2626',
    description: isKo ? 'CoreDNS 패닉 횟수. 0이 아니면 즉시 조사 필요' : 'CoreDNS panic count. Investigate immediately if non-zero',
    query: 'coredns_panics_total'
  }];
  const labels = isKo
    ? ['메트릭', '시그널', '설명 / PromQL']
    : ['Metric', 'Signal', 'Description / PromQL'];
  return (
    <div className={styles.frame}>
      <table className={styles.table} role="table">
        <caption>{isKo ? 'CoreDNS Prometheus 핵심 메트릭' : 'CoreDNS Prometheus metrics'}</caption>
        <thead role="rowgroup">
          <tr role="row">{labels.map(label => <th key={label} scope="col" role="columnheader">{label}</th>)}</tr>
        </thead>
        <tbody role="rowgroup">
          {metrics.map(metric => (
            <tr key={metric.name} role="row">
              <th scope="row" role="rowheader">
                <code className={styles.metric}>{metric.name}</code>
                <span className={styles.type}>{metric.type}</span>
              </th>
              <td role="cell">
                <span className={styles.mobileLabel} aria-hidden="true">{labels[1]}</span>
                <span className={styles.signal}>{metric.signal}</span>
              </td>
              <td role="cell">
                <span className={styles.mobileLabel} aria-hidden="true">{labels[2]}</span>
                <p>{metric.description}</p>
                <pre className={styles.query} tabIndex={0} aria-label={`PromQL: ${metric.name}`}><code>{metric.query}</code></pre>
                <CopyButton text={metric.query} label={isKo ? '쿼리 복사' : 'Copy query'}
                  ariaLabel={`${isKo ? '쿼리 복사' : 'Copy query'}: ${metric.name}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default CoreDnsMetricsTable;
