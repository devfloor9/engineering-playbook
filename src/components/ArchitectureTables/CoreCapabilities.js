import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CoreCapabilities = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const capabilities = [
    {
      name: isKo ? '에이전트 오케스트레이션' : isZh ? '代理编排' : 'Agent Orchestration',
      description: isKo ? 'Kagent를 통한 AI 에이전트 라이프사이클 관리' : isZh ? '通过 Kagent 管理 AI 代理生命周期' : 'Manage AI agent lifecycle through Kagent',
      color: '#4ecdc4'
    },
    {
      name: isKo ? '지능형 라우팅' : isZh ? '智能路由' : 'Intelligent Routing',
      description: isKo ? 'Kgateway를 통한 추론 요청의 동적 라우팅' : isZh ? '通过 Kgateway 动态路由推理请求' : 'Dynamic routing of inference requests through Kgateway',
      color: '#ff6b6b'
    },
    {
      name: isKo ? '벡터 검색' : isZh ? '向量搜索' : 'Vector Search',
      description: isKo ? 'Milvus를 통한 RAG(Retrieval-Augmented Generation) 지원' : isZh ? '通过 Milvus 支持 RAG（检索增强生成）' : 'Support RAG (Retrieval-Augmented Generation) through Milvus',
      color: '#45b7d1'
    },
    {
      name: isKo ? '관측성' : isZh ? '可观测性' : 'Observability',
      description: isKo ? 'LangFuse를 통한 에이전트 동작 추적 및 분석' : isZh ? '通过 LangFuse 跟踪和分析代理行为' : 'Track and analyze agent behavior through LangFuse',
      color: '#96ceb4'
    },
    {
      name: isKo ? '확장성' : isZh ? '可扩展性' : 'Scalability',
      description: isKo ? 'Kubernetes 네이티브 수평적 확장' : isZh ? 'Kubernetes 原生水平扩展' : 'Horizontal scaling native to Kubernetes',
      color: '#f9ca24'
    },
    {
      name: isKo ? '멀티테넌트' : isZh ? '多租户' : 'Multi-Tenancy',
      description: isKo ? '리소스 격리와 공정한 분배를 통한 다중 팀 지원' : isZh ? '通过资源隔离和公平分配支持多团队' : 'Support multiple teams with resource isolation and fair distribution',
      color: '#eb4d4b'
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
          {isKo ? '핵심 기능' : isZh ? '核心功能' : 'Core Capabilities'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {capabilities.map((capability, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 24px',
              borderBottom: index < capabilities.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              width: '4px',
              height: '40px',
              background: capability.color,
              borderRadius: '2px',
              marginRight: '16px'
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: 'var(--ifm-font-color-base)',
                marginBottom: '4px'
              }}>
                {capability.name}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'var(--ifm-color-emphasis-700)',
                lineHeight: '1.5'
              }}>
                {capability.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CoreCapabilities;
