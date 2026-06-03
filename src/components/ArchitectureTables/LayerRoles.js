import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const LayerRoles = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const layers = [
    {
      layer: isKo ? 'Layer 1: Client & Feedback' : isZh ? '第1层：客户端与反馈' : 'Layer 1: Client & Feedback',
      role: isKo ? '사용자 인터페이스 및 피드백 수집' : isZh ? '用户接口和反馈收集' : 'User interface and feedback collection',
      components: isKo ? 'API Clients, Web UI, SDK, Feedback Collector' : isZh ? 'API 客户端、Web UI、SDK、反馈收集器' : 'API Clients, Web UI, SDK, Feedback Collector',
      color: '#e3f2fd'
    },
    {
      layer: isKo ? 'Layer 2: Gateway & Governance' : isZh ? '第2层：网关与治理' : 'Layer 2: Gateway & Governance',
      role: isKo ? '인증, 라우팅, A/B 테스트, 비용 제어' : isZh ? '认证、路由、A/B 测试、成本控制' : 'Authentication, routing, A/B testing, cost control',
      components: isKo ? 'Inference Gateway, Auth, A/B Router, Cost Guardrails' : isZh ? '推理网关、认证、A/B 路由器、成本护栏' : 'Inference Gateway, Auth, A/B Router, Cost Guardrails',
      color: '#fff3e0'
    },
    {
      layer: isKo ? 'Layer 3: Agent & Orchestration' : isZh ? '第3层：代理与编排' : 'Layer 3: Agent & Orchestration',
      role: isKo ? 'AI 에이전트 실행 및 버전 관리' : isZh ? 'AI 代理执行和版本管理' : 'AI agent execution and version management',
      components: isKo ? 'Agent Controller, Agent Runtime, Tool Registry, Agent Version Store' : isZh ? '代理控制器、代理运行时、工具注册表、代理版本库' : 'Agent Controller, Agent Runtime, Tool Registry, Agent Version Store',
      color: '#e8f5e9'
    },
    {
      layer: isKo ? 'Layer 4: Model Serving & Lifecycle' : isZh ? '第4层：模型服务与生命周期' : 'Layer 4: Model Serving & Lifecycle',
      role: isKo ? 'LLM 추론, 모델 버전 관리, 파인튜닝' : isZh ? 'LLM 推理、模型版本管理、微调' : 'LLM inference, model versioning, fine-tuning',
      components: isKo ? 'LLM Serving Engine, Model Registry, Fine-tuning Service, Evaluation Harness' : isZh ? 'LLM 服务引擎、模型注册表、微调服务、评估工具' : 'LLM Serving Engine, Model Registry, Fine-tuning Service, Evaluation Harness',
      color: '#fce4ec'
    },
    {
      layer: isKo ? 'Layer 5: Data & Feature' : isZh ? '第5层：数据与特征' : 'Layer 5: Data & Feature',
      role: isKo ? '데이터 저장, Feature Store, 데이터 품질 관리' : isZh ? '数据存储、特征库、数据质量管理' : 'Data storage, Feature Store, data quality management',
      components: isKo ? 'Vector DB, Feature Store, ETL Pipeline, Data Quality Monitor' : isZh ? '向量数据库、特征库、ETL 管道、数据质量监控' : 'Vector DB, Feature Store, ETL Pipeline, Data Quality Monitor',
      color: '#f3e5f5'
    },
    {
      layer: isKo ? 'Layer 6: Observability & Insights' : isZh ? '第6层：可观测性与洞察' : 'Layer 6: Observability & Insights',
      role: isKo ? '모니터링, 추적, 드리프트 감지, 실험 추적' : isZh ? '监控、追踪、漂移检测、实验追踪' : 'Monitoring, tracing, drift detection, experiment tracking',
      components: isKo ? 'LLM Tracing, Metrics, Drift Detection, Experiment Tracking' : isZh ? 'LLM 追踪、指标、漂移检测、实验追踪' : 'LLM Tracing, Metrics, Drift Detection, Experiment Tracking',
      color: '#e0f7fa'
    },
    {
      layer: isKo ? 'Layer 7: Training & Feedback' : isZh ? '第7层：训练与反馈' : 'Layer 7: Training & Feedback',
      role: isKo ? '지속적 학습, 재학습 파이프라인, 피드백 루프' : isZh ? '持续学习、重新训练管道、反馈循环' : 'Continuous learning, retraining pipeline, feedback loop',
      components: isKo ? 'Training Pipeline, CT Scheduler, Feedback Loop, Drift Detector' : isZh ? '训练管道、CT 调度器、反馈循环、漂移检测器' : 'Training Pipeline, CT Scheduler, Feedback Loop, Drift Detector',
      color: '#fff0f5'
    },
    {
      layer: isKo ? 'Layer 8: Evaluation & Quality' : isZh ? '第8层：评估与质量' : 'Layer 8: Evaluation & Quality',
      role: isKo ? '품질 평가, Guardrails, 자동 롤백, SLO 관리' : isZh ? '质量评估、护栏、自动回滚、SLO 管理' : 'Quality evaluation, guardrails, automated rollback, SLO management',
      components: isKo ? 'RAGAS Metrics, Guardrails, Regression Detection, Automated Rollback' : isZh ? 'RAGAS 指标、护栏、回归检测、自动回滚' : 'RAGAS Metrics, Guardrails, Regression Detection, Automated Rollback',
      color: '#f0ffe1'
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
