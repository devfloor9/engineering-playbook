import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const ScenarioMatrix = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const scenarios = [{
    icon: '🔧',
    scenario: isKo ? '단순 내부 마이크로서비스 (HTTP/gRPC, 지연 민감)' : 'Simple internal microservices (HTTP/gRPC, latency-sensitive)',
    scope: 'Single Cluster',
    solution: isKo ? 'ClusterIP + Topology Aware Routing + NodeLocal DNSCache. 필요 시 InternalTrafficPolicy(Local)로 동일 노드 최적화' : 'ClusterIP + TAR + NodeLocal DNSCache. Optionally InternalTrafficPolicy(Local) for same-node optimization',
    color: '#3b82f6'
  }, {
    icon: '🗄️',
    scenario: isKo ? 'StatefulSet (DB 등 TCP, 세션 필요)' : 'StatefulSet (DB, TCP, session required)',
    scope: 'Single Cluster',
    solution: isKo ? 'Headless 서비스 + 클라이언트 DNS 라운드로빈. 클라이언트와 같은 AZ에 리더-팔로워 스케줄링' : 'Headless service + client DNS round-robin. Schedule leader-follower in same AZ as client',
    color: '#8b5cf6'
  }, {
    icon: '🌐',
    scenario: isKo ? '대용량 L7 트래픽 (라우팅/WAF 필요)' : 'High-volume L7 traffic (routing/WAF needed)',
    scope: 'Single Cluster',
    solution: isKo ? 'Internal ALB (IP 모드) + ClusterIP 서비스 연결. ALB는 필요한 서비스에만 사용' : 'Internal ALB (IP mode) + ClusterIP service. ALB only where needed',
    color: '#f59e0b'
  }, {
    icon: '🔒',
    scenario: isKo ? '보안 민감 (mTLS/Zero-Trust 필수)' : 'Security-sensitive (mTLS/Zero-Trust required)',
    scope: 'Single/Multi Cluster',
    solution: isKo ? 'Istio 서비스 메쉬. mTLS + AuthorizationPolicy. 레이턴시 요구와 트래픽량 검토' : 'Istio service mesh. mTLS + AuthorizationPolicy. Review latency requirements and traffic volume',
    color: '#ef4444'
  }, {
    icon: '💰',
    scenario: isKo ? '멀티 AZ 비용 최적화 (트래픽 많음, 메쉬 미사용)' : 'Multi-AZ cost optimization (high traffic, no mesh)',
    scope: isKo ? '단일 클러스터' : 'Single Cluster',
    solution: isKo ? 'Topology Hints + IP 모드 LB + Pod Spread + NAT GW AZ별 분리' : 'Topology Hints + IP mode LB + Pod Spread + NAT GW per AZ',
    color: '#059669'
  }, {
    icon: '🔗',
    scenario: isKo ? '멀티 클러스터 (동일 계정, 낮은 운영 복잡도)' : 'Multi-cluster (same account, low ops complexity)',
    scope: isKo ? '멀티 클러스터' : 'Multi-cluster',
    solution: isKo ? 'Cilium ClusterMesh. Pod 직접 통신, 추가 비용 없이 저지연' : 'Cilium ClusterMesh. Direct Pod communication, low latency with no extra cost',
    color: '#2563eb'
  }, {
    icon: '🏢',
    scenario: isKo ? '멀티 계정/조직 (IAM 통제, 운영 인력 적음)' : 'Multi-account/org (IAM control, small ops team)',
    scope: isKo ? '멀티 계정' : 'Multi-account',
    solution: isKo ? 'AWS VPC Lattice. IAM Policy 기반 접근 제어, 통합 모니터링' : 'AWS VPC Lattice. IAM Policy-based access control, unified monitoring',
    color: '#f59e0b'
  }, {
    icon: '🔄',
    scenario: isKo ? '간단한 DR 클러스터 (트래픽 적음)' : 'Simple DR cluster (low traffic)',
    scope: 'DR',
    solution: isKo ? 'DNS + Internal NLB (Route53 + ExternalDNS). DR 시 DNS 스위칭' : 'DNS + Internal NLB (Route53 + ExternalDNS). DNS switching for DR',
    color: 'var(--ifm-color-emphasis-600)'
  }];
  return <div style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '8px 8px 0 0'
    }}>
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '🎯 시나리오별 추천 매트릭스' : '🎯 Scenario-Based Recommendation Matrix'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? '서비스 특성, 보안 요구사항, 운영 복잡도에 따른 권장 솔루션' : 'Recommended solutions by service characteristics, security requirements, and operational complexity'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      overflow: 'hidden'
    }}>
        {scenarios.map((s, idx) => <div key={idx} style={{
        padding: '12px 20px',
        borderBottom: idx < scenarios.length - 1 ? '1px solid #f3f4f6' : 'none',
        borderLeft: `3px solid ${s.color}`
      }}>
            <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '4px',
          flexWrap: 'wrap'
        }}>
              <span style={{
            fontSize: '16px'
          }}>{s.icon}</span>
              <span style={{
            fontWeight: '700',
            fontSize: '13px',
            color: 'var(--ifm-font-color-base)'
          }}>{s.scenario}</span>
              <span style={{
            background: 'var(--ifm-color-emphasis-100)',
            color: 'var(--ifm-color-emphasis-600)',
            padding: '1px 6px',
            borderRadius: '3px',
            fontSize: '10px',
            fontWeight: '600'
          }}>{s.scope}</span>
            </div>
            <div style={{
          fontSize: '12px',
          color: 'var(--ifm-font-color-base)',
          lineHeight: '1.5',
          paddingLeft: '28px'
        }}>
              {s.solution}
            </div>
          </div>)}
      </div>
    </div>;
};
export default ScenarioMatrix;