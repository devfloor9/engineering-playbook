import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const LayerRoles = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  // 요청은 위에서 아래로(L6→L1) 흐르고, 빌드는 아래에서 위로(L1→L6) 쌓인다.
  // 표는 최상단 L6부터 최하단 L1 순서로 표시한다.
  const layers = [
    {
      layer: isKo ? 'Layer 6: Experience & Channels' : isZh ? '第6层：体验与渠道' : 'Layer 6: Experience & Channels',
      role: isKo ? '사용자·시스템 진입점, 멀티 채널 노출' : isZh ? '用户与系统入口、多渠道接入' : 'User/system entry points, multi-channel exposure',
      components: isKo ? 'API · gRPC, Agent SDK, Web UI, 채널 연동' : isZh ? 'API · gRPC、Agent SDK、Web UI、渠道集成' : 'API · gRPC, Agent SDK, Web UI, Channel Connectors',
      color: '#e3f2fd'
    },
    {
      layer: isKo ? 'Layer 5: Gateway & Routing' : isZh ? '第5层：网关与路由' : 'Layer 5: Gateway & Routing',
      role: isKo ? '인증, 지능형 추론 라우팅, 비용 가드레일' : isZh ? '认证、智能推理路由、成本护栏' : 'Auth, intelligent inference routing, cost guardrails',
      components: isKo ? '2-Tier Gateway, Cascade Router, KV Cache-aware 라우팅, Rate Limit' : isZh ? '2-Tier 网关、Cascade 路由、KV Cache 感知路由、限流' : '2-Tier Gateway, Cascade Router, KV Cache-aware Routing, Rate Limit',
      color: '#fff3e0'
    },
    {
      layer: isKo ? 'Layer 4: Agent Runtime & Orchestration' : isZh ? '第4层：代理运行时与编排' : 'Layer 4: Agent Runtime & Orchestration',
      role: isKo ? 'Agent 실행 루프, 메모리, 도구·멀티에이전트 협업' : isZh ? '代理执行循环、记忆、工具与多代理协作' : 'Agent loops, memory, tool & multi-agent collaboration',
      components: isKo ? 'Agent Runtime, Tool Registry (MCP), A2A, State Store' : isZh ? '代理运行时、工具注册表 (MCP)、A2A、状态存储' : 'Agent Runtime, Tool Registry (MCP), A2A, State Store',
      color: '#e8f5e9'
    },
    {
      layer: isKo ? 'Layer 3: Data, Knowledge & Memory' : isZh ? '第3层：数据、知识与记忆' : 'Layer 3: Data, Knowledge & Memory',
      role: isKo ? 'RAG 검색, 지식 그래프, 세션·장기 메모리' : isZh ? 'RAG 检索、知识图谱、会话与长期记忆' : 'RAG retrieval, knowledge graph, session/long-term memory',
      components: isKo ? 'Vector DB, Knowledge/Feature Store, Cache, Object Storage' : isZh ? '向量数据库、知识/特征库、缓存、对象存储' : 'Vector DB, Knowledge/Feature Store, Cache, Object Storage',
      color: '#f3e5f5'
    },
    {
      layer: isKo ? 'Layer 2: Model Serving & Inference' : isZh ? '第2层：模型服务与推理' : 'Layer 2: Model Serving & Inference',
      role: isKo ? 'LLM·비-LLM 추론 엔진, 분산 추론, 모델 레지스트리' : isZh ? 'LLM 与非 LLM 推理引擎、分布式推理、模型注册表' : 'LLM/non-LLM inference engines, distributed serving, model registry',
      components: isKo ? 'vLLM, llm-d, Triton, Model Registry' : isZh ? 'vLLM、llm-d、Triton、模型注册表' : 'vLLM, llm-d, Triton, Model Registry',
      color: '#fce4ec'
    },
    {
      layer: isKo ? 'Layer 1: AI Infrastructure' : isZh ? '第1层：AI 基础设施' : 'Layer 1: AI Infrastructure',
      role: isKo ? '가속 컴퓨팅, GPU 오케스트레이션·모니터링·성능 최적화' : isZh ? '加速计算、GPU 编排、监控与性能优化' : 'Accelerated compute, GPU orchestration, monitoring & perf optimization',
      components: isKo ? 'GPU · Trainium · Inferentia, Karpenter · Kueue · DRA, MIG, DCGM · Neuron Monitor, EFA' : isZh ? 'GPU · Trainium · Inferentia、Karpenter · Kueue · DRA、MIG、DCGM · Neuron Monitor、EFA' : 'GPU · Trainium · Inferentia, Karpenter · Kueue · DRA, MIG, DCGM · Neuron Monitor, EFA',
      color: '#eceff1'
    }
  ];

  const planes = [
    {
      plane: isKo ? '관측성 & 평가' : isZh ? '可观测性与评估' : 'Observability & Evaluation',
      role: isKo ? '트레이싱, 메트릭, 비용 추적, 품질 평가, 드리프트 감지' : isZh ? '追踪、指标、成本跟踪、质量评估、漂移检测' : 'Tracing, metrics, cost tracking, quality eval, drift detection',
      components: isKo ? 'Langfuse, OpenTelemetry, RAGAS, Cost Tracking, Drift Detection' : isZh ? 'Langfuse、OpenTelemetry、RAGAS、成本跟踪、漂移检测' : 'Langfuse, OpenTelemetry, RAGAS, Cost Tracking, Drift Detection',
      color: '#e0f7fa'
    },
    {
      plane: isKo ? '거버넌스 · 안전 · 주권' : isZh ? '治理 · 安全 · 主权' : 'Governance, Safety & Sovereignty',
      role: isKo ? 'Guardrails, 정책·RBAC, 컴플라이언스, 데이터 주권·리전 강제' : isZh ? '护栏、策略与 RBAC、合规、数据主权与区域强制' : 'Guardrails, policy/RBAC, compliance, data sovereignty & region enforcement',
      components: isKo ? 'NeMo Guardrails, OIDC/RBAC, SCP 리전 강제, ISMS-P · SOC2' : isZh ? 'NeMo Guardrails、OIDC/RBAC、SCP 区域强制、ISMS-P · SOC2' : 'NeMo Guardrails, OIDC/RBAC, SCP Region Enforcement, ISMS-P · SOC2',
      color: '#ffebee'
    },
    {
      plane: isKo ? '모델 라이프사이클 (FMOps)' : isZh ? '模型生命周期 (FMOps)' : 'Model Lifecycle (FMOps)',
      role: isKo ? '학습·파인튜닝, 평가 게이트, 지속 학습(CT), 피드백 루프' : isZh ? '训练与微调、评估门、持续训练 (CT)、反馈循环' : 'Training/fine-tuning, eval gates, continuous training, feedback loop',
      components: isKo ? 'Training Pipeline, CT Scheduler, Eval Harness, Feedback Loop' : isZh ? '训练管道、CT 调度器、评估工具、反馈循环' : 'Training Pipeline, CT Scheduler, Eval Harness, Feedback Loop',
      color: '#fff0f5'
    }
  ];

  const cellGrid = '230px 1fr 300px';

  const headerLabels = {
    layer: isKo ? '레이어' : isZh ? '层' : 'Layer',
    plane: isKo ? '플레인' : isZh ? '平面' : 'Plane',
    role: isKo ? '역할' : isZh ? '角色' : 'Role',
    components: isKo ? '주요 컴포넌트' : isZh ? '主要组件' : 'Key Components'
  };

  return (
    <div style={{
      maxWidth: '1040px',
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
          {isKo ? '런타임 레이어 (6) — 요청 경로' : isZh ? '运行时层 (6) — 请求路径' : 'Runtime Layers (6) — Request Path'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: cellGrid,
          background: 'var(--ifm-color-emphasis-100)',
          padding: '12px 20px',
          fontWeight: '600',
          fontSize: '14px',
          color: 'var(--ifm-font-color-base)',
          borderBottom: '2px solid var(--ifm-color-emphasis-300)'
        }}>
          <div>{headerLabels.layer}</div>
          <div>{headerLabels.role}</div>
          <div>{headerLabels.components}</div>
        </div>

        {layers.map((layer, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: cellGrid,
              padding: '16px 20px',
              borderBottom: index < layers.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              background: layer.color,
              cursor: 'default'
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a202c' }}>
              {layer.layer}
            </div>
            <div style={{ fontSize: '14px', color: '#2d3748', lineHeight: '1.5' }}>
              {layer.role}
            </div>
            <div style={{ fontSize: '13px', color: '#4a5568', fontFamily: 'monospace' }}>
              {layer.components}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        color: 'white',
        padding: '16px 24px',
        marginTop: '16px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? '횡단 플레인 (3) — 전 레이어 관통' : isZh ? '横切平面 (3) — 贯穿所有层' : 'Cross-cutting Planes (3) — Span All Layers'}
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
          gridTemplateColumns: cellGrid,
          background: 'var(--ifm-color-emphasis-100)',
          padding: '12px 20px',
          fontWeight: '600',
          fontSize: '14px',
          color: 'var(--ifm-font-color-base)',
          borderBottom: '2px solid var(--ifm-color-emphasis-300)'
        }}>
          <div>{headerLabels.plane}</div>
          <div>{headerLabels.role}</div>
          <div>{headerLabels.components}</div>
        </div>

        {planes.map((plane, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: cellGrid,
              padding: '16px 20px',
              borderBottom: index < planes.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              background: plane.color,
              cursor: 'default'
            }}
          >
            <div style={{ fontSize: '15px', fontWeight: '600', color: '#1a202c' }}>
              {plane.plane}
            </div>
            <div style={{ fontSize: '14px', color: '#2d3748', lineHeight: '1.5' }}>
              {plane.role}
            </div>
            <div style={{ fontSize: '13px', color: '#4a5568', fontFamily: 'monospace' }}>
              {plane.components}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default LayerRoles;
