import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const ObservabilityLayerStack = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const solutions = [{
    name: 'Langfuse',
    color: '#45b7d1',
    bgColor: '#e8f8fc',
    role: isKo ? 'LLM 트레이싱 (Production)' : 'LLM Tracing (Production)',
    integration: isKo ? 'Helm Chart, StatefulSet' : 'Helm Chart, StatefulSet',
    features: isKo ? '토큰 추적, 비용 분석, 프롬프트 버전 관리' : 'Token tracking, cost analysis, prompt version management'
  }, {
    name: 'LangSmith',
    color: '#9b59b6',
    bgColor: 'var(--ifm-color-emphasis-100)',
    role: isKo ? 'LLM 트레이싱 (Dev/Staging)' : 'LLM Tracing (Dev/Staging)',
    integration: isKo ? 'SDK 연동' : 'SDK integration',
    features: isKo ? '트레이싱, 평가, 데이터셋 관리, 협업' : 'Tracing, evaluation, dataset management, collaboration'
  }, {
    name: 'RAGAS',
    color: '#e67e22',
    bgColor: '#fef5e7',
    role: isKo ? 'RAG 품질 평가' : 'RAG Quality Evaluation',
    integration: isKo ? 'Job/CronJob' : 'Job/CronJob',
    features: isKo ? 'Faithfulness, Relevancy, Context Precision 평가' : 'Faithfulness, Relevancy, Context Precision evaluation'
  }];
  return <div style={{
    maxWidth: '760px',
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
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '🔍 관측성 레이어 스택' : '🔍 Observability Layer Stack'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? 'LLM 성능 모니터링 및 평가 솔루션' : 'LLM performance monitoring and evaluation solutions'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      padding: '24px'
    }}>
        <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '20px'
      }}>
          {solutions.map((solution, index) => <div key={index} style={{
          background: solution.bgColor,
          padding: '20px',
          borderRadius: '8px',
          border: `2px solid ${solution.color}`,
          boxShadow: `0 4px 8px ${solution.color}20`,
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}>
              <div style={{
            fontSize: '18px',
            fontWeight: '700',
            color: solution.color,
            marginBottom: '12px',
            textAlign: 'center'
          }}>
                {solution.name}
              </div>

              <div style={{
            marginBottom: '12px'
          }}>
                <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--ifm-color-emphasis-600)',
              textTransform: 'uppercase',
              marginBottom: '4px'
            }}>
                  {isKo ? '역할' : 'Role'}
                </div>
                <div style={{
              fontSize: '14px',
              color: 'var(--ifm-font-color-base)',
              fontWeight: '500'
            }}>
                  {solution.role}
                </div>
              </div>

              <div style={{
            marginBottom: '12px'
          }}>
                <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--ifm-color-emphasis-600)',
              textTransform: 'uppercase',
              marginBottom: '4px'
            }}>
                  {isKo ? 'Kubernetes 통합' : 'Kubernetes Integration'}
                </div>
                <div style={{
              display: 'inline-block',
              fontSize: '12px',
              padding: '4px 8px',
              background: '#326ce5',
              color: 'white',
              borderRadius: '4px',
              fontWeight: '500'
            }}>
                  {solution.integration}
                </div>
              </div>

              <div>
                <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--ifm-color-emphasis-600)',
              textTransform: 'uppercase',
              marginBottom: '4px'
            }}>
                  {isKo ? '핵심 기능' : 'Core Features'}
                </div>
                <div style={{
              fontSize: '13px',
              color: 'var(--ifm-font-color-base)',
              lineHeight: '1.5'
            }}>
                  {solution.features}
                </div>
              </div>
            </div>)}
        </div>
      </div>
    </div>;
};
export default ObservabilityLayerStack;