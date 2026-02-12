import React from 'react';

const McpServerTypes = () => {
  const types = [
    {
      name: '개별 로컬 MCP 서버',
      count: '50+',
      status: 'GA',
      statusColor: '#059669',
      color: '#2563eb',
      released: '2024~',
      location: '로컬 (npx/pip)',
      scope: '서비스별 1개 서버',
      feature: '서비스별 심화 도구 (kubectl, PromQL 등)',
      install: 'npx @awslabs/mcp-server-eks',
      useCase: 'Kiro/IDE에서 개별 AWS 서비스 직접 제어',
    },
    {
      name: 'Fully Managed MCP 서버',
      count: 'EKS, ECS',
      status: 'Preview',
      statusColor: '#d97706',
      color: '#7c3aed',
      released: '2025.11',
      location: 'AWS 클라우드 (Remote)',
      scope: '서비스별 클라우드 호스팅 버전',
      feature: 'IAM 통합, CloudTrail 감사, 자동 패치, 베스트 프랙티스 KB',
      install: 'Kiro/IDE에서 remote 연결',
      useCase: '엔터프라이즈 보안·감사 요구사항이 있는 환경',
    },
    {
      name: 'AWS MCP Server (통합)',
      count: '15,000+ API',
      status: 'Preview',
      statusColor: '#d97706',
      color: '#dc2626',
      released: '2025.11',
      location: 'AWS 클라우드 (Remote)',
      scope: '전체 AWS API 단일 서버',
      feature: 'API 실행 + AWS 문서 + Agent SOPs (워크플로우 가이드)',
      install: 'Kiro/IDE에서 remote 연결',
      useCase: '멀티 서비스 복합 작업, 자연어 기반 AWS 운영',
    },
  ];

  const rows = [
    { label: '출시', key: 'released' },
    { label: '실행 위치', key: 'location' },
    { label: '범위', key: 'scope' },
    { label: '핵심 특징', key: 'feature' },
    { label: '설치/연결', key: 'install' },
    { label: '활용 시나리오', key: 'useCase' },
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
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          AWS MCP 서버 3가지 제공 방식
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          개별 로컬 (GA) · Fully Managed (Preview) · 통합 서버 (Preview)
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Column Headers */}
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
          }} />
          {types.map((t) => (
            <div key={t.name} style={{
              padding: '12px 14px',
              background: `${t.color}08`,
              borderLeft: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: t.color,
                marginBottom: '4px'
              }}>
                {t.name}
              </div>
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <span style={{
                  background: `${t.color}15`,
                  color: t.color,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {t.count}
                </span>
                <span style={{
                  background: `${t.statusColor}15`,
                  color: t.statusColor,
                  padding: '2px 8px',
                  borderRadius: '4px',
                  fontSize: '11px',
                  fontWeight: '600'
                }}>
                  {t.status}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Data Rows */}
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
            {types.map((t) => (
              <div key={`${row.key}-${t.name}`} style={{
                padding: '10px 14px',
                fontSize: '12px',
                color: '#4b5563',
                borderLeft: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center'
              }}>
                {row.key === 'install' ? (
                  <code style={{
                    background: '#f3f4f6',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    wordBreak: 'break-all'
                  }}>
                    {t[row.key]}
                  </code>
                ) : (
                  t[row.key]
                )}
              </div>
            ))}
          </div>
        ))}

        {/* Footer */}
        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>권장 시작점:</strong> 개별 로컬 MCP 서버(GA)로 시작하여 Kiro+MCP 패턴을 검증한 후,
          엔터프라이즈 보안 요구사항에 따라 Fully Managed로 전환하세요.
          AWS MCP Server(통합)는 멀티 서비스 복합 작업에 적합합니다.
        </div>
      </div>
    </div>
  );
};

export default McpServerTypes;
