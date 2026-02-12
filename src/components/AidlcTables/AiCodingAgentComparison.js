import React from 'react';

const AiCodingAgentComparison = () => {
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
    { feature: 'Code Generation', description: 'Auto-generate AWS SDK, CDK, Terraform code' },
    { feature: 'Security Scan', description: 'Automated code vulnerability detection' },
    { feature: 'Code Transform', description: 'Java 8→17, .NET Framework→.NET Core, etc.' },
    { feature: 'CloudWatch Investigations', description: 'AI-powered operational issue analysis' },
    { feature: 'EKS Troubleshooting', description: 'kubectl command suggestions, YAML error fixes' }
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
        <h2 style={styles.title}>AI Coding Agents</h2>
        <p style={styles.subtitle}>Amazon Q Developer, Kiro, Claude Code, Cursor, OpenAI Codex</p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>Amazon Q Developer Key Features</h3>
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
                <div><strong>Provider:</strong> {agent.provider}</div>
                <div><strong>Model:</strong> {agent.model}</div>
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
                <div><strong>Cost:</strong> {agent.cost}</div>
                <div><strong>Specialty:</strong> {agent.specialty}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        <strong>Selection Guide:</strong> For AWS-native development and security scanning, use Q Developer. For systematic Spec-driven workflows, choose Kiro. For MCP-based autonomous agents, use Claude Code. For IDE-integrated multi-model development, try Cursor. For multi-file autonomous coding, consider OpenAI Codex. Q Developer, Kiro, and Claude Code all use <strong>Anthropic Claude</strong> models, and Kiro also supports open weight models for cost optimization and domain-specific extensibility.
      </div>
    </div>
  );
};

export default AiCodingAgentComparison;
