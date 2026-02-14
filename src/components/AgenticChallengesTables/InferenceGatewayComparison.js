import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const InferenceGatewayComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const solutions = [
    {
      name: 'Kgateway',
      version: 'v2.0+',
      role: isKo ? '트래픽 관리' : isZh ? '流量管理' : 'Traffic Management',
      features: isKo ? '헤더 기반 라우팅, 가중치 분배, Rate Limiting, Canary 배포' : isZh ? '基于标头的路由，权重分配，速率限制，金丝雀部署' : 'Header-based routing, weight distribution, Rate Limiting, Canary deployment',
      color: '#4286f4'
    },
    {
      name: 'LiteLLM',
      version: 'latest',
      role: isKo ? 'API 추상화' : isZh ? 'API 抽象' : 'API Abstraction',
      features: isKo ? '100+ LLM 프로바이더 지원, 통합 API, 폴백 설정, 비용 추적' : isZh ? '支持 100+ LLM 提供商，统一 API，回退设置，成本跟踪' : '100+ LLM provider support, unified API, fallback settings, cost tracking',
      color: '#9b59b6'
    }
  ];

  return (
    <div style={{
      maxWidth: '800px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🌐 추론 게이트웨이 솔루션 비교' : isZh ? '🌐 推理网关解决方案比较' : '🌐 Inference Gateway Solutions'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'Kgateway vs LiteLLM 역할과 기능' : isZh ? 'Kgateway vs LiteLLM 角色和功能' : 'Kgateway vs LiteLLM roles and capabilities'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {solutions.map((solution, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 80px 1fr',
              gap: '16px',
              padding: '20px',
              borderBottom: index < solutions.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              alignItems: 'start'
            }}
          >
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: solution.color,
                marginBottom: '4px'
              }}>
                {solution.name}
              </div>
              <div style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: `${solution.color}20`,
                color: solution.color,
                border: `1px solid ${solution.color}40`
              }}>
                {solution.version}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '4px'
              }}>
                {isKo ? '역할' : isZh ? '角色' : 'Role'}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: solution.color
              }}>
                {solution.role}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: '#6b7280',
                marginBottom: '6px'
              }}>
                {isKo ? '핵심 기능' : isZh ? '核心功能' : 'Key Features'}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.5'
              }}>
                {solution.features}
              </div>
            </div>
          </div>
        ))}

        <div style={{
          padding: '16px 20px',
          background: '#eff6ff',
          borderTop: '1px solid var(--ifm-color-emphasis-200)'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#1e40af',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <span>
              {isKo ? 'Kgateway는 트래픽 제어를, LiteLLM은 멀티 프로바이더 통합을 담당하여 함께 사용 가능합니다.' : isZh ? 'Kgateway 负责流量控制，LiteLLM 负责多提供商集成，两者可以一起使用。' : 'Kgateway handles traffic control while LiteLLM manages multi-provider integration, and they can be used together.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InferenceGatewayComparison;
