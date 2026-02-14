import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MaturityModelTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const levels = [
    {
      level: 'Level 1',
      maturity: isKo ? '기본' : 'Basic',
      implementation: isKo ? '로그 수집, 기본 메트릭' : 'Log collection, basic metrics',
      color: '#f59e0b'
    },
    {
      level: 'Level 2',
      maturity: isKo ? '표준' : 'Standard',
      implementation: isKo ? 'LangFuse/LangSmith 트레이싱, Grafana 대시보드' : 'LangFuse/LangSmith tracing, Grafana dashboard',
      color: '#3b82f6'
    },
    {
      level: 'Level 3',
      maturity: isKo ? '고급' : 'Advanced',
      implementation: isKo ? '비용 추적, 품질 평가, 자동 알림' : 'Cost tracking, quality assessment, automated alerts',
      color: '#8b5cf6'
    },
    {
      level: 'Level 4',
      maturity: isKo ? '최적화' : 'Optimized',
      implementation: isKo ? 'A/B 테스트, 자동 튜닝, 예측 분석' : 'A/B testing, auto-tuning, predictive analytics',
      color: '#059669'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '모니터링 성숙도 모델' : 'Monitoring Maturity Model'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {levels.map((level, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '100px 120px 1fr',
              padding: '16px 20px',
              borderBottom: index < levels.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              gap: '20px',
              alignItems: 'center'
            }}
          >
            <div style={{
              fontWeight: '600',
              color: level.color,
              fontSize: '15px'
            }}>
              {level.level}
            </div>
            <div style={{
              background: level.color,
              color: 'white',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: '600',
              textAlign: 'center',
              fontSize: '13px'
            }}>
              {level.maturity}
            </div>
            <div style={{
              color: 'var(--ifm-font-color-base)'
            }}>
              {level.implementation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MaturityModelTable;
