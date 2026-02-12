import React from 'react';

const OperationPatternsComparison = () => {
  const patterns = [
    {
      name: 'Prompt-Driven',
      color: '#2563eb',
      humanRole: '매 단계 지시 (Human-in-the-Loop)',
      responseStart: '운영자가 알림 확인 후 AI에 지시',
      dataCollection: '프롬프트로 하나씩 요청',
      analysis: '운영자가 결과를 보고 다음 지시',
      recovery: '운영자 승인 후 AI가 실행',
      learning: '운영자 개인 경험에 의존',
      responseTime: '분~시간',
      tools: 'Q Developer, ChatOps'
    },
    {
      name: 'Spec-Driven',
      color: '#7c3aed',
      humanRole: 'Intent 정의 + 결과 검토',
      responseStart: '사전 정의된 파이프라인 트리거',
      dataCollection: 'Spec에 정의된 데이터 자동 수집',
      analysis: '사전 정의된 검증 로직 실행',
      recovery: 'GitOps로 선언적 롤백/변경',
      learning: 'Spec 버전 히스토리로 조직 지식화',
      responseTime: '분',
      tools: 'Kiro + GitOps + Argo CD'
    },
    {
      name: 'Agent-Driven',
      color: '#059669',
      humanRole: '가드레일 설정 + 예외 처리 (Human-on-the-Loop)',
      responseStart: 'Agent가 알림 수신 후 자동 시작',
      dataCollection: 'MCP로 멀티소스 동시 수집',
      analysis: 'AI가 근본 원인까지 자동 분석',
      recovery: '가드레일 범위 내 자율 복구',
      learning: '결과 피드백 자동 학습',
      responseTime: '초~분',
      tools: 'Kagent, Strands SOPs'
    }
  ];

  const rows = [
    { label: '사람의 역할', key: 'humanRole' },
    { label: '대응 시작', key: 'responseStart' },
    { label: '데이터 수집', key: 'dataCollection' },
    { label: '분석', key: 'analysis' },
    { label: '복구', key: 'recovery' },
    { label: '학습', key: 'learning' },
    { label: '대응 시간', key: 'responseTime' },
    { label: '대표 도구', key: 'tools' }
  ];

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          운영 패턴 비교: EKS 클러스터 이슈 대응 시나리오
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Prompt-Driven · Spec-Driven · Agent-Driven
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '110px 1fr 1fr 1fr',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            항목
          </div>
          {patterns.map((p) => (
            <div key={p.name} style={{
              padding: '12px 14px',
              background: `${p.color}08`,
              borderLeft: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: p.color
              }}>
                {p.name}
              </div>
            </div>
          ))}
        </div>

        {rows.map((row, idx) => (
          <div key={row.key} style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 1fr 1fr',
            borderBottom: idx < rows.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '10px 14px',
              background: '#f8fafc',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center'
            }}>
              {row.label}
            </div>
            {patterns.map((p) => (
              <div key={`${row.key}-${p.name}`} style={{
                padding: '10px 14px',
                fontSize: '12px',
                color: '#4b5563',
                borderLeft: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center'
              }}>
                {p[row.key]}
              </div>
            ))}
          </div>
        ))}

        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>실전 조합:</strong> 세 패턴은 상호 보완적입니다. 새로운 장애를 Prompt-Driven으로 탐색한 뒤,
          반복 패턴을 Spec-Driven으로 코드화하고, 최종적으로 Agent-Driven으로 자율화하는 점진적 성숙 과정을 거칩니다.
        </div>
      </div>
    </div>
  );
};

export default OperationPatternsComparison;
