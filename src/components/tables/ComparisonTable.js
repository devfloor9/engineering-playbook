import React from 'react';
import PropTypes from 'prop-types';
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
  sortable = true,
  searchable = false,
  ...baseProps
}) {
  const enhancedRows = rows.map(row => {
    const isRecommended = row.id === recommendedId;
    
    return {
      ...row,
      cells: isRecommended
        ? row.cells.map((cell, index) => 
            index === 0 ? (
              <span className={styles.recommendedCell}>
                {cell}
                <span className={styles.badge} aria-label="추천">추천</span>
              </span>
            ) : cell
          )
        : row.cells,
      className: `${row.className || ''} ${highlightOnHover ? styles.hoverable : ''} ${isRecommended ? styles.recommendedRow : ''}`
    };
  });

  return (
    <div className={styles.comparisonTableWrapper}>
      <BaseTable
        headers={headers}
        rows={enhancedRows}
        sortable={sortable}
        searchable={searchable}
        ariaLabel="비교 테이블"
        {...baseProps}
      />
    </div>
  );
}

ComparisonTable.propTypes = {
  /** Array of header labels */
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Array of row objects */
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      cells: PropTypes.arrayOf(PropTypes.node).isRequired,
      className: PropTypes.string
    })
  ).isRequired,
  /** ID of the recommended row */
  recommendedId: PropTypes.string,
  /** Enable hover highlighting */
  highlightOnHover: PropTypes.bool,
  /** Enable sorting */
  sortable: PropTypes.bool,
  /** Enable search */
  searchable: PropTypes.bool
};
