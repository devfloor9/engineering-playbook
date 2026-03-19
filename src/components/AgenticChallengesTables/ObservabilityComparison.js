import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ObservabilityComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const solutions = [
    {
      name: 'Langfuse',
      version: 'latest',
      deployment: isKo ? 'Self-hosted (K8s) - 프로덕션 (데이터 주권)' : isZh ? '自托管 (K8s) - 生产（数据主权）' : 'Self-hosted (K8s) - Production (Data Sovereignty)',
      features: isKo ? '토큰 추적, 비용 분석, 프롬프트 관리, A/B 테스트' : isZh ? '令牌跟踪，成本分析，提示管理，A/B 测试' : 'Token tracking, cost analysis, prompt management, A/B testing',
      color: '#45b7d1'
    },
    {
      name: 'LangSmith',
      version: 'latest',
      deployment: isKo ? 'Managed SaaS - 개발/스테이징 (LangGraph Studio)' : isZh ? '托管 SaaS - 开发/预发（LangGraph Studio）' : 'Managed SaaS - Dev/Staging (LangGraph Studio)',
      features: isKo ? '트레이싱, 평가, 데이터셋 관리, 협업 기능' : isZh ? '追踪，评估，数据集管理，协作功能' : 'Tracing, evaluation, dataset management, collaboration features',
      color: '#9b59b6'
    }
  ];

  return (
    <div style={{
      maxWidth: '800px',
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
          {isKo ? '📊 관찰성 솔루션 비교' : isZh ? '📊 可观测性解决方案比较' : '📊 Observability Solutions'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'Langfuse vs LangSmith 배포 방식과 기능' : isZh ? 'Langfuse vs LangSmith 部署方式和功能' : 'Langfuse vs LangSmith deployment and capabilities'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {solutions.map((solution, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 150px 1fr',
              gap: '16px',
              padding: '20px',
              borderBottom: index < solutions.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              alignItems: 'start'
            }}
          >
            <div>
              <div style={{
                fontSize: '18px',
                fontWeight: '700',
                color: solution.color,
                marginBottom: '4px'
              }}>
                {solution.name}
              </div>
              <div style={{
                display: 'inline-block',
                fontSize: '11px',
                fontWeight: '600',
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: `${solution.color}20`,
                color: solution.color,
                border: `1px solid ${solution.color}40`
              }}>
                {solution.version}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--ifm-color-emphasis-600)',
                marginBottom: '4px'
              }}>
                {isKo ? '배포 방식' : isZh ? '部署方式' : 'Deployment'}
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: solution.color
              }}>
                {solution.deployment}
              </div>
            </div>

            <div>
              <div style={{
                fontSize: '12px',
                fontWeight: '600',
                color: 'var(--ifm-color-emphasis-600)',
                marginBottom: '6px'
              }}>
                {isKo ? '핵심 기능' : isZh ? '核心功能' : 'Key Features'}
              </div>
              <div style={{
                fontSize: '14px',
                color: 'var(--ifm-font-color-base)',
                lineHeight: '1.5'
              }}>
                {solution.features}
              </div>
            </div>
          </div>
        ))}

        <div style={{
          padding: '16px 20px',
          background: 'var(--ifm-color-emphasis-100)',
          borderTop: '1px solid var(--ifm-color-emphasis-200)'
        }}>
          <div style={{
            fontSize: '13px',
            color: '#0c4a6e',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{ fontSize: '16px' }}>💡</span>
            <span>
              {isKo ? 'Langfuse는 온프레미스 제어를, LangSmith는 편의성을 제공하며 선택은 보안 요구사항에 따라 달라집니다.' : isZh ? 'Langfuse 提供本地控制，LangSmith 提供便利性，选择取决于安全要求。' : 'Langfuse offers on-premise control while LangSmith provides convenience; choice depends on security requirements.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ObservabilityComparison;
