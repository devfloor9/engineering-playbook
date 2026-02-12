import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DataFlowSummary = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const layers = [
    {
      layer: isKo ? '수집' : isZh ? '采集' : 'Collection',
      components: 'ADOT, CW Agent, Fluent Bit, Node Monitor, Flow Monitor',
      role: isKo ? '메트릭/로그/트레이스/이벤트 수집' : isZh ? '采集指标/日志/链路追踪/事件' : 'Collect metrics/logs/traces/events'
    },
    {
      layer: isKo ? '전송' : isZh ? '传输' : 'Transport',
      components: 'OTLP, Remote Write, CW API, X-Ray API',
      role: isKo ? '표준 프로토콜로 데이터 전달' : isZh ? '通过标准协议传输数据' : 'Deliver data via standard protocols'
    },
    {
      layer: isKo ? '저장' : isZh ? '存储' : 'Storage',
      components: 'AMP, CloudWatch Logs/Metrics, X-Ray',
      role: isKo ? '시계열 저장 및 인덱싱' : isZh ? '时序存储和索引' : 'Time-series storage and indexing'
    },
    {
      layer: isKo ? '분석' : isZh ? '分析' : 'Analysis',
      components: 'AMG, CloudWatch AI, DevOps Guru, Application Signals',
      role: isKo ? 'AI/ML 기반 분석 및 시각화' : isZh ? '基于 AI/ML 的分析和可视化' : 'AI/ML-based analysis and visualization'
    },
    {
      layer: isKo ? '실행' : isZh ? '执行' : 'Action',
      components: 'Hosted MCP, Kiro, Q Developer, Kagent',
      role: isKo ? 'AI 기반 자동 대응 및 복구' : isZh ? '基于 AI 的自动响应和修复' : 'AI-based auto-response and remediation'
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
        background: 'linear-gradient(135deg, #155e75 0%, #0891b2 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '데이터 흐름 요약' : isZh ? '数据流概览' : 'Data Flow Summary'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '5개 레이어의 역할과 구성 요소' : isZh ? '5 个层次的作用和组件' : 'Roles and components of 5 layers'}
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
          gridTemplateColumns: '100px 1fr 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '레이어' : isZh ? '层次' : 'Layer'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '구성 요소' : isZh ? '组件' : 'Components'}
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
        </div>

        {/* Data Rows */}
        {layers.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '100px 1fr 1fr',
            borderBottom: idx < layers.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.layer}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.components}
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
          </div>
        ))}
      </div>
    </div>
  );
};

export default DataFlowSummary;
