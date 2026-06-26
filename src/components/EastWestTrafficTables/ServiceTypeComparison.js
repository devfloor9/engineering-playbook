import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const ServiceTypeComparison = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const services = [{
    name: 'ClusterIP',
    badge: 'L4',
    badgeColor: '#3b82f6',
    behavior: isKo ? '클러스터 내 가상 IP, kube-proxy NAT 분산 (iptables=랜덤, IPVS=라운드로빈)' : 'In-cluster virtual IP, kube-proxy NAT (iptables=random, IPVS=round-robin)',
    pros: isKo ? '간편성, DNS 자동 할당, 추가 비용 없음' : 'Simple, auto DNS, no extra cost',
    cons: isKo ? 'Cross-AZ 무작위 분산, NAT 오버헤드' : 'Random cross-AZ, NAT overhead',
    recommended: true
  }, {
    name: 'Headless',
    badge: 'L4',
    badgeColor: '#3b82f6',
    behavior: isKo ? 'clusterIP 없이 DNS로 모든 Pod IP 직접 노출, 프록시 미경유' : 'No clusterIP, DNS exposes all Pod IPs directly, no proxy',
    pros: isKo ? '직접 연결(지연 최소), gRPC DNS 라운드로빈, StatefulSet 필수' : 'Direct connection (min latency), gRPC DNS round-robin, required for StatefulSet',
    cons: isKo ? '클라이언트 LB 로직 필요, DNS 갱신 지연' : 'Client LB logic needed, DNS refresh delay'
  }, {
    name: 'Internal NLB',
    badge: 'L4',
    badgeColor: '#059669',
    behavior: isKo ? 'AWS NLB Controller, L4 동작, Instance/IP 모드 선택' : 'AWS NLB Controller, L4 operation, Instance/IP mode',
    pros: isKo ? '멀티 AZ 고가용성, L4 초저지연, 고정 IP' : 'Multi-AZ HA, ultra-low L4 latency, static IP',
    cons: isKo ? 'NLB 시간당 비용, Instance 모드 cross-AZ 비용 증가' : 'NLB hourly cost, Instance mode cross-AZ cost increase'
  }, {
    name: 'Internal ALB',
    badge: 'L7',
    badgeColor: '#8b5cf6',
    behavior: isKo ? 'AWS ALB Controller, L7 동작, IP 모드 전용' : 'AWS ALB Controller, L7 operation, IP mode only',
    pros: isKo ? 'L7 기능(경로 라우팅, WAF, gRPC), Cross-Zone 무료' : 'L7 features (path routing, WAF, gRPC), free cross-zone',
    cons: isKo ? 'ALB 시간당 + LCU 비용, 수~수십ms 추가 지연' : 'ALB hourly + LCU cost, ms-level added latency'
  }];
  return <div style={{
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
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '🔀 Kubernetes 서비스 유형별 비교' : '🔀 Kubernetes Service Type Comparison'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? 'East-West 트래픽에 적합한 서비스 유형 선택 가이드' : 'Service type selection guide for East-West traffic'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      overflow: 'hidden'
    }}>
        {services.map((svc, idx) => <div key={idx} style={{
        padding: '14px 20px',
        borderBottom: idx < services.length - 1 ? '1px solid #f3f4f6' : 'none',
        background: svc.recommended ? '#f0f9ff' : 'white'
      }}>
            <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
          flexWrap: 'wrap'
        }}>
              <span style={{
            fontWeight: '700',
            fontSize: '15px',
            color: 'var(--ifm-font-color-base)'
          }}>{svc.name}</span>
              <span style={{
            background: svc.badgeColor,
            color: 'white',
            padding: '1px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: '600'
          }}>{svc.badge}</span>
              {svc.recommended && <span style={{
            background: '#059669',
            color: 'white',
            padding: '1px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '600'
          }}>{isKo ? '기본 권장' : 'Recommended'}</span>}
            </div>
            <div style={{
          fontSize: '13px',
          color: 'var(--ifm-font-color-base)',
          marginBottom: '8px',
          lineHeight: '1.5'
        }}>{svc.behavior}</div>
            <div style={{
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
              <div style={{
            fontSize: '12px'
          }}>
                <span style={{
              color: '#059669',
              fontWeight: '600'
            }}>+</span>{' '}
                <span style={{
              color: 'var(--ifm-font-color-base)'
            }}>{svc.pros}</span>
              </div>
              <div style={{
            fontSize: '12px'
          }}>
                <span style={{
              color: '#dc2626',
              fontWeight: '600'
            }}>-</span>{' '}
                <span style={{
              color: 'var(--ifm-color-emphasis-600)'
            }}>{svc.cons}</span>
              </div>
            </div>
          </div>)}
      </div>

      <div style={{
      background: 'var(--ifm-color-emphasis-100)',
      border: '1px solid #bfdbfe',
      borderRadius: '0 0 8px 8px',
      padding: '12px 16px',
      fontSize: '12px',
      color: '#2563eb',
      lineHeight: '1.6'
    }}>
        💡 <strong>{isKo ? '선택 지침:' : 'Selection Guide:'}</strong>{' '}
        {isKo ? '기본: ClusterIP + Topology Aware Routing | StatefulSet: Headless | L7 필요: Internal ALB (IP 모드) | L4 외부 노출: Internal NLB (IP 모드)' : 'Default: ClusterIP + TAR | StatefulSet: Headless | L7 needed: Internal ALB (IP mode) | L4 external: Internal NLB (IP mode)'}
      </div>
    </div>;
};
export default ServiceTypeComparison;