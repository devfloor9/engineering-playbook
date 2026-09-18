import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
import Icon from '../Icon';
import styles from '../ArchitectureTables/manual.module.css';
const ModelServingComparison = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const solutions = [{
    name: 'vLLM',
    version: 'v0.6+',
    role: isKo ? '추론 엔진' : 'Inference Engine',
    features: isKo ? 'PagedAttention, Continuous Batching, Speculative Decoding' : 'PagedAttention, Continuous Batching, Speculative Decoding'
  }, {
    name: 'llm-d',
    version: 'v0.4+',
    role: isKo ? '분산 스케줄러' : 'Distributed Scheduler',
    features: isKo ? '로드 밸런싱, Prefix Caching 인식 라우팅, 장애 복구' : 'Load balancing, Prefix Caching-aware routing, Failure recovery'
  }];
  return <div data-ep-theme="manual"><ManualTable title={isKo ? "모델 서빙 솔루션 비교" : "Model Serving Solutions"} icon="cpu" description={isKo ? 'vLLM vs llm-d 역할과 기능' : 'vLLM vs llm-d roles and capabilities'} headers={[isKo ? "솔루션" : "Solution", isKo ? "버전" : "Version", isKo ? "역할" : "Role", isKo ? "핵심 기능" : "Key Features"]} rows={solutions.map(row => [row.name, row.version, row.role, row.features])} /><p className={styles.note}><Icon name="info" size={18} /> {isKo ? 'vLLM은 추론 최적화를, llm-d는 분산 스케줄링을 담당하여 상호 보완적으로 작동합니다.' : 'vLLM handles inference optimization while llm-d manages distributed scheduling in a complementary manner.'}</p></div>;
};
export default ModelServingComparison;
