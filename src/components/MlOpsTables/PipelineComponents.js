import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const PipelineComponents = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const components = [
    {
      name: 'Kubeflow Pipelines',
      role: isKo ? 'ML 워크플로우 오케스트레이션' : isZh ? 'ML 工作流编排' : 'ML Workflow Orchestration',
      stack: 'Argo Workflows, Tekton',
      color: '#ff6b6b',
      bgColor: '#fff5f5'
    },
    {
      name: 'MLflow',
      role: isKo ? '실험 추적, 모델 레지스트리' : isZh ? '实验跟踪，模型注册表' : 'Experiment Tracking, Model Registry',
      stack: 'MLflow Tracking Server, S3 Backend',
      color: '#4ecdc4',
      bgColor: '#f0fdfa'
    },
    {
      name: 'vLLM + ArgoCD',
      role: isKo ? '모델 서빙 및 GitOps 배포' : isZh ? '模型服务与 GitOps 部署' : 'Model Serving & GitOps Deployment',
      stack: 'vLLM, ArgoCD, GitOps',
      color: '#45b7d1',
      bgColor: '#eff6ff'
    },
    {
      name: 'Karpenter',
      role: isKo ? '동적 GPU 노드 프로비저닝' : isZh ? '动态 GPU 节点配置' : 'Dynamic GPU Node Provisioning',
      stack: 'AWS EC2, Spot Instances',
      color: '#96ceb4',
      bgColor: '#f0fdf4'
    },
    {
      name: 'Argo Workflows',
      role: 'CI/CD for ML',
      stack: 'GitOps, Automated Deployment',
      color: '#f4a261',
      bgColor: '#fef3e2'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🔧 파이프라인 핵심 컴포넌트' : isZh ? '🔧 管道核心组件' : '🔧 Pipeline Core Components'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'MLOps 플랫폼을 구성하는 5가지 핵심 기술' : isZh ? '构成 MLOps 平台的 5 项核心技术' : '5 Core Technologies Powering MLOps Platform'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{
          display: 'grid',
          gap: '16px'
        }}>
          {components.map((component, index) => (
            <div
              key={index}
              style={{
                background: component.bgColor,
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `4px solid ${component.color}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                display: 'grid',
                gridTemplateColumns: '200px 1fr 1fr',
                gap: '20px',
                alignItems: 'center'
              }}
            >
              <div style={{ fontSize: '16px', fontWeight: '700', color: component.color }}>
                {component.name}
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                  {isKo ? '역할' : isZh ? '角色' : 'Role'}
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  {component.role}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                  {isKo ? '기술 스택' : isZh ? '技术栈' : 'Tech Stack'}
                </div>
                <div style={{ fontSize: '14px', color: '#374151', fontFamily: 'monospace' }}>
                  {component.stack}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PipelineComponents;
