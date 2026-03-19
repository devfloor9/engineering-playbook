import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const GoldenSignals = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const signals = [
    {
      icon: '📈',
      name: isKo ? '트래픽 (Throughput)' : isZh ? '流量 (Throughput)' : 'Throughput',
      metric: 'coredns_dns_requests_total',
      description: isKo
        ? '초당 DNS 요청 수(QPS). Pod별 부하 균등 여부를 확인하고, 지속 증가 시 스케일 아웃을 검토합니다.'
        : isZh
        ? '每秒 DNS 请求数(QPS)。检查各 Pod 负载是否均衡，持续增长时考虑横向扩展。'
        : 'DNS queries per second (QPS). Check per-Pod load balance; consider scale-out on sustained growth.',
      color: '#3b82f6'
    },
    {
      icon: '⏱️',
      name: isKo ? '지연 시간 (Latency)' : isZh ? '延迟 (Latency)' : 'Latency',
      metric: 'coredns_dns_request_duration_seconds',
      description: isKo
        ? 'P99 응답 시간. 평소보다 높아지면 업스트림 DNS 지연 또는 CoreDNS CPU/메모리 포화를 점검합니다.'
        : isZh
        ? 'P99 响应时间。高于正常值时，检查上游 DNS 延迟或 CoreDNS CPU/内存饱和。'
        : 'P99 response time. If elevated, check upstream DNS latency or CoreDNS CPU/memory saturation.',
      color: '#f59e0b'
    },
    {
      icon: '❌',
      name: isKo ? '오류 (Errors)' : isZh ? '错误 (Errors)' : 'Errors',
      metric: 'coredns_dns_responses_total{rcode=SERVFAIL}',
      description: isKo
        ? 'SERVFAIL/REFUSED 비율 증가 시 외부 통신 또는 접근 권한 문제를 점검합니다. NXDOMAIN 급증은 잘못된 도메인 조회를 의미합니다.'
        : isZh
        ? 'SERVFAIL/REFUSED 比例增加时，检查外部通信或访问权限问题。NXDOMAIN 激增意味着错误的域名查询。'
        : 'Check external connectivity or ACL issues on SERVFAIL/REFUSED spike. NXDOMAIN surge indicates wrong domain lookups.',
      color: '#ef4444'
    },
    {
      icon: '💻',
      name: isKo ? '자원 사용량 (Resource)' : isZh ? '资源使用 (Resource)' : 'Resource',
      metric: 'CPU / Memory utilization',
      description: isKo
        ? 'EKS 기본 메모리 요청/제한: 70Mi/170Mi. 150Mi 초과 시 경보 설정. CPU 제한 도달 시 스로틀링으로 DNS 지연 발생.'
        : isZh
        ? 'EKS 默认内存请求/限制：70Mi/170Mi。超过 150Mi 时设置告警。CPU 达到限制会导致节流和 DNS 延迟。'
        : 'EKS default memory request/limit: 70Mi/170Mi. Alert above 150Mi. CPU throttling at limit causes DNS latency.',
      color: '#8b5cf6'
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
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0284c7 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🎯 CoreDNS 4 Golden Signals' : isZh ? '🎯 CoreDNS 四大黄金信号' : '🎯 CoreDNS 4 Golden Signals'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'Google SRE 방법론 기반 핵심 모니터링 지표' : isZh ? '基于 Google SRE 方法论的核心监控指标' : 'Core monitoring indicators based on Google SRE methodology'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {signals.map((signal, idx) => (
          <div key={idx} style={{
            display: 'flex',
            gap: '16px',
            padding: '16px 20px',
            borderBottom: idx < signals.length - 1 ? '1px solid #f3f4f6' : 'none',
            alignItems: 'flex-start'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '8px',
              background: `${signal.color}15`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              flexShrink: 0
            }}>
              {signal.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--ifm-font-color-base)' }}>{signal.name}</span>
                <code style={{
                  background: 'var(--ifm-color-emphasis-100)',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  color: signal.color,
                  fontWeight: '600'
                }}>{signal.metric}</code>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ifm-font-color-base)', lineHeight: '1.5' }}>
                {signal.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GoldenSignals;
