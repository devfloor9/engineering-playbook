import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ServiceComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const services = [
    {
      name: 'AMP',
      type: 'Managed OSS',
      color: '#059669',
      cost: isKo ? '수집 메트릭 기반' : isZh ? '基于摄入指标' : 'Based on ingested metrics',
      bestFor: isKo ? 'Prometheus 호환 메트릭 장기 저장' : isZh ? 'Prometheus 兼容指标长期存储' : 'Long-term storage of Prometheus-compatible metrics'
    },
    {
      name: 'AMG',
      type: 'Managed OSS',
      color: '#059669',
      cost: isKo ? '사용자/워크스페이스 기반' : isZh ? '基于用户/工作区' : 'Based on users/workspaces',
      bestFor: isKo ? '통합 대시보드 + 알림' : isZh ? '统一仪表盘 + 告警' : 'Unified dashboards + alerts'
    },
    {
      name: 'CloudWatch',
      type: 'AWS Native',
      color: '#3b82f6',
      cost: isKo ? '로그/메트릭/요청 기반' : isZh ? '基于日志/指标/请求' : 'Based on logs/metrics/requests',
      bestFor: isKo ? 'AWS 서비스 통합 모니터링' : isZh ? 'AWS 服务集成监控' : 'Integrated AWS service monitoring'
    },
    {
      name: 'X-Ray',
      type: 'AWS Native',
      color: '#3b82f6',
      cost: isKo ? '트레이스 샘플링 기반' : isZh ? '基于链路追踪采样' : 'Based on trace sampling',
      bestFor: isKo ? '분산 트레이싱' : isZh ? '分布式链路追踪' : 'Distributed tracing'
    },
    {
      name: 'DevOps Guru',
      type: 'AWS AI',
      color: '#8b5cf6',
      cost: isKo ? '분석 리소스 기반' : isZh ? '基于分析的资源' : 'Based on analyzed resources',
      bestFor: isKo ? 'ML 이상 탐지' : isZh ? 'ML 异常检测' : 'ML anomaly detection'
    },
    {
      name: 'Application Signals',
      type: 'AWS Native',
      color: '#3b82f6',
      cost: isKo ? 'CloudWatch 요금에 포함' : isZh ? '包含在 CloudWatch 定价中' : 'Included in CloudWatch pricing',
      bestFor: 'zero-code APM'
    }
  ];

  const typeColors = {
    'Managed OSS': '#059669',
    'AWS Native': '#3b82f6',
    'AWS AI': '#8b5cf6'
  };

  const containerStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #581c87 0%, #7e22ce 100%)',
    color: 'white',
    padding: '1.5rem',
    borderRadius: '8px 8px 0 0',
    marginBottom: '1rem'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0'
  };

  const subtitleStyle = {
    fontSize: '0.875rem',
    opacity: 0.9,
    margin: 0
  };

  const tableContainerStyle = {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0 0 8px 8px',
    overflow: 'hidden'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse'
  };

  const headerRowStyle = {
    background: '#f3f4f6',
    borderBottom: '2px solid #d1d5db'
  };

  const headerCellStyle = {
    padding: '0.75rem',
    textAlign: 'left',
    fontSize: '0.75rem',
    fontWeight: 'bold',
    color: '#374151',
    textTransform: 'uppercase'
  };

  const rowStyle = (index) => ({
    borderBottom: index < services.length - 1 ? '1px solid #e5e7eb' : 'none'
  });

  const cellStyle = {
    padding: '0.75rem',
    fontSize: '0.875rem',
    color: '#1f2937'
  };

  const serviceNameStyle = {
    fontWeight: 'bold',
    fontSize: '1rem'
  };

  const typeBadgeStyle = (type) => ({
    display: 'inline-block',
    background: typeColors[type],
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  });

  const costStyle = {
    color: '#6b7280',
    fontSize: '0.8125rem'
  };

  const bestForStyle = {
    color: '#059669',
    fontWeight: '500'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>{isKo ? '📊 관찰성 서비스 비교' : isZh ? '📊 可观测性服务对比' : '📊 Observability Services Comparison'}</h3>
        <p style={subtitleStyle}>{isKo ? 'AWS Native vs Managed OSS vs AI 서비스' : isZh ? 'AWS Native vs Managed OSS vs AI 服务' : 'AWS Native vs Managed OSS vs AI Services'}</p>
      </div>
      <div style={tableContainerStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={headerRowStyle}>
              <th style={headerCellStyle}>Service</th>
              <th style={headerCellStyle}>Type</th>
              <th style={headerCellStyle}>Cost Model</th>
              <th style={headerCellStyle}>Best For</th>
            </tr>
          </thead>
          <tbody>
            {services.map((service, index) => (
              <tr key={index} style={rowStyle(index)}>
                <td style={{...cellStyle, ...serviceNameStyle}}>{service.name}</td>
                <td style={cellStyle}>
                  <span style={typeBadgeStyle(service.type)}>{service.type}</span>
                </td>
                <td style={{...cellStyle, ...costStyle}}>{service.cost}</td>
                <td style={{...cellStyle, ...bestForStyle}}>{service.bestFor}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ServiceComparison;
