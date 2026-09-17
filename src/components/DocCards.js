import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './DocCards.module.css';

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
  const url = useBaseUrl(to);
  return (
    <Link to={url} className={styles.card}
      style={{'--doc-card-accent': color || 'var(--ifm-color-primary)'}}>
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <span className={styles.title}>{title}</span>
      <span className={styles.description}>{description}</span>
    </Link>
  );
}

export function DocCardGrid({ children, columns = 2 }) {
  return (
    <div className={styles.grid} style={{'--doc-card-columns': columns}}>
      {children}
    </div>
  );
}

export { DocCard, ICONS };
export default DocCard;
