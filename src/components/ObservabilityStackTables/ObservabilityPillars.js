import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ObservabilityPillars = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const pillars = [
    {
      pillar: 'Metrics',
      role: isKo ? '수치적 시계열 데이터' : isZh ? '数值型时序数据' : 'Numerical time-series data',
      service: 'AMP (Amazon Managed Prometheus), CloudWatch Metrics'
    },
    {
      pillar: 'Logs',
      role: isKo ? '이벤트 기반 텍스트 데이터' : isZh ? '基于事件的文本数据' : 'Event-based text data',
      service: 'CloudWatch Logs, OpenSearch'
    },
    {
      pillar: 'Traces',
      role: isKo ? '분산 요청 추적' : isZh ? '分布式请求追踪' : 'Distributed request tracing',
      service: 'AWS X-Ray, ADOT'
    },
    {
      pillar: isKo ? 'AI 분석' : isZh ? 'AI 分析' : 'AI Analysis',
      role: isKo ? 'ML 기반 이상 탐지 및 인사이트' : isZh ? '基于 ML 的异常检测和洞察' : 'ML-based anomaly detection and insights',
      service: 'DevOps Guru, CloudWatch AI, Q Developer'
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
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '3-Pillar 관찰성 + AI 분석 레이어' : isZh ? '三大支柱可观测性 + AI 分析层' : '3-Pillar Observability + AI Analysis Layer'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '관찰성의 세 기둥과 AI 분석의 결합' : isZh ? '可观测性三大支柱与 AI 分析的结合' : 'Combining the three pillars of observability with AI analysis'}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 200px 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '필러' : isZh ? '支柱' : 'Pillar'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '역할' : isZh ? '作用' : 'Role'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? 'AWS 서비스' : isZh ? 'AWS 服务' : 'AWS Services'}
          </div>
        </div>

        {/* Data Rows */}
        {pillars.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '140px 200px 1fr',
            borderBottom: idx < pillars.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.pillar}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.role}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.service}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ObservabilityPillars;
