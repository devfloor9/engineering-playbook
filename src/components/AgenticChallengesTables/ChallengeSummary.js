import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ChallengeSummary = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const challenges = [
    {
      name: isKo ? 'GPU 모니터링 및 스케줄링' : isZh ? 'GPU 监控和调度' : 'GPU Monitoring & Scheduling',
      icon: '🎯',
      color: '#ff6b6b',
      bgColor: '#fff5f5',
      problem: isKo ? '멀티 클러스터 GPU 가시성 부재, 세대별 워크로드 매칭' : isZh ? '缺乏多集群 GPU 可见性，代际工作负载匹配' : 'Lack of multi-cluster GPU visibility, generation-specific workload matching',
      limitation: isKo ? '수동 모니터링, 정적 할당' : isZh ? '手动监控，静态分配' : 'Manual monitoring, static allocation'
    },
    {
      name: isKo ? '동적 라우팅 및 스케일링' : isZh ? '动态路由和扩展' : 'Dynamic Routing & Scaling',
      icon: '🔀',
      color: '#4ecdc4',
      bgColor: '#f0fdfa',
      problem: isKo ? '예측 불가능한 트래픽, 멀티 모델 서빙 복잡성' : isZh ? '不可预测的流量，多模型服务复杂性' : 'Unpredictable traffic, multi-model serving complexity',
      limitation: isKo ? '느린 프로비저닝, 고정 용량' : isZh ? '缓慢的配置，固定容量' : 'Slow provisioning, fixed capacity'
    },
    {
      name: isKo ? '비용 컨트롤' : isZh ? '成本控制' : 'Cost Control',
      icon: '💰',
      color: '#45b7d1',
      bgColor: '#eff6ff',
      problem: isKo ? 'GPU 유휴 비용, 토큰 레벨 추적 어려움' : isZh ? 'GPU 闲置成本，令牌级别跟踪困难' : 'GPU idle costs, difficulty tracking at token level',
      limitation: isKo ? '비용 가시성 부재, 최적화 불가' : isZh ? '缺乏成本可见性，无法优化' : 'No cost visibility, no optimization'
    },
    {
      name: isKo ? 'FM 파인튜닝' : isZh ? 'FM 微调' : 'FM Fine-tuning',
      icon: '🔧',
      color: '#96ceb4',
      bgColor: '#f0fdf4',
      problem: isKo ? '분산 학습 인프라 복잡성, 리소스 프로비저닝 지연' : isZh ? '分布式训练基础设施复杂性，资源配置延迟' : 'Distributed training infrastructure complexity, resource provisioning delays',
      limitation: isKo ? '수동 클러스터 관리, 낮은 활용률' : isZh ? '手动集群管理，低利用率' : 'Manual cluster management, low utilization'
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
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
                  {isKo ? '핵심 문제' : isZh ? '核心问题' : 'Core Problem'}
                </div>
                <div style={{ fontSize: '14px', color: '#374151' }}>
                  {challenge.problem}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '4px' }}>
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
