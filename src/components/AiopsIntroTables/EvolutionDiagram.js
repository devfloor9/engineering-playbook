import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EvolutionDiagram = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const stages = [
    {
      stage: isKo ? '1단계' : 'Stage 1',
      title: isKo ? '운영 복잡성 제거' : 'Remove Operational Complexity',
      subtitle: isKo ? 'K8s 네이티브 관리형 서비스로 기반 구축' : 'Build foundation with K8s-native managed services',
      color: '#0d9488',
      gradientFrom: '#0d9488',
      gradientTo: '#14b8a6',
      items: [
        { label: 'Managed Add-ons (22+)', detail: isKo ? 'VPC CNI, CoreDNS, ADOT, GuardDuty, EBS/EFS CSI 등' : 'VPC CNI, CoreDNS, ADOT, GuardDuty, EBS/EFS CSI, etc.' },
        { label: isKo ? '관리형 오픈소스' : 'Managed Open Source', detail: 'AMP(Prometheus), AMG(Grafana), ADOT(OpenTelemetry), MSK(Kafka), OpenSearch ...' },
        { label: 'Community Catalog', detail: isKo ? 'metrics-server, cert-manager, external-dns 등 원클릭 배포' : 'One-click deploy: metrics-server, cert-manager, external-dns, etc.' },
      ],
      outcome: isKo ? '오픈소스의 유연성은 유지하면서 운영 부담을 AWS에 위임' : 'Keep OSS flexibility while delegating ops burden to AWS'
    },
    {
      stage: isKo ? '2단계' : 'Stage 2',
      title: isKo ? '자동화를 위한 핵심 컴포넌트 강화' : 'Strengthen Core Automation Components',
      subtitle: isKo ? 'EKS Capabilities + K8s 네이티브 자동화' : 'EKS Capabilities + K8s-native automation',
      color: '#2563eb',
      gradientFrom: '#2563eb',
      gradientTo: '#3b82f6',
      items: [
        { label: 'Managed Argo CD', detail: isKo ? 'GitOps를 AWS 관리형으로 (HA · 자동 업그레이드 · IAM 통합)' : 'AWS-managed GitOps (HA · auto upgrades · IAM integration)' },
        { label: 'ACK', detail: isKo ? '50+ AWS 서비스를 K8s CRD로 선언적 관리' : 'Declarative management of 50+ AWS services via K8s CRDs' },
        { label: 'KRO', detail: isKo ? 'ResourceGroup CRD로 복합 리소스 단일 배포 단위 구성' : 'ResourceGroup CRD for composite resource deployment' },
        { label: 'LBC v3', detail: isKo ? 'Gateway API GA · JWT 검증 · 헤더 변환' : 'Gateway API GA · JWT validation · header transformation' },
        { label: 'Karpenter', detail: isKo ? '노드 자동 프로비저닝 · 인스턴스 최적화 (EKS Auto Mode 내장)' : 'Auto node provisioning · instance optimization (built into EKS Auto Mode)' },
      ],
      outcome: isKo ? 'EKS가 자동화의 핵심 컴포넌트로 진화' : 'EKS evolves into core automation component'
    },
    {
      stage: isKo ? '3단계' : 'Stage 3',
      title: isKo ? '효율적인 운영을 위한 AI 활용' : 'Leverage AI for Efficient Operations',
      subtitle: isKo ? 'Kiro + Hosted MCP로 프로그래머틱 자동화' : 'Programmatic automation with Kiro + Hosted MCP',
      color: '#7c3aed',
      gradientFrom: '#7c3aed',
      gradientTo: '#8b5cf6',
      items: [
        { label: 'Kiro', detail: isKo ? 'Spec-driven 개발 (requirements → design → tasks → 코드)' : 'Spec-driven development (requirements → design → tasks → code)' },
        { label: 'Hosted MCP Servers', detail: isKo ? 'EKS · Serverless · Cost · Docs를 AI가 직접 접근' : 'AI direct access to EKS · Serverless · Cost · Docs' },
        { label: isKo ? '프로그래머틱 자동화' : 'Programmatic Automation', detail: isKo ? '디렉팅 기반 → 코드 기반 운영 · 디버깅으로 전환' : 'Shift from directing to code-based ops & debugging' },
      ],
      outcome: isKo ? 'Spec 한 번 정의하면 반복 실행 — 비용효율적이고 빠른 대응' : 'Define spec once, execute repeatedly — cost-efficient & fast response'
    },
    {
      stage: isKo ? '4단계' : 'Stage 4',
      title: isKo ? 'AI Agent로 자율 운영 확장' : 'Expand to Autonomous Operations with AI Agents',
      subtitle: isKo ? 'Q Developer(GA) + Strands(OSS) + Kagent(초기) — 점진적 Agent 도입' : 'Q Developer(GA) + Strands(OSS) + Kagent(early) — gradual agent adoption',
      color: '#d97706',
      gradientFrom: '#d97706',
      gradientTo: '#f59e0b',
      items: [
        { label: 'Kagent', detail: isKo ? 'K8s 네이티브 AI 에이전트, MCP 통합 (kmcp)' : 'K8s-native AI agent, MCP integration (kmcp)' },
        { label: 'Strands Agents', detail: isKo ? 'AWS 프로덕션 검증, Agent SOPs (자연어 워크플로우)' : 'AWS production-validated, Agent SOPs (natural language workflows)' },
        { label: 'Amazon Q Developer', detail: isKo ? 'CloudWatch Investigations, EKS 트러블슈팅' : 'CloudWatch Investigations, EKS troubleshooting' },
      ],
      outcome: isKo ? '다양한 데이터 소스 기반 인사이트 + 세부적·광범위한 컨트롤' : 'Multi-source insights + granular & broad control'
    },
  ];

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? 'AWS 오픈소스 전략의 진화' : 'Evolution of AWS Open Source Strategy'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '운영 복잡성 제거 → 자동화 강화 → AI 운영 → 자율 운영' : 'Remove complexity → Strengthen automation → AI ops → Autonomous ops'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '24px 20px'
      }}>
        {stages.map((stage, idx) => (
          <div key={stage.stage}>
            {/* Stage Card */}
            <div style={{
              border: `2px solid ${stage.color}`,
              borderRadius: '8px',
              overflow: 'hidden'
            }}>
              {/* Stage Header */}
              <div style={{
                background: `linear-gradient(135deg, ${stage.gradientFrom}, ${stage.gradientTo})`,
                color: 'white',
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center'
              }}>
                <span style={{
                  background: 'rgba(255,255,255,0.25)',
                  padding: '2px 10px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '700',
                  marginRight: '10px'
                }}>
                  {stage.stage}
                </span>
                <span style={{ fontSize: '17px', fontWeight: '600' }}>
                  {stage.title}
                </span>
              </div>

              {/* Subtitle */}
              <div style={{
                padding: '10px 18px 6px',
                color: '#6b7280',
                fontSize: '13px',
                fontStyle: 'italic',
                borderBottom: '1px solid #f3f4f6'
              }}>
                {stage.subtitle}
              </div>

              {/* Items */}
              <div style={{ padding: '8px 18px 12px' }}>
                {stage.items.map((item) => (
                  <div key={item.label} style={{
                    display: 'flex',
                    gap: '8px',
                    padding: '6px 0',
                    alignItems: 'baseline'
                  }}>
                    <span style={{
                      background: `${stage.color}18`,
                      color: stage.color,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      flexShrink: 0
                    }}>
                      {item.label}
                    </span>
                    <span style={{ fontSize: '13px', color: '#4b5563' }}>
                      {item.detail}
                    </span>
                  </div>
                ))}
              </div>

              {/* Outcome */}
              <div style={{
                background: `${stage.color}08`,
                borderTop: `1px dashed ${stage.color}40`,
                padding: '10px 18px',
                fontSize: '13px',
                fontWeight: '600',
                color: stage.color
              }}>
                → {stage.outcome}
              </div>
            </div>

            {/* Arrow between stages */}
            {idx < stages.length - 1 && (
              <div style={{
                textAlign: 'center',
                padding: '8px 0',
                fontSize: '24px',
                color: '#9ca3af',
                lineHeight: 1
              }}>
                ▼
              </div>
            )}
          </div>
        ))}

        {/* Summary */}
        <div style={{
          marginTop: '20px',
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px 18px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#92400e', marginBottom: '4px' }}>
            {isKo ? '누적적 진화 모델' : 'Cumulative Evolution Model'}
          </div>
          <div style={{ fontSize: '13px', color: '#78350f' }}>
            {isKo
              ? '각 단계가 이전 단계 위에 쌓입니다 — 운영 복잡성 제거 → 자동화 컴포넌트 강화 → AI 활용 운영 → 자율 운영'
              : 'Each stage builds on the previous — Remove complexity → Strengthen automation → AI ops → Autonomous ops'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EvolutionDiagram;
