import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const KagentVsAgentCore = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const data = [
    {
      item: isKo ? '실행 환경' : isZh ? '运行环境' : 'Execution Environment',
      kagent: isKo ? 'EKS Pod' : 'EKS Pod',
      agentcore: isKo ? 'AWS 관리형 런타임' : isZh ? 'AWS托管运行时' : 'AWS Managed Runtime'
    },
    {
      item: isKo ? '모델 선택' : isZh ? '模型选择' : 'Model Selection',
      kagent: isKo ? '자유 (vLLM, 외부 API)' : isZh ? '灵活 (vLLM, 外部 API)' : 'Flexible (vLLM, external API)',
      agentcore: isKo ? 'Bedrock 모델' : isZh ? 'Bedrock模型' : 'Bedrock Models'
    },
    {
      item: isKo ? '도구 프로토콜' : isZh ? '工具协议' : 'Tool Protocol',
      kagent: isKo ? '커스텀 CRD' : isZh ? '自定义 CRD' : 'Custom CRD',
      agentcore: isKo ? 'MCP 표준' : isZh ? 'MCP标准' : 'MCP Standard'
    },
    {
      item: isKo ? '스케일링' : isZh ? '扩展' : 'Scaling',
      kagent: 'Karpenter/HPA',
      agentcore: isKo ? '자동 스케일링' : isZh ? '自动扩展' : 'Auto-scaling'
    },
    {
      item: isKo ? '비용' : isZh ? '成本' : 'Cost',
      kagent: isKo ? 'GPU 인프라 비용' : isZh ? 'GPU基础设施成本' : 'GPU Infrastructure Cost',
      agentcore: isKo ? 'API 호출 비용' : isZh ? 'API调用成本' : 'API Call Cost'
    },
    {
      item: isKo ? '적합한 경우' : isZh ? '适用场景' : 'Best For',
      kagent: isKo ? 'GPU 보유, 커스텀 모델' : isZh ? '拥有 GPU，自定义模型' : 'GPU availability, custom models',
      agentcore: isKo ? '빠른 프로덕션 배포' : isZh ? '快速生产部署' : 'Fast production deployment'
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
        background: 'linear-gradient(135deg, #ff9900 0%, #cc7a00 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'Kagent vs Bedrock AgentCore' : isZh ? 'Kagent vs Bedrock AgentCore' : 'Kagent vs Bedrock AgentCore'}
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
                {isKo ? '비교 항목' : isZh ? '比较项' : 'Comparison Item'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? 'Kagent (Self-managed)' : isZh ? 'Kagent (自管理)' : 'Kagent (Self-managed)'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                Bedrock AgentCore
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
                  {row.item}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.kagent}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.agentcore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default KagentVsAgentCore;
