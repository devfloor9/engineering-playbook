import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const GpuInfraStack = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const components = isKo ? [
    {
      name: 'DRA (Dynamic Resource Allocation)',
      version: 'v1beta1 (K8s 1.32+)',
      role: 'GPU 리소스 동적 할당, 네트워크 인터페이스 할당 (K8s 1.33+)',
      docs: 'GPU 리소스 관리',
      color: '#326ce5'
    },
    {
      name: 'DCGM (Data Center GPU Manager)',
      version: '3.3+',
      role: 'GPU 메트릭 수집, H100/H200 지원',
      docs: 'GPU 리소스 관리',
      color: '#76b900'
    },
    {
      name: 'NCCL (NVIDIA Collective Communication Library)',
      version: 'latest',
      role: '멀티 GPU 통신 최적화',
      docs: 'NeMo 프레임워크',
      color: '#76b900'
    },
    {
      name: 'Karpenter',
      version: 'v1.0+ (GA)',
      role: 'GPU 노드 자동 프로비저닝',
      docs: 'GPU 리소스 관리',
      color: '#ffd93d'
    },
    {
      name: 'GPU Operator',
      version: 'v24.x',
      role: 'CUDA 12.x 지원, 드라이버 자동 관리',
      docs: 'GPU 리소스 관리',
      color: '#76b900'
    }
  ] : isZh ? [
    {
      name: 'DRA (Dynamic Resource Allocation)',
      version: 'v1beta1 (K8s 1.32+)',
      role: '动态 GPU 资源分配，网络接口分配 (K8s 1.33+)',
      docs: 'GPU 资源管理',
      color: '#326ce5'
    },
    {
      name: 'DCGM (Data Center GPU Manager)',
      version: '3.3+',
      role: 'GPU 指标收集，H100/H200 支持',
      docs: 'GPU 资源管理',
      color: '#76b900'
    },
    {
      name: 'NCCL (NVIDIA Collective Communication Library)',
      version: 'latest',
      role: '多 GPU 通信优化',
      docs: 'NeMo 框架',
      color: '#76b900'
    },
    {
      name: 'Karpenter',
      version: 'v1.0+ (GA)',
      role: 'GPU 节点自动配置',
      docs: 'GPU 资源管理',
      color: '#ffd93d'
    },
    {
      name: 'GPU Operator',
      version: 'v24.x',
      role: 'CUDA 12.x 支持，驱动程序自动管理',
      docs: 'GPU 资源管理',
      color: '#76b900'
    }
  ] : [
    {
      name: 'DRA (Dynamic Resource Allocation)',
      version: 'v1beta1 (K8s 1.32+)',
      role: 'Dynamic GPU resource allocation, network interface allocation (K8s 1.33+)',
      docs: 'GPU Resource Management',
      color: '#326ce5'
    },
    {
      name: 'DCGM (Data Center GPU Manager)',
      version: '3.3+',
      role: 'GPU metrics collection, H100/H200 support',
      docs: 'GPU Resource Management',
      color: '#76b900'
    },
    {
      name: 'NCCL (NVIDIA Collective Communication Library)',
      version: 'latest',
      role: 'Multi-GPU communication optimization',
      docs: 'NeMo Framework',
      color: '#76b900'
    },
    {
      name: 'Karpenter',
      version: 'v1.0+ (GA)',
      role: 'GPU node automatic provisioning',
      docs: 'GPU Resource Management',
      color: '#ffd93d'
    },
    {
      name: 'GPU Operator',
      version: 'v24.x',
      role: 'CUDA 12.x support, driver auto management',
      docs: 'GPU Resource Management',
      color: '#76b900'
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
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '💎 GPU 인프라 스택' : isZh ? '💎 GPU 基础设施堆栈' : '💎 GPU Infrastructure Stack'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'GPU 리소스 관리 및 최적화 컴포넌트' : isZh ? 'GPU 资源管理和优化组件' : 'GPU resource management and optimization components'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '16px'
      }}>
        {components.map((component, index) => (
          <div
            key={index}
            style={{
              background: 'var(--ifm-color-emphasis-100)',
              padding: '18px',
              marginBottom: index < components.length - 1 ? '12px' : '0',
              borderRadius: '8px',
              border: `2px solid ${component.color}`,
              boxShadow: `0 2px 6px ${component.color}30`,
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ flex: '1', minWidth: '200px' }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: 'var(--ifm-font-color-base)',
                  marginBottom: '6px'
                }}>
                  {component.name}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--ifm-color-emphasis-600)',
                  marginBottom: '8px',
                  fontFamily: 'monospace',
                  background: 'var(--ifm-background-surface-color)',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  display: 'inline-block'
                }}>
                  {component.version}
                </div>
              </div>

              <div style={{
                display: 'inline-block',
                fontSize: '11px',
                padding: '6px 12px',
                background: component.color,
                color: 'white',
                borderRadius: '12px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px'
              }}>
                {component.docs}
              </div>
            </div>

            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-font-color-base)',
              marginTop: '8px',
              lineHeight: '1.5'
            }}>
              {component.role}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GpuInfraStack;
