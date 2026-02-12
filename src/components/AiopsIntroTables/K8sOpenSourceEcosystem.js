import React, { useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const K8sOpenSourceEcosystem = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const [activeTab, setActiveTab] = useState(0);

  const categories = [
    {
      title: 'Managed Add-ons',
      shortTitle: 'Managed Add-ons',
      subtitle: isKo ? 'AWS가 수명주기를 직접 관리하는 K8s 확장' : 'K8s extensions with AWS-managed lifecycle',
      color: '#059669',
      badge: 'Managed Add-on',
      items: [
        { oss: 'Kubernetes VPC CNI', managed: 'vpc-cni', desc: 'Pod 네트워킹, Security Group for Pods, Network Policy' },
        { oss: 'CoreDNS', managed: 'coredns', desc: 'K8s 클러스터 내부 DNS 서비스' },
        { oss: 'kube-proxy', managed: 'kube-proxy', desc: 'K8s 서비스 네트워크 프록시' },
        { oss: 'OpenTelemetry Collector', managed: 'adot', desc: '메트릭 · 로그 · 트레이스 수집 (벤더 중립 백엔드 전송)' },
        { oss: 'EBS CSI Driver', managed: 'aws-ebs-csi-driver', desc: 'EBS 블록 스토리지 프로비저닝' },
        { oss: 'EFS CSI Driver', managed: 'aws-efs-csi-driver', desc: 'EFS 파일 스토리지 마운트' },
        { oss: 'Mountpoint for S3 CSI', managed: 'aws-mountpoint-s3-csi-driver', desc: 'S3 객체 스토리지를 파일시스템으로' },
        { oss: 'Snapshot Controller', managed: 'snapshot-controller', desc: 'PV 스냅샷 관리' },
        { oss: 'GuardDuty Agent', managed: 'aws-guardduty-agent', desc: 'K8s 런타임 위협 탐지' },
        { oss: 'Pod Identity Agent', managed: 'eks-pod-identity-agent', desc: 'Pod 수준 IAM 역할 매핑' },
        { oss: 'CloudWatch Observability', managed: 'amazon-cloudwatch-observability', desc: 'Container Insights Enhanced · Application Signals · 1-click 온보딩' },
        { oss: 'Node Monitoring Agent', managed: 'eks-node-monitoring-agent', desc: '노드 하드웨어 · OS 수준 이상 탐지' },
        { oss: 'Network Flow Monitor Agent', managed: 'aws-network-flow-monitoring-agent', desc: 'Container Network Observability 데이터 수집 · Pod 플로우 · Cross-AZ 가시성' },
      ]
    },
    {
      title: 'Community Add-ons Catalog',
      shortTitle: 'Community',
      subtitle: isKo ? '2025.03 출시 — 인기 OSS를 EKS 콘솔/CLI로 배포 · 수명주기 관리' : 'Released 2025.03 — Deploy popular OSS via EKS console/CLI · lifecycle management',
      color: '#0891b2',
      badge: 'Community Add-on',
      items: [
        { oss: 'metrics-server', managed: 'EKS Community Add-on', desc: 'Pod/노드 CPU · 메모리 사용량 수집 (HPA/VPA 필수)' },
        { oss: 'kube-state-metrics', managed: 'EKS Community Add-on', desc: 'K8s 오브젝트 상태 메트릭 (Deployment, Pod, Node 등)' },
        { oss: 'prometheus-node-exporter', managed: 'EKS Community Add-on', desc: '호스트 시스템 메트릭 (CPU, 디스크, 네트워크 등)' },
        { oss: 'cert-manager', managed: 'EKS Community Add-on', desc: 'TLS 인증서 자동 발급 · 갱신 (Let\'s Encrypt 등)' },
        { oss: 'external-dns', managed: 'EKS Community Add-on', desc: 'K8s Service/Ingress → Route 53 DNS 자동 동기화' },
      ]
    },
    {
      title: 'EKS Capabilities',
      shortTitle: 'Capabilities',
      subtitle: isKo ? '2025.11 출시 — 클러스터 외부 AWS 인프라에서 실행, 자동 HA · 업그레이드' : 'Released 2025.11 — Runs on AWS infra outside cluster, auto HA · upgrades',
      color: '#2563eb',
      badge: 'EKS Capability',
      items: [
        { oss: 'Argo CD', managed: 'Managed Argo CD', desc: 'GitOps 기반 지속 배포 (HA · 자동 업그레이드 · 멀티클러스터)' },
        { oss: 'ACK (AWS Controllers for K8s)', managed: 'Managed ACK', desc: '50+ AWS 서비스를 K8s CRD로 선언적 관리' },
        { oss: 'KRO (K8s Resource Orchestrator)', managed: 'Managed KRO', desc: 'ResourceGroup CRD로 복합 리소스 단일 배포' },
      ]
    },
    {
      title: isKo ? '관리형 오픈소스 서비스' : 'Managed Open Source Services',
      shortTitle: isKo ? '관리형 서비스' : 'Managed Services',
      subtitle: isKo ? 'K8s와 직접 연동되는 독립 관리형 서비스' : 'Independent managed services directly integrated with K8s',
      color: '#7c3aed',
      badge: 'Managed Service',
      items: [
        { oss: 'Prometheus', managed: 'AMP (Amazon Managed Prometheus)', desc: '페타바이트 메트릭 저장, PromQL, 자동 스케일링' },
        { oss: 'Grafana', managed: 'AMG (Amazon Managed Grafana)', desc: '엔터프라이즈 대시보드, SSO, 40+ 데이터소스' },
        { oss: 'OpenTelemetry', managed: 'ADOT (AWS Distro for OpenTelemetry)', desc: '벤더 중립 계측, AWS 서비스 네이티브 통합' },
      ]
    },
    {
      title: isKo ? 'AWS 오픈소스 K8s 컨트롤러' : 'AWS Open Source K8s Controllers',
      shortTitle: isKo ? 'OSS 컨트롤러' : 'OSS Controllers',
      subtitle: isKo ? 'AWS가 개발 · 유지보수하는 K8s 네이티브 컨트롤러' : 'K8s-native controllers developed & maintained by AWS',
      color: '#ea580c',
      badge: 'OSS Controller',
      items: [
        { oss: 'Karpenter', managed: 'Helm 설치 (EKS Auto Mode 내장)', desc: '노드 자동 프로비저닝 · 최적화 (Managed Add-on 아님)' },
        { oss: 'AWS Load Balancer Controller', managed: 'LBC v3 (Gateway API GA)', desc: 'ALB/NLB 프로비저닝, Gateway API L4/L7, QUIC/HTTP3, JWT 검증' },
        { oss: 'AWS Node Termination Handler', managed: 'NTH', desc: 'Spot 중단 · 유지보수 이벤트 대응' },
        { oss: 'AWS VPC Resource Controller', managed: 'Security Group for Pods', desc: 'Pod에 ENI 기반 보안 그룹 연결' },
      ]
    }
  ];

  const activeCat = categories[activeTab];

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? 'K8s 관련 오픈소스 프로젝트 · 관리형 서비스 맵' : 'K8s Open Source Projects & Managed Services Map'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'Kubernetes 생태계의 오픈소스와 AWS 관리형 대응 서비스' : 'Open source & AWS managed counterparts in Kubernetes ecosystem'}
        </div>
      </div>

      {/* Tab Bar */}
      <div style={{
        display: 'flex',
        background: '#f8fafc',
        borderLeft: '1px solid #e5e7eb',
        borderRight: '1px solid #e5e7eb',
        overflow: 'hidden'
      }}>
        {categories.map((cat, idx) => (
          <button
            key={cat.title}
            onClick={() => setActiveTab(idx)}
            style={{
              flex: 1,
              padding: '12px 8px',
              border: 'none',
              borderBottom: activeTab === idx ? `3px solid ${cat.color}` : '3px solid transparent',
              background: activeTab === idx ? 'white' : '#f8fafc',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: activeTab === idx ? '700' : '500',
              color: activeTab === idx ? cat.color : '#6b7280',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              fontFamily: 'inherit'
            }}
          >
            <span>{cat.shortTitle}</span>
            <span style={{
              background: activeTab === idx ? `${cat.color}15` : '#e5e7eb',
              color: activeTab === idx ? cat.color : '#9ca3af',
              padding: '1px 6px',
              borderRadius: '10px',
              fontSize: '10px',
              fontWeight: '600'
            }}>
              {cat.items.length}
            </span>
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {/* Category Description */}
        <div style={{
          padding: '14px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: `${activeCat.color}05`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <span style={{
              background: activeCat.color,
              color: 'white',
              padding: '3px 10px',
              borderRadius: '4px',
              fontSize: '12px',
              fontWeight: '600'
            }}>
              {activeCat.badge}
            </span>
            <span style={{ fontWeight: '600', color: '#111827', fontSize: '15px' }}>
              {activeCat.title}
            </span>
          </div>
          <div style={{ color: '#6b7280', fontSize: '13px', paddingLeft: '2px' }}>
            {activeCat.subtitle}
          </div>
        </div>

        {/* Column Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1.1fr 1.4fr',
          gap: '8px',
          padding: '8px 20px',
          borderBottom: '1px solid #e5e7eb',
          background: '#fafafa'
        }}>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isKo ? '오픈소스' : 'Open Source'}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isKo ? 'AWS 관리형' : 'AWS Managed'}
          </div>
          <div style={{ fontSize: '11px', fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {isKo ? '역할' : 'Role'}
          </div>
        </div>

        {/* Items */}
        {activeCat.items.map((item, itemIdx) => (
          <div
            key={item.oss}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1.1fr 1.4fr',
              gap: '8px',
              padding: '10px 20px',
              borderBottom: itemIdx < activeCat.items.length - 1 ? '1px solid #f3f4f6' : 'none',
              borderLeft: `3px solid ${activeCat.color}20`,
              alignItems: 'center'
            }}
          >
            <div style={{ fontSize: '13px', color: '#374151', fontWeight: '500' }}>
              {item.oss}
            </div>
            <div style={{
              fontSize: '13px',
              color: activeCat.color,
              fontWeight: '600'
            }}>
              {item.managed}
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>
              {item.desc}
            </div>
          </div>
        ))}

        {/* Tab Footer Summary */}
        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          {isKo ? (
            <>
              <strong>전체 합계:</strong> Managed Add-ons {categories[0].items.length}개
              + Community {categories[1].items.length}개
              + Capabilities {categories[2].items.length}개
              + 관리형 서비스 {categories[3].items.length}개
              + OSS 컨트롤러 {categories[4].items.length}개
              = <strong>총 {categories.reduce((a, c) => a + c.items.length, 0)}개</strong> K8s 관련 오픈소스 · 관리형 서비스
            </>
          ) : (
            <>
              <strong>Total:</strong> Managed Add-ons {categories[0].items.length}
              + Community {categories[1].items.length}
              + Capabilities {categories[2].items.length}
              + Managed Services {categories[3].items.length}
              + OSS Controllers {categories[4].items.length}
              = <strong>{categories.reduce((a, c) => a + c.items.length, 0)} total</strong> K8s-related open source & managed services
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default K8sOpenSourceEcosystem;
