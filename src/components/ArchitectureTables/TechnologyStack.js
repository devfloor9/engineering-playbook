import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from './ManualTable';
import styles from './manual.module.css';
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
  return <div data-ep-theme="manual" className={styles.root}><p className={styles.sectionTitle}>{isKo ? "기술 스택" : "Technology Stack"}</p><ManualTable title={isKo ? "핵심 인프라" : "Core Infrastructure"} headers={[isKo ? "영역" : "Area", isKo ? "기술" : "Technology"]} rows={infrastructure.map(row => [row.area, row.tech])} /><ManualTable title={isKo ? "GenAI 기술" : "GenAI Technologies"} headers={[isKo ? "영역" : "Area", isKo ? "기술" : "Technology"]} rows={genai.map(row => [row.area, row.tech])} /><ManualTable title={isKo ? "플랫폼 운영" : "Platform Operations"} headers={[isKo ? "영역" : "Area", isKo ? "기술" : "Technology"]} rows={operations.map(row => [row.area, row.tech])} /></div>;
};
export default TechnologyStack;
