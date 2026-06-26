import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const PlatformComparisonMatrix = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const data = [{
    axis: isKo ? '비용 구조' : 'Cost Structure',
    bedrock: isKo ? '사용량 과금, GPU 관리 불필요' : 'Usage-based pricing, no GPU management',
    sagemaker: isKo ? '인스턴스+사용량 혼합, 노트북/학습 별도' : 'Instance+usage hybrid, notebook/training separate',
    eks: isKo ? 'Spot/MIG 최적화, 초기 투자 필요' : 'Spot/MIG optimization, upfront investment needed',
    hybrid: isKo ? 'Bedrock + 자체 SLM 혼합, Cascade 66% 절감' : 'Bedrock + self-hosted SLM, Cascade 66% savings'
  }, {
    axis: isKo ? '운영 부담' : 'Operational Burden',
    bedrock: isKo ? '최소 — AWS 완전 관리' : 'Minimal — AWS fully managed',
    sagemaker: isKo ? '낮음 — 인프라 관리 최소, ML 워크플로우 집중' : 'Low — minimal infra management, focus on ML workflows',
    eks: isKo ? '중간 — K8s/GPU 운영 역량 필요 (Auto Mode로 절감)' : 'Medium — K8s/GPU ops capability needed (reduced with Auto Mode)',
    hybrid: isKo ? '중간 — 두 환경 모두 이해 필요' : 'Medium — understanding of both environments required'
  }, {
    axis: isKo ? '데이터 주권' : 'Data Sovereignty',
    bedrock: isKo ? 'AWS 리전 내 처리' : 'Processed within AWS region',
    sagemaker: isKo ? 'VPC 격리, 학습 데이터 S3 내 유지' : 'VPC isolation, training data stays in S3',
    eks: isKo ? '완전 제어 — VPC 내 모델+데이터 격리' : 'Full control — model+data isolation within VPC',
    hybrid: isKo ? '워크로드별 선택적 격리' : 'Selective isolation per workload'
  }, {
    axis: isKo ? '커스터마이징' : 'Customization',
    bedrock: isKo ? '제한적 — Bedrock 지원 모델, Guardrails 범위 내' : 'Limited — Bedrock-supported models, within Guardrails scope',
    sagemaker: isKo ? 'MLflow, 커스텀 파이프라인, Fine-tuning 지원' : 'MLflow, custom pipelines, fine-tuning support',
    eks: isKo ? '완전 유연 — 모든 오픈 모델, LoRA, 커스텀 게이트웨이' : 'Fully flexible — all open models, LoRA, custom gateway',
    hybrid: isKo ? '필요에 따라 선택적 확장' : 'Selective expansion as needed'
  }, {
    axis: isKo ? 'Time-to-Value' : 'Time-to-Value',
    bedrock: isKo ? '2-4주 — API 호출만으로 시작' : '2-4 weeks — start with API calls only',
    sagemaker: isKo ? '4-8주 — 환경 구성 + 파이프라인 설정' : '4-8 weeks — environment setup + pipeline configuration',
    eks: isKo ? '2-4개월 — 클러스터 + GPU + 모델 서빙 구축' : '2-4 months — cluster + GPU + model serving setup',
    hybrid: isKo ? '1-3개월 — Bedrock 시작 + EKS 점진 확장' : '1-3 months — Bedrock start + gradual EKS expansion'
  }];
  return <div style={{
    maxWidth: '900px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0',
      fontWeight: '600',
      fontSize: '16px'
    }}>
        {isKo ? 'AI 플랫폼 5축 비교 매트릭스' : 'AI Platform 5-Axis Comparison Matrix'}
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      overflow: 'hidden'
    }}>
        <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
          <thead>
            <tr style={{
            background: 'var(--ifm-color-emphasis-100)'
          }}>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '평가축' : 'Evaluation Axis'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                Bedrock + AgentCore
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                SageMaker Unified Studio
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? 'EKS+오픈소스' : 'EKS+Open Source'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '하이브리드' : 'Hybrid'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => <tr key={index} style={{
            background: index % 2 === 0 ? 'transparent' : 'var(--ifm-color-emphasis-50)',
            transition: 'background 0.2s'
          }}>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)',
              fontWeight: '500'
            }}>
                  {row.axis}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.bedrock}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.sagemaker}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.eks}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.hybrid}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default PlatformComparisonMatrix;