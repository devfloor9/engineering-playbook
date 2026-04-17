import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const PlatformComparisonMatrix = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const data = [
    {
      axis: isKo ? '비용 구조' : isZh ? '成本结构' : 'Cost Structure',
      bedrock: isKo ? '사용량 과금, GPU 관리 불필요' : isZh ? '按使用付费，无需GPU管理' : 'Usage-based pricing, no GPU management',
      sagemaker: isKo ? '인스턴스+사용량 혼합, 노트북/학습 별도' : isZh ? '实例+使用混合，笔记本/训练分开' : 'Instance+usage hybrid, notebook/training separate',
      eks: isKo ? 'Spot/MIG 최적화, 초기 투자 필요' : isZh ? 'Spot/MIG优化，需初期投资' : 'Spot/MIG optimization, upfront investment needed',
      hybrid: isKo ? 'Bedrock + 자체 SLM 혼합, Cascade 66% 절감' : isZh ? 'Bedrock+自托管SLM混合，Cascade节省66%' : 'Bedrock + self-hosted SLM, Cascade 66% savings'
    },
    {
      axis: isKo ? '운영 부담' : isZh ? '运营负担' : 'Operational Burden',
      bedrock: isKo ? '최소 — AWS 완전 관리' : isZh ? '最小 — AWS完全托管' : 'Minimal — AWS fully managed',
      sagemaker: isKo ? '낮음 — 인프라 관리 최소, ML 워크플로우 집중' : isZh ? '低 — 基础设施管理最小，专注ML工作流' : 'Low — minimal infra management, focus on ML workflows',
      eks: isKo ? '중간 — K8s/GPU 운영 역량 필요 (Auto Mode로 절감)' : isZh ? '中等 — 需要K8s/GPU运营能力（Auto Mode降低）' : 'Medium — K8s/GPU ops capability needed (reduced with Auto Mode)',
      hybrid: isKo ? '중간 — 두 환경 모두 이해 필요' : isZh ? '中等 — 需了解两种环境' : 'Medium — understanding of both environments required'
    },
    {
      axis: isKo ? '데이터 주권' : isZh ? '数据主权' : 'Data Sovereignty',
      bedrock: isKo ? 'AWS 리전 내 처리' : isZh ? 'AWS区域内处理' : 'Processed within AWS region',
      sagemaker: isKo ? 'VPC 격리, 학습 데이터 S3 내 유지' : isZh ? 'VPC隔离，训练数据保留在S3' : 'VPC isolation, training data stays in S3',
      eks: isKo ? '완전 제어 — VPC 내 모델+데이터 격리' : isZh ? '完全控制 — VPC内模型+数据隔离' : 'Full control — model+data isolation within VPC',
      hybrid: isKo ? '워크로드별 선택적 격리' : isZh ? '按工作负载选择性隔离' : 'Selective isolation per workload'
    },
    {
      axis: isKo ? '커스터마이징' : isZh ? '定制化' : 'Customization',
      bedrock: isKo ? '제한적 — Bedrock 지원 모델, Guardrails 범위 내' : isZh ? '受限 — Bedrock支持的模型，Guardrails范围内' : 'Limited — Bedrock-supported models, within Guardrails scope',
      sagemaker: isKo ? 'MLflow, 커스텀 파이프라인, Fine-tuning 지원' : isZh ? 'MLflow，自定义管道，Fine-tuning支持' : 'MLflow, custom pipelines, fine-tuning support',
      eks: isKo ? '완전 유연 — 모든 오픈 모델, LoRA, 커스텀 게이트웨이' : isZh ? '完全灵活 — 所有开源模型，LoRA，自定义网关' : 'Fully flexible — all open models, LoRA, custom gateway',
      hybrid: isKo ? '필요에 따라 선택적 확장' : isZh ? '按需选择性扩展' : 'Selective expansion as needed'
    },
    {
      axis: isKo ? 'Time-to-Value' : isZh ? '价值实现时间' : 'Time-to-Value',
      bedrock: isKo ? '2-4주 — API 호출만으로 시작' : isZh ? '2-4周 — 仅API调用即可开始' : '2-4 weeks — start with API calls only',
      sagemaker: isKo ? '4-8주 — 환경 구성 + 파이프라인 설정' : isZh ? '4-8周 — 环境配置+管道设置' : '4-8 weeks — environment setup + pipeline configuration',
      eks: isKo ? '2-4개월 — 클러스터 + GPU + 모델 서빙 구축' : isZh ? '2-4个月 — 集群+GPU+模型服务构建' : '2-4 months — cluster + GPU + model serving setup',
      hybrid: isKo ? '1-3개월 — Bedrock 시작 + EKS 점진 확장' : isZh ? '1-3个月 — Bedrock开始+EKS渐进扩展' : '1-3 months — Bedrock start + gradual EKS expansion'
    }
  ];

  return (
    <div style={{
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
        {isKo ? 'AI 플랫폼 5축 비교 매트릭스' : isZh ? 'AI平台5轴比较矩阵' : 'AI Platform 5-Axis Comparison Matrix'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '평가축' : isZh ? '评估轴' : 'Evaluation Axis'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                Bedrock + AgentCore
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                SageMaker Unified Studio
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? 'EKS+오픈소스' : isZh ? 'EKS+开源' : 'EKS+Open Source'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '하이브리드' : isZh ? '混合' : 'Hybrid'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={{
                background: index % 2 === 0 ? 'transparent' : 'var(--ifm-color-emphasis-50)',
                transition: 'background 0.2s'
              }}>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)', fontWeight: '500' }}>
                  {row.axis}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.bedrock}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.sagemaker}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.eks}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.hybrid}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PlatformComparisonMatrix;
