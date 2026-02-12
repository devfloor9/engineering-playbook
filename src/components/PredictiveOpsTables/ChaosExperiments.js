import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ChaosExperiments = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const experiments = [
    {
      experiment: isKo ? 'Pod 종료' : isZh ? 'Pod 终止' : 'Pod Termination',
      injectedFault: isKo ? '2/3 Pod 종료' : isZh ? '终止 2/3 Pod' : 'Terminate 2/3 pods',
      systemReaction: isKo ? 'HPA 30초 후 복구' : isZh ? 'HPA 30 秒后恢复' : 'HPA recovery after 30s',
      aiLearning: isKo ? '"Pod 종료 → HPA 반응 패턴"' : isZh ? '"Pod 终止 → HPA 响应模式"' : '"Pod termination → HPA response pattern"',
      color: '#ef4444'
    },
    {
      experiment: isKo ? '노드 장애' : isZh ? '节点故障' : 'Node Failure',
      injectedFault: isKo ? '노드 1대 drain' : isZh ? '驱逐 1 个节点' : 'Drain 1 node',
      systemReaction: isKo ? 'Karpenter 2분 후 대체' : isZh ? 'Karpenter 2 分钟后替换' : 'Karpenter replacement after 2 min',
      aiLearning: isKo ? '"노드 장애 → Karpenter 대응 시간"' : isZh ? '"节点故障 → Karpenter 响应时间"' : '"Node failure → Karpenter response time"',
      color: '#f97316'
    },
    {
      experiment: isKo ? '네트워크 지연' : isZh ? '网络延迟' : 'Network Latency',
      injectedFault: isKo ? '100ms 추가 지연' : isZh ? '增加 100ms 延迟' : 'Add 100ms latency',
      systemReaction: isKo ? '타임아웃 에러 급증' : isZh ? '超时错误激增' : 'Timeout errors spike',
      aiLearning: isKo ? '"네트워크 지연 → 타임아웃 임계값"' : isZh ? '"网络延迟 → 超时阈值"' : '"Network latency → timeout threshold"',
      color: '#f59e0b'
    },
    {
      experiment: isKo ? 'CPU 스트레스' : isZh ? 'CPU 压力' : 'CPU Stress',
      injectedFault: isKo ? '90% CPU 부하' : isZh ? '90% CPU 负载' : '90% CPU load',
      systemReaction: isKo ? '스로틀링 발생' : isZh ? '发生限流' : 'Throttling occurs',
      aiLearning: isKo ? '"CPU 스트레스 → 스로틀링 패턴"' : isZh ? '"CPU 压力 → 限流模式"' : '"CPU stress → throttling pattern"',
      color: '#84cc16'
    },
    {
      experiment: isKo ? '메모리 누수' : isZh ? '内存泄漏' : 'Memory Leak',
      injectedFault: isKo ? '점진적 메모리 증가' : isZh ? '内存逐渐增长' : 'Gradual memory increase',
      systemReaction: 'OOMKilled ' + (isKo ? '발생' : isZh ? '发生' : 'occurs'),
      aiLearning: isKo ? '"메모리 누수 패턴 → 사전 감지 규칙"' : isZh ? '"内存泄漏模式 → 主动检测规则"' : '"Memory leak pattern → proactive detection rule"',
      color: '#06b6d4'
    }
  ];

  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    fontSize: '15px',
    lineHeight: '1.6'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
    color: '#ffffff',
    padding: '1.5rem',
    textAlign: 'center'
  };

  const titleStyle = {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: '700'
  };

  const subtitleStyle = {
    margin: 0,
    fontSize: '0.95rem',
    opacity: 0.95,
    fontWeight: '400'
  };

  const tableStyle = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '15px'
  };

  const thStyle = {
    backgroundColor: '#f3f4f6',
    color: '#111827',
    padding: '1rem',
    textAlign: 'left',
    fontWeight: '700',
    borderBottom: '2px solid #e5e7eb',
    fontSize: '0.9375rem'
  };

  const tdStyle = {
    padding: '1rem',
    borderBottom: '1px solid #e5e7eb',
    color: '#374151',
    fontSize: '15px',
    verticalAlign: 'top'
  };

  const experimentBadgeStyle = (color) => ({
    display: 'inline-block',
    backgroundColor: color,
    color: '#ffffff',
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600'
  });

  const learningStyle = {
    fontStyle: 'italic',
    color: '#4b5563',
    backgroundColor: '#f9fafb',
    padding: '0.5rem',
    borderRadius: '4px',
    borderLeft: '3px solid #10b981'
  };

  const footerStyle = {
    backgroundColor: '#fef3c7',
    padding: '1rem 1.5rem',
    fontSize: '0.875rem',
    color: '#92400e',
    borderTop: '2px solid #fbbf24',
    lineHeight: '1.6'
  };

  const footerLabelStyle = {
    fontWeight: '700',
    color: '#78350f'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>💥 {isKo ? 'Chaos Engineering 실험 결과' : isZh ? '混沌工程实验结果' : 'Chaos Engineering Experiment Results'}</h2>
        <p style={subtitleStyle}>{isKo ? 'AWS FIS 기반 장애 주입 및 AI 학습' : isZh ? '基于 AWS FIS 的故障注入和 AI 学习' : 'AWS FIS-based Fault Injection and AI Learning'}</p>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr>
              <th style={thStyle}>{isKo ? '실험' : isZh ? '实验' : 'Experiment'}</th>
              <th style={thStyle}>{isKo ? '주입 장애' : isZh ? '注入故障' : 'Injected Fault'}</th>
              <th style={thStyle}>{isKo ? '시스템 반응' : isZh ? '系统反应' : 'System Reaction'}</th>
              <th style={thStyle}>{isKo ? 'AI 학습' : isZh ? 'AI 学习' : 'AI Learning'}</th>
            </tr>
          </thead>
          <tbody>
            {experiments.map((item, index) => (
              <tr key={index}>
                <td style={tdStyle}>
                  <div style={experimentBadgeStyle(item.color)}>
                    {item.experiment}
                  </div>
                </td>
                <td style={tdStyle}>{item.injectedFault}</td>
                <td style={tdStyle}>{item.systemReaction}</td>
                <td style={tdStyle}>
                  <div style={learningStyle}>
                    {item.aiLearning}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={footerStyle}>
        <span style={footerLabelStyle}>{isKo ? '피드백 루프:' : isZh ? '反馈循环：' : 'Feedback Loop:'}</span> {isKo ? 'FIS로 장애를 주입하고 AI가 시스템 반응 패턴을 학습하면, AI Agent의 자동 대응 능력이 지속적으로 향상됩니다. "장애 주입 → 관찰 → 학습 → 대응 개선"의 선순환이 자율 운영의 핵심입니다.' : isZh ? '通过 FIS 注入故障并让 AI 学习系统响应模式，AI Agent 的自动响应能力将持续提升。"故障注入 → 观察 → 学习 → 响应改进"的良性循环是自主运维的核心。' : 'As FIS injects faults and AI learns system response patterns, the AI Agent\'s automatic response capabilities continuously improve. The virtuous cycle of "fault injection → observation → learning → response improvement" is key to autonomous operations.'}
      </div>
    </div>
  );
};

export default ChaosExperiments;
