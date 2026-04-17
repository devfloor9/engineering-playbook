import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const HybridPatternSummary = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const data = [
    {
      pattern: isKo ? 'Bedrock + EKS SLM' : 'Bedrock + EKS SLM',
      configuration: isKo ? 'Bedrock(추론) + EKS 자체 SLM(고빈도)' : isZh ? 'Bedrock(推理) + EKS自托管SLM(高频)' : 'Bedrock (inference) + EKS self-hosted SLM (high-frequency)',
      scenario: isKo ? 'API 비용 절감이 급한 대규모 추론' : isZh ? '大规模推理急需降低API成本' : 'Large-scale inference with urgent API cost reduction',
      complexity: '★★☆☆☆'
    },
    {
      pattern: isKo ? 'SageMaker 학습 + EKS 서빙' : isZh ? 'SageMaker训练 + EKS服务' : 'SageMaker Training + EKS Serving',
      configuration: isKo ? 'SageMaker(학습/실험) + EKS+vLLM(서빙)' : isZh ? 'SageMaker(训练/实验) + EKS+vLLM(服务)' : 'SageMaker (training/experimentation) + EKS+vLLM (serving)',
      scenario: isKo ? 'ML 팀과 서빙 팀이 분리된 조직' : isZh ? 'ML团队与服务团队分离的组织' : 'Organizations with separated ML and serving teams',
      complexity: '★★★☆☆'
    },
    {
      pattern: isKo ? 'AgentCore + 자체 모델' : isZh ? 'AgentCore + 自托管模型' : 'AgentCore + Self-hosted Models',
      configuration: isKo ? 'AgentCore(Agent 런타임) + EKS(커스텀 모델 추론)' : isZh ? 'AgentCore(Agent运行时) + EKS(自定义模型推理)' : 'AgentCore (Agent runtime) + EKS (custom model inference)',
      scenario: isKo ? 'Agent 운영은 AWS, 모델은 자체 호스팅' : isZh ? 'Agent运营由AWS，模型自托管' : 'AWS-managed Agent operations, self-hosted models',
      complexity: '★★★☆☆'
    },
    {
      pattern: 'Full Stack',
      configuration: isKo ? 'Unified Studio(개발) + Bedrock(외부) + EKS(자체) + AgentCore(운영)' : isZh ? 'Unified Studio(开发) + Bedrock(外部) + EKS(自托管) + AgentCore(运营)' : 'Unified Studio (dev) + Bedrock (external) + EKS (self-hosted) + AgentCore (ops)',
      scenario: isKo ? '엔터프라이즈 AI CoE, 전체 AI 라이프사이클 관리' : isZh ? '企业AI CoE，全AI生命周期管理' : 'Enterprise AI CoE, full AI lifecycle management',
      complexity: '★★★★☆'
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
        background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '하이브리드 패턴 요약' : isZh ? '混合模式摘要' : 'Hybrid Pattern Summary'}
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
                {isKo ? '패턴' : isZh ? '模式' : 'Pattern'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '구성' : isZh ? '配置' : 'Configuration'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '적합 시나리오' : isZh ? '适用场景' : 'Best Fit Scenario'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '복잡도' : isZh ? '复杂度' : 'Complexity'}
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
                  {row.pattern}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.configuration}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.scenario}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.complexity}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default HybridPatternSummary;
