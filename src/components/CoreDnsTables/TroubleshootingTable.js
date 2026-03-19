import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TroubleshootingTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const bestPractices = [
    {
      icon: '📈',
      title: isKo ? 'Cluster Proportional Autoscaler' : isZh ? 'Cluster Proportional Autoscaler' : 'Cluster Proportional Autoscaler',
      description: isKo
        ? 'EKS 기본 CoreDNS 복제수는 2개. 노드 수/CPU 코어에 비례하여 자동 확장하여 DNS 부하를 분산합니다.'
        : isZh
        ? 'EKS 默认 CoreDNS 副本数为 2。根据节点数/CPU 核心数自动扩展，分散 DNS 负载。'
        : 'EKS default CoreDNS replicas is 2. Auto-scale proportionally to node count/CPU cores to distribute DNS load.',
      impact: isKo ? 'DNS QPS 선형 확장' : isZh ? 'DNS QPS 线性扩展' : 'Linear DNS QPS scaling',
      impactColor: '#059669'
    },
    {
      icon: '🗄️',
      title: 'NodeLocal DNSCache',
      description: isKo
        ? '모든 노드에서 DNS 캐시 에이전트(DaemonSet)를 실행하여 로컬 DNS 제공. 네트워크 지연 및 ENI 한계 해소.'
        : isZh
        ? '在所有节点上运行 DNS 缓存代理（DaemonSet），提供本地 DNS。消除网络延迟和 ENI 限制。'
        : 'Run DNS cache agent (DaemonSet) on all nodes for local DNS. Eliminates network latency and ENI limits.',
      impact: isKo ? 'RTT 감소, ENI 병목 해소' : isZh ? 'RTT 降低，ENI 瓶颈消除' : 'Reduced RTT, ENI bottleneck eliminated',
      impactColor: '#3b82f6'
    },
    {
      icon: '🔒',
      title: isKo ? 'DNS 패킷 한계 & 트래픽 분산' : isZh ? 'DNS 包限制 & 流量分散' : 'DNS Packet Limit & Traffic Distribution',
      description: isKo
        ? 'VPC ENI는 초당 1024 DNS 패킷 제한. CoreDNS Pod를 서로 다른 노드에 분산(Pod Anti-Affinity)하여 ENI 한도 분산.'
        : isZh
        ? 'VPC ENI 限制每秒 1024 个 DNS 包。将 CoreDNS Pod 分散到不同节点（Pod Anti-Affinity）以分散 ENI 限制。'
        : 'VPC ENI limits 1024 DNS packets/sec. Spread CoreDNS Pods across nodes (Pod Anti-Affinity) to distribute ENI limits.',
      impact: isKo ? 'ENI PPS 병목 회피' : isZh ? '避免 ENI PPS 瓶颈' : 'Avoid ENI PPS bottleneck',
      impactColor: '#f59e0b'
    },
    {
      icon: '🔄',
      title: isKo ? 'Graceful Termination (Lameduck)' : isZh ? '优雅终止 (Lameduck)' : 'Graceful Termination (Lameduck)',
      description: isKo
        ? 'CoreDNS 재시작/축소 시 일시적 DNS 실패 방지. lameduck 30s 설정 + /ready Readiness Probe 구성.'
        : isZh
        ? '防止 CoreDNS 重启/缩容时的临时 DNS 故障。配置 lameduck 30s + /ready Readiness Probe。'
        : 'Prevent transient DNS failures during CoreDNS restart/scale-down. Configure lameduck 30s + /ready Readiness Probe.',
      impact: isKo ? 'Zero-downtime DNS 롤링 업데이트' : isZh ? 'Zero-downtime DNS 滚动更新' : 'Zero-downtime DNS rolling updates',
      impactColor: '#8b5cf6'
    }
  ];

  const cases = [
    {
      title: isKo ? '사례 1: ENI PPS 한도로 인한 DNS 지연' : isZh ? '案例 1：ENI PPS 限制导致的 DNS 延迟' : 'Case 1: DNS Latency from ENI PPS Limit',
      symptom: isKo
        ? '특정 서비스 DNS 응답 지연 → 전체 응답시간 1초 이상 추가'
        : isZh
        ? '特定服务 DNS 响应延迟 → 整体响应时间增加 1 秒以上'
        : 'Specific service DNS response delay → 1s+ added to total response time',
      cause: isKo
        ? 'CoreDNS가 질의하는 VPC DNS Resolver가 ENI PPS 한도(1024 PPS)에 걸려 패킷 드롭'
        : isZh
        ? 'CoreDNS 查询的 VPC DNS Resolver 达到 ENI PPS 限制（1024 PPS）导致丢包'
        : 'VPC DNS Resolver hit ENI PPS limit (1024 PPS) causing packet drops',
      solution: isKo
        ? 'NodeLocal DNSCache 도입 + CoreDNS Pod 노드 분산(Anti-Affinity)'
        : isZh
        ? '引入 NodeLocal DNSCache + CoreDNS Pod 节点分散（Anti-Affinity）'
        : 'Deploy NodeLocal DNSCache + CoreDNS Pod node distribution (Anti-Affinity)',
      color: '#ef4444'
    },
    {
      title: isKo ? '사례 2: Aurora DNS TTL 캐싱으로 인한 리더 편중' : isZh ? '案例 2：Aurora DNS TTL 缓存导致的读取器偏斜' : 'Case 2: Aurora Reader Skew from DNS TTL Caching',
      symptom: isKo
        ? 'Aurora 리더 노드에 세션 편중 → 일부 리더만 과부하'
        : isZh
        ? 'Aurora 读取器节点会话偏斜 → 部分读取器过载'
        : 'Aurora reader node session skew → Some readers overloaded',
      cause: isKo
        ? 'Aurora Reader 엔드포인트 DNS TTL 1초인데 CoreDNS 최소 TTL 5초로 과도 캐싱'
        : isZh
        ? 'Aurora Reader 端点 DNS TTL 为 1 秒，但 CoreDNS 最小 TTL 5 秒导致过度缓存'
        : 'Aurora Reader endpoint DNS TTL is 1s but CoreDNS min TTL 5s causes over-caching',
      solution: isKo
        ? 'NodeLocal DNSCache에서 amazonaws.com에 cache 1, success/denial 1 설정 적용'
        : isZh
        ? '在 NodeLocal DNSCache 中为 amazonaws.com 配置 cache 1、success/denial 1'
        : 'Configure cache 1 with success/denial 1 for amazonaws.com in NodeLocal DNSCache',
      color: '#f59e0b'
    }
  ];

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🛡️ EKS 모범 사례 & 실무 사례' : isZh ? '🛡️ EKS 最佳实践 & 实战案例' : '🛡️ EKS Best Practices & Real-World Cases'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'AWS 권장 CoreDNS 최적화 전략과 장애 대응 사례' : isZh ? 'AWS 推荐的 CoreDNS 优化策略和故障应对案例' : 'AWS recommended CoreDNS optimization strategies and incident response cases'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        overflow: 'hidden'
      }}>
        {/* Best Practices */}
        {bestPractices.map((bp, idx) => (
          <div key={idx} style={{
            display: 'flex',
            gap: '14px',
            padding: '14px 20px',
            borderBottom: '1px solid #f3f4f6',
            alignItems: 'flex-start'
          }}>
            <div style={{ fontSize: '20px', flexShrink: 0, marginTop: '2px' }}>{bp.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>{bp.title}</span>
                <span style={{
                  background: bp.impactColor,
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>{bp.impact}</span>
              </div>
              <div style={{ fontSize: '13px', color: 'var(--ifm-font-color-base)', lineHeight: '1.5' }}>{bp.description}</div>
            </div>
          </div>
        ))}

        {/* Divider */}
        <div style={{
          padding: '10px 20px',
          background: 'var(--ifm-background-surface-color)',
          borderTop: '1px solid var(--ifm-color-emphasis-200)',
          borderBottom: '1px solid var(--ifm-color-emphasis-200)',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--ifm-color-emphasis-600)',
          textTransform: 'uppercase'
        }}>
          {isKo ? '실무 장애 대응 사례' : isZh ? '实战故障应对案例' : 'Real-World Incident Cases'}
        </div>

        {/* Cases */}
        {cases.map((c, idx) => (
          <div key={idx} style={{
            padding: '14px 20px',
            borderBottom: idx < cases.length - 1 ? '1px solid #f3f4f6' : 'none',
            borderLeft: `3px solid ${c.color}`
          }}>
            <div style={{ fontWeight: '700', fontSize: '14px', color: 'var(--ifm-font-color-base)', marginBottom: '8px' }}>{c.title}</div>
            <div style={{ display: 'grid', gap: '4px' }}>
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                <span style={{ color: '#dc2626', fontWeight: '600' }}>
                  {isKo ? '증상: ' : isZh ? '症状：' : 'Symptom: '}
                </span>
                <span style={{ color: 'var(--ifm-font-color-base)' }}>{c.symptom}</span>
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                <span style={{ color: '#f59e0b', fontWeight: '600' }}>
                  {isKo ? '원인: ' : isZh ? '原因：' : 'Cause: '}
                </span>
                <span style={{ color: 'var(--ifm-font-color-base)' }}>{c.cause}</span>
              </div>
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                <span style={{ color: '#059669', fontWeight: '600' }}>
                  {isKo ? '해결: ' : isZh ? '解决：' : 'Solution: '}
                </span>
                <span style={{ color: 'var(--ifm-font-color-base)' }}>{c.solution}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div style={{
        background: 'var(--ifm-color-emphasis-100)',
        border: '1px solid #fecaca',
        borderRadius: '0 0 8px 8px',
        padding: '12px 16px',
        fontSize: '12px',
        color: '#991b1b',
        lineHeight: '1.6'
      }}>
        ⚠️ <strong>{isKo ? 'ENI DNS 패킷 제한:' : isZh ? 'ENI DNS 包限制:' : 'ENI DNS Packet Limit:'}</strong>{' '}
        {isKo
          ? '각 노드 ENI는 초당 1024개의 DNS 패킷만 허용합니다. CoreDNS의 max_concurrent를 높여도 ENI PPS 한계(1024 PPS)로 인해 성능이 제한될 수 있습니다.'
          : isZh
          ? '每个节点 ENI 每秒仅允许 1024 个 DNS 包。即使提高 CoreDNS 的 max_concurrent，ENI PPS 限制（1024 PPS）也可能制约性能。'
          : 'Each node ENI allows only 1024 DNS packets per second. Even with higher CoreDNS max_concurrent, ENI PPS limit (1024 PPS) may constrain performance.'}
      </div>
    </div>
  );
};

export default TroubleshootingTable;
