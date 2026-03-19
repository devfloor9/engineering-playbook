import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ArchitectureLayers = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const layers = [
    {
      name: isKo ? '수집 (Collection)' : isZh ? '采集 (Collection)' : 'Collection',
      color: '#3b82f6',
      description: isKo ? '관찰성 데이터를 생성하고 수집' : isZh ? '生成并采集可观测性数据' : 'Generate and collect observability data',
      components: ['ADOT Collector', 'CloudWatch Agent', 'Fluent Bit', 'Node Monitoring Agent']
    },
    {
      name: isKo ? '전송 (Transport)' : isZh ? '传输 (Transport)' : 'Transport',
      color: '#8b5cf6',
      description: isKo ? '수집된 데이터를 백엔드로 전송' : isZh ? '将采集的数据传输到后端' : 'Send collected data to backends',
      components: ['OTLP/gRPC', 'Prometheus Remote Write', 'CloudWatch API', 'X-Ray API']
    },
    {
      name: isKo ? '저장 (Storage)' : isZh ? '存储 (Storage)' : 'Storage',
      color: '#059669',
      description: isKo ? '관찰성 데이터를 장기 저장' : isZh ? '可观测性数据的长期存储' : 'Long-term storage of observability data',
      components: ['AMP (Prometheus)', 'CloudWatch Logs/Metrics', 'X-Ray Traces', 'S3']
    },
    {
      name: isKo ? '분석 (Analysis)' : isZh ? '分析 (Analysis)' : 'Analysis',
      color: '#d97706',
      description: isKo ? '데이터를 쿼리하고 시각화' : isZh ? '查询和可视化数据' : 'Query and visualize data',
      components: ['AMG (Grafana)', 'CloudWatch AI', 'DevOps Guru', 'Q Developer']
    },
    {
      name: isKo ? '액션 (Action)' : isZh ? '执行 (Action)' : 'Action',
      color: '#dc2626',
      description: isKo ? '인사이트에 기반한 자동화' : isZh ? '基于洞察的自动化' : 'Insight-driven automation',
      components: ['Kiro + MCP', 'AI Agents', isKo ? '자동 복구' : isZh ? '自动修复' : 'Auto-remediation', isKo ? '에스컬레이션' : isZh ? '升级' : 'Escalation']
    }
  ];

  const containerStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
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

  const layersContainerStyle = {
    background: 'var(--ifm-background-surface-color)',
    border: '1px solid var(--ifm-color-emphasis-200)',
    borderRadius: '0 0 8px 8px',
    padding: '1rem'
  };

  const layerStyle = (color) => ({
    borderLeft: `4px solid ${color}`,
    padding: '1rem',
    marginBottom: '1rem',
    background: 'var(--ifm-background-surface-color)',
    borderRadius: '4px'
  });

  const badgeStyle = (color) => ({
    display: 'inline-block',
    background: color,
    color: 'white',
    padding: '0.25rem 0.75rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    marginBottom: '0.5rem'
  });

  const descriptionStyle = {
    fontSize: '0.875rem',
    color: 'var(--ifm-color-emphasis-600)',
    marginBottom: '0.75rem'
  };

  const componentsStyle = {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem'
  };

  const componentTagStyle = {
    background: 'var(--ifm-background-surface-color)',
    border: '1px solid var(--ifm-color-emphasis-200)',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    color: 'var(--ifm-font-color-base)'
  };

  const arrowStyle = {
    textAlign: 'center',
    fontSize: '1.5rem',
    color: 'var(--ifm-color-emphasis-500)',
    margin: '0.5rem 0'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>{isKo ? '🏗️ 관찰성 아키텍처 레이어' : isZh ? '🏗️ 可观测性架构层次' : '🏗️ Observability Architecture Layers'}</h3>
        <p style={subtitleStyle}>{isKo ? '수집 → 전송 → 저장 → 분석 → 액션' : isZh ? '采集 → 传输 → 存储 → 分析 → 执行' : 'Collection → Transport → Storage → Analysis → Action'}</p>
      </div>
      <div style={layersContainerStyle}>
        {layers.map((layer, index) => (
          <React.Fragment key={index}>
            <div style={layerStyle(layer.color)}>
              <div style={badgeStyle(layer.color)}>{layer.name}</div>
              <div style={descriptionStyle}>{layer.description}</div>
              <div style={componentsStyle}>
                {layer.components.map((component, idx) => (
                  <span key={idx} style={componentTagStyle}>{component}</span>
                ))}
              </div>
            </div>
            {index < layers.length - 1 && (
              <div style={arrowStyle}>↓</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default ArchitectureLayers;
