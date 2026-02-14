import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ComponentStructureTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const components = [
    {
      id: 'gatewayclass',
      component: isKo ? 'GatewayClass' : isZh ? 'GatewayClass' : 'GatewayClass',
      role: isKo ? '게이트웨이 구현체 정의' : isZh ? '网关实现定义' : 'Gateway implementation definition',
      description: isKo ? 'Kgateway 컨트롤러 지정' : isZh ? '指定 Kgateway 控制器' : 'Designate Kgateway controller'
    },
    {
      id: 'gateway',
      component: isKo ? 'Gateway' : isZh ? 'Gateway' : 'Gateway',
      role: isKo ? '진입점 정의' : isZh ? '入口点定义' : 'Entry point definition',
      description: isKo ? '리스너, TLS, 주소 설정' : isZh ? '配置监听器、TLS、地址' : 'Configure listeners, TLS, addresses'
    },
    {
      id: 'httproute',
      component: isKo ? 'HTTPRoute' : isZh ? 'HTTPRoute' : 'HTTPRoute',
      role: isKo ? '라우팅 규칙' : isZh ? '路由规则' : 'Routing rules',
      description: isKo ? '경로, 헤더 기반 라우팅' : isZh ? '基于路径、标头的路由' : 'Path, header-based routing'
    },
    {
      id: 'backend',
      component: isKo ? 'Backend' : isZh ? 'Backend' : 'Backend',
      role: isKo ? '모델 서비스' : isZh ? '模型服务' : 'Model service',
      description: isKo ? 'vLLM, TGI 등 추론 서버' : isZh ? 'vLLM、TGI 等推理服务器' : 'vLLM, TGI and other inference servers'
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
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '25%'
              }}>
                {isKo ? '컴포넌트' : isZh ? '组件' : 'Component'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '30%'
              }}>
                {isKo ? '역할' : isZh ? '角色' : 'Role'}
              </th>
              <th style={{
                padding: '12px 16px',
                textAlign: 'left',
                fontWeight: '600',
                borderBottom: '2px solid var(--ifm-color-emphasis-300)',
                width: '45%'
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

export default ComponentStructureTable;
