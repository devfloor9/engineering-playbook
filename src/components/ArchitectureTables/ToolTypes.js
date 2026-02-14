import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ToolTypes = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const tools = [
    {
      type: 'API',
      description: isKo ? '외부 REST/gRPC API 호출' : isZh ? '调用外部 REST/gRPC API' : 'Call external REST/gRPC API',
      examples: isKo ? '웹 검색, 티켓 생성' : isZh ? 'Web 搜索、创建工单' : 'Web search, ticket creation',
      icon: '🌐',
      color: '#3b82f6'
    },
    {
      type: 'Retrieval',
      description: isKo ? '벡터 저장소 검색' : isZh ? '搜索向量存储' : 'Search vector store',
      examples: isKo ? '문서 검색, FAQ 조회' : isZh ? '文档搜索、FAQ 查询' : 'Document search, FAQ lookup',
      icon: '🔍',
      color: '#8b5cf6'
    },
    {
      type: 'Code',
      description: isKo ? '코드 실행 (샌드박스)' : isZh ? '代码执行（沙箱）' : 'Execute code (sandboxed)',
      examples: isKo ? 'Python 스크립트, SQL 쿼리' : isZh ? 'Python 脚本、SQL 查询' : 'Python script, SQL query',
      icon: '💻',
      color: '#10b981'
    },
    {
      type: 'Human',
      description: isKo ? '사람의 승인/입력 대기' : isZh ? '等待人工批准/输入' : 'Wait for human approval/input',
      examples: isKo ? '결제 승인, 민감 작업 확인' : isZh ? '支付批准、敏感操作确认' : 'Payment approval, sensitive task confirmation',
      icon: '👤',
      color: '#f59e0b'
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
          {isKo ? '도구 유형' : isZh ? '工具类型' : 'Tool Types'}
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
          gap: '16px'
        }}>
          {tools.map((tool, index) => (
            <div
              key={index}
              style={{
                background: `${tool.color}10`,
                padding: '20px',
                borderRadius: '8px',
                borderLeft: `4px solid ${tool.color}`,
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '12px'
              }}>
                <span style={{ fontSize: '32px' }}>{tool.icon}</span>
                <span style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: tool.color
                }}>
                  {tool.type}
                </span>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--ifm-color-emphasis-600)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {isKo ? '설명' : isZh ? '说明' : 'Description'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--ifm-font-color-base)',
                  lineHeight: '1.5'
                }}>
                  {tool.description}
                </div>
              </div>

              <div>
                <div style={{
                  fontSize: '12px',
                  fontWeight: '600',
                  color: 'var(--ifm-color-emphasis-600)',
                  marginBottom: '4px',
                  textTransform: 'uppercase'
                }}>
                  {isKo ? '예시' : isZh ? '示例' : 'Examples'}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'var(--ifm-color-emphasis-800)',
                  fontStyle: 'italic'
                }}>
                  {tool.examples}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolTypes;
