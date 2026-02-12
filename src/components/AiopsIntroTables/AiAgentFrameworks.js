import React from 'react';

const AiAgentFrameworks = () => {
  const frameworks = [
    {
      name: 'Amazon Q Developer',
      color: '#2563eb',
      nature: 'AI 어시스턴트 — CloudWatch Investigations, 코드 리뷰, 보안 스캔',
      maturity: 'GA',
      maturityColor: '#059669',
      status: '프로덕션 레디'
    },
    {
      name: 'Strands Agents SDK',
      color: '#7c3aed',
      nature: 'AWS 오픈소스 Agent 프레임워크 — Agent SOPs로 자연어 워크플로우 정의',
      maturity: '오픈소스',
      maturityColor: '#d97706',
      status: 'AWS 내부 활용'
    },
    {
      name: 'Kagent',
      color: '#059669',
      nature: 'CNCF 커뮤니티 K8s 네이티브 AI Agent — CRD 기반, kmcp로 MCP 통합',
      maturity: '초기 단계',
      maturityColor: '#6b7280',
      status: '실험적'
    }
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
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          AI Agent 프레임워크 비교
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          자율 운영을 위한 세 가지 프레임워크
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
          gridTemplateColumns: '160px 1fr 120px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            도구
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            성격
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            성숙도
          </div>
        </div>

        {frameworks.map((fw, idx) => (
          <div key={fw.name} style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 120px',
            borderBottom: idx < frameworks.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '12px 14px',
              background: `${fw.color}08`,
              fontSize: '13px',
              fontWeight: '700',
              color: fw.color,
              display: 'flex',
              alignItems: 'center'
            }}>
              {fw.name}
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {fw.nature}
            </div>
            <div style={{
              padding: '12px 14px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <span style={{
                background: `${fw.maturityColor}15`,
                color: fw.maturityColor,
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {fw.maturity}
              </span>
              <span style={{
                fontSize: '10px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                {fw.status}
              </span>
            </div>
          </div>
        ))}

        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>권장 접근:</strong> Q Developer(GA)로 시작 → Strands(OSS)로 워크플로우 자동화 → Kagent(초기)로 K8s 네이티브 자율 운영 탐색
        </div>
      </div>
    </div>
  );
};

export default AiAgentFrameworks;
