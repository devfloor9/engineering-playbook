import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const MaturityPathTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const data = [{
    level: isKo ? 'Level 1 — AI 탐색기' : 'Level 1 — AI Explorer',
    characteristics: isKo ? 'AI/ML 워크로드 없음, 빠른 PoC 필요' : 'No AI/ML workloads, need fast PoC',
    recommended: isKo ? 'AWS 매니지드 우선' : 'AWS Managed First',
    services: isKo ? 'Bedrock API + Strands SDK + AgentCore' : 'Bedrock API + Strands SDK + AgentCore',
    timeline: isKo ? '2-4주' : '2-4 weeks'
  }, {
    level: isKo ? 'Level 2 — AI 구축기' : 'Level 2 — AI Builder',
    characteristics: isKo ? 'ML 일부 운영, 학습 파이프라인 필요' : 'Some ML in production, training pipelines needed',
    recommended: isKo ? 'SageMaker + Bedrock 하이브리드' : 'SageMaker + Bedrock Hybrid',
    services: isKo ? 'SageMaker Unified Studio + Bedrock + S3/Glue' : 'SageMaker Unified Studio + Bedrock + S3/Glue',
    timeline: isKo ? '1-3개월' : '1-3 months'
  }, {
    level: isKo ? 'Level 3 — AI 최적화기' : 'Level 3 — AI Optimizer',
    characteristics: isKo ? '대규모 추론, 비용 압박, 커스텀 모델' : 'Large-scale inference, cost pressure, custom models',
    recommended: isKo ? 'EKS 오픈 아키텍처 + Cascade Routing' : 'EKS Open Architecture + Cascade Routing',
    services: isKo ? 'EKS + vLLM/llm-d + kgateway + Bifrost + Langfuse' : 'EKS + vLLM/llm-d + kgateway + Bifrost + Langfuse',
    timeline: isKo ? '3-6개월' : '3-6 months'
  }];
  return <div style={{
    maxWidth: '900px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0',
      fontWeight: '600',
      fontSize: '16px'
    }}>
        {isKo ? 'AI 플랫폼 성숙도 경로' : 'AI Platform Maturity Path'}
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
                {isKo ? '성숙도' : 'Maturity Level'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '특징' : 'Characteristics'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '권장 스택' : 'Recommended Stack'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '핵심 서비스' : 'Core Services'}
              </th>
              <th style={{
              padding: '12px',
              textAlign: 'left',
              borderBottom: '2px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                {isKo ? '기간' : 'Timeline'}
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
                  {row.level}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.characteristics}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.recommended}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.services}
                </td>
                <td style={{
              padding: '12px',
              borderBottom: '1px solid var(--ifm-color-emphasis-100)'
            }}>
                  {row.timeline}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default MaturityPathTable;