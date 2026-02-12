import React from 'react';

const DevOpsAgentArchitecture = () => {
  const layers = [
    {
      title: '관찰성 데이터 소스',
      subtitle: 'AWS 네이티브 · OSS · 3rd Party 모두 지원',
      color: '#0d9488',
      bg: '#f0fdfa',
      items: [
        { icon: '📈', name: '메트릭', desc: 'AMP · CloudWatch · Datadog 등' },
        { icon: '🔗', name: '트레이스', desc: 'X-Ray · Jaeger · Datadog APM 등' },
        { icon: '📋', name: '로그', desc: 'OpenSearch · CloudWatch · Sumo Logic 등' },
        { icon: '☸️', name: 'K8s API', desc: '이벤트 · 상태 · 리소스' },
      ]
    },
    {
      title: 'MCP 통합 레이어 (50+ 서버)',
      subtitle: '관찰성 백엔드에 무관하게 단일 인터페이스 제공',
      color: '#2563eb',
      bg: '#eff6ff',
      items: [
        { icon: '☸️', name: 'EKS MCP', desc: '클러스터 제어' },
        { icon: '📈', name: 'CloudWatch MCP', desc: '메트릭 · 알람 · 로그' },
        { icon: '💰', name: 'Cost Explorer MCP', desc: '비용 분석' },
        { icon: '🔒', name: 'IAM MCP', desc: '보안 관리' },
        { icon: '📖', name: 'Core MCP', desc: '50+ 서버 오케스트레이션' },
      ]
    },
  ];

  const consumers = [
    {
      title: 'AI 도구 (프로덕션 레디)',
      color: '#7c3aed',
      bg: '#f5f3ff',
      items: [
        { icon: '🤖', name: 'Q Developer', desc: 'CloudWatch Investigations · 트러블슈팅 (GA)' },
        { icon: '🔧', name: 'Kiro', desc: 'Spec-driven 개발 · MCP 네이티브' },
        { icon: '💻', name: 'AI IDE', desc: 'Claude Code · GitHub Copilot 등' },
      ]
    },
    {
      title: 'Agent 확장 (점진적 도입)',
      color: '#9ca3af',
      bg: '#f9fafb',
      items: [
        { icon: '📋', name: 'Strands SDK', desc: 'Agent SOPs — 자연어 워크플로우 (OSS)' },
        { icon: '⚙️', name: 'Kagent', desc: 'K8s 네이티브 Agent — kmcp (초기 단계)' },
      ]
    },
  ];

  const renderItems = (items, color) => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {items.map((item) => (
        <div key={item.name} style={{
          flex: '1 1 0',
          minWidth: '100px',
          background: 'white',
          border: `1px solid ${color}30`,
          borderRadius: '6px',
          padding: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827', marginBottom: '2px' }}>
            {item.name}
          </div>
          <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.desc}</div>
        </div>
      ))}
    </div>
  );

  const renderLayer = (layer) => (
    <div key={layer.title} style={{
      background: layer.bg,
      border: `1px solid ${layer.color}30`,
      borderLeft: `4px solid ${layer.color}`,
      borderRadius: '8px',
      padding: '14px 16px',
    }}>
      <div style={{
        fontSize: '12px',
        fontWeight: '700',
        color: layer.color,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        marginBottom: layer.subtitle ? '2px' : '10px'
      }}>
        {layer.title}
      </div>
      {layer.subtitle && (
        <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>
          {layer.subtitle}
        </div>
      )}
      {renderItems(layer.items, layer.color)}
    </div>
  );

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
          Kiro + MCP 아키텍처 (Agent 확장 가능)
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          관찰성 백엔드(AWS · OSS · 3rd Party) → MCP 추상화 → AI 도구 → 자동화 액션 (→ Agent 확장)
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        {/* Data Sources */}
        {renderLayer(layers[0])}

        {/* Arrow */}
        <div style={{ textAlign: 'center', padding: '6px 0', fontSize: '20px', color: '#9ca3af' }}>▼</div>

        {/* MCP Layer */}
        {renderLayer(layers[1])}

        {/* Arrow - split */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '6px 0',
          gap: '80px'
        }}>
          <span style={{ fontSize: '20px', color: '#9ca3af' }}>↙</span>
          <span style={{ fontSize: '20px', color: '#9ca3af' }}>↘</span>
        </div>

        {/* AI Tools + AI Agents side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {consumers.map((c) => (
            <div key={c.title} style={{
              background: c.bg,
              border: `1px solid ${c.color}30`,
              borderLeft: `4px solid ${c.color}`,
              borderRadius: '8px',
              padding: '14px 16px',
            }}>
              <div style={{
                fontSize: '12px',
                fontWeight: '700',
                color: c.color,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                marginBottom: '10px'
              }}>
                {c.title}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {c.items.map((item) => (
                  <div key={item.name} style={{
                    background: 'white',
                    border: `1px solid ${c.color}20`,
                    borderRadius: '6px',
                    padding: '10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '18px', marginBottom: '2px' }}>{item.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#111827' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>{item.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Converge arrows */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '6px 0',
          gap: '80px'
        }}>
          <span style={{ fontSize: '20px', color: '#9ca3af' }}>↘</span>
          <span style={{ fontSize: '20px', color: '#9ca3af' }}>↙</span>
        </div>

        {/* Action output */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: '#92400e', marginBottom: '6px' }}>
            자동화 액션
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {['인시던트 자동 대응', '배포 검증', '리소스 최적화', '비용 절감', '근본 원인 분석'].map((action) => (
              <span key={action} style={{
                background: 'white',
                border: '1px solid #f59e0b',
                color: '#78350f',
                padding: '3px 10px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                {action}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DevOpsAgentArchitecture;
