import React from 'react';
import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Icon, {ICON_NAMES} from './Icon';
import styles from './DocCards.module.css';

// Keep existing MDX imports compatible while returning semantic SVG names.
export const ICONS = Object.freeze({
  architecture: 'layers', challenge: 'activity', aws: 'cloud',
  eks: 'server', gpu: 'cpu', resource: 'chart', vllm: 'cpu',
  distributed: 'network', moe: 'cpu', nvidia: 'cpu', nemo: 'cpu',
  gateway: 'network', vector: 'database', agent: 'terminal',
  bedrock: 'cloud', openclaw: 'terminal', llmgateway: 'network',
  observability: 'activity', monitoring: 'activity', evaluation: 'check',
  mlops: 'activity', sagemaker: 'cpu',
});

// Legacy input compatibility only; these characters are never rendered.
const legacyIcons = {
  '\u{1f3d7}\ufe0f': 'layers', '\u{1f4d0}': 'terminal',
  '\u{1f680}': 'cpu', '\u{1f5a5}\ufe0f': 'cpu', '\u26a1': 'cpu',
  '\u{1f4c8}': 'activity', '\u{1f4ca}': 'chart',
  '\u{1f310}': 'network', '\u{1f500}': 'network', '\u{1f5fa}\ufe0f': 'network',
  '\u{1f512}': 'shield', '\u{1f510}': 'shield', '\u{1f6e1}\ufe0f': 'shield',
  '\u{1faaa}': 'shield', '\u{1f4dc}': 'shield',
  '\u{1f4be}': 'database', '\u{1f4b0}': 'chart',
  '\u{1f39b}\ufe0f': 'settings', '\u{1f527}': 'settings',
  '\u{1f504}': 'refresh', '\u{1f4d6}': 'book-open',
  '\u{1f9ed}': 'compass', '\u{1f4e6}': 'server',
  '\u{1f52d}': 'activity', '\u{1f6a8}': 'alert-triangle',
  '\u{1f687}': 'network', '\u2696\ufe0f': 'network', '\u{1f9f1}': 'shield',
  '\u2699\ufe0f': 'settings', '\u2705': 'check', '\u{1f3af}': 'compass',
  '\u{1f441}\ufe0f': 'activity', '\u{1f493}': 'activity', '\u{1f49a}': 'cpu',
  '\u{1f4cb}': 'file-text', '\u{1f4da}': 'book-open', '\u{1f4e1}': 'network',
  '\u{1f50c}': 'network', '\u{1f50d}': 'search', '\u{1f578}\ufe0f': 'network',
  '\u{1f5c4}\ufe0f': 'database', '\u{1f6f0}\ufe0f': 'network',
  '\u{1f916}': 'terminal', '\u{1f9e0}': 'cpu', '\u{1f9e9}': 'cpu',
  '\u{1f9ea}': 'activity', '\u2194\ufe0f': 'network',
};

export function resolveDocCardIcon(icon, to = '', fallback = 'file-text') {
  if (ICON_NAMES.includes(icon)) return icon;
  if (Object.hasOwn(ICONS, icon)) return ICONS[icon];
  // The destination supplies consistent meaning to old decorative icon props.
  if (/\/reference-architecture(?:\/|$)/.test(to)) return 'terminal';
  if (/\/(?:governance|security-authn)(?:\/|$)/.test(to)) return 'shield';
  if (/\/design-architecture(?:\/|$)/.test(to)) return 'layers';
  if (/\/model-serving(?:\/|$)/.test(to)) return 'cpu';
  if (/\/(?:operations-mlops|operations-observability)(?:\/|$)/.test(to)) return 'activity';
  return Object.hasOwn(legacyIcons, icon) ? legacyIcons[icon] : fallback;
}

/** Shared presentation; href is already resolved. Each card is one native link. */
export function DocCardLink({href, icon, title, description, className, titleAs: Title = 'span'}) {
  return (
    <Link
      href={href}
      data-ep-theme="manual"
      data-ep-card=""
      className={['card', styles.card, className].filter(Boolean).join(' ')}>
      <Icon name={resolveDocCardIcon(icon, href)} size={20} className={styles.icon} />
      <Title className={styles.title}>{title}</Title>
      {description && <span className={styles.description}>{description}</span>}
    </Link>
  );
}

// Legacy color props remain accepted by callers, but navigation uses one palette.
export function DocCard({to, icon, title, description, className}) {
  const href = useBaseUrl(to);
  return <DocCardLink {...{href, icon, title, description, className}} />;
}

export function DocCardGrid({children, columns = 2}) {
  return (
    <div className={styles.gridContainer} data-ep-theme="manual">
      <div className={styles.grid} data-columns={columns === 1 ? '1' : '2'}>
        {children}
      </div>
    </div>
  );
}

export default DocCard;
