import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import CopyButton from '../CopyButton';
import metricsData from '../../data/coredns-metrics.json';
import styles from './CoreDnsMetricsTable.module.css';
const CoreDnsMetricsTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const locale = isKo ? 'ko' : 'en';
  const metrics = metricsData.rows.map(metric => ({
    ...metric, signal: metric.signal[locale], description: metric.description[locale],
  }));
  const labels = isKo
    ? ['메트릭', '시그널', '설명 / PromQL']
    : ['Metric', 'Signal', 'Description / PromQL'];
  return (
    <div className={styles.frame}>
      <p className={styles.scope}>{metricsData.scope[locale]}</p>
      <table className={styles.table} role="table">
        <caption>{isKo ? 'CoreDNS Prometheus 핵심 메트릭' : 'CoreDNS Prometheus metrics'}</caption>
        <thead role="rowgroup">
          <tr role="row">{labels.map(label => <th key={label} scope="col" role="columnheader">{label}</th>)}</tr>
        </thead>
        <tbody role="rowgroup">
          {metrics.map(metric => (
            <tr key={metric.name} role="row">
              <th scope="row" role="rowheader">
                <code className={styles.metric}>{metric.name}</code>
                <span className={styles.type}>{metric.type}</span>
              </th>
              <td role="cell">
                <span className={styles.mobileLabel} aria-hidden="true">{labels[1]}</span>
                <span className={styles.signal}>{metric.signal}</span>
              </td>
              <td role="cell">
                <span className={styles.mobileLabel} aria-hidden="true">{labels[2]}</span>
                <p>{metric.description}</p>
                <pre className={styles.query} tabIndex={0} aria-label={`PromQL: ${metric.name}`}><code>{metric.query}</code></pre>
                <CopyButton text={metric.query} label={isKo ? '쿼리 복사' : 'Copy query'}
                  ariaLabel={`${isKo ? '쿼리 복사' : 'Copy query'}: ${metric.name}`} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default CoreDnsMetricsTable;
