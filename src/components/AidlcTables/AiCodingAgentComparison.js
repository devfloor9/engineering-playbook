import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AiCodingAgentComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';
  const agents = [
    {
      name: 'Amazon Q Developer',
      provider: 'AWS',
      model: 'Claude (Anthropic)',
      cost: 'Pro $19/mo',
      specialty: 'AWS Native + Security',
      color: '#ea580c',
      ratings: {
        'AWS Services': 5,
        'Spec-driven': 2,
        'Security Scan': 5,
        'MCP Integration': 4,
        'EKS Ops': 5
      }
    },
    {
      name: 'Kiro',
      provider: 'AWS',
      model: 'Claude + Open Weight',
      cost: 'Separate',
      specialty: 'Spec-driven + MCP Native',
      color: '#2563eb',
      ratings: {
        'AWS Services': 4,
        'Spec-driven': 5,
        'Security Scan': 3,
        'MCP Integration': 5,
        'EKS Ops': 4
      }
    },
    {
      name: 'Claude Code',
      provider: 'Anthropic',
      model: 'Claude Opus/Sonnet',
      cost: 'Max $100-200/mo',
      specialty: 'Autonomous Agent + MCP',
      color: '#7c3aed',
      ratings: {
        'AWS Services': 3,
        'Spec-driven': 3,
        'Security Scan': 3,
        'MCP Integration': 5,
        'EKS Ops': 4
      }
    },
    {
      name: 'Cursor',
      provider: 'Anysphere',
      model: 'Claude / GPT-4o / Custom',
      cost: 'Pro $20/mo',
      specialty: 'IDE Integration + Multi-model',
      color: '#059669',
      ratings: {
        'AWS Services': 2,
        'Spec-driven': 3,
        'Security Scan': 2,
        'MCP Integration': 4,
        'EKS Ops': 2
      }
    },
    {
      name: 'OpenAI Codex',
      provider: 'OpenAI',
      model: 'codex-1 (o3-mini based)',
      cost: 'Included in Pro $20/mo',
      specialty: 'Multi-file Autonomous Coding',
      color: '#0891b2',
      ratings: {
        'AWS Services': 2,
        'Spec-driven': 2,
        'Security Scan': 3,
        'MCP Integration': 2,
        'EKS Ops': 2
      }
    }
  ];

  const qDeveloperFeatures = [
    { feature: isKo ? '코드 생성' : isZh ? '代码生成' : 'Code Generation', description: isKo ? 'AWS SDK, CDK, Terraform 코드 자동 생성' : isZh ? '自动生成 AWS SDK、CDK、Terraform 代码' : 'Auto-generate AWS SDK, CDK, Terraform code' },
    { feature: isKo ? '보안 스캔' : isZh ? '安全扫描' : 'Security Scan', description: isKo ? '자동 코드 취약점 탐지' : isZh ? '自动代码漏洞检测' : 'Automated code vulnerability detection' },
    { feature: isKo ? '코드 변환' : isZh ? '代码转换' : 'Code Transform', description: 'Java 8→17, .NET Framework→.NET Core, etc.' },
    { feature: 'CloudWatch Investigations', description: isKo ? 'AI 기반 운영 이슈 분석' : isZh ? 'AI 驱动的运维问题分析' : 'AI-powered operational issue analysis' },
    { feature: isKo ? 'EKS 트러블슈팅' : isZh ? 'EKS 故障排查' : 'EKS Troubleshooting', description: isKo ? 'kubectl 명령어 제안, YAML 오류 수정' : isZh ? 'kubectl 命令建议、YAML 错误修复' : 'kubectl command suggestions, YAML error fixes' }
  ];

  const renderStars = (rating) => {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  };

  const features = Object.keys(agents[0].ratings);

  const styles = {
    container: {
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
      color: 'white',
      padding: '1.5rem',
      borderRadius: '12px 12px 0 0'
    },
    title: {
      margin: '0 0 0.5rem 0',
      fontSize: '1.5rem',
      fontWeight: '700'
    },
    subtitle: {
      margin: 0,
      fontSize: '0.875rem',
      opacity: 0.95
    },
    section: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderLeft: '4px solid #ea580c',
      borderRadius: '0 8px 8px 0',
      padding: '1.5rem',
      marginTop: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    sectionTitle: {
      margin: '0 0 1.25rem 0',
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#111827'
    },
    featureRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 3fr',
      gap: '1rem',
      padding: '0.875rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.875rem',
      marginBottom: '0.5rem'
    },
    cardsGrid: {
      display: 'flex',
      flexWrap: 'wrap',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    card: {
      flex: '1 1 calc(50% - 0.5rem)',
      minWidth: '280px',
      background: 'white',
      borderRadius: '10px',
      overflow: 'hidden',
      border: '1px solid #e5e7eb',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    cardHeader: {
      color: 'white',
      padding: '1rem 1.25rem',
      fontWeight: '600',
      fontSize: '1.1rem'
    },
    cardBody: {
      padding: '1.25rem'
    },
    cardMeta: {
      marginBottom: '1rem',
      fontSize: '0.8125rem',
      color: '#6b7280',
      lineHeight: '1.6'
    },
    ratingRow: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.375rem',
      fontSize: '0.8125rem'
    },
    ratingLabel: {
      color: '#374151',
      fontWeight: '500'
    },
    ratingStars: {
      color: '#f59e0b',
      fontSize: '0.875rem',
      letterSpacing: '1px'
    },
    cardFooter: {
      paddingTop: '0.75rem',
      borderTop: '1px solid #e5e7eb',
      fontSize: '0.8125rem',
      color: '#6b7280',
      lineHeight: '1.6'
    },
    footer: {
      marginTop: '1.5rem',
      padding: '1rem',
      background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
      borderRadius: '8px',
      fontSize: '0.875rem',
      color: '#78350f',
      lineHeight: '1.6'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>{isKo ? 'AI 코딩 에이전트' : isZh ? 'AI 编码代理' : 'AI Coding Agents'}</h2>
        <p style={styles.subtitle}>Amazon Q Developer, Kiro, Claude Code, Cursor, OpenAI Codex</p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{isKo ? 'Amazon Q Developer 주요 기능' : isZh ? 'Amazon Q Developer 核心功能' : 'Amazon Q Developer Key Features'}</h3>
        {qDeveloperFeatures.map((item, idx) => (
          <div key={idx} style={styles.featureRow}>
            <div style={{ fontWeight: '600', color: '#111827' }}>{item.feature}</div>
            <div style={{ color: '#4b5563', lineHeight: '1.5' }}>{item.description}</div>
          </div>
        ))}
      </div>

      <div style={styles.cardsGrid}>
        {agents.map((agent, idx) => (
          <div key={idx} style={styles.card}>
            <div style={{ ...styles.cardHeader, background: agent.color }}>
              {agent.name}
            </div>
            <div style={styles.cardBody}>
              <div style={styles.cardMeta}>
                <div><strong>{isKo ? '제공' : isZh ? '提供商' : 'Provider'}:</strong> {agent.provider}</div>
                <div><strong>{isKo ? '모델' : isZh ? '模型' : 'Model'}:</strong> {agent.model}</div>
              </div>
              <div style={{ marginBottom: '0.75rem' }}>
                {features.map((feature, fidx) => (
                  <div key={fidx} style={styles.ratingRow}>
                    <span style={styles.ratingLabel}>{feature}</span>
                    <span style={styles.ratingStars}>
                      {renderStars(agent.ratings[feature])}
                    </span>
                  </div>
                ))}
              </div>
              <div style={styles.cardFooter}>
                <div><strong>{isKo ? '비용' : isZh ? '费用' : 'Cost'}:</strong> {agent.cost}</div>
                <div><strong>{isKo ? '특기' : isZh ? '特长' : 'Specialty'}:</strong> {agent.specialty}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <strong>{isKo ? '선택 가이드:' : isZh ? '选择指南:' : 'Selection Guide:'}</strong> {isKo
          ? 'AWS 네이티브 개발과 보안 스캔에는 Q Developer를, 체계적인 Spec-driven 워크플로우에는 Kiro를, MCP 기반 자율 에이전트에는 Claude Code를, IDE 통합 멀티모델 개발에는 Cursor를, 멀티파일 자율 코딩에는 OpenAI Codex를 사용하세요. Q Developer, Kiro, Claude Code 모두 Anthropic Claude 모델을 사용하며, Kiro는 비용 최적화와 도메인 확장을 위해 오픈 웨이트 모델도 지원합니다.'
          : isZh
          ? 'AWS 原生开发和安全扫描选 Q Developer，系统化 Spec 驱动工作流选 Kiro，基于 MCP 的自主 Agent 选 Claude Code，IDE 集成多模型开发选 Cursor，多文件自主编码选 OpenAI Codex。Q Developer、Kiro 和 Claude Code 均使用 Anthropic Claude 模型，Kiro 还支持开放权重模型以优化成本和领域扩展。'
          : 'For AWS-native development and security scanning, use Q Developer. For systematic Spec-driven workflows, choose Kiro. For MCP-based autonomous agents, use Claude Code. For IDE-integrated multi-model development, try Cursor. For multi-file autonomous coding, consider OpenAI Codex. Q Developer, Kiro, and Claude Code all use Anthropic Claude models, and Kiro also supports open weight models for cost optimization and domain-specific extensibility.'}
      </div>
    </div>
  );
};

export default AiCodingAgentComparison;
