import React from 'react';
import PropTypes from 'prop-types';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Icon from '@site/src/components/Icon';
import BaseTable from './BaseTable';
import styles from './ComparisonTable.module.css';

/**
 * ComparisonTable Component
 * 
 * A specialized table for comparing multiple solutions, options, or alternatives.
 * Supports highlighting recommended options and hover effects.
 * 
 * @component
 * @example
 * const data = {
 *   headers: ['솔루션', '특징', '사용 사례'],
 *   rows: [
 *     { id: 'kagent', cells: ['Kagent', 'AI 에이전트 CRD', '멀티 에이전트'] },
 *     { id: 'kubeai', cells: ['KubeAI', '경량 LLM 서빙', '프로토타이핑'] }
 *   ],
 *   recommendedId: 'kagent'
 * };
 * return <ComparisonTable {...data} />
 */
export default function ComparisonTable({
  headers,
  rows,
  recommendedId,
  highlightOnHover = true,
  sortable = false,
  searchable = false,
  ...baseProps
}) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const enhancedRows = rows.map(row => {
    const isRecommended = row.id === recommendedId || row.recommended === true;
    
    return {
      ...row,
      sortValues: row.sortValues || row.cells,
      cells: isRecommended
        ? row.cells.map((cell, index) => 
            index === 0 ? (
              <span className={styles.recommendedCell}>
                {cell}
                {' '}
                <span className={styles.badge}><Icon name="check" size={16} />{ko ? '추천' : 'Recommended'}</span>
              </span>
            ) : cell
          )
        : row.cells,
      className: `${row.className || ''} ${highlightOnHover ? styles.hoverable : ''} ${isRecommended ? styles.recommendedRow : ''}`
    };
  });

  return (
    <div data-ep-theme="manual" className={styles.comparisonTableWrapper}>
      <BaseTable
        headers={headers}
        rows={enhancedRows}
        sortable={sortable}
        searchable={searchable}
        {...baseProps}
      />
    </div>
  );
}

ComparisonTable.propTypes = {
  /** Array of header labels */
  headers: PropTypes.arrayOf(PropTypes.node).isRequired,
  /** Array of row objects */
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      cells: PropTypes.arrayOf(PropTypes.node).isRequired,
      className: PropTypes.string,
      recommended: PropTypes.bool
    })
  ).isRequired,
  /** ID of the recommended row */
  recommendedId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Enable hover highlighting */
  highlightOnHover: PropTypes.bool,
  /** Enable sorting */
  sortable: PropTypes.bool,
  /** Enable search */
  searchable: PropTypes.bool
};
