import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const EKSMCPTools = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const tools = [{
    tool: 'get_cluster_status',
    function: isKo ? '클러스터 전체 상태 조회' : 'Query overall cluster status',
    scenario: isKo ? '정기 건강 검진' : 'Regular health checks'
  }, {
    tool: 'list_pods',
    function: isKo ? 'Pod 목록 및 상태' : 'Pod list and status',
    scenario: isKo ? '장애 Pod 식별' : 'Identify failing Pods'
  }, {
    tool: 'get_pod_logs',
    function: isKo ? 'Pod 로그 조회' : 'Query Pod logs',
    scenario: isKo ? '에러 로그 분석' : 'Error log analysis'
  }, {
    tool: 'describe_node',
    function: isKo ? '노드 상세 정보' : 'Node detailed information',
    scenario: isKo ? '노드 리소스 문제 진단' : 'Diagnose node resource issues'
  }, {
    tool: 'get_events',
    function: isKo ? 'K8s 이벤트 조회' : 'Query K8s events',
    scenario: isKo ? '최근 이벤트 분석' : 'Recent event analysis'
  }, {
    tool: 'list_deployments',
    function: isKo ? 'Deployment 상태' : 'Deployment status',
    scenario: isKo ? '배포 상태 확인' : 'Check deployment status'
  }];
  return <div style={{
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
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? 'EKS MCP 서버 도구' : 'EKS MCP Server Tools'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? 'Kiro/Q Developer에서 사용 가능한 EKS 통합 도구' : 'EKS integration tools available in Kiro/Q Developer'}
        </div>
      </div>

      {/* Table */}
      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      overflow: 'hidden'
    }}>
        {/* Column Headers */}
        <div style={{
        display: 'grid',
        gridTemplateColumns: '180px 180px 1fr',
        borderBottom: '2px solid var(--ifm-color-emphasis-200)',
        background: 'var(--ifm-background-surface-color)'
      }}>
          <div style={{
          padding: '12px 14px',
          fontWeight: '600',
          fontSize: '12px',
          color: 'var(--ifm-color-emphasis-600)'
        }}>
            {isKo ? '도구' : 'Tool'}
          </div>
          <div style={{
          padding: '12px 14px',
          borderLeft: '1px solid var(--ifm-color-emphasis-200)',
          fontWeight: '600',
          fontSize: '12px',
          color: 'var(--ifm-color-emphasis-600)'
        }}>
            {isKo ? '기능' : 'Function'}
          </div>
          <div style={{
          padding: '12px 14px',
          borderLeft: '1px solid var(--ifm-color-emphasis-200)',
          fontWeight: '600',
          fontSize: '12px',
          color: 'var(--ifm-color-emphasis-600)'
        }}>
            {isKo ? '활용 시나리오' : 'Use Case Scenario'}
          </div>
        </div>

        {/* Data Rows */}
        {tools.map((item, idx) => <div key={idx} style={{
        display: 'grid',
        gridTemplateColumns: '180px 180px 1fr',
        borderBottom: idx < tools.length - 1 ? '1px solid #f3f4f6' : 'none'
      }}>
            <div style={{
          padding: '14px',
          background: 'var(--ifm-background-surface-color)',
          fontFamily: 'Monaco, Consolas, monospace',
          fontSize: '12px',
          fontWeight: '700',
          color: 'var(--ifm-font-color-base)',
          display: 'flex',
          alignItems: 'center'
        }}>
              {item.tool}
            </div>
            <div style={{
          padding: '14px',
          fontSize: '13px',
          color: 'var(--ifm-font-color-base)',
          borderLeft: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center'
        }}>
              {item.function}
            </div>
            <div style={{
          padding: '14px',
          fontSize: '13px',
          color: 'var(--ifm-font-color-base)',
          borderLeft: '1px solid #f3f4f6',
          display: 'flex',
          alignItems: 'center'
        }}>
              {item.scenario}
            </div>
          </div>)}

        {/* Footer */}
        <div style={{
        background: 'var(--ifm-color-emphasis-100)',
        borderTop: '1px solid #fde68a',
        padding: '12px 16px',
        fontSize: '12px',
        color: 'var(--ifm-color-emphasis-700)',
        lineHeight: '1.6'
      }}>
          💡 <strong>{isKo ? '통합 분석:' : 'Unified Analysis:'}</strong> {isKo ? 'MCP를 통해 CloudWatch, X-Ray, EKS API를 단일 인터페이스로 조회. AI 에이전트가 여러 콘솔을 오가지 않고 자동으로 근본 원인을 분석합니다.' : 'Query CloudWatch, X-Ray, and EKS API through a single MCP interface. AI agents automatically analyze root causes without switching between multiple consoles.'}
        </div>
      </div>
    </div>;
};
export default EKSMCPTools;