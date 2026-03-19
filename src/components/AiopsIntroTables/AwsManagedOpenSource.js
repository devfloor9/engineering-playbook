import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AwsManagedOpenSource = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const categories = [
    {
      icon: '🗄️',
      label: isKo ? '데이터베이스' : isZh ? '数据库' : 'Database',
      color: '#2563eb',
      bg: 'var(--ifm-color-emphasis-100)',
      items: ['DocumentDB (MongoDB)', 'ElastiCache (Redis/Valkey)', 'MemoryDB (Redis)', 'Keyspaces (Cassandra)', 'Neptune (Graph)']
    },
    {
      icon: '📡',
      label: isKo ? '스트리밍·메시징' : isZh ? '流式处理·消息' : 'Streaming·Messaging',
      color: '#dc2626',
      bg: 'var(--ifm-color-emphasis-100)',
      items: ['MSK (Kafka)', 'MQ (ActiveMQ/RabbitMQ)']
    },
    {
      icon: '🔍',
      label: isKo ? '검색·분석' : isZh ? '搜索·分析' : 'Search·Analytics',
      color: '#059669',
      bg: 'var(--ifm-color-emphasis-100)',
      items: ['OpenSearch (Elasticsearch)', 'EMR (Spark/Flink)', 'MWAA (Airflow)']
    },
    {
      icon: '📊',
      label: isKo ? '관찰성' : isZh ? '可观测性' : 'Observability',
      color: '#7c3aed',
      bg: 'var(--ifm-color-emphasis-100)',
      items: ['AMP (Prometheus)', 'AMG (Grafana)', 'ADOT (OpenTelemetry)']
    },
    {
      icon: '📦',
      label: isKo ? '컨테이너' : isZh ? '容器' : 'Container',
      color: '#ea580c',
      bg: 'var(--ifm-color-emphasis-100)',
      items: ['EKS (Kubernetes)', 'ECR (OCI Registry)', 'App Mesh (Envoy)']
    },
    {
      icon: '🤖',
      label: 'ML·AI',
      color: '#0891b2',
      bg: 'var(--ifm-color-emphasis-100)',
      items: ['SageMaker (PyTorch/TF)', 'Bedrock (Foundation Models)']
    },
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? 'AWS 관리형 오픈소스 서비스' : isZh ? 'AWS 托管开源服务' : 'AWS Managed Open Source Services'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '오픈소스의 유연성은 유지하고, 운영 부담은 AWS에 위임' : isZh ? '保持开源灵活性，将运维负担委托给 AWS' : 'Keep open source flexibility, delegate operations to AWS'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        {/* Infographic grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '12px',
          marginBottom: '16px'
        }}>
          {categories.map((cat) => (
            <div key={cat.label} style={{
              background: cat.bg,
              border: `1px solid ${cat.color}30`,
              borderRadius: '8px',
              padding: '14px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '6px' }}>{cat.icon}</div>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: cat.color,
                marginBottom: '8px'
              }}>
                {cat.label}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {cat.items.map((item) => (
                  <span key={item} style={{
                    fontSize: '11px',
                    color: 'var(--ifm-font-color-base)',
                    lineHeight: '1.4'
                  }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Summary bar */}
        <div style={{
          background: 'var(--ifm-background-surface-color)',
          border: '1px solid var(--ifm-color-emphasis-200)',
          borderRadius: '6px',
          padding: '12px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '13px'
        }}>
          <span style={{ color: 'var(--ifm-color-emphasis-600)' }}>
            {isKo ? (
              <>
                <strong style={{ color: 'var(--ifm-font-color-base)' }}>6개 영역</strong>에 걸친 <strong style={{ color: 'var(--ifm-font-color-base)' }}>18+ 관리형 오픈소스 서비스</strong>
              </>
            ) : isZh ? (
              <>
                跨 <strong style={{ color: 'var(--ifm-font-color-base)' }}>6 个领域</strong>的 <strong style={{ color: 'var(--ifm-font-color-base)' }}>18+ 托管开源服务</strong>
              </>
            ) : (
              <>
                <strong style={{ color: 'var(--ifm-font-color-base)' }}>18+ managed open source services</strong> across <strong style={{ color: 'var(--ifm-font-color-base)' }}>6 domains</strong>
              </>
            )}
          </span>
          <span style={{
            background: 'var(--ifm-color-emphasis-100)',
            color: '#2563eb',
            padding: '3px 10px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {isKo ? '벤더 종속 없는 오픈소스 + AWS 관리형 운영' : isZh ? '无供应商锁定的开源 + AWS 托管运维' : 'No vendor lock-in OSS + AWS managed ops'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AwsManagedOpenSource;
