import React from 'react';
import Link from '@docusaurus/Link';

const ICONS = {
  architecture: '🏗️',
  challenge: '⚡',
  aws: '☁️',
  eks: '🔧',
  gpu: '🖥️',
  resource: '📊',
  vllm: '🚀',
  distributed: '🔀',
  moe: '🧩',
  nvidia: '💚',
  nemo: '🧠',
  gateway: '🌐',
  vector: '🔍',
  agent: '🤖',
  bedrock: '🏢',
  openclaw: '🦞',
  llmgateway: '🔄',
  observability: '👁️',
  monitoring: '📈',
  evaluation: '✅',
  mlops: '⚙️',
  sagemaker: '🔬',
};

function DocCard({ to, icon, title, description, color }) {
  return (
    <Link
      to={to}
      style={{ textDecoration: 'none', color: 'inherit' }}
    >
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid var(--ifm-color-emphasis-200)',
        background: 'var(--ifm-background-surface-color)',
        height: '100%',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
          e.currentTarget.style.borderColor = color || 'var(--ifm-color-primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.borderColor = 'var(--ifm-color-emphasis-200)';
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: color || 'var(--ifm-color-primary)',
          borderRadius: '12px 12px 0 0',
        }} />
        <div style={{
          fontSize: '32px',
          marginBottom: '12px',
          lineHeight: 1,
        }}>
          {icon}
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: '700',
          color: 'var(--ifm-font-color-base)',
          marginBottom: '8px',
          lineHeight: '1.3',
        }}>
          {title}
        </div>
        <div style={{
          fontSize: '13px',
          color: 'var(--ifm-color-emphasis-700)',
          lineHeight: '1.6',
          flex: 1,
        }}>
          {description}
        </div>
      </div>
    </Link>
  );
}

export function DocCardGrid({ children, columns = 2 }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(${columns}, 1fr)`,
      gap: '16px',
      marginTop: '16px',
      marginBottom: '24px',
    }}>
      {children}
    </div>
  );
}

export { DocCard, ICONS };
export default DocCard;
