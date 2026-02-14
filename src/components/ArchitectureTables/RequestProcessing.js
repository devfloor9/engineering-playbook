import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const RequestProcessing = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const steps = [
    {
      step: '1-3',
      component: 'Gateway, Auth',
      description: isKo ? '인증 및 권한 검증' : isZh ? '身份验证和授权验证' : 'Authentication and authorization verification',
      color: '#3b82f6',
      icon: '🔐'
    },
    {
      step: '4-5',
      component: 'Kagent, Agent',
      description: isKo ? '에이전트 선택 및 작업 할당' : isZh ? '代理选择和任务分配' : 'Agent selection and task assignment',
      color: '#8b5cf6',
      icon: '🤖'
    },
    {
      step: '6-8',
      component: 'Agent, Milvus',
      description: isKo ? 'RAG를 위한 컨텍스트 검색' : isZh ? 'RAG 上下文搜索' : 'Context search for RAG',
      color: '#10b981',
      icon: '🔍'
    },
    {
      step: '9-11',
      component: 'Agent, LLM',
      description: isKo ? 'LLM 추론 수행' : isZh ? 'LLM 推理执行' : 'LLM inference execution',
      color: '#f59e0b',
      icon: '🧠'
    },
    {
      step: '12',
      component: 'LangFuse',
      description: isKo ? '관측성 데이터 기록' : isZh ? '记录可观测性数据' : 'Record observability data',
      color: '#06b6d4',
      icon: '📊'
    },
    {
      step: '13-15',
      component: isKo ? '전체' : isZh ? '全部' : 'Overall',
      description: isKo ? '응답 반환' : isZh ? '返回响应' : 'Response return',
      color: '#ec4899',
      icon: '✅'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
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
          {isKo ? '요청 처리 단계' : isZh ? '请求处理步骤' : 'Request Processing Steps'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        {steps.map((step, index) => (
          <div key={index}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '20px',
                background: `${step.color}10`,
                borderRadius: '8px',
                borderLeft: `4px solid ${step.color}`,
                marginBottom: index < steps.length - 1 ? '12px' : '0',
                transition: 'transform 0.2s'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '50px',
                height: '50px',
                background: step.color,
                borderRadius: '50%',
                fontSize: '24px',
                marginRight: '16px',
                flexShrink: 0
              }}>
                {step.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  marginBottom: '6px'
                }}>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: step.color,
                    background: 'white',
                    padding: '2px 10px',
                    borderRadius: '12px'
                  }}>
                    {isKo ? '단계' : isZh ? '步骤' : 'Step'} {step.step}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '600',
                    color: 'var(--ifm-color-emphasis-600)',
                    fontFamily: 'monospace'
                  }}>
                    {step.component}
                  </div>
                </div>
                <div style={{
                  fontSize: '15px',
                  color: 'var(--ifm-font-color-base)',
                  lineHeight: '1.5'
                }}>
                  {step.description}
                </div>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                margin: '8px 0'
              }}>
                <div style={{
                  width: '2px',
                  height: '20px',
                  background: 'var(--ifm-color-emphasis-300)'
                }} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RequestProcessing;
