import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ServiceTypeComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const services = [
    {
      name: 'ClusterIP',
      badge: 'L4',
      badgeColor: '#3b82f6',
      behavior: isKo
        ? '클러스터 내 가상 IP, kube-proxy NAT 분산 (iptables=랜덤, IPVS=라운드로빈)'
        : isZh
        ? '集群内虚拟 IP，kube-proxy NAT 分发（iptables=随机，IPVS=轮询）'
        : 'In-cluster virtual IP, kube-proxy NAT (iptables=random, IPVS=round-robin)',
      pros: isKo
        ? '간편성, DNS 자동 할당, 추가 비용 없음'
        : isZh
        ? '简便，DNS 自动分配，无额外费用'
        : 'Simple, auto DNS, no extra cost',
      cons: isKo
        ? 'Cross-AZ 무작위 분산, NAT 오버헤드'
        : isZh
        ? 'Cross-AZ 随机分发，NAT 开销'
        : 'Random cross-AZ, NAT overhead',
      recommended: true
    },
    {
      name: 'Headless',
      badge: 'L4',
      badgeColor: '#3b82f6',
      behavior: isKo
        ? 'clusterIP 없이 DNS로 모든 Pod IP 직접 노출, 프록시 미경유'
        : isZh
        ? '无 clusterIP，通过 DNS 直接暴露所有 Pod IP，不经过代理'
        : 'No clusterIP, DNS exposes all Pod IPs directly, no proxy',
      pros: isKo
        ? '직접 연결(지연 최소), gRPC DNS 라운드로빈, StatefulSet 필수'
        : isZh
        ? '直连（最低延迟），gRPC DNS 轮询，StatefulSet 必需'
        : 'Direct connection (min latency), gRPC DNS round-robin, required for StatefulSet',
      cons: isKo
        ? '클라이언트 LB 로직 필요, DNS 갱신 지연'
        : isZh
        ? '需客户端 LB 逻辑，DNS 更新延迟'
        : 'Client LB logic needed, DNS refresh delay'
    },
    {
      name: 'Internal NLB',
      badge: 'L4',
      badgeColor: '#059669',
      behavior: isKo
        ? 'AWS NLB Controller, L4 동작, Instance/IP 모드 선택'
        : isZh
        ? 'AWS NLB Controller，L4 运行，Instance/IP 模式可选'
        : 'AWS NLB Controller, L4 operation, Instance/IP mode',
      pros: isKo
        ? '멀티 AZ 고가용성, L4 초저지연, 고정 IP'
        : isZh
        ? '多 AZ 高可用，L4 超低延迟，固定 IP'
        : 'Multi-AZ HA, ultra-low L4 latency, static IP',
      cons: isKo
        ? 'NLB 시간당 비용, Instance 모드 cross-AZ 비용 증가'
        : isZh
        ? 'NLB 每小时费用，Instance 模式 cross-AZ 成本增加'
        : 'NLB hourly cost, Instance mode cross-AZ cost increase'
    },
    {
      name: 'Internal ALB',
      badge: 'L7',
      badgeColor: '#8b5cf6',
      behavior: isKo
        ? 'AWS ALB Controller, L7 동작, IP 모드 전용'
        : isZh
        ? 'AWS ALB Controller，L7 运行，仅 IP 模式'
        : 'AWS ALB Controller, L7 operation, IP mode only',
      pros: isKo
        ? 'L7 기능(경로 라우팅, WAF, gRPC), Cross-Zone 무료'
        : isZh
        ? 'L7 功能（路径路由、WAF、gRPC），Cross-Zone 免费'
        : 'L7 features (path routing, WAF, gRPC), free cross-zone',
      cons: isKo
        ? 'ALB 시간당 + LCU 비용, 수~수십ms 추가 지연'
        : isZh
        ? 'ALB 每小时 + LCU 费用，数~数十ms 额外延迟'
        : 'ALB hourly + LCU cost, ms-level added latency'
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
          {isKo ? '🔀 Kubernetes 서비스 유형별 비교' : isZh ? '🔀 Kubernetes 服务类型对比' : '🔀 Kubernetes Service Type Comparison'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'East-West 트래픽에 적합한 서비스 유형 선택 가이드' : isZh ? 'East-West 流量的服务类型选择指南' : 'Service type selection guide for East-West traffic'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        overflow: 'hidden'
      }}>
        {services.map((svc, idx) => (
          <div key={idx} style={{
            padding: '14px 20px',
            borderBottom: idx < services.length - 1 ? '1px solid #f3f4f6' : 'none',
            background: svc.recommended ? '#f0f9ff' : 'white'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '700', fontSize: '15px', color: '#1f2937' }}>{svc.name}</span>
              <span style={{
                background: svc.badgeColor,
                color: 'white',
                padding: '1px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>{svc.badge}</span>
              {svc.recommended && (
                <span style={{
                  background: '#059669',
                  color: 'white',
                  padding: '1px 8px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>{isKo ? '기본 권장' : isZh ? '默认推荐' : 'Recommended'}</span>
              )}
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '8px', lineHeight: '1.5' }}>{svc.behavior}</div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: '#059669', fontWeight: '600' }}>+</span>{' '}
                <span style={{ color: '#374151' }}>{svc.pros}</span>
              </div>
              <div style={{ fontSize: '12px' }}>
                <span style={{ color: '#dc2626', fontWeight: '600' }}>-</span>{' '}
                <span style={{ color: '#6b7280' }}>{svc.cons}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: '#eff6ff',
        border: '1px solid #bfdbfe',
        borderRadius: '0 0 8px 8px',
        padding: '12px 16px',
        fontSize: '12px',
        color: '#1e40af',
        lineHeight: '1.6'
      }}>
        💡 <strong>{isKo ? '선택 지침:' : isZh ? '选择指南:' : 'Selection Guide:'}</strong>{' '}
        {isKo
          ? '기본: ClusterIP + Topology Aware Routing | StatefulSet: Headless | L7 필요: Internal ALB (IP 모드) | L4 외부 노출: Internal NLB (IP 모드)'
          : isZh
          ? '默认：ClusterIP + Topology Aware Routing | StatefulSet：Headless | 需要 L7：Internal ALB（IP 模式）| L4 外部暴露：Internal NLB（IP 模式）'
          : 'Default: ClusterIP + TAR | StatefulSet: Headless | L7 needed: Internal ALB (IP mode) | L4 external: Internal NLB (IP mode)'}
      </div>
    </div>
  );
};

export default ServiceTypeComparison;
