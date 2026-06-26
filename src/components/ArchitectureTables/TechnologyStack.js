import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const TechnologyStack = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const infrastructure = [{
    area: isKo ? '컨테이너 오케스트레이션' : 'Container Orchestration',
    tech: 'Amazon EKS (Auto Mode, Pod Identity)'
  }, {
    area: isKo ? '네트워킹' : 'Networking',
    tech: 'Cilium CNI, Gateway API, VPC Lattice'
  }, {
    area: isKo ? '보안' : 'Security',
    tech: 'OPA/Kyverno, RBAC, Pod Security Standards'
  }, {
    area: 'GitOps',
    tech: 'ArgoCD, Helm, Kustomize'
  }];
  const genai = [{
    area: isKo ? '모델 서빙' : 'Model Serving',
    tech: 'vLLM, llm-d (분산 추론)'
  }, {
    area: isKo ? '로우코드 플랫폼' : 'Low-Code Platform',
    tech: 'Dify (Visual AI Workflow Builder)'
  }, {
    area: isKo ? '에이전트 프레임워크' : 'Agent Frameworks',
    tech: 'LangChain, LangGraph, CrewAI'
  }, {
    area: isKo ? '벡터 데이터베이스' : 'Vector Databases',
    tech: isKo ? 'Milvus, RAG 통합 패턴' : 'Milvus, RAG integration patterns'
  }];
  const operations = [{
    area: isKo ? '관측성' : 'Observability',
    tech: 'OpenTelemetry, Prometheus, Grafana, Hubble'
  }, {
    area: isKo ? '비용 관리' : 'Cost Management',
    tech: isKo ? 'Kubecost, Karpenter 최적화' : 'Kubecost, Karpenter optimization'
  }, {
    area: isKo ? '자동화' : 'Automation',
    tech: 'AWS Controllers for Kubernetes (ACK)'
  }];
  const renderSection = (title, items, color) => <div style={{
    marginBottom: '24px'
  }}>
      <div style={{
      background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`,
      color: 'white',
      padding: '12px 20px',
      borderRadius: '6px 6px 0 0',
      fontSize: '16px',
      fontWeight: '600'
    }}>
        {title}
      </div>
      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 6px 6px',
      overflow: 'hidden'
    }}>
        {items.map((item, index) => <div key={index} style={{
        display: 'grid',
        gridTemplateColumns: '220px 1fr',
        padding: '12px 20px',
        borderBottom: index < items.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none'
      }}>
            <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: 'var(--ifm-color-emphasis-700)'
        }}>
              {item.area}
            </div>
            <div style={{
          fontSize: '14px',
          color: 'var(--ifm-font-color-base)',
          fontFamily: 'monospace'
        }}>
              {item.tech}
            </div>
          </div>)}
      </div>
    </div>;
  return <div style={{
    maxWidth: '1000px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '8px',
      marginBottom: '24px',
      textAlign: 'center'
    }}>
        <div style={{
        fontSize: '24px',
        fontWeight: '600'
      }}>
          {isKo ? '기술 스택' : 'Technology Stack'}
        </div>
      </div>

      {renderSection(isKo ? '핵심 인프라' : 'Core Infrastructure', infrastructure, '#3b82f6')}
      {renderSection(isKo ? 'GenAI 기술' : 'GenAI Technologies', genai, '#8b5cf6')}
      {renderSection(isKo ? '플랫폼 운영' : 'Platform Operations', operations, '#10b981')}
    </div>;
};
export default TechnologyStack;