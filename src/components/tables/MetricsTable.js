import React from 'react';
import PropTypes from 'prop-types';
import BaseTable from './BaseTable';
import styles from './MetricsTable.module.css';

/**
 * MetricsTable Component
 * 
 * Specialized table for displaying monitoring metrics with status indicators
 * and threshold visualization.
 * 
 * @component
 */
export default function MetricsTable({
  headers,
  rows,
  thresholds = {},
  currentValues = {},
  showLegend = true,
  ...baseProps
}) {
  /**
   * Determines the status based on current value and thresholds
   * @param {number} value - Current metric value
   * @param {Object} threshold - Threshold configuration {warning, critical}
   * @returns {string} Status: 'normal', 'warning', or 'critical'
   */
  const getStatus = (value, threshold) => {
    if (!threshold || typeof value !== 'number') return 'normal';
    
    if (value >= threshold.critical) return 'critical';
    if (value >= threshold.warning) return 'warning';
    return 'normal';
  };

  /**
   * Renders a status indicator dot
   * @param {string} metricName - Name of the metric
   * @param {number} value - Current value
   * @param {Object} threshold - Threshold configuration
   * @returns {JSX.Element|null} Status dot element or null
   */
  const getStatusIndicator = (metricName, value, threshold) => {
    if (!threshold || typeof value !== 'number') return null;
    
    const status = getStatus(value, threshold);
    
    return (
      <span 
        className={`${styles.statusDot} ${styles[status]}`}
        aria-label={`Status: ${status}`}
        role="img"
      />
    );
  };

  // Enhance rows with status indicators
  const enhancedRows = rows.map(row => {
    const metricName = row.cells[0];
    const currentValue = currentValues[metricName];
    const threshold = thresholds[metricName];
    
    return {
      ...row,
      cells: [
        <div className={styles.metricCell} key={`metric-${row.id}`}>
          {getStatusIndicator(metricName, currentValue, threshold)}
          <span className={styles.metricName}>{metricName}</span>
        </div>,
        ...row.cells.slice(1)
      ]
    };
  });

  return (
    <div className={styles.metricsTableWrapper}>
      <BaseTable
        headers={headers}
        rows={enhancedRows}
        sortable={true}
        {...baseProps}
      />
      
      {showLegend && (
        <div className={styles.legend} role="note" aria-label="Status legend">
          <span className={styles.legendItem}>
            <span className={`${styles.statusDot} ${styles.normal}`} aria-hidden="true" />
            <span className={styles.legendLabel}>Normal</span>
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.statusDot} ${styles.warning}`} aria-hidden="true" />
            <span className={styles.legendLabel}>Warning</span>
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.statusDot} ${styles.critical}`} aria-hidden="true" />
            <span className={styles.legendLabel}>Critical</span>
          </span>
        </div>
      )}
    </div>
  );
}

MetricsTable.propTypes = {
  /** Array of column headers */
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  
  /** Array of row objects */
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      cells: PropTypes.array.isRequired,
      className: PropTypes.string,
      highlighted: PropTypes.bool
    })
  ).isRequired,
  
  /** Threshold configuration for each metric */
  thresholds: PropTypes.objectOf(
    PropTypes.shape({
      warning: PropTypes.number.isRequired,
      critical: PropTypes.number.isRequired
    })
  ),
  
  /** Current values for metrics */
  currentValues: PropTypes.objectOf(PropTypes.number),
  
  /** Show status legend */
  showLegend: PropTypes.bool,
  
  /** Enable sorting (passed to BaseTable) */
  sortable: PropTypes.bool,
  
  /** Enable search (passed to BaseTable) */
  searchable: PropTypes.bool,
  
  /** Enable pagination (passed to BaseTable) */
  paginated: PropTypes.bool,
  
  /** Page size (passed to BaseTable) */
  pageSize: PropTypes.number,
  
  /** Additional CSS class */
  className: PropTypes.string,
  
  /** ARIA label for accessibility */
  ariaLabel: PropTypes.string
};

MetricsTable.defaultProps = {
  thresholds: {},
  currentValues: {},
  showLegend: true,
  sortable: true,
  searchable: false,
  paginated: false,
  pageSize: 10,
  className: '',
  ariaLabel: 'Metrics table'
};
