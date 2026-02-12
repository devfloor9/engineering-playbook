import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ContainerInsightsMetrics = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const categories = [
    {
      category: 'Control Plane',
      examples: 'apiserver_request_total, etcd_db_total_size',
      description: isKo ? 'API 서버, etcd, 스케줄러 상태' : 'API server, etcd, scheduler status'
    },
    {
      category: 'Node',
      examples: 'node_cpu_utilization, node_memory_working_set',
      description: isKo ? '노드 리소스 사용량' : 'Node resource usage'
    },
    {
      category: 'Pod',
      examples: 'pod_cpu_utilization, pod_memory_working_set',
      description: isKo ? 'Pod 리소스 사용량' : 'Pod resource usage'
    },
    {
      category: 'Container',
      examples: 'container_cpu_limit, container_restart_count',
      description: isKo ? '컨테이너 수준 상세' : 'Container-level details'
    },
    {
      category: 'Service',
      examples: 'service_number_of_running_pods',
      description: isKo ? '서비스 레벨 집계' : 'Service-level aggregation'
    },
    {
      category: 'Namespace',
      examples: 'namespace_number_of_running_pods',
      description: isKo ? '네임스페이스 레벨 집계' : 'Namespace-level aggregation'
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
          {isKo ? 'Enhanced Container Insights 메트릭 범위' : 'Enhanced Container Insights Metrics Scope'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'EKS 1.28+ Control Plane 포함 심층 관찰성' : 'Deep observability including EKS 1.28+ Control Plane'}
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
          gridTemplateColumns: '140px 1fr 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '카테고리' : 'Category'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '메트릭 예시' : 'Metric Examples'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '설명' : 'Description'}
          </div>
        </div>

        {/* Data Rows */}
        {categories.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 1fr',
            borderBottom: idx < categories.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.category}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '12px',
              fontFamily: 'Monaco, Consolas, monospace',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.examples}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ContainerInsightsMetrics;
