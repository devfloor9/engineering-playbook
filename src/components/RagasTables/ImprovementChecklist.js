import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ImprovementChecklist = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const issues = [
    {
      problem: 'Faithfulness < 0.7',
      cause: isKo ? 'LLM이 컨텍스트 무시' : isZh ? 'LLM 忽略上下文' : 'LLM ignores context',
      solution: isKo ? '프롬프트에 "컨텍스트만 사용" 강조' : isZh ? '在提示中强调"仅使用上下文"' : 'Emphasize "use context only" in prompt',
      color: '#ea4335'
    },
    {
      problem: 'Context Precision < 0.6',
      cause: isKo ? '검색 품질 낮음' : isZh ? '检索质量低' : 'Poor retrieval quality',
      solution: isKo ? '임베딩 모델 업그레이드, 리랭킹 추가' : isZh ? '升级嵌入模型，添加重排序' : 'Upgrade embedding model, add re-ranking',
      color: '#fbbc04'
    },
    {
      problem: 'Context Recall < 0.6',
      cause: isKo ? '관련 문서 누락' : isZh ? '缺少相关文档' : 'Missing relevant docs',
      solution: isKo ? 'k값 증가, 지식 베이스 보강' : isZh ? '增加 k 值，增强知识库' : 'Increase k, use hybrid search',
      color: '#ff6b6b'
    },
    {
      problem: 'Answer Relevancy < 0.7',
      cause: isKo ? '답변이 산만함' : isZh ? '答案分散' : 'Rambling answers',
      solution: isKo ? '프롬프트 구조화, 출력 형식 지정' : isZh ? '结构化提示，指定输出格式' : 'Structure prompt, specify output format',
      color: '#9c27b0'
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
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '🔧 개선 체크리스트' : isZh ? '🔧 改进清单' : '🔧 Improvement Checklist'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{ display: 'grid', gap: '16px' }}>
          {issues.map((issue, index) => (
            <div
              key={index}
              style={{
                background: 'var(--ifm-color-emphasis-50)',
                padding: '18px',
                borderRadius: '8px',
                borderLeft: `4px solid ${issue.color}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}
            >
              <div style={{
                display: 'grid',
                gridTemplateColumns: '150px 1fr 1fr',
                gap: '16px',
                alignItems: 'start'
              }}>
                <div style={{
                  fontWeight: '700',
                  color: issue.color,
                  fontSize: '14px'
                }}>
                  {issue.problem}
                </div>
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--ifm-color-emphasis-600)',
                    marginBottom: '4px'
                  }}>
                    {isKo ? '가능한 원인' : isZh ? '可能原因' : 'Possible Cause'}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>
                    {issue.cause}
                  </div>
                </div>
                <div>
                  <div style={{
                    fontSize: '12px',
                    fontWeight: '600',
                    color: 'var(--ifm-color-emphasis-600)',
                    marginBottom: '4px'
                  }}>
                    {isKo ? '해결 방안' : isZh ? '解决方案' : 'Solution'}
                  </div>
                  <div style={{
                    fontSize: '14px',
                    color: '#059669',
                    fontWeight: '500'
                  }}>
                    ✓ {issue.solution}
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

export default ImprovementChecklist;
