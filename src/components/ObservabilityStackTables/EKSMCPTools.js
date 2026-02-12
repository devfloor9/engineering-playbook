import React from 'react';

const EKSMCPTools = () => {
  const tools = [
    {
      tool: 'get_cluster_status',
      function: '클러스터 전체 상태 조회',
      scenario: '정기 건강 검진'
    },
    {
      tool: 'list_pods',
      function: 'Pod 목록 및 상태',
      scenario: '장애 Pod 식별'
    },
    {
      tool: 'get_pod_logs',
      function: 'Pod 로그 조회',
      scenario: '에러 로그 분석'
    },
    {
      tool: 'describe_node',
      function: '노드 상세 정보',
      scenario: '노드 리소스 문제 진단'
    },
    {
      tool: 'get_events',
      function: 'K8s 이벤트 조회',
      scenario: '최근 이벤트 분석'
    },
    {
      tool: 'list_deployments',
      function: 'Deployment 상태',
      scenario: '배포 상태 확인'
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
        background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          EKS MCP 서버 도구
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Kiro/Q Developer에서 사용 가능한 EKS 통합 도구
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
          gridTemplateColumns: '180px 180px 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            도구
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            기능
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            활용 시나리오
          </div>
        </div>

        {/* Data Rows */}
        {tools.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '180px 180px 1fr',
            borderBottom: idx < tools.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '12px',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.tool}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.function}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.scenario}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          💡 <strong>통합 분석:</strong> MCP를 통해 CloudWatch, X-Ray, EKS API를 단일 인터페이스로 조회.
          AI 에이전트가 여러 콘솔을 오가지 않고 자동으로 근본 원인을 분석합니다.
        </div>
      </div>
    </div>
  );
};

export default EKSMCPTools;
