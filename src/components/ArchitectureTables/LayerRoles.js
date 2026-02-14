import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const LayerRoles = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const layers = [
    {
      layer: isKo ? 'Client Layer' : isZh ? '客户端层' : 'Client Layer',
      role: isKo ? '사용자 및 애플리케이션 인터페이스' : isZh ? '用户和应用程序接口' : 'User and application interface',
      components: isKo ? 'API Clients, Web UI, SDK' : isZh ? 'API 客户端、Web UI、SDK' : 'API Clients, Web UI, SDK',
      color: '#e3f2fd'
    },
    {
      layer: isKo ? 'Gateway Layer' : isZh ? '网关层' : 'Gateway Layer',
      role: isKo ? '인증, 라우팅, 트래픽 관리' : isZh ? '认证、路由、流量管理' : 'Authentication, routing, traffic management',
      components: isKo ? 'Kgateway, Auth, Rate Limiter' : isZh ? 'Kgateway、认证、速率限制器' : 'Kgateway, Auth, Rate Limiter',
      color: '#fff3e0'
    },
    {
      layer: isKo ? 'Agent Layer' : isZh ? '代理层' : 'Agent Layer',
      role: isKo ? 'AI 에이전트 실행 및 오케스트레이션' : isZh ? 'AI 代理执行和编排' : 'AI agent execution and orchestration',
      components: isKo ? 'Kagent, Agent Instances, Tool Registry' : isZh ? 'Kagent、代理实例、工具注册表' : 'Kagent, Agent Instances, Tool Registry',
      color: '#e8f5e9'
    },
    {
      layer: isKo ? 'Model Serving Layer' : isZh ? '模型服务层' : 'Model Serving Layer',
      role: isKo ? 'LLM 모델 추론 서비스' : isZh ? 'LLM 模型推理服务' : 'LLM model inference service',
      components: 'vLLM, TGI',
      color: '#fce4ec'
    },
    {
      layer: isKo ? 'Data Layer' : isZh ? '数据层' : 'Data Layer',
      role: isKo ? '데이터 저장 및 검색' : isZh ? '数据存储和搜索' : 'Data storage and search',
      components: 'Milvus, Redis, S3',
      color: '#f3e5f5'
    },
    {
      layer: isKo ? 'Observability Layer' : isZh ? '可观测性层' : 'Observability Layer',
      role: isKo ? '모니터링 및 추적' : isZh ? '监控和跟踪' : 'Monitoring and tracking',
      components: 'LangFuse, Prometheus, Grafana',
      color: '#e0f7fa'
    }
  ];

  return (
    <div style={{
      maxWidth: '1000px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? '레이어별 역할' : isZh ? '各层角色' : 'Role by Layer'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 280px',
          background: 'var(--ifm-color-emphasis-100)',
          padding: '12px 20px',
          fontWeight: '600',
          fontSize: '14px',
          color: 'var(--ifm-font-color-base)',
          borderBottom: '2px solid var(--ifm-color-emphasis-300)'
        }}>
          <div>{isKo ? '레이어' : isZh ? '层' : 'Layer'}</div>
          <div>{isKo ? '역할' : isZh ? '角色' : 'Role'}</div>
          <div>{isKo ? '주요 컴포넌트' : isZh ? '主要组件' : 'Key Components'}</div>
        </div>

        {layers.map((layer, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '200px 1fr 280px',
              padding: '16px 20px',
              borderBottom: index < layers.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              background: layer.color,
              transition: 'transform 0.2s',
              cursor: 'default'
            }}
          >
            <div style={{
              fontSize: '15px',
              fontWeight: '600',
              color: 'var(--ifm-font-color-base)'
            }}>
              {layer.layer}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              lineHeight: '1.5'
            }}>
              {layer.role}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-700)',
              fontFamily: 'monospace'
            }}>
              {layer.components}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerRoles;
