import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
import styles from '../ArchitectureTables/manual.module.css';
const K8sCoreFeatures = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const features = [{
    feature: isKo ? '선언적 리소스 관리' : 'Declarative Resource Management',
    application: isKo ? 'GPU 리소스를 코드로 정의하고 버전 관리' : 'Define GPU resources as code with version control',
    challenges: ['1', '4']
  }, {
    feature: isKo ? '자동 스케일링 (HPA/VPA)' : 'Auto Scaling (HPA/VPA)',
    application: isKo ? '트래픽 패턴에 따른 Pod 자동 확장/축소' : 'Automatic Pod expansion/contraction based on traffic patterns',
    challenges: ['2']
  }, {
    feature: isKo ? '네임스페이스 기반 격리' : 'Namespace-based Isolation',
    application: isKo ? '팀/프로젝트별 리소스 할당량 관리' : 'Resource quota management by team/project',
    challenges: ['3']
  }, {
    feature: isKo ? 'Operator 패턴' : 'Operator Pattern',
    application: isKo ? '복잡한 분산 학습 워크플로우 자동화' : 'Automation of complex distributed learning workflows',
    challenges: ['4']
  }, {
    feature: isKo ? '서비스 메시 통합' : 'Service Mesh Integration',
    application: isKo ? '멀티 모델 라우팅 및 트래픽 관리' : 'Multi-model routing and traffic management',
    challenges: ['2']
  }, {
    feature: isKo ? '메트릭 기반 오케스트레이션' : 'Metrics-based Orchestration',
    application: isKo ? 'GPU 사용률 기반 스케줄링 결정' : 'GPU utilization-based scheduling decisions',
    challenges: ['1', '3']
  }];
  const challengeLabels = {
    '1': isKo ? 'GPU 모니터링' : 'GPU Monitoring',
    '2': isKo ? '동적 라우팅' : 'Dynamic Routing',
    '3': isKo ? '비용 컨트롤' : 'Cost Control',
    '4': isKo ? 'FM 파인튜닝' : 'FM Fine-tuning'
  };
  return <div data-ep-theme="manual"><ManualTable title={isKo ? "Kubernetes 핵심 기능 활용" : "Kubernetes Core Features"} icon="layers" description={isKo ? 'AI 플랫폼 적용 방안과 해결되는 도전과제' : 'AI platform applications and challenges addressed'} headers={[isKo ? "K8s 기능" : "K8s Feature", isKo ? "AI 플랫폼 적용" : "AI Platform Application", isKo ? "해결 도전과제" : "Resolves"]} rows={features.map(row => [row.feature, row.application, row.challenges.map(ch => '#' + ch).join(', ')])} /><div className={styles.note}><strong>{isKo ? "도전과제 범례" : "Challenge Legend"}</strong><ul>{Object.entries(challengeLabels).map(([num, text]) => <li key={num}>#{num} {text}</li>)}</ul></div></div>;
};
export default K8sCoreFeatures;
