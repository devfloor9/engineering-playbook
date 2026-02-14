import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ComponentsTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const components = [
    {
      id: 'controller',
      component: isKo ? 'Kagent Controller' : isZh ? 'Kagent 控制器' : 'Kagent Controller',
      role: isKo ? '조정 루프' : isZh ? '协调循环' : 'Reconciliation loop',
      description: isKo ? 'CRD 변경을 감지하고 원하는 상태로 리소스를 조정' : isZh ? '检测 CRD 更改并将资源协调到所需状态' : 'Detect CRD changes and reconcile resources to desired state'
    },
    {
      id: 'webhook',
      component: isKo ? 'Admission Webhook' : isZh ? '准入 Webhook' : 'Admission Webhook',
      role: isKo ? '검증/변환' : isZh ? '验证/转换' : 'Validation/Mutation',
      description: isKo ? 'CRD 생성/수정 시 유효성 검사 및 기본값 설정' : isZh ? '在创建/修改 CRD 时验证并设置默认值' : 'Validate and set defaults on CRD creation/modification'
    },
    {
      id: 'metrics',
      component: isKo ? 'Metrics Server' : isZh ? '指标服务器' : 'Metrics Server',
      role: isKo ? '메트릭 수집' : isZh ? '指标收集' : 'Metrics collection',
      description: isKo ? '에이전트 상태 및 성능 메트릭 노출' : isZh ? '暴露代理状态和性能指标' : 'Expose agent state and performance metrics'
    },
    {
      id: 'agent-crd',
      component: isKo ? 'Agent CRD' : isZh ? 'Agent CRD' : 'Agent CRD',
      role: isKo ? '에이전트 정의' : isZh ? '代理定义' : 'Agent definition',
      description: isKo ? 'AI 에이전트의 스펙, 모델, 도구 설정' : isZh ? 'AI 代理的规范、模型和工具配置' : 'Spec, model, and tool configuration for AI agents'
    },
    {
      id: 'tool-crd',
      component: isKo ? 'Tool CRD' : isZh ? 'Tool CRD' : 'Tool CRD',
      role: isKo ? '도구 정의' : isZh ? '工具定义' : 'Tool definition',
      description: isKo ? '에이전트가 사용할 도구(API, 검색 등) 정의' : isZh ? '定义代理使用的工具（API、搜索等）' : 'Define tools (API, search, etc.) for agent use'
    },
    {
      id: 'workflow-crd',
      component: isKo ? 'Workflow CRD' : isZh ? 'Workflow CRD' : 'Workflow CRD',
      role: isKo ? '워크플로우 정의' : isZh ? '工作流定义' : 'Workflow definition',
      description: isKo ? '멀티 에이전트 협업 워크플로우 정의' : isZh ? '定义多代理协作工作流' : 'Define multi-agent collaboration workflows'
    }
  ];

  return (
    <div style={{
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
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)'
              }}>
                {isKo ? '컴포넌트' : isZh ? '组件' : 'Component'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)'
              }}>
                {isKo ? '역할' : isZh ? '角色' : 'Role'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)'
              }}>
                {isKo ? '설명' : isZh ? '描述' : 'Description'}
              </th>
            </tr>
          </thead>
          <tbody>
            {components.map((item, index) => (
              <tr key={item.id} style={{
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ComponentsTable;
