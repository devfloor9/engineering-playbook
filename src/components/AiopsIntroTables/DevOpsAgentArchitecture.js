import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DevOpsAgentArchitecture = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const layers = [
    {
      title: isKo ? '관찰성 데이터 소스' : isZh ? '可观测性数据源' : 'Observability Data Sources',
      subtitle: isKo ? 'AWS 네이티브 · OSS · 3rd Party 모두 지원' : isZh ? 'AWS 原生 · OSS · 第三方均支持' : 'AWS native · OSS · 3rd party all supported',
      color: '#0d9488',
      bg: 'var(--ifm-color-emphasis-100)',
      items: [
        { icon: '📈', name: isKo ? '메트릭' : isZh ? '指标' : 'Metrics', desc: isKo ? 'AMP · CloudWatch · Datadog 등' : isZh ? 'AMP · CloudWatch · Datadog 等' : 'AMP · CloudWatch · Datadog, etc.' },
        { icon: '🔗', name: isKo ? '트레이스' : isZh ? '追踪' : 'Traces', desc: isKo ? 'X-Ray · Jaeger · Datadog APM 등' : isZh ? 'X-Ray · Jaeger · Datadog APM 等' : 'X-Ray · Jaeger · Datadog APM, etc.' },
        { icon: '📋', name: isKo ? '로그' : isZh ? '日志' : 'Logs', desc: isKo ? 'OpenSearch · CloudWatch · Sumo Logic 등' : isZh ? 'OpenSearch · CloudWatch · Sumo Logic 等' : 'OpenSearch · CloudWatch · Sumo Logic, etc.' },
        { icon: '☸️', name: 'K8s API', desc: isKo ? '이벤트 · 상태 · 리소스' : isZh ? '事件 · 状态 · 资源' : 'Events · status · resources' },
      ]
    },
    {
      title: isKo ? 'MCP 통합 레이어 (50+ 서버)' : isZh ? 'MCP 集成层 (50+ 服务器)' : 'MCP Integration Layer (50+ servers)',
      subtitle: isKo ? '관찰성 백엔드에 무관하게 단일 인터페이스 제공' : isZh ? '无论可观测性后端如何，提供统一接口' : 'Single interface regardless of observability backend',
      color: '#2563eb',
      bg: 'var(--ifm-color-emphasis-100)',
      items: [
        { icon: '☸️', name: 'EKS MCP', desc: isKo ? '클러스터 제어' : isZh ? '集群控制' : 'Cluster control' },
        { icon: '📈', name: 'CloudWatch MCP', desc: isKo ? '메트릭 · 알람 · 로그' : isZh ? '指标 · 告警 · 日志' : 'Metrics · alarms · logs' },
        { icon: '💰', name: 'Cost Explorer MCP', desc: isKo ? '비용 분석' : isZh ? '成本分析' : 'Cost analysis' },
        { icon: '🔒', name: 'IAM MCP', desc: isKo ? '보안 관리' : isZh ? '安全管理' : 'Security mgmt' },
        { icon: '📖', name: 'Core MCP', desc: isKo ? '50+ 서버 오케스트레이션' : isZh ? '50+ 服务器编排' : '50+ server orchestration' },
      ]
    },
  ];

  const consumers = [
    {
      title: isKo ? 'AI 도구 (프로덕션 레디)' : isZh ? 'AI 工具 (生产就绪)' : 'AI Tools (Production Ready)',
      color: '#7c3aed',
      bg: 'var(--ifm-color-emphasis-100)',
      items: [
        { icon: '🤖', name: 'Q Developer', desc: isKo ? 'CloudWatch Investigations · 트러블슈팅 (GA)' : isZh ? 'CloudWatch Investigations · 故障排查 (GA)' : 'CloudWatch Investigations · troubleshooting (GA)' },
        { icon: '🔧', name: 'Kiro', desc: isKo ? 'Spec-driven 개발 · MCP 네이티브' : isZh ? 'Spec 驱动开发 · MCP 原生' : 'Spec-driven dev · MCP native' },
        { icon: '💻', name: 'AI IDE', desc: isKo ? 'Claude Code · GitHub Copilot 등' : isZh ? 'Claude Code · GitHub Copilot 等' : 'Claude Code · GitHub Copilot, etc.' },
      ]
    },
    {
      title: isKo ? 'Agent 확장 (점진적 도입)' : isZh ? 'Agent 扩展 (逐步采用)' : 'Agent Extension (Gradual Adoption)',
      color: 'var(--ifm-color-emphasis-500)',
      bg: 'var(--ifm-color-emphasis-100)',
      items: [
        { icon: '📋', name: 'Strands SDK', desc: isKo ? 'Agent SOPs — 자연어 워크플로우 (OSS)' : isZh ? 'Agent SOPs — 自然语言工作流 (OSS)' : 'Agent SOPs — natural language workflows (OSS)' },
        { icon: '⚙️', name: 'Kagent', desc: isKo ? 'K8s 네이티브 Agent — kmcp (초기 단계)' : isZh ? 'K8s 原生 Agent — kmcp (早期阶段)' : 'K8s-native Agent — kmcp (early stage)' },
      ]
    },
  ];

  const renderItems = (items, color) => (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {items.map((item) => (
        <div key={item.name} style={{
          flex: '1 1 0',
          minWidth: '100px',
          background: 'var(--ifm-background-surface-color)',
          border: `1px solid ${color}30`,
          borderRadius: '6px',
          padding: '10px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '20px', marginBottom: '4px' }}>{item.icon}</div>
          <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ifm-font-color-base)', marginBottom: '2px' }}>
            {item.name}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--ifm-color-emphasis-600)' }}>{item.desc}</div>
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
        <div style={{ fontSize: '11px', color: 'var(--ifm-color-emphasis-600)', marginBottom: '10px' }}>
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
          {isKo ? 'Kiro + MCP 아키텍처 (Agent 확장 가능)' : isZh ? 'Kiro + MCP 架构 (可扩展 Agent)' : 'Kiro + MCP Architecture (Agent Extensible)'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '관찰성 백엔드(AWS · OSS · 3rd Party) → MCP 추상화 → AI 도구 → 자동화 액션 (→ Agent 확장)' : isZh ? '可观测性后端(AWS · OSS · 第三方) → MCP 抽象 → AI 工具 → 自动化操作 (→ Agent 扩展)' : 'Observability backends (AWS · OSS · 3rd Party) → MCP abstraction → AI tools → Automation actions (→ Agent extension)'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        {/* Data Sources */}
        {renderLayer(layers[0])}

        {/* Arrow */}
        <div style={{ textAlign: 'center', padding: '6px 0', fontSize: '20px', color: 'var(--ifm-color-emphasis-500)' }}>▼</div>

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
          <span style={{ fontSize: '20px', color: 'var(--ifm-color-emphasis-500)' }}>↙</span>
          <span style={{ fontSize: '20px', color: 'var(--ifm-color-emphasis-500)' }}>↘</span>
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
                    background: 'var(--ifm-background-surface-color)',
                    border: `1px solid ${c.color}20`,
                    borderRadius: '6px',
                    padding: '10px',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '18px', marginBottom: '2px' }}>{item.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ifm-font-color-base)' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--ifm-color-emphasis-600)' }}>{item.desc}</div>
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
          <span style={{ fontSize: '20px', color: 'var(--ifm-color-emphasis-500)' }}>↘</span>
          <span style={{ fontSize: '20px', color: 'var(--ifm-color-emphasis-500)' }}>↙</span>
        </div>

        {/* Action output */}
        <div style={{
          background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
          border: '2px solid #f59e0b',
          borderRadius: '8px',
          padding: '16px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--ifm-color-emphasis-700)', marginBottom: '6px' }}>
            {isKo ? '자동화 액션' : isZh ? '自动化操作' : 'Automation Actions'}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            flexWrap: 'wrap'
          }}>
            {(isKo
              ? ['인시던트 자동 대응', '배포 검증', '리소스 최적화', '비용 절감', '근본 원인 분석']
              : isZh ? ['自动事件响应', '部署验证', '资源优化', '成本削减', '根因分析']
              : ['Auto Incident Response', 'Deployment Validation', 'Resource Optimization', 'Cost Reduction', 'Root Cause Analysis']
            ).map((action) => (
              <span key={action} style={{
                background: 'var(--ifm-background-surface-color)',
                border: '1px solid #f59e0b',
                color: 'var(--ifm-color-emphasis-700)',
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
