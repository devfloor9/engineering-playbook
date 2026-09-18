import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
import Icon from '../Icon';
const DistributedTrainingStack = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const solutions = [{
    name: 'NeMo',
    icon: "cpu",
    role: isKo ? '학습 프레임워크' : 'Training Framework',
    features: isKo ? 'LLM/멀티모달 학습, 모델 병렬화, 최적화 기법' : 'LLM/multimodal training, model parallelism, optimization techniques'
  }, {
    name: 'Kubeflow',
    icon: "settings",
    role: isKo ? 'ML 오케스트레이션' : 'ML Orchestration',
    features: isKo ? '파이프라인 관리, 실험 추적, 하이퍼파라미터 튜닝' : 'Pipeline management, experiment tracking, hyperparameter tuning'
  }];
  return <ManualTable title={isKo ? "분산 학습 스택" : "Distributed Training Stack"} icon="book-open" description={isKo ? '대규모 모델 학습 및 파이프라인 관리' : 'Large-scale model training and pipeline management'} headers={[isKo ? "솔루션" : "Solution", isKo ? "역할" : "Role", isKo ? "핵심 기능" : "Key Features"]} rows={solutions.map(row => [<><Icon name={row.icon} size={18} /> {row.name}</>, row.role, row.features])} />;
};
export default DistributedTrainingStack;
