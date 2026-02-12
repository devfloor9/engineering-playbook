import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MonitoringComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const comparisons = [
    {
      aspect: isKo ? '데이터 분석' : 'Data Analysis',
      traditional: isKo ? '규칙 기반 임계값' : 'Rule-based thresholds',
      aiops: isKo ? 'ML 기반 패턴 인식' : 'ML-based pattern recognition'
    },
    {
      aspect: isKo ? '이상 탐지' : 'Anomaly Detection',
      traditional: isKo ? '정적 임계값 알림' : 'Static threshold alerts',
      aiops: isKo ? '동적 베이스라인 이상 탐지' : 'Dynamic baseline anomaly detection'
    },
    {
      aspect: isKo ? '근본 원인 분석' : 'Root Cause Analysis',
      traditional: isKo ? '수동 로그 분석' : 'Manual log analysis',
      aiops: isKo ? 'AI 자동 상관관계 분석' : 'AI auto correlation analysis'
    },
    {
      aspect: isKo ? '알림' : 'Alerting',
      traditional: isKo ? '알림 폭주 (Alert Fatigue)' : 'Alert storm (Alert Fatigue)',
      aiops: isKo ? '지능형 알림 그룹핑/억제' : 'Intelligent alert grouping/suppression'
    },
    {
      aspect: isKo ? '자동화' : 'Automation',
      traditional: isKo ? '제한적 스크립트 기반' : 'Limited script-based',
      aiops: isKo ? 'AI Agent 자율 대응' : 'AI Agent autonomous response'
    },
    {
      aspect: isKo ? '확장성' : 'Scalability',
      traditional: isKo ? '수동 구성 관리' : 'Manual configuration mgmt',
      aiops: isKo ? '자동 적응형 스케일링' : 'Auto adaptive scaling'
    },
    {
      aspect: isKo ? '비용 효율' : 'Cost Efficiency',
      traditional: isKo ? '오버 프로비저닝' : 'Over-provisioning',
      aiops: isKo ? 'AI 기반 Right-Sizing' : 'AI-powered right-sizing'
    }
  ];

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '⚖️ 전통적 모니터링 vs AIOps' : '⚖️ Traditional Monitoring vs AIOps'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '패러다임 전환 비교' : 'Paradigm shift comparison'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {comparisons.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px',
              borderBottom: index < comparisons.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}
          >
            <div style={{
              background: '#fef2f2',
              padding: '16px',
              borderRadius: '6px',
              borderLeft: '3px solid #dc2626'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>❌</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b' }}>
                  {item.aspect}
                </span>
              </div>
              <div style={{ color: '#dc2626', fontSize: '14px' }}>
                {item.traditional}
              </div>
            </div>

            <div style={{
              background: '#ecfdf5',
              padding: '16px',
              borderRadius: '6px',
              borderLeft: '3px solid #059669'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>✅</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#065f46' }}>
                  {item.aspect}
                </span>
              </div>
              <div style={{ color: '#059669', fontSize: '14px' }}>
                {item.aiops}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonitoringComparison;
