import React from 'react';

const AiToolsComparison = () => {
  const tools = [
    {
      name: 'Amazon Q Developer',
      color: '#2563eb',
      mcpUsage: 'CloudWatch MCP로 Investigations 수행, EKS 트러블슈팅',
      strength: '가장 성숙한 프로덕션 패턴, AWS 콘솔 네이티브 통합'
    },
    {
      name: 'Claude Code',
      color: '#7c3aed',
      mcpUsage: '복수 MCP 동시 연결로 멀티서비스 운영 분석',
      strength: '터미널 기반, 대규모 컨텍스트 처리, 자율 에이전트 루프'
    },
    {
      name: 'GitHub Copilot',
      color: '#059669',
      mcpUsage: 'MCP 확장으로 코드 작성 시 인프라 상태 참조',
      strength: 'IDE 네이티브 통합, 코드 자동완성과 MCP 결합'
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
        background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          AI 도구의 MCP 활용
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          MCP로 AWS 인프라를 직접 제어하는 세 가지 AI 도구
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
          gridTemplateColumns: '140px 1fr 1fr',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            AI 도구
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            MCP 활용 방식
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            강점
          </div>
        </div>

        {tools.map((tool, idx) => (
          <div key={tool.name} style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 1fr',
            borderBottom: idx < tools.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '12px 14px',
              background: `${tool.color}08`,
              fontSize: '13px',
              fontWeight: '700',
              color: tool.color,
              display: 'flex',
              alignItems: 'center'
            }}>
              {tool.name}
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {tool.mcpUsage}
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {tool.strength}
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
          <strong>핵심:</strong> 각 AI 도구는 MCP를 통해 AWS 서비스에 접근하지만, 활용 방식과 통합 수준이 다릅니다.
          Q Developer는 AWS 콘솔 통합, Claude Code는 자율 에이전트, Copilot은 IDE 통합이 각각의 강점입니다.
        </div>
      </div>
    </div>
  );
};

export default AiToolsComparison;
