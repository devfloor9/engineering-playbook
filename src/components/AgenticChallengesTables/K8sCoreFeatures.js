import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const K8sCoreFeatures = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const features = [
    {
      feature: isKo ? '선언적 리소스 관리' : isZh ? '声明式资源管理' : 'Declarative Resource Management',
      application: isKo ? 'GPU 리소스를 코드로 정의하고 버전 관리' : isZh ? '将 GPU 资源定义为代码并进行版本控制' : 'Define GPU resources as code with version control',
      challenges: ['1', '4']
    },
    {
      feature: isKo ? '자동 스케일링 (HPA/VPA)' : isZh ? '自动扩展 (HPA/VPA)' : 'Auto Scaling (HPA/VPA)',
      application: isKo ? '트래픽 패턴에 따른 Pod 자동 확장/축소' : isZh ? '根据流量模式自动扩展/缩减 Pod' : 'Automatic Pod expansion/contraction based on traffic patterns',
      challenges: ['2']
    },
    {
      feature: isKo ? '네임스페이스 기반 격리' : isZh ? '基于命名空间的隔离' : 'Namespace-based Isolation',
      application: isKo ? '팀/프로젝트별 리소스 할당량 관리' : isZh ? '按团队/项目管理资源配额' : 'Resource quota management by team/project',
      challenges: ['3']
    },
    {
      feature: isKo ? 'Operator 패턴' : isZh ? 'Operator 模式' : 'Operator Pattern',
      application: isKo ? '복잡한 분산 학습 워크플로우 자동화' : isZh ? '复杂分布式学习工作流自动化' : 'Automation of complex distributed learning workflows',
      challenges: ['4']
    },
    {
      feature: isKo ? '서비스 메시 통합' : isZh ? '服务网格集成' : 'Service Mesh Integration',
      application: isKo ? '멀티 모델 라우팅 및 트래픽 관리' : isZh ? '多模型路由和流量管理' : 'Multi-model routing and traffic management',
      challenges: ['2']
    },
    {
      feature: isKo ? '메트릭 기반 오케스트레이션' : isZh ? '基于指标的编排' : 'Metrics-based Orchestration',
      application: isKo ? 'GPU 사용률 기반 스케줄링 결정' : isZh ? '基于 GPU 利用率的调度决策' : 'GPU utilization-based scheduling decisions',
      challenges: ['1', '3']
    }
  ];

  const challengeColors = {
    '1': '#ff6b6b',
    '2': '#4ecdc4',
    '3': '#45b7d1',
    '4': '#96ceb4'
  };

  const challengeLabels = {
    '1': isKo ? 'GPU 모니터링' : isZh ? 'GPU 监控' : 'GPU Monitoring',
    '2': isKo ? '동적 라우팅' : isZh ? '动态路由' : 'Dynamic Routing',
    '3': isKo ? '비용 컨트롤' : isZh ? '成本控制' : 'Cost Control',
    '4': isKo ? 'FM 파인튜닝' : isZh ? 'FM 微调' : 'FM Fine-tuning'
  };

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
          {isKo ? '☸️ Kubernetes 핵심 기능 활용' : isZh ? '☸️ Kubernetes 核心功能应用' : '☸️ Kubernetes Core Features'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'AI 플랫폼 적용 방안과 해결되는 도전과제' : isZh ? 'AI 平台应用方案和解决的挑战' : 'AI platform applications and challenges addressed'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {features.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'var(--ifm-background-surface-color)',
                padding: '18px',
                borderRadius: '8px',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                borderLeft: '4px solid #326ce5'
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.5fr auto',
                gap: '16px',
                alignItems: 'start'
              }}>
                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#326ce5',
                    marginBottom: '4px'
                  }}>
                    {isKo ? 'K8s 기능' : isZh ? 'K8s 功能' : 'K8s Feature'}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '600', color: '#1e293b' }}>
                    {item.feature}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '4px'
                  }}>
                    {isKo ? 'AI 플랫폼 적용' : isZh ? 'AI 平台应用' : 'AI Platform Application'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#374151' }}>
                    {item.application}
                  </div>
                </div>

                <div>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#6b7280',
                    marginBottom: '6px'
                  }}>
                    {isKo ? '해결 도전과제' : isZh ? '解决挑战' : 'Resolves'}
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {item.challenges.map((ch, idx) => (
                      <span
                        key={idx}
                        style={{
                          display: 'inline-block',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '600',
                          backgroundColor: `${challengeColors[ch]}20`,
                          color: challengeColors[ch],
                          border: `1px solid ${challengeColors[ch]}40`
                        }}
                      >
                        #{ch}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: '#f9fafb',
          borderRadius: '6px',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '8px' }}>
            {isKo ? '도전과제 범례' : isZh ? '挑战图例' : 'Challenge Legend'}
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {Object.entries(challengeLabels).map(([num, label]) => (
              <div key={num} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  backgroundColor: challengeColors[num]
                }}></span>
                <span style={{ fontSize: '13px', color: '#374151' }}>
                  #{num} {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default K8sCoreFeatures;
