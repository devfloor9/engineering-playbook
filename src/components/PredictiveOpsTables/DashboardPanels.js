import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DashboardPanels = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const panels = [
    {
      panel: isKo ? '트래픽 예측 vs 실제' : isZh ? '预测流量 vs 实际流量' : 'Predicted vs Actual Traffic',
      dataSource: 'AMP',
      purpose: isKo ? '예측 정확도 시각화' : isZh ? '预测准确性可视化' : 'Forecast accuracy visualization',
      color: '#3b82f6'
    },
    {
      panel: isKo ? '스케일링 이벤트' : isZh ? '扩缩容事件' : 'Scaling Events',
      dataSource: 'AMP + K8s',
      purpose: isKo ? '선제 vs 반응 스케일링 비교' : isZh ? '主动 vs 被动扩缩容对比' : 'Proactive vs reactive scaling comparison',
      color: '#8b5cf6'
    },
    {
      panel: isKo ? 'SLO 현황' : isZh ? 'SLO 状态' : 'SLO Status',
      dataSource: 'AMP',
      purpose: isKo ? 'Error Budget 소진 상태' : isZh ? 'Error Budget 消耗状态' : 'Error budget burn status',
      color: '#ec4899'
    },
    {
      panel: isKo ? '인시던트 타임라인' : isZh ? '事件时间线' : 'Incident Timeline',
      dataSource: 'CloudWatch',
      purpose: isKo ? '장애 발생·대응·복구 추적' : isZh ? '事件检测、响应和恢复跟踪' : 'Incident detection, response, and recovery tracking',
      color: '#f59e0b'
    },
    {
      panel: isKo ? '비용 추이' : isZh ? '成本趋势' : 'Cost Trends',
      dataSource: 'Cost Explorer',
      purpose: isKo ? 'Right-sizing 효과 모니터링' : isZh ? 'Right-sizing 效果监控' : 'Right-sizing effectiveness monitoring',
      color: '#10b981'
    },
    {
      panel: isKo ? 'Agent 활동 로그' : isZh ? 'Agent 活动日志' : 'Agent Activity Log',
      dataSource: 'Kagent/Strands',
      purpose: isKo ? 'AI Agent 조치 이력' : isZh ? 'AI Agent 操作历史' : 'AI Agent action history',
      color: '#06b6d4'
    }
  ];

  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: 'var(--ifm-background-surface-color)',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontSize: '15px',
    lineHeight: '1.6'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
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
    backgroundColor: 'var(--ifm-background-surface-color)',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  });

  const panelBadgeStyle = (color) => ({
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
    marginBottom: '0.75rem'
  };

  const labelStyle = {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: 'var(--ifm-font-color-base)',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    marginBottom: '0.25rem'
  };

  const valueStyle = {
    fontSize: '0.875rem',
    color: 'var(--ifm-font-color-base)',
    lineHeight: '1.5'
  };

  const footerStyle = {
    backgroundColor: 'var(--ifm-color-emphasis-100)',
    padding: '1rem 1.5rem',
    fontSize: '0.875rem',
    color: 'var(--ifm-color-emphasis-700)',
    borderTop: '2px solid #fbbf24',
    lineHeight: '1.6'
  };

  const footerLabelStyle = {
    fontWeight: '700',
    color: 'var(--ifm-color-emphasis-700)'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>📊 {isKo ? '통합 운영 대시보드 구성' : isZh ? '统一运维仪表盘架构' : 'Unified Operations Dashboard Architecture'}</h2>
        <p style={subtitleStyle}>{isKo ? 'AMG 핵심 대시보드 패널' : isZh ? 'AMG 核心仪表盘面板' : 'AMG Core Dashboard Panels'}</p>
      </div>
      <div style={contentStyle}>
        <div style={gridStyle}>
          {panels.map((panel, index) => (
            <div key={index} style={cardStyle(panel.color)}>
              <div style={panelBadgeStyle(panel.color)}>
                {panel.panel}
              </div>
              <div style={rowStyle}>
                <div style={labelStyle}>{isKo ? '데이터 소스' : isZh ? '数据源' : 'Data Source'}</div>
                <div style={valueStyle}>{panel.dataSource}</div>
              </div>
              <div style={rowStyle}>
                <div style={labelStyle}>{isKo ? '목적' : isZh ? '用途' : 'Purpose'}</div>
                <div style={valueStyle}>{panel.purpose}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={footerStyle}>
        <span style={footerLabelStyle}>{isKo ? '통합 가시성:' : isZh ? '统一可见性：' : 'Unified Visibility:'}</span> {isKo ? '통합 운영 대시보드는 예측 데이터와 실제 데이터를 함께 표시하여 예측 정확도, SLO 현황, Error Budget, 인시던트 대응 상황을 한눈에 파악할 수 있습니다.' : isZh ? '统一运维仪表盘将预测数据和实际数据一起展示，可以一目了然地掌握预测准确性、SLO 状态、Error Budget 和事件响应情况。' : 'The unified operations dashboard displays predicted and actual data together, enabling at-a-glance insights into forecast accuracy, SLO status, error budget, and incident response status.'}
      </div>
    </div>
  );
};

export default DashboardPanels;
