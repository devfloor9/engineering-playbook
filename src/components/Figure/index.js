import React, {useId} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

/** Authors supply meaning and source; the shell adds no technical claims. */
export default function Figure({
  title, description, source, children, dataFallback, className = '',
}) {
  const {i18n} = useDocusaurusContext();
  const id = useId();
  const hasCaption = title != null || description != null || source != null;
  return (
    <figure data-ep-theme="manual" className={`${styles.figure} ${className}`}
      aria-labelledby={title != null ? `${id}-title` : undefined}
      aria-describedby={description != null ? `${id}-description` : undefined}>
      {children}
      {dataFallback != null && <div className={styles.dataFallback}>{dataFallback}</div>}
      {hasCaption && <figcaption className={styles.caption}>
        {title != null && <div id={`${id}-title`} className={styles.title}>{title}</div>}
        {description != null && <div id={`${id}-description`}>{description}</div>}
        {source != null && <div className={styles.source}>
          <span>{i18n.currentLocale === 'ko' ? '출처: ' : 'Source: '}</span>{source}
        </div>}
      </figcaption>}
    </figure>
  );
}
