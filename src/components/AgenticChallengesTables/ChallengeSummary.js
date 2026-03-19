import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ChallengeSummary = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const challenges = [
    {
      name: isKo ? 'GPU 리소스 관리 및 비용 최적화' : isZh ? 'GPU 资源管理和成本优化' : 'GPU Resource Management & Cost Optimization',
      icon: '🎯',
      color: '#ff6b6b',
      bgColor: 'var(--ifm-color-emphasis-100)',
      problem: isKo ? '멀티 클러스터 GPU 가시성 부재, 세대별 워크로드 매칭, GPU 유휴 비용' : isZh ? '缺乏多集群 GPU 可见性，代际工作负载匹配，GPU 闲置成本' : 'Lack of multi-cluster GPU visibility, generation-specific workload matching, GPU idle costs',
      limitation: isKo ? '수동 모니터링, 정적 할당, 비용 가시성 부재' : isZh ? '手动监控，静态分配，缺乏成本可见性' : 'Manual monitoring, static allocation, no cost visibility'
    },
    {
      name: isKo ? '지능형 추론 라우팅 및 게이트웨이' : isZh ? '智能推理路由和网关' : 'Intelligent Inference Routing & Gateway',
      icon: '🔀',
      color: '#4ecdc4',
      bgColor: 'var(--ifm-color-emphasis-100)',
      problem: isKo ? '예측 불가능한 트래픽, 멀티 모델 라우팅, 동적 스케일링' : isZh ? '不可预测的流量，多模型路由，动态扩展' : 'Unpredictable traffic, multi-model routing, dynamic scaling',
      limitation: isKo ? '느린 프로비저닝, 고정 용량, 수동 라우팅' : isZh ? '缓慢的配置，固定容量，手动路由' : 'Slow provisioning, fixed capacity, manual routing'
    },
    {
      name: isKo ? 'LLMOps 관찰성 및 비용 거버넌스' : isZh ? 'LLMOps 可观测性和成本治理' : 'LLMOps Observability & Cost Governance',
      icon: '💰',
      color: '#45b7d1',
      bgColor: 'var(--ifm-color-emphasis-100)',
      problem: isKo ? '토큰 레벨 추적 어려움, 비용 가시성 부재, 품질 평가 체계 미흡' : isZh ? '令牌级别跟踪困难，缺乏成本可见性，质量评估体系不足' : 'Difficulty tracking at token level, no cost visibility, inadequate quality evaluation',
      limitation: isKo ? '수동 추적, 최적화 불가, 사후 분석만 가능' : isZh ? '手动跟踪，无法优化，仅事后分析' : 'Manual tracking, no optimization, only post-analysis'
    },
    {
      name: isKo ? 'Agent 오케스트레이션 및 안전성' : isZh ? 'Agent 编排和安全性' : 'Agent Orchestration & Safety',
      icon: '🤖',
      color: '#9b59b6',
      bgColor: 'var(--ifm-color-emphasis-100)',
      problem: isKo ? 'Agent 워크플로우 복잡성, 도구 통합 어려움, 안전성 보장 미흡' : isZh ? 'Agent 工作流复杂性，工具集成困难，安全性保障不足' : 'Agent workflow complexity, tool integration challenges, inadequate safety guarantees',
      limitation: isKo ? '수동 오케스트레이션, 표준화 부재, 가드레일 미흡' : isZh ? '手动编排，缺乏标准化，防护栏不足' : 'Manual orchestration, lack of standardization, insufficient guardrails'
    },
    {
      name: isKo ? '모델 공급망 관리 (Model Supply Chain)' : isZh ? '模型供应链管理' : 'Model Supply Chain Management',
      icon: '🔧',
      color: '#96ceb4',
      bgColor: 'var(--ifm-color-emphasis-100)',
      problem: isKo ? '분산 학습 인프라 복잡성, 리소스 프로비저닝 지연, 모델 배포 파이프라인' : isZh ? '分布式训练基础设施复杂性，资源配置延迟，模型部署流水线' : 'Distributed training infrastructure complexity, resource provisioning delays, model deployment pipeline',
      limitation: isKo ? '수동 클러스터 관리, 낮은 활용률, 파이프라인 자동화 부재' : isZh ? '手动集群管理，低利用率，缺乏流水线自动化' : 'Manual cluster management, low utilization, no pipeline automation'
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
          {isKo ? '🚀 에이전틱 AI 플랫폼 핵심 도전과제' : isZh ? '🚀 代理 AI 平台核心挑战' : '🚀 Agentic AI Platform Core Challenges'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '기존 인프라의 한계와 해결해야 할 문제' : isZh ? '现有基础设施的限制和需要解决的问题' : 'Legacy infrastructure limitations and problems to solve'}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '16px'
        }}>
          {challenges.map((challenge, index) => (
            <div
              key={index}
              style={{
                background: challenge.bgColor,
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `4px solid ${challenge.color}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '24px' }}>{challenge.icon}</span>
                <span style={{ fontSize: '16px', fontWeight: '600', color: challenge.color }}>
                  {challenge.name}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ifm-color-emphasis-600)', marginBottom: '4px' }}>
                  {isKo ? '핵심 문제' : isZh ? '核心问题' : 'Core Problem'}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>
                  {challenge.problem}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--ifm-color-emphasis-600)', marginBottom: '4px' }}>
                  {isKo ? '기존 인프라의 한계' : isZh ? '现有基础设施限制' : 'Legacy Limitation'}
                </div>
                <div style={{ fontSize: '14px', color: '#dc2626', fontWeight: '500' }}>
                  {challenge.limitation}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChallengeSummary;
