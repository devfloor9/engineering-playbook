import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const KAgentFeatures = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const features = [
    {
      icon: '📝',
      name: isKo ? '선언적 Agent 정의' : isZh ? '声明式 Agent 定义' : 'Declarative Agent Definition',
      description: isKo ? 'YAML로 Agent 구성, 도구, 메모리 정의' : isZh ? '使用 YAML 定义 Agent 配置、工具、内存' : 'Define Agent configuration, tools, memory in YAML'
    },
    {
      icon: '📈',
      name: isKo ? '자동 스케일링' : isZh ? '自动扩展' : 'Automatic Scaling',
      description: isKo ? '요청량에 따른 Agent 인스턴스 자동 확장' : isZh ? '根据请求量自动扩展 Agent 实例' : 'Auto-expand Agent instances based on request volume'
    },
    {
      icon: '🔍',
      name: isKo ? '통합 관측성' : isZh ? '集成可观测性' : 'Integrated Observability',
      description: isKo ? 'LangFuse/LangSmith와 자동 연동' : isZh ? '与 LangFuse/LangSmith 自动集成' : 'Automatic integration with LangFuse/LangSmith'
    },
    {
      icon: '🛠️',
      name: isKo ? '도구 관리' : isZh ? '工具管理' : 'Tool Management',
      description: isKo ? 'MCP(Model Context Protocol) 기반 도구 통합' : isZh ? '基于 MCP（模型上下文协议）的工具集成' : 'Tool integration based on MCP (Model Context Protocol)'
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
      <div style={{
        background: 'linear-gradient(135deg, #27ae60 0%, #2ecc71 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🤖 KAgent 핵심 기능' : isZh ? '🤖 KAgent 核心功能' : '🤖 KAgent Core Features'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'Kubernetes 네이티브 Agent 오케스트레이션' : isZh ? 'Kubernetes 原生 Agent 编排' : 'Kubernetes-native Agent orchestration'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '16px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '16px'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
                padding: '20px',
                borderRadius: '8px',
                border: '1px solid #2ecc71',
                boxShadow: '0 2px 4px rgba(46, 204, 113, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '28px' }}>{feature.icon}</span>
                <div style={{
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#166534',
                  lineHeight: '1.3'
                }}>
                  {feature.name}
                </div>
              </div>
              <div style={{
                fontSize: '14px',
                color: '#15803d',
                lineHeight: '1.5'
              }}>
                {feature.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default KAgentFeatures;
