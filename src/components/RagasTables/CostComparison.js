import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CostComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const data = [
    {
      method: 'Ragas + OpenAI GPT-4',
      cost: '$50-100',
      complexity: isKo ? '중간' : isZh ? '中等' : 'Medium',
      color: '#ea4335'
    },
    {
      method: 'Ragas + OpenAI GPT-3.5',
      cost: '$5-10',
      complexity: isKo ? '중간' : isZh ? '中等' : 'Medium',
      color: '#34a853'
    },
    {
      method: 'Bedrock RAG Eval (Claude 3 Sonnet)',
      cost: '$20-40',
      complexity: isKo ? '낮음' : isZh ? '低' : 'Low',
      color: '#fbbc04'
    },
    {
      method: 'Bedrock RAG Eval (Claude 3 Haiku)',
      cost: '$5-15',
      complexity: isKo ? '낮음' : isZh ? '低' : 'Low',
      color: '#4285f4'
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
        {isKo ? '비용 비교 (1000개 평가 기준)' : isZh ? '成本比较 (基于1000次评估)' : 'Cost Comparison (Based on 1000 Evaluations)'}
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
                {isKo ? '방식' : isZh ? '方式' : 'Method'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '예상 비용' : isZh ? '预期成本' : 'Expected Cost'}
              </th>
              <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid var(--ifm-color-emphasis-200)', fontWeight: '600' }}>
                {isKo ? '설정 복잡도' : isZh ? '设置复杂度' : 'Setup Complexity'}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, index) => (
              <tr key={index} style={{
                background: index % 2 === 0 ? 'transparent' : 'var(--ifm-color-emphasis-50)',
                transition: 'background 0.2s'
              }}>
                <td style={{
                  padding: '12px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-100)',
                  fontWeight: '500',
                  borderLeft: `4px solid ${row.color}`
                }}>
                  {row.method}
                </td>
                <td style={{
                  padding: '12px',
                  borderBottom: '1px solid var(--ifm-color-emphasis-100)',
                  fontWeight: '700',
                  color: row.color,
                  fontSize: '16px'
                }}>
                  {row.cost}
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

export default CostComparison;
