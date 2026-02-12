import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EvolutionStages = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const stages = [
    {
      stage: isKo ? '반응형' : isZh ? '被动型' : 'Reactive',
      stageEn: 'Reactive',
      characteristics: isKo ? '문제 발생 후 대응' : isZh ? '问题发生后响应' : 'Post-problem response',
      tools: 'HPA, CloudWatch Alarms'
    },
    {
      stage: isKo ? '예측형' : isZh ? '预测型' : 'Predictive',
      stageEn: 'Predictive',
      characteristics: isKo ? '패턴 기반 사전 대응' : isZh ? '基于模式的主动响应' : 'Pattern-based proactive response',
      tools: isKo ? 'ML 예측, CloudWatch Anomaly Detection' : isZh ? 'ML 预测, CloudWatch 异常检测' : 'ML forecasting, CloudWatch Anomaly Detection'
    },
    {
      stage: isKo ? '자율형' : isZh ? '自主型' : 'Autonomous',
      stageEn: 'Autonomous',
      characteristics: isKo ? 'AI가 자율적으로 판단·대응' : isZh ? 'AI 自主决策和响应' : 'AI autonomous decision-making and response',
      tools: 'Kiro+MCP, Q Developer, Kagent/Strands'
    }
  ];

  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontSize: '15px',
    lineHeight: '1.6'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #c2410c 0%, #ea580c 100%)',
    color: '#ffffff',
    padding: '1.5rem',
    textAlign: 'center'
  };

  const titleStyle = {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: '700'
  };

  const subtitleStyle = {
    margin: 0,
    fontSize: '0.95rem',
    opacity: 0.95,
    fontWeight: '400'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '15px'
  };

  const thStyle = {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '700',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '0.9375rem'
  };

  const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    color: '#374151',
    fontSize: '15px'
  };

  const stageBadgeStyle = {
    display: 'inline-block',
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600'
  };

  const footerStyle = {
    backgroundColor: '#fef3c7',
    padding: '1rem 1.5rem',
    fontSize: '0.875rem',
    color: '#92400e',
    borderTop: '2px solid #fbbf24',
    lineHeight: '1.6'
  };

  const footerLabelStyle = {
    fontWeight: '700',
    color: '#78350f'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🚀 {isKo ? 'EKS 운영의 진화' : isZh ? 'EKS 运维的演进' : 'Evolution of EKS Operations'}</h2>
        <p style={subtitleStyle}>{isKo ? '반응형 → 예측형 → 자율형' : isZh ? '被动型 → 预测型 → 自主型' : 'Reactive → Predictive → Autonomous'}</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{isKo ? '단계' : isZh ? '阶段' : 'Stage'}</th>
              <th style={thStyle}>{isKo ? '특성' : isZh ? '特征' : 'Characteristics'}</th>
              <th style={thStyle}>{isKo ? '도구' : isZh ? '工具' : 'Tools'}</th>
            </tr>
          </thead>
          <tbody>
            {stages.map((item, index) => (
              <tr key={index}>
                <td style={tdStyle}>
                  <div style={stageBadgeStyle}>
                    {item.stage}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: '#6b7280', marginTop: '0.375rem' }}>
                    {item.stageEn}
                  </div>
                </td>
                <td style={tdStyle}>{item.characteristics}</td>
                <td style={tdStyle}>{item.tools}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={footerStyle}>
        <span style={footerLabelStyle}>{isKo ? '핵심:' : isZh ? '核心：' : 'Key:'}</span> {isKo ? '이 문서는 반응형 스케일링의 한계를 넘어 ML 기반 예측 스케일링과 AI Agent를 통한 자율 복구 패턴을 다룹니다.' : isZh ? '本文档涵盖基于 ML 的预测扩缩容和通过 AI Agent 实现的自主恢复模式，超越了被动扩缩容的局限性。' : 'This document covers ML-based predictive scaling and autonomous recovery patterns through AI Agents, going beyond the limitations of reactive scaling.'}
      </div>
    </div>
  );
};

export default EvolutionStages;
