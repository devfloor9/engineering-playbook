import React from 'react';

const ContainerInsightsMetrics = () => {
  const categories = [
    {
      category: 'Control Plane',
      examples: 'apiserver_request_total, etcd_db_total_size',
      description: 'API 서버, etcd, 스케줄러 상태'
    },
    {
      category: 'Node',
      examples: 'node_cpu_utilization, node_memory_working_set',
      description: '노드 리소스 사용량'
    },
    {
      category: 'Pod',
      examples: 'pod_cpu_utilization, pod_memory_working_set',
      description: 'Pod 리소스 사용량'
    },
    {
      category: 'Container',
      examples: 'container_cpu_limit, container_restart_count',
      description: '컨테이너 수준 상세'
    },
    {
      category: 'Service',
      examples: 'service_number_of_running_pods',
      description: '서비스 레벨 집계'
    },
    {
      category: 'Namespace',
      examples: 'namespace_number_of_running_pods',
      description: '네임스페이스 레벨 집계'
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
          Enhanced Container Insights 메트릭 범위
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          EKS 1.28+ Control Plane 포함 심층 관찰성
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
            카테고리
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            메트릭 예시
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            설명
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
