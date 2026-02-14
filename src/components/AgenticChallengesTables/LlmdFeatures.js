import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const LlmdFeatures = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const features = [
    {
      icon: '🎯',
      name: isKo ? 'Prefix Caching 인식' : isZh ? 'Prefix Caching 识别' : 'Prefix Caching Awareness',
      description: isKo ? '동일 프롬프트 프리픽스를 가진 요청을 같은 인스턴스로 라우팅' : isZh ? '将具有相同提示前缀的请求路由到同一实例' : 'Routes requests with the same prompt prefix to the same instance',
      k8sIntegration: isKo ? 'Service Discovery 활용' : isZh ? '利用 Service Discovery' : 'Leverages Service Discovery'
    },
    {
      icon: '⚖️',
      name: isKo ? '로드 밸런싱' : isZh ? '负载均衡' : 'Load Balancing',
      description: isKo ? 'GPU 사용률 기반 지능형 분배' : isZh ? '基于 GPU 利用率的智能分发' : 'Intelligent distribution based on GPU utilization',
      k8sIntegration: isKo ? 'Prometheus 메트릭 연동' : isZh ? 'Prometheus 指标集成' : 'Prometheus metrics integration'
    },
    {
      icon: '🔄',
      name: isKo ? '장애 복구' : isZh ? '故障恢复' : 'Failure Recovery',
      description: isKo ? '인스턴스 장애 시 자동 재라우팅' : isZh ? '实例故障时自动重新路由' : 'Automatic re-routing on instance failure',
      k8sIntegration: isKo ? 'Health Check + Endpoint Slice' : isZh ? 'Health Check + Endpoint Slice' : 'Health Check + Endpoint Slice'
    },
    {
      icon: '📊',
      name: isKo ? '동적 스케일링' : isZh ? '动态扩展' : 'Dynamic Scaling',
      description: isKo ? '요청량에 따른 백엔드 확장' : isZh ? '根据请求量扩展后端' : 'Backend expansion based on request volume',
      k8sIntegration: isKo ? 'KEDA 연동' : isZh ? 'KEDA 集成' : 'KEDA integration'
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
        background: 'linear-gradient(135deg, #c0392b 0%, #e74c3c 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🚀 llm.d 핵심 기능' : isZh ? '🚀 llm.d 核心功能' : '🚀 llm.d Core Features'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '지능형 LLM 프록시 및 라우팅' : isZh ? '智能 LLM 代理和路由' : 'Intelligent LLM proxy and routing'}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px'
        }}>
          {features.map((feature, index) => (
            <div
              key={index}
              style={{
                background: 'linear-gradient(135deg, #fff5f5 0%, #ffe5e5 100%)',
                padding: '20px',
                borderRadius: '8px',
                border: '2px solid #e74c3c',
                boxShadow: '0 3px 6px rgba(231, 76, 60, 0.15)',
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
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#c0392b',
                  lineHeight: '1.3'
                }}>
                  {feature.name}
                </div>
              </div>

              <div style={{
                fontSize: '14px',
                color: '#2c3e50',
                marginBottom: '12px',
                lineHeight: '1.5'
              }}>
                {feature.description}
              </div>

              <div style={{
                display: 'inline-block',
                fontSize: '12px',
                padding: '6px 12px',
                background: '#326ce5',
                color: 'white',
                borderRadius: '16px',
                fontWeight: '500'
              }}>
                {feature.k8sIntegration}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LlmdFeatures;
