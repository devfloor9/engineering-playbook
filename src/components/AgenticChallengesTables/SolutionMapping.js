import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const SolutionMapping = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const solutions = [
    {
      challenge: isKo ? 'GPU 모니터링 및 스케줄링' : isZh ? 'GPU 监控和调度' : 'GPU Monitoring & Scheduling',
      color: '#ff6b6b',
      bgColor: '#fff5f5',
      coreSolution: 'Karpenter',
      supportingSolutions: ['DCGM Exporter', 'NVIDIA GPU Operator'],
      solves: isKo ? 'GPU 노드 자동 프로비저닝, 세대별 워크로드 매칭' : isZh ? 'GPU 节点自动配置，代际工作负载匹配' : 'GPU node auto provisioning, generation-specific workload matching'
    },
    {
      challenge: isKo ? '동적 라우팅 및 스케일링' : isZh ? '动态路由和扩展' : 'Dynamic Routing & Scaling',
      color: '#4ecdc4',
      bgColor: '#f0fdfa',
      coreSolution: 'Kgateway, LiteLLM',
      supportingSolutions: ['KEDA', 'vLLM', 'llm-d'],
      solves: isKo ? '멀티 모델 라우팅, 트래픽 기반 자동 스케일링' : isZh ? '多模型路由，基于流量的自动扩展' : 'Multi-model routing, traffic-based auto scaling'
    },
    {
      challenge: isKo ? '토큰/비용 모니터링' : isZh ? '令牌/成本监控' : 'Token/Cost Monitoring',
      color: '#45b7d1',
      bgColor: '#eff6ff',
      coreSolution: 'LangSmith (개발) + Langfuse (프로덕션)',
      supportingSolutions: ['OpenTelemetry', 'Prometheus'],
      solves: isKo ? '토큰 레벨 추적, 비용 가시성, 품질 평가' : isZh ? '令牌级别跟踪，成本可见性，质量评估' : 'Token-level tracking, cost visibility, quality evaluation'
    },
    {
      challenge: isKo ? 'Agent 오케스트레이션 및 안전성' : isZh ? 'Agent 编排和安全性' : 'Agent Orchestration & Safety',
      color: '#9b59b6',
      bgColor: '#f3ebf8',
      coreSolution: 'LangGraph, NeMo Guardrails',
      supportingSolutions: ['MCP/A2A', 'Ragas'],
      solves: isKo ? 'Agent 워크플로우 오케스트레이션, 안전성 가드레일, 도구 통합' : isZh ? 'Agent 工作流编排，安全防护栏，工具集成' : 'Agent workflow orchestration, safety guardrails, tool integration'
    },
    {
      challenge: isKo ? '모델 공급망 관리' : isZh ? '模型供应链管理' : 'Model Supply Chain Management',
      color: '#96ceb4',
      bgColor: '#f0fdf4',
      coreSolution: 'NeMo, Kubeflow',
      supportingSolutions: ['MLflow', 'Ray'],
      solves: isKo ? '분산 학습 오케스트레이션, 파이프라인 자동화' : isZh ? '分布式学习编排，流水线自动化' : 'Distributed learning orchestration, pipeline automation'
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
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🎯 도전과제별 솔루션 매핑' : isZh ? '🎯 按挑战分类的解决方案映射' : '🎯 Solution Mapping by Challenge'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '핵심 솔루션과 보조 솔루션' : isZh ? '核心解决方案和辅助解决方案' : 'Core and supporting solutions'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {solutions.map((item, index) => (
            <div
              key={index}
              style={{
                background: item.bgColor,
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `4px solid ${item.color}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: item.color,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <span style={{ fontSize: '20px' }}>🎯</span>
                {item.challenge}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '6px'
                  }}>
                    {isKo ? '핵심 솔루션' : isZh ? '核心解决方案' : 'Core Solution'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {item.coreSolution.split(', ').map((solution, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          padding: '6px 14px',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: '600',
                          backgroundColor: item.color,
                          color: 'white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        {solution}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '6px'
                  }}>
                    {isKo ? '보조 솔루션' : isZh ? '辅助解决方案' : 'Supporting Solutions'}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {item.supportingSolutions.map((solution, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          backgroundColor: 'white',
                          color: item.color,
                          border: `1.5px solid ${item.color}60`
                        }}
                      >
                        {solution}
                      </span>
                    ))}
                  </div>
                </div>

                <div style={{
                  marginTop: '4px',
                  padding: '12px',
                  background: 'white',
                  borderRadius: '6px',
                  border: '1px solid #e5e7eb'
                }}>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    {isKo ? '해결하는 문제' : isZh ? '解决的问题' : 'Solves'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {item.solves}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SolutionMapping;
