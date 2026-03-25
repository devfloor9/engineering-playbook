import React from 'react';
import Layout from '@theme/Layout';
import useBaseUrl from '@docusaurus/useBaseUrl';

const slideDecks = [
  {
    category: 'Agentic AI Platform',
    categoryIcon: '🧠',
    categoryColor: '#a78bfa',
    items: [
      {
        title: '설계 & 아키텍처',
        description: '2-Tier Gateway (Bifrost), Knowledge Feature Store, EKS 클러스터 구성, AgentCore 하이브리드, Graceful Operations',
        badge: 'Block 1',
        slides: 24,
        href: '/docs/agentic-ai-platform/slide/agentic-block1/',
      },
      {
        title: '게이트웨이 & 에이전트',
        description: '2-Tier Gateway (Kgateway + Bifrost), Kagent CRD, Milvus 벡터 DB, 표준 프로토콜 (MCP + A2A + AG-UI)',
        badge: 'Block 2',
        slides: 18,
        href: '/docs/agentic-ai-platform/slide/agentic-block2/',
      },
      {
        title: '모델 서빙 & 추론',
        description: 'vLLM Graceful Drain, llm-d Drain-Aware 라우팅, Blue/Green NodePool, MoE 모델 서빙, GPU 리소스 관리',
        badge: 'Block 3',
        slides: 21,
        href: '/docs/agentic-ai-platform/slide/agentic-block3/',
      },
      {
        title: '운영 & MLOps',
        description: 'Hybrid Observability (Langfuse/LangSmith), DCGM + Kubecost, Bifrost 비용 추적, RAGAS 평가',
        badge: 'Block 4',
        slides: 18,
        href: '/docs/agentic-ai-platform/slide/agentic-block4/',
      },
    ],
  },
  {
    category: 'EKS Operations Training',
    categoryIcon: '⚙️',
    categoryColor: '#60a5fa',
    items: [
      {
        title: 'GitOps 기반 EKS 클러스터 운영',
        description: 'ArgoCD, Flux, Kustomize 오버레이, 멀티 클러스터 관리, Progressive Delivery, Secret 관리',
        badge: 'Block 1',
        slides: 16,
        href: '/docs/operations-observability/slide/block1/',
      },
      {
        title: 'EKS Node Monitoring Agent',
        description: 'Node Problem Detector, 시스템 모니터, Node Termination Handler, Spot 인스턴스, Prometheus 통합',
        badge: 'Block 2',
        slides: 17,
        href: '/docs/operations-observability/slide/block2/',
      },
      {
        title: 'EKS 장애 진단 6-Layer Framework',
        description: '인프라/컨트롤플레인/노드/네트워크/워크로드/앱 6계층 진단, 트리아지 프로세스',
        badge: 'Block 3',
        slides: 18,
        href: '/docs/operations-observability/slide/block3/',
      },
      {
        title: '고가용성 아키텍처',
        description: 'Failure Domain, Topology Spread, Zonal Shift, Cell Architecture, PDB, Chaos Engineering',
        badge: 'Block 4',
        slides: 20,
        href: '/docs/operations-observability/slide/block4/',
      },
      {
        title: 'Pod Health & Graceful Shutdown',
        description: 'Probe 3종, 워크로드별 패턴, SIGTERM, preStop Hook, Native Sidecar, ALB 연동',
        badge: 'Block 5',
        slides: 18,
        href: '/docs/operations-observability/slide/block5/',
      },
      {
        title: 'Pod Scheduling 전략',
        description: '스케줄링 3단계, Affinity, Taints/Tolerations, TSC, PDB, PriorityClass, Descheduler',
        badge: 'Block 6',
        slides: 18,
        href: '/docs/operations-observability/slide/block6/',
      },
    ],
  },
  {
    category: 'EKS Best Practices',
    categoryIcon: '🚀',
    categoryColor: '#34d399',
    items: [
      {
        title: 'EKS Control Plane & CRD Best Practices',
        description: 'Control Plane 모니터링, CRD 영향도 분석, Provisioned Control Plane, DR 아키텍처, Gateway API, 멀티 클러스터 운영',
        badge: 'Best Practices',
        slides: 19,
        href: '/docs/eks-best-practices/slide/eks-best-practices/',
      },
    ],
  },
  {
    category: 'Sales Resources',
    categoryIcon: '📊',
    categoryColor: '#f472b6',
    items: [
      {
        title: 'MRC Sales Pitch — Modern Agentic Applications Day',
        description: 'AI 에이전트 시대의 클라우드 네이티브 인프라, 3대 기둥(LLMOps, AgentOps, Migration), 산업별 시나리오',
        badge: 'Sales Pitch',
        slides: 11,
        href: '/sales-pitch/',
      },
    ],
  },
];

function SlideCard({title, description, badge, slides, href, color}) {
  return (
    <a
      href={useBaseUrl(href)}
      style={{
        display: 'block',
        background: 'var(--ifm-card-background-color, #fff)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderRadius: '12px',
        padding: '1.5rem',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'all 0.25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = color;
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 8px 24px ${color}22`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-200)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <span
        style={{
          display: 'inline-block',
          padding: '3px 10px',
          borderRadius: '12px',
          fontSize: '0.7rem',
          fontWeight: 700,
          background: `${color}18`,
          color: color,
          marginBottom: '0.75rem',
        }}
      >
        {badge}
      </span>
      <h3 style={{fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.5rem'}}>
        {title}
      </h3>
      <p style={{
        fontSize: '0.85rem',
        color: 'var(--ifm-color-emphasis-600)',
        lineHeight: 1.6,
        marginBottom: '0.75rem',
      }}>
        {description}
      </p>
      <span style={{fontSize: '0.75rem', color: 'var(--ifm-color-emphasis-500)'}}>
        {slides} slides
      </span>
    </a>
  );
}

export default function SlidesPage() {
  return (
    <Layout title="Slides" description="Interactive training slides and presentations">
      <main style={{maxWidth: 1100, margin: '0 auto', padding: '3rem 1.5rem'}}>
        <div style={{textAlign: 'center', marginBottom: '3rem'}}>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            marginBottom: '0.5rem',
          }}>
            Interactive Slides
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: 'var(--ifm-color-emphasis-600)',
          }}>
            React 기반 인터랙티브 교육 슬라이드 모음
          </p>
        </div>

        {slideDecks.map((deck) => (
          <section key={deck.category} style={{marginBottom: '2.5rem'}}>
            <h2 style={{
              fontSize: '1.4rem',
              fontWeight: 700,
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <span>{deck.categoryIcon}</span>
              <span>{deck.category}</span>
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: '1rem',
            }}>
              {deck.items.map((item) => (
                <SlideCard
                  key={item.title}
                  {...item}
                  color={deck.categoryColor}
                />
              ))}
            </div>
          </section>
        ))}
      </main>
    </Layout>
  );
}
