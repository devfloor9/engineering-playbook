import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CoreDnsMetricsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      name: 'coredns_dns_requests_total',
      type: 'Counter',
      signal: isKo ? '트래픽' : isZh ? '流量' : 'Throughput',
      signalColor: '#3b82f6',
      description: isKo
        ? 'DNS 요청 총 수 (프로토콜/타입별). rate()로 QPS 산출'
        : isZh
        ? 'DNS 请求总数（按协议/类型）。用 rate() 计算 QPS'
        : 'Total DNS requests (by proto/type). Use rate() for QPS',
      query: 'rate(coredns_dns_requests_total[5m])'
    },
    {
      name: 'coredns_dns_request_duration_seconds',
      type: 'Histogram',
      signal: isKo ? '지연' : isZh ? '延迟' : 'Latency',
      signalColor: '#f59e0b',
      description: isKo
        ? 'DNS 처리 시간 분포. P99 > 100ms 시 업스트림/리소스 점검'
        : isZh
        ? 'DNS 处理时间分布。P99 > 100ms 时检查上游/资源'
        : 'DNS processing time distribution. Check upstream/resources if P99 > 100ms',
      query: 'histogram_quantile(0.99, rate(coredns_dns_request_duration_seconds_bucket[5m]))'
    },
    {
      name: 'coredns_dns_responses_total',
      type: 'Counter',
      signal: isKo ? '오류' : isZh ? '错误' : 'Errors',
      signalColor: '#ef4444',
      description: isKo
        ? 'DNS 응답 코드별 분포. SERVFAIL/NXDOMAIN 비율 추적'
        : isZh
        ? 'DNS 响应码分布。跟踪 SERVFAIL/NXDOMAIN 比例'
        : 'DNS response code distribution. Track SERVFAIL/NXDOMAIN ratios',
      query: 'rate(coredns_dns_responses_total{rcode="SERVFAIL"}[5m])'
    },
    {
      name: 'coredns_cache_hits_total',
      type: 'Counter',
      signal: isKo ? '캐시' : isZh ? '缓存' : 'Cache',
      signalColor: '#059669',
      description: isKo
        ? '캐시 적중 수 (success/denial). 캐시 히트율 산출에 활용'
        : isZh
        ? '缓存命中数（success/denial）。用于计算缓存命中率'
        : 'Cache hits (success/denial). Used to calculate cache hit ratio',
      query: 'rate(coredns_cache_hits_total[5m])'
    },
    {
      name: 'coredns_cache_misses_total',
      type: 'Counter',
      signal: isKo ? '캐시' : isZh ? '缓存' : 'Cache',
      signalColor: '#059669',
      description: isKo
        ? '캐시 미스 수. 히트율 = hits / (hits + misses)'
        : isZh
        ? '缓存未命中数。命中率 = hits / (hits + misses)'
        : 'Cache misses. Hit ratio = hits / (hits + misses)',
      query: 'rate(coredns_cache_misses_total[5m])'
    },
    {
      name: 'coredns_forward_requests_total',
      type: 'Counter',
      signal: isKo ? '포워드' : isZh ? '转发' : 'Forward',
      signalColor: '#6366f1',
      description: isKo
        ? '업스트림 DNS 전달 요청 수. 캐시 미스 시 발생'
        : isZh
        ? '上游 DNS 转发请求数。缓存未命中时发生'
        : 'Upstream DNS forwarded requests. Triggered on cache miss',
      query: 'rate(coredns_forward_requests_total[5m])'
    },
    {
      name: 'coredns_forward_responses_total',
      type: 'Counter',
      signal: isKo ? '포워드' : isZh ? '转发' : 'Forward',
      signalColor: '#6366f1',
      description: isKo
        ? '업스트림 DNS 응답 수 (rcode별). 업스트림 오류 모니터링'
        : isZh
        ? '上游 DNS 响应数（按 rcode）。监控上游错误'
        : 'Upstream DNS responses (by rcode). Monitor upstream errors',
      query: 'rate(coredns_forward_responses_total[5m])'
    },
    {
      name: 'coredns_panics_total',
      type: 'Counter',
      signal: isKo ? '안정성' : isZh ? '稳定性' : 'Stability',
      signalColor: '#dc2626',
      description: isKo
        ? 'CoreDNS 패닉 횟수. 0이 아니면 즉시 조사 필요'
        : isZh
        ? 'CoreDNS panic 次数。非零时需立即调查'
        : 'CoreDNS panic count. Investigate immediately if non-zero',
      query: 'coredns_panics_total'
    }
  ];

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '📊 CoreDNS Prometheus 핵심 메트릭' : isZh ? '📊 CoreDNS Prometheus 核心指标' : '📊 CoreDNS Core Prometheus Metrics'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'EKS 기본 포트 9153 (/metrics)으로 노출' : isZh ? 'EKS 默认通过端口 9153 (/metrics) 暴露' : 'Exposed via port 9153 (/metrics) by default on EKS'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Header Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 80px 1fr',
          borderBottom: '2px solid var(--ifm-color-emphasis-200)',
          background: 'var(--ifm-background-surface-color)'
        }}>
          <div style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12px', color: 'var(--ifm-color-emphasis-600)', textTransform: 'uppercase' }}>
            {isKo ? '메트릭' : isZh ? '指标' : 'Metric'}
          </div>
          <div style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12px', color: 'var(--ifm-color-emphasis-600)', textTransform: 'uppercase', borderLeft: '1px solid var(--ifm-color-emphasis-200)' }}>
            {isKo ? '시그널' : isZh ? '信号' : 'Signal'}
          </div>
          <div style={{ padding: '10px 14px', fontWeight: '600', fontSize: '12px', color: 'var(--ifm-color-emphasis-600)', textTransform: 'uppercase', borderLeft: '1px solid var(--ifm-color-emphasis-200)' }}>
            {isKo ? '설명 / PromQL' : isZh ? '说明 / PromQL' : 'Description / PromQL'}
          </div>
        </div>

        {/* Data Rows */}
        {metrics.map((m, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '1fr 80px 1fr',
            borderBottom: idx < metrics.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{ padding: '12px 14px' }}>
              <code style={{ fontSize: '12px', color: '#2563eb', fontWeight: '600', wordBreak: 'break-all' }}>{m.name}</code>
              <div style={{ fontSize: '11px', color: 'var(--ifm-color-emphasis-500)', marginTop: '2px' }}>{m.type}</div>
            </div>
            <div style={{
              padding: '12px 14px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                display: 'inline-block',
                background: m.signalColor,
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>{m.signal}</span>
            </div>
            <div style={{ padding: '12px 14px', borderLeft: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: '13px', color: 'var(--ifm-font-color-base)', marginBottom: '4px' }}>{m.description}</div>
              <code style={{ fontSize: '11px', color: '#7c3aed', background: 'var(--ifm-color-emphasis-100)', padding: '2px 6px', borderRadius: '3px', wordBreak: 'break-all' }}>{m.query}</code>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoreDnsMetricsTable;
