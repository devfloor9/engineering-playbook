import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const ComponentsTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const components = [{
    id: 'controller',
    component: isKo ? 'Kagent Controller' : 'Kagent Controller',
    role: isKo ? '조정 루프' : 'Reconciliation loop',
    description: isKo ? 'CRD 변경을 감지하고 원하는 상태로 리소스를 조정' : 'Detect CRD changes and reconcile resources to desired state'
  }, {
    id: 'webhook',
    component: isKo ? 'Admission Webhook' : 'Admission Webhook',
    role: isKo ? '검증/변환' : 'Validation/Mutation',
    description: isKo ? 'CRD 생성/수정 시 유효성 검사 및 기본값 설정' : 'Validate and set defaults on CRD creation/modification'
  }, {
    id: 'metrics',
    component: isKo ? 'Metrics Server' : 'Metrics Server',
    role: isKo ? '메트릭 수집' : 'Metrics collection',
    description: isKo ? '에이전트 상태 및 성능 메트릭 노출' : 'Expose agent state and performance metrics'
  }, {
    id: 'agent-crd',
    component: isKo ? 'Agent CRD' : 'Agent CRD',
    role: isKo ? '에이전트 정의' : 'Agent definition',
    description: isKo ? 'AI 에이전트의 스펙, 모델, 도구 설정' : 'Spec, model, and tool configuration for AI agents'
  }, {
    id: 'modelconfig-crd',
    component: isKo ? 'ModelConfig CRD' : 'ModelConfig CRD',
    role: isKo ? '모델 정의' : 'Model definition',
    description: isKo ? 'Agent가 modelConfig로 참조하는 모델 제공자, 모델 이름, API 키 참조 정의' : 'Model provider, model name, and API key reference that an Agent references via modelConfig'
  }, {
    id: 'mcp-crd',
    component: isKo ? 'RemoteMCPServer / MCPServer CRD' : 'RemoteMCPServer / MCPServer CRD',
    role: isKo ? '도구 서버 정의' : 'Tool server definition',
    description: isKo ? 'Agent가 type: McpServer 도구로 바인딩하는 MCP 서버 정의(도구와 메모리는 별도 CRD가 아니라 Agent spec에 포함)' : 'MCP server that an Agent binds as type: McpServer tools (tools and memory are not separate CRDs; they live in the Agent spec)'
  }, {
    id: 'workflow-crd',
    component: isKo ? 'Workflow CRD (설계 제안)' : 'Workflow CRD (design proposal)',
    role: isKo ? '워크플로우 정의' : 'Workflow definition',
    description: isKo ? '멀티 에이전트 협업 워크플로우 정의. 공식 kagent.dev/v1alpha2 API에는 없으며 별도 CRD와 컨트롤러가 필요한 설계 제안(§4)' : 'Define multi-agent collaboration workflows. Not in the official kagent.dev/v1alpha2 API; a design proposal that needs its own CRD and controller (§4)'
  }];
  return <div style={{
    maxWidth: '100%',
    margin: '20px 0',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: '15px'
  }}>
      <div style={{
      overflowX: 'auto',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderRadius: '8px'
    }}>
        <table style={{
        width: '100%',
        borderCollapse: 'collapse',
        background: 'var(--ifm-background-surface-color)'
      }}>
          <thead>
            <tr style={{
            background: 'var(--ifm-color-emphasis-100)'
          }}>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              borderBottom: '2px solid var(--ifm-color-emphasis-300)'
            }}>
                {isKo ? '컴포넌트' : 'Component'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              borderBottom: '2px solid var(--ifm-color-emphasis-300)'
            }}>
                {isKo ? '역할' : 'Role'}
              </th>
              <th style={{
              padding: '12px 16px',
              textAlign: 'left',
              fontWeight: '600',
              borderBottom: '2px solid var(--ifm-color-emphasis-300)'
            }}>
                {isKo ? '설명' : 'Description'}
              </th>
            </tr>
          </thead>
          <tbody>
            {components.map((item, index) => <tr key={item.id} style={{
            background: index % 2 === 0 ? 'var(--ifm-background-surface-color)' : 'var(--ifm-color-emphasis-50)'
          }}>
                <td style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--ifm-color-emphasis-200)',
              fontWeight: '600'
            }}>
                  {item.component}
                </td>
                <td style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--ifm-color-emphasis-200)'
            }}>
                  {item.role}
                </td>
                <td style={{
              padding: '12px 16px',
              borderBottom: '1px solid var(--ifm-color-emphasis-200)'
            }}>
                  {item.description}
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>;
};
export default ComponentsTable;