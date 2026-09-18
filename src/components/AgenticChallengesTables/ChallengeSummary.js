import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
import Icon from '../Icon';
const ChallengeSummary = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const challenges = [{
    name: isKo ? 'GPU 리소스 관리 및 비용 최적화' : 'GPU Resource Management & Cost Optimization',
    icon: "compass",
    problem: isKo ? '멀티 클러스터 GPU 가시성 부재, 세대별 워크로드 매칭, GPU 유휴 비용' : 'Lack of multi-cluster GPU visibility, generation-specific workload matching, GPU idle costs',
    limitation: isKo ? '수동 모니터링, 정적 할당, 비용 가시성 부재' : 'Manual monitoring, static allocation, no cost visibility'
  }, {
    name: isKo ? '지능형 추론 라우팅 및 게이트웨이' : 'Intelligent Inference Routing & Gateway',
    icon: "network",
    problem: isKo ? '예측 불가능한 트래픽, 멀티 모델 라우팅, 동적 스케일링' : 'Unpredictable traffic, multi-model routing, dynamic scaling',
    limitation: isKo ? '느린 프로비저닝, 고정 용량, 수동 라우팅' : 'Slow provisioning, fixed capacity, manual routing'
  }, {
    name: isKo ? 'LLMOps 관찰성 및 비용 거버넌스' : 'LLMOps Observability & Cost Governance',
    icon: "chart",
    problem: isKo ? '토큰 레벨 추적 어려움, 비용 가시성 부재, 품질 평가 체계 미흡' : 'Difficulty tracking at token level, no cost visibility, inadequate quality evaluation',
    limitation: isKo ? '수동 추적, 최적화 불가, 사후 분석만 가능' : 'Manual tracking, no optimization, only post-analysis'
  }, {
    name: isKo ? 'Agent 오케스트레이션 및 안전성' : 'Agent Orchestration & Safety',
    icon: "terminal",
    problem: isKo ? 'Agent 워크플로우 복잡성, 도구 통합 어려움, 안전성 보장 미흡' : 'Agent workflow complexity, tool integration challenges, inadequate safety guarantees',
    limitation: isKo ? '수동 오케스트레이션, 표준화 부재, 가드레일 미흡' : 'Manual orchestration, lack of standardization, insufficient guardrails'
  }, {
    name: isKo ? '모델 공급망 관리 (Model Supply Chain)' : 'Model Supply Chain Management',
    icon: "settings",
    problem: isKo ? '분산 학습 인프라 복잡성, 리소스 프로비저닝 지연, 모델 배포 파이프라인' : 'Distributed training infrastructure complexity, resource provisioning delays, model deployment pipeline',
    limitation: isKo ? '수동 클러스터 관리, 낮은 활용률, 파이프라인 자동화 부재' : 'Manual cluster management, low utilization, no pipeline automation'
  }];
  return <ManualTable title={isKo ? "에이전틱 AI 플랫폼 핵심 도전과제" : "Agentic AI Platform Core Challenges"} icon="cpu" description={isKo ? '기존 인프라의 한계와 해결해야 할 문제' : 'Legacy infrastructure limitations and problems to solve'} headers={[isKo ? "도전과제" : "Challenge", isKo ? "핵심 문제" : "Core Problem", isKo ? "기존 인프라의 한계" : "Legacy Limitation"]} rows={challenges.map(row => [<><Icon name={row.icon} size={18} /> {row.name}</>, row.problem, row.limitation])} />;
};
export default ChallengeSummary;
