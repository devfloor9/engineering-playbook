import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const AckControllers = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["AWS 서비스", "ACK Controller", "Agentic AI 활용"] : ["AWS Service", "ACK Controller", "Agentic AI Use"];
  const data = isKo ? [["**S3**", "`s3.services.k8s.aws`", "모델 아티팩트 저장소, 학습 데이터 버킷"], ["**RDS/Aurora**", "`rds.services.k8s.aws`", "Langfuse 백엔드, 메타데이터 저장소"], ["**SageMaker**", "`sagemaker.services.k8s.aws`", "모델 학습 작업, 엔드포인트 배포"], ["**Secrets Manager**", "`secretsmanager.services.k8s.aws`", "API 키, 모델 자격증명 관리"], ["**ECR**", "`ecr.services.k8s.aws`", "컨테이너 이미지 레지스트리"]] : [["**S3**", "`s3.services.k8s.aws`", "Model artifact repository, training data buckets"], ["**RDS/Aurora**", "`rds.services.k8s.aws`", "Langfuse backend, metadata store"], ["**SageMaker**", "`sagemaker.services.k8s.aws`", "Model training jobs, endpoint deployment"], ["**Secrets Manager**", "`secretsmanager.services.k8s.aws`", "API keys, model credential management"], ["**ECR**", "`ecr.services.k8s.aws`", "Container image registry"]];
  return <ManualTable title={isKo ? 'ACK 컨트롤러 활용' : 'ACK Controllers Usage'} headers={headers} rows={data} />;
};
export default AckControllers;
