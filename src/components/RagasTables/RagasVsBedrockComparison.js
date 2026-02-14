import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const RagasVsBedrockComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const data = [
    {
      item: isKo ? '배포 방식' : isZh ? '部署方式' : 'Deployment Method',
      ragas: isKo ? 'Self-hosted' : 'Self-hosted',
      bedrock: isKo ? 'AWS 관리형' : isZh ? 'AWS托管' : 'AWS Managed'
    },
    {
      item: isKo ? '평가 LLM' : isZh ? '评估 LLM' : 'Evaluation LLM',
      ragas: isKo ? '외부 API (OpenAI 등)' : isZh ? '外部 API (OpenAI等)' : 'External API (OpenAI, etc.)',
      bedrock: isKo ? 'Bedrock 모델' : isZh ? 'Bedrock模型' : 'Bedrock Models'
    },
    {
      item: isKo ? '메트릭' : isZh ? '指标' : 'Metrics',
      ragas: isKo ? '5개 핵심 메트릭' : isZh ? '5个核心指标' : '5 core metrics',
      bedrock: isKo ? '4개 핵심 메트릭' : isZh ? '4个核心指标' : '4 core metrics'
    },
    {
      item: isKo ? '커스터마이징' : isZh ? '定制化' : 'Customization',
      ragas: isKo ? '높음 (Python 코드)' : isZh ? '高 (Python代码)' : 'High (Python code)',
      bedrock: isKo ? '중간 (API 파라미터)' : isZh ? '中等 (API参数)' : 'Medium (API parameters)'
    },
    {
      item: isKo ? '비용' : isZh ? '成本' : 'Cost',
      ragas: isKo ? 'LLM API 비용' : isZh ? 'LLM API成本' : 'LLM API cost',
      bedrock: isKo ? 'Bedrock 호출 비용' : isZh ? 'Bedrock调用成本' : 'Bedrock call cost'
    },
    {
      item: isKo ? '통합' : isZh ? '集成' : 'Integration',
      ragas: isKo ? '수동 통합 필요' : isZh ? '需要手动集成' : 'Manual integration required',
      bedrock: isKo ? 'Bedrock 네이티브' : isZh ? 'Bedrock原生' : 'Bedrock native'
    },
    {
      item: isKo ? '적합한 경우' : isZh ? '适用场景' : 'Best For',
      ragas: isKo ? '세밀한 제어 필요' : isZh ? '需要精细控制' : 'Fine-grained control needed',
      bedrock: isKo ? '빠른 프로덕션 배포' : isZh ? '快速生产部署' : 'Fast production deployment'
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'Ragas vs AWS Bedrock RAG Evaluation' : isZh ? 'Ragas vs AWS Bedrock RAG 评估' : 'Ragas vs AWS Bedrock RAG Evaluation'}
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
                {isKo ? 'Ragas (오픈소스)' : isZh ? 'Ragas (开源)' : 'Ragas (Open Source)'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                AWS Bedrock RAG Evaluation
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
                  {row.ragas}
                </td>
                <td style={{ padding: '12px', borderBottom: '1px solid var(--ifm-color-emphasis-100)' }}>
                  {row.bedrock}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RagasVsBedrockComparison;
