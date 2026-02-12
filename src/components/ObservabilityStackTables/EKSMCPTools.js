import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EKSMCPTools = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const tools = [
    {
      tool: 'get_cluster_status',
      function: isKo ? '클러스터 전체 상태 조회' : isZh ? '查询集群整体状态' : 'Query overall cluster status',
      scenario: isKo ? '정기 건강 검진' : isZh ? '定期健康检查' : 'Regular health checks'
    },
    {
      tool: 'list_pods',
      function: isKo ? 'Pod 목록 및 상태' : isZh ? 'Pod 列表和状态' : 'Pod list and status',
      scenario: isKo ? '장애 Pod 식별' : isZh ? '识别故障 Pod' : 'Identify failing Pods'
    },
    {
      tool: 'get_pod_logs',
      function: isKo ? 'Pod 로그 조회' : isZh ? '查询 Pod 日志' : 'Query Pod logs',
      scenario: isKo ? '에러 로그 분석' : isZh ? '错误日志分析' : 'Error log analysis'
    },
    {
      tool: 'describe_node',
      function: isKo ? '노드 상세 정보' : isZh ? '节点详细信息' : 'Node detailed information',
      scenario: isKo ? '노드 리소스 문제 진단' : isZh ? '诊断节点资源问题' : 'Diagnose node resource issues'
    },
    {
      tool: 'get_events',
      function: isKo ? 'K8s 이벤트 조회' : isZh ? '查询 K8s 事件' : 'Query K8s events',
      scenario: isKo ? '최근 이벤트 분석' : isZh ? '近期事件分析' : 'Recent event analysis'
    },
    {
      tool: 'list_deployments',
      function: isKo ? 'Deployment 상태' : isZh ? 'Deployment 状态' : 'Deployment status',
      scenario: isKo ? '배포 상태 확인' : isZh ? '检查部署状态' : 'Check deployment status'
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
          {isKo ? 'EKS MCP 서버 도구' : isZh ? 'EKS MCP 服务器工具' : 'EKS MCP Server Tools'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'Kiro/Q Developer에서 사용 가능한 EKS 통합 도구' : isZh ? 'Kiro/Q Developer 中可用的 EKS 集成工具' : 'EKS integration tools available in Kiro/Q Developer'}
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
            {isKo ? '도구' : isZh ? '工具' : 'Tool'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '기능' : isZh ? '功能' : 'Function'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '활용 시나리오' : isZh ? '使用场景' : 'Use Case Scenario'}
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
          💡 <strong>{isKo ? '통합 분석:' : isZh ? '统一分析:' : 'Unified Analysis:'}</strong> {isKo ? 'MCP를 통해 CloudWatch, X-Ray, EKS API를 단일 인터페이스로 조회. AI 에이전트가 여러 콘솔을 오가지 않고 자동으로 근본 원인을 분석합니다.' : isZh ? '通过 MCP 以单一接口查询 CloudWatch、X-Ray 和 EKS API。AI 代理无需在多个控制台之间切换即可自动分析根因。' : 'Query CloudWatch, X-Ray, and EKS API through a single MCP interface. AI agents automatically analyze root causes without switching between multiple consoles.'}
        </div>
      </div>
    </div>
  );
};

export default EKSMCPTools;
