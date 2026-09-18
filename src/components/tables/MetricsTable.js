import React from 'react';
import PropTypes from 'prop-types';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Icon from '@site/src/components/Icon';
import BaseTable from './BaseTable';
import styles from './MetricsTable.module.css';

export default function MetricsTable({
  headers, rows, thresholds = {}, currentValues = {}, showLegend = true, ...baseProps
}) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const labels = ko ? {normal: '정상', warning: '경고', critical: '심각'} : {normal: 'Normal', warning: 'Warning', critical: 'Critical'};
  const icons = {normal: 'check', warning: 'alert-triangle', critical: 'x-circle'};
  const enhancedRows = rows.map(row => {
    const metricName = row.cells[0];
    const value = currentValues[metricName];
    const threshold = thresholds[metricName];
    const hasStatus = threshold && typeof value === 'number' && Number.isFinite(value);
    const status = hasStatus && value >= threshold.critical ? 'critical' : hasStatus && value >= threshold.warning ? 'warning' : 'normal';
    return {
      ...row,
      sortValues: row.sortValues || row.cells,
      cells: [
        <span className={styles.metricCell} key={`metric-${row.id}`}>
          {metricName}
          {' '}
          {hasStatus && <span className={`${styles.status} ${styles[status]}`}>
            <Icon name={icons[status]} size={16} />{labels[status]}
          </span>}
        </span>,
        ...row.cells.slice(1)
      ]
    };
  });
  return <div data-ep-theme="manual" className={styles.metricsTableWrapper}>
    <BaseTable headers={headers} rows={enhancedRows} {...baseProps} />
    {showLegend && <div className={styles.legend} role="note" aria-label={ko ? '상태 범례' : 'Status legend'}>
      {Object.keys(labels).map(status => <span key={status} className={`${styles.status} ${styles[status]}`}>
        <Icon name={icons[status]} size={16} />{labels[status]}
      </span>)}
    </div>}
  </div>;
}

MetricsTable.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.node).isRequired,
  rows: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    cells: PropTypes.array.isRequired,
  })).isRequired,
  thresholds: PropTypes.objectOf(PropTypes.shape({warning: PropTypes.number, critical: PropTypes.number})),
  currentValues: PropTypes.objectOf(PropTypes.number),
  showLegend: PropTypes.bool,
};
