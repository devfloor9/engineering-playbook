import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MLModelComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const models = [
    {
      model: 'ARIMA',
      characteristics: isKo ? '통계 기반, 계절성' : isZh ? '基于统计，季节性' : 'Statistical-based, seasonality',
      suitablePattern: isKo ? '규칙적 일/주간 패턴' : isZh ? '规律的日/周模式' : 'Regular daily/weekly patterns',
      color: '#3b82f6'
    },
    {
      model: 'Prophet',
      characteristics: isKo ? 'Facebook 개발, 휴일 반영' : isZh ? 'Facebook 开发，假日感知' : 'Developed by Facebook, holiday-aware',
      suitablePattern: isKo ? '비즈니스 트래픽 (이벤트, 휴일)' : isZh ? '业务流量（活动、假日）' : 'Business traffic (events, holidays)',
      color: '#8b5cf6'
    },
    {
      model: 'LSTM',
      characteristics: isKo ? '딥러닝, 복잡한 패턴' : isZh ? '深度学习，复杂模式' : 'Deep learning, complex patterns',
      suitablePattern: isKo ? '불규칙적이지만 반복되는 패턴' : isZh ? '不规则但重复的模式' : 'Irregular but recurring patterns',
      color: '#ec4899'
    },
    {
      model: 'CloudWatch',
      characteristics: isKo ? 'AWS 네이티브, 자동' : isZh ? 'AWS 原生，自动化' : 'AWS native, automatic',
      suitablePattern: isKo ? '범용 (별도 ML 인프라 불필요)' : isZh ? '通用（无需单独 ML 基础设施）' : 'General purpose (no separate ML infrastructure needed)',
      color: '#f59e0b'
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
    background: 'linear-gradient(135deg, #7c2d12 0%, #c2410c 100%)',
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

  const contentStyle = {
    padding: '1.5rem'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem'
  };

  const cardStyle = (color) => ({
    borderLeft: `4px solid ${color}`,
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  });

  const modelBadgeStyle = (color) => ({
    display: 'inline-block',
    backgroundColor: color,
    color: '#ffffff',
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '1rem'
  });

  const rowStyle = {
    marginBottom: '0.875rem'
  };

  const labelStyle = {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: '#111827',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    marginBottom: '0.375rem'
  };

  const valueStyle = {
    fontSize: '0.875rem',
    color: '#4b5563',
    lineHeight: '1.5'
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
        <h2 style={titleStyle}>🧠 {isKo ? '시계열 예측 모델 비교' : isZh ? '时序预测模型对比' : 'Time Series Forecasting Model Comparison'}</h2>
        <p style={subtitleStyle}>{isKo ? 'EKS 워크로드 트래픽 패턴 예측' : isZh ? 'EKS 工作负载流量模式预测' : 'EKS Workload Traffic Pattern Forecasting'}</p>
      </div>
      <div style={contentStyle}>
        <div style={gridStyle}>
          {models.map((model, index) => (
            <div key={index} style={cardStyle(model.color)}>
              <div style={modelBadgeStyle(model.color)}>
                {model.model}
              </div>
              <div style={rowStyle}>
                <div style={labelStyle}>{isKo ? '특성' : isZh ? '特征' : 'Characteristics'}</div>
                <div style={valueStyle}>{model.characteristics}</div>
              </div>
              <div style={rowStyle}>
                <div style={labelStyle}>{isKo ? '적합한 패턴' : isZh ? '适用模式' : 'Suitable Patterns'}</div>
                <div style={valueStyle}>{model.suitablePattern}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={footerStyle}>
        <span style={footerLabelStyle}>{isKo ? '권장:' : isZh ? '建议：' : 'Recommendation:'}</span> {isKo ? '프로덕션 환경에서는 CloudWatch Anomaly Detection으로 시작하여, 특수 패턴이 있다면 Prophet이나 LSTM을 추가로 도입하는 것이 효과적입니다.' : isZh ? '生产环境建议从 CloudWatch 异常检测开始，如果有特殊模式再引入 Prophet 或 LSTM。' : 'In production environments, start with CloudWatch Anomaly Detection, then introduce Prophet or LSTM if there are special patterns.'}
      </div>
    </div>
  );
};

export default MLModelComparison;
