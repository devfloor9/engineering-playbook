import React, {useId, useMemo, useState} from 'react';
import PropTypes from 'prop-types';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import DataTableFrame from '@site/src/components/DataTableFrame';
import Icon from '@site/src/components/Icon';
import {nodeText} from '@site/src/components/DataTableFrame/accessibility';
import {compareValues, numericValue, rowValue} from './values';
import styles from './BaseTable.module.css';

/** Source rows remain complete; filtering, sorting and paging only affect the view. */
export default function BaseTable({
  headers, rows, sortable = false, searchable = false, paginated = false,
  pageSize = 10, className = '', responsive = true, ariaLabel,
  title, caption, description, minWidth, rowHeaderColumn = 0, columnAlignments = [],
}) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const searchId = useId();
  const [sortConfig, setSortConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const collator = useMemo(() => new Intl.Collator(ko ? 'ko' : 'en', {numeric: true, sensitivity: 'base'}), [ko]);
  const visibleRows = useMemo(() => {
    const term = searchTerm.trim().toLocaleLowerCase(ko ? 'ko' : 'en');
    const filtered = term ? rows.filter(row => row.cells.some((cell, index) =>
      nodeText(row.searchValues?.[index] ?? cell).toLocaleLowerCase(ko ? 'ko' : 'en').includes(term))) : rows;
    if (!sortConfig) return filtered;
    return [...filtered].sort((a, b) => compareValues(
      rowValue(a, sortConfig.column), rowValue(b, sortConfig.column), collator,
    ) * (sortConfig.direction === 'ascending' ? 1 : -1));
  }, [rows, sortConfig, searchTerm, collator, ko]);
  const size = Number.isFinite(pageSize) && pageSize > 0 ? Math.max(1, Math.floor(pageSize)) : 10;
  const totalPages = Math.max(1, Math.ceil(visibleRows.length / size));
  const page = Math.min(currentPage, totalPages);
  const displayedRows = paginated ? visibleRows.slice((page - 1) * size, page * size) : visibleRows;
  const alignments = headers.map((_, index) => columnAlignments[index] || (
    rows.length > 0 && rows.every(row => numericValue(rowValue(row, index)) !== null) ? 'right' : undefined));
  const tableCaption = caption ?? title;

  function sort(column) {
    setSortConfig(previous => ({column, direction: previous?.column === column && previous.direction === 'ascending'
      ? 'descending' : 'ascending'}));
    setCurrentPage(1);
  }

  return (
    <div data-ep-theme="manual" className={`${styles.tableContainer} ${className}`}>
      {searchable && <div className={styles.searchBox}>
        <label htmlFor={searchId}>{ko ? '표 검색' : 'Search table'}</label>
        <input id={searchId} type="search" value={searchTerm} className={styles.searchInput}
          onChange={event => { setSearchTerm(event.target.value); setCurrentPage(1); }} />
      </div>}
      <DataTableFrame description={description} minWidth={minWidth} ariaLabel={ariaLabel}
        scrollable={responsive} className={styles.frame}>
        <table aria-label={ariaLabel}>
          {tableCaption != null && <caption>{tableCaption}</caption>}
          <thead><tr>{headers.map((header, index) => {
            const direction = sortConfig?.column === index ? sortConfig.direction : 'none';
            const next = direction === 'ascending' ? (ko ? '내림차순' : 'descending') : (ko ? '오름차순' : 'ascending');
            return <th key={index} scope="col" style={{textAlign: alignments[index]}}
              aria-sort={sortable ? direction : undefined}>
              {sortable ? <button type="button" className={styles.sortButton} onClick={() => sort(index)}
                aria-label={ko ? `${nodeText(header)}: ${next} 정렬` : `${nodeText(header)}: sort ${next}`}>
                {header}<Icon name={direction === 'descending' ? 'arrow-down' : 'arrow-up'} size={16} />
              </button> : header}
            </th>;
          })}</tr></thead>
          <tbody>{displayedRows.length === 0 ? <tr><td colSpan={headers.length} className={styles.emptyState}>
            {ko ? '검색 결과가 없습니다.' : 'No matching rows.'}
          </td></tr> : displayedRows.map(row => <tr key={row.id}
            className={`${row.className || ''} ${row.highlighted ? styles.highlighted : ''}`}>
            {row.cells.map((cell, index) => {
              const Cell = index === rowHeaderColumn ? 'th' : 'td';
              return <Cell key={index} scope={index === rowHeaderColumn ? 'row' : undefined}
                style={{textAlign: alignments[index]}}>{cell}</Cell>;
            })}
          </tr>)}</tbody>
        </table>
      </DataTableFrame>
      {searchable && <p className={styles.resultCount} role="status">
        {ko ? `${visibleRows.length}개 행` : `${visibleRows.length} rows`}
      </p>}
      {paginated && totalPages > 1 && <nav className={styles.pagination} aria-label={ko ? '표 페이지' : 'Table pages'}>
        <button type="button" disabled={page === 1} onClick={() => setCurrentPage(page - 1)}>
          <Icon name="chevron-left" size={18} />{ko ? '이전' : 'Previous'}
        </button>
        <span className={styles.pageInfo} role="status">{ko ? `페이지 ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
        <button type="button" disabled={page >= totalPages} onClick={() => setCurrentPage(page + 1)}>
          {ko ? '다음' : 'Next'}<Icon name="chevron-right" size={18} />
        </button>
      </nav>}
    </div>
  );
}

BaseTable.propTypes = {
  headers: PropTypes.arrayOf(PropTypes.node).isRequired,
  rows: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    cells: PropTypes.arrayOf(PropTypes.node).isRequired,
    sortValues: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number])),
    searchValues: PropTypes.arrayOf(PropTypes.string),
    className: PropTypes.string, highlighted: PropTypes.bool,
  })).isRequired,
  sortable: PropTypes.bool, searchable: PropTypes.bool, paginated: PropTypes.bool,
  pageSize: PropTypes.number, className: PropTypes.string, responsive: PropTypes.bool,
  ariaLabel: PropTypes.string, title: PropTypes.node, caption: PropTypes.node,
  description: PropTypes.node, minWidth: PropTypes.string,
  rowHeaderColumn: PropTypes.number,
  columnAlignments: PropTypes.arrayOf(PropTypes.oneOf(['left', 'center', 'right'])),
};
