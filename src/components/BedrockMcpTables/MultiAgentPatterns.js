import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MultiAgentPatterns = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const patterns = [
    {
      pattern: 'Sequential',
      description: isKo ? '순차적 에이전트 호출' : isZh ? '顺序代理调用' : 'Sequential agent invocation',
      useCase: isKo ? '진단 → 분석 → 해결' : isZh ? '诊断 → 分析 → 解决' : 'Diagnose → Analyze → Remediate',
      color: '#4285f4'
    },
    {
      pattern: 'Parallel',
      description: isKo ? '병렬 에이전트 호출' : isZh ? '并行代理调用' : 'Parallel agent invocation',
      useCase: isKo ? '여러 클러스터 동시 점검' : isZh ? '同时检查多个集群' : 'Simultaneous multi-cluster inspection',
      color: '#34a853'
    },
    {
      pattern: 'Hierarchical',
      description: isKo ? '계층적 에이전트 구조' : isZh ? '分层代理结构' : 'Hierarchical agent structure',
      useCase: isKo ? '마스터 에이전트 + 전문 에이전트' : isZh ? '主代理 + 专业代理' : 'Master agent + specialist agents',
      color: '#fbbc04'
    },
    {
      pattern: 'Collaborative',
      description: isKo ? '에이전트 간 협업' : isZh ? '代理间协作' : 'Agent-to-agent collaboration',
      useCase: isKo ? '복잡한 문제 해결' : isZh ? '解决复杂问题' : 'Complex problem solving',
      color: '#ea4335'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '15px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ff9900 0%, #cc7a00 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '멀티 에이전트 패턴' : isZh ? '多代理模式' : 'Multi-Agent Patterns'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {patterns.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'var(--ifm-color-emphasis-50)',
                padding: '18px',
                borderRadius: '8px',
                borderLeft: `4px solid ${item.color}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '150px 250px 1fr',
                gap: '16px',
                alignItems: 'center'
              }}>
                <div style={{
                  fontWeight: '700',
                  color: item.color,
                  fontSize: '16px'
                }}>
                  {item.pattern}
                </div>
                <div style={{ fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>
                  {item.description}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#059669',
                  fontWeight: '500',
                  fontStyle: 'italic'
                }}>
                  {item.useCase}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MultiAgentPatterns;
