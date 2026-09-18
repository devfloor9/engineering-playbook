import React from 'react';
import PropTypes from 'prop-types';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Icon from '@site/src/components/Icon';
import BaseTable from './BaseTable';
import styles from './SpecificationTable.module.css';

/**
 * SpecificationTable Component
 * 
 * A specialized table for displaying technical specifications, resource requirements,
 * and configuration details with units and threshold indicators.
 * 
 * @component
 * @example
 * // Simple data format (2D array)
 * <SpecificationTable
 *   title="GPU Requirements"
 *   headers={['Model', 'GPU', 'Memory']}
 *   data={[
 *     ['8B', '1x A100', '80GB'],
 *     ['70B', '8x A100', '640GB']
 *   ]}
 * />
 * 
 * // Advanced format with rows
 * const data = {
 *   headers: ['모델 크기', '최소 GPU', '메모리 요구'],
 *   rows: [
 *     { id: '1', cells: ['8B', '1x A100 80GB', 80] },
 *     { id: '2', cells: ['70B', '8x A100 80GB', 640] }
 *   ],
 *   units: { 2: 'GB' },
 *   thresholds: { 2: { warning: 500, danger: 600 } }
 * };
 * return <SpecificationTable {...data} />
 */
export default function SpecificationTable({
  title,
  headers,
  data,
  rows,
  units = {},
  thresholds = {},
  sortable = false,
  searchable = false,
  ...baseProps
}) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  // Convert simple data array to rows format if needed
  const tableRows = rows || (data ? data.map((row, index) => ({
    id: `row-${index}`,
    cells: row
  })) : []);

  const enhancedRows = tableRows.map(row => ({
    ...row,
    sortValues: row.sortValues || row.cells,
    cells: row.cells.map((cell, index) => {
      // Handle non-numeric cells
      if (typeof cell !== 'number' && !units[index] && !thresholds[index]) {
        return cell;
      }

      // Add units
      const cellValue = typeof cell === 'number' ? cell : typeof cell === 'string' ? parseFloat(cell) : NaN;
      const displayValue = units[index] ? <>{cell}{' '}{units[index]}</> : cell;
      
      // Add threshold indicators
      if (thresholds[index] && !isNaN(cellValue)) {
        const { warning, danger } = thresholds[index];
        let className = styles.normal;
        let statusLabel = ko ? '정상' : 'Normal';
        let icon = 'check';
        
        if (cellValue >= danger) {
          className = styles.danger;
          statusLabel = ko ? '위험' : 'Danger';
          icon = 'x-circle';
        } else if (cellValue >= warning) {
          className = styles.warning;
          statusLabel = ko ? '경고' : 'Warning';
          icon = 'alert-triangle';
        }
        
        return (
          <span className={`${styles.valueCell} ${className}`}>
            {displayValue}
            {' '}
            <span className={styles.statusLabel}><Icon name={icon} size={16} />{statusLabel}</span>
          </span>
        );
      }
      
      return displayValue;
    })
  }));

  return (
    <div data-ep-theme="manual" className={styles.specTableWrapper}>
      <BaseTable
        title={title}
        headers={headers}
        rows={enhancedRows}
        sortable={sortable}
        searchable={searchable}
        {...baseProps}
      />
    </div>
  );
}

SpecificationTable.propTypes = {
  /** Optional table title */
  title: PropTypes.node,
  /** Array of header labels */
  headers: PropTypes.arrayOf(PropTypes.node).isRequired,
  /** Simple 2D array of data (alternative to rows) */
  data: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.node)),
  /** Array of row objects (alternative to data) */
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      cells: PropTypes.arrayOf(PropTypes.node).isRequired,
      className: PropTypes.string
    })
  ),
  /** Units for specific columns (columnIndex: unit) */
  units: PropTypes.objectOf(PropTypes.string),
  /** Thresholds for specific columns (columnIndex: {warning, danger}) */
  thresholds: PropTypes.objectOf(
    PropTypes.shape({
      warning: PropTypes.number.isRequired,
      danger: PropTypes.number.isRequired
    })
  ),
  /** Enable sorting */
  sortable: PropTypes.bool,
  /** Enable search */
  searchable: PropTypes.bool
};
