import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const PlatformComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';
  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: '600',
    color: 'var(--ifm-font-color-base)',
    marginBottom: '0.5rem',
  };

  const subtitleStyle = {
    fontSize: '0.95rem',
    color: 'var(--ifm-color-emphasis-600)',
    lineHeight: '1.6',
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    marginBottom: '1.5rem',
  };

  const cardStyle = {
    backgroundColor: 'var(--ifm-background-surface-color)',
    border: '1px solid var(--ifm-color-emphasis-200)',
    borderRadius: '8px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
  };

  const cardHeaderPurpleStyle = {
    background: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    padding: '1rem',
    color: '#ffffff',
  };

  const cardHeaderBlueStyle = {
    background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
    padding: '1rem',
    color: '#ffffff',
  };

  const cardTitleStyle = {
    fontSize: '1.125rem',
    fontWeight: '600',
    margin: '0',
  };

  const cardBodyStyle = {
    padding: '1.25rem',
  };

  const itemStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    marginBottom: '0.875rem',
  };

  const lastItemStyle = {
    ...itemStyle,
    marginBottom: '0',
  };

  const iconStyle = {
    fontSize: '1.25rem',
    marginRight: '0.75rem',
    flexShrink: '0',
    marginTop: '0.125rem',
  };

  const textStyle = {
    fontSize: '0.9375rem',
    color: 'var(--ifm-font-color-base)',
    lineHeight: '1.5',
  };

  const summaryStyle = {
    textAlign: 'center',
    padding: '1rem',
    backgroundColor: 'var(--ifm-background-surface-color)',
    border: '1px solid var(--ifm-color-emphasis-200)',
    borderRadius: '8px',
    fontSize: '0.9375rem',
    color: 'var(--ifm-color-emphasis-600)',
    fontWeight: '500',
  };

  const leftCardData = [
    { icon: '🧠', text: isKo ? 'LLM 서빙 및 추론 최적화' : isZh ? 'LLM 服务与推理优化' : 'LLM serving & inference optimization' },
    { icon: '🚀', text: isKo ? 'vLLM, llm-d 배포 구성' : isZh ? 'vLLM、llm-d 部署配置' : 'vLLM, llm-d deployment configuration' },
    { icon: '🎮', text: isKo ? 'GPU 리소스 관리' : isZh ? 'GPU 资源管理' : 'GPU resource management' },
    { icon: '⚡', text: isKo ? '실시간 추론 패턴' : isZh ? '实时推理模式' : 'Real-time inference patterns' },
  ];

  const rightCardData = [
    { icon: '🤖', text: isKo ? 'AI로 플랫폼 자체를 운영하고 개발' : isZh ? '用 AI 运维和开发平台本身' : 'Operate & develop the platform with AI' },
    { icon: '🔧', text: isKo ? 'Kiro+MCP 기반 프로그래머틱 자동화' : isZh ? '基于 Kiro+MCP 的编程式自动化' : 'Programmatic automation with Kiro+MCP' },
    { icon: '📊', text: isKo ? '예측 스케일링, AI Agent 자율 운영' : isZh ? '预测性扩展、AI Agent 自主运维' : 'Predictive scaling, AI Agent autonomous ops' },
    { icon: '📐', text: isKo ? '관찰성 스택, AIDLC 개발 방법론' : isZh ? '可观测性栈、AIDLC 开发方法论' : 'Observability stack, AIDLC methodology' },
  ];

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>{isKo ? '플랫폼 비교' : isZh ? '平台对比' : 'Platform Comparison'}</h2>
        <p style={subtitleStyle}>
          {isKo ? 'AI 인프라의 두 가지 핵심 관점: 워크로드 실행 vs 운영 방법론' : isZh ? 'AI 基础设施的两个核心视角：工作负载执行 vs 运维方法论' : 'Two key perspectives of AI infrastructure: workload execution vs operations methodology'}
        </p>
      </div>

      <div style={gridStyle}>
        <div style={cardStyle}>
          <div style={cardHeaderPurpleStyle}>
            <h3 style={cardTitleStyle}>Agentic AI Platform</h3>
          </div>
          <div style={cardBodyStyle}>
            {leftCardData.map((item, index) => (
              <div
                key={index}
                style={index === leftCardData.length - 1 ? lastItemStyle : itemStyle}
              >
                <span style={iconStyle}>{item.icon}</span>
                <span style={textStyle}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={cardStyle}>
          <div style={cardHeaderBlueStyle}>
            <h3 style={cardTitleStyle}>AIops & AIDLC</h3>
          </div>
          <div style={cardBodyStyle}>
            {rightCardData.map((item, index) => (
              <div
                key={index}
                style={index === rightCardData.length - 1 ? lastItemStyle : itemStyle}
              >
                <span style={iconStyle}>{item.icon}</span>
                <span style={textStyle}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={summaryStyle}>
        {isKo ? 'AI 워크로드를 실행하는 플랫폼 vs AI로 플랫폼을 운영하는 방법론' : isZh ? '运行 AI 工作负载的平台 vs 用 AI 运维平台的方法论' : 'Platform that runs AI workloads vs methodology that operates platforms with AI'}
      </div>
    </div>
  );
};

export default PlatformComparison;
