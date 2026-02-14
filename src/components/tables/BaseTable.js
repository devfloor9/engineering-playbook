import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import styles from './BaseTable.module.css';

/**
 * BaseTable Component
 * 
 * A foundational table component with sorting, searching, and pagination capabilities.
 * Serves as the base for all specialized table components.
 * 
 * @component
 * @example
 * const headers = ['Name', 'Age', 'City'];
 * const rows = [
 *   { id: '1', cells: ['Alice', 30, 'Seoul'] },
 *   { id: '2', cells: ['Bob', 25, 'Busan'] }
 * ];
 * return <BaseTable headers={headers} rows={rows} sortable searchable />
 */
export default function BaseTable({
  headers,
  rows,
  sortable = false,
  searchable = false,
  paginated = false,
  pageSize = 10,
  className = '',
  responsive = true,
  ariaLabel = 'Data table'
}) {
  const [sortConfig, setSortConfig] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Sorting logic
  const sortedRows = useMemo(() => {
    if (!sortConfig) return rows;
    
    return [...rows].sort((a, b) => {
      const aValue = a.cells[sortConfig.columnIndex];
      const bValue = b.cells[sortConfig.columnIndex];
      
      // Handle React nodes by converting to string
      const aStr = typeof aValue === 'object' && aValue !== null ? String(aValue) : aValue;
      const bStr = typeof bValue === 'object' && bValue !== null ? String(bValue) : bValue;
      
      if (aStr < bStr) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr > bStr) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [rows, sortConfig]);

  // Search logic
  const filteredRows = useMemo(() => {
    if (!searchTerm) return sortedRows;
    
    return sortedRows.filter(row =>
      row.cells.some(cell => {
        const cellStr = typeof cell === 'object' && cell !== null ? String(cell) : String(cell);
        return cellStr.toLowerCase().includes(searchTerm.toLowerCase());
      })
    );
  }, [sortedRows, searchTerm]);

  // Pagination logic
  const paginatedRows = useMemo(() => {
    if (!paginated) return filteredRows;
    
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRows.slice(startIndex, startIndex + pageSize);
  }, [filteredRows, currentPage, pageSize, paginated]);

  const totalPages = Math.ceil(filteredRows.length / pageSize);

  const handleSort = (columnIndex) => {
    if (!sortable) return;
    
    setSortConfig(prev => ({
      columnIndex,
      direction: prev?.columnIndex === columnIndex && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handlePreviousPage = () => {
    setCurrentPage(p => Math.max(1, p - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(p => Math.min(totalPages, p + 1));
  };

  return (
    <div className={`${styles.tableContainer} ${className}`}>
      {searchable && (
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="검색..."
            value={searchTerm}
            onChange={handleSearchChange}
            className={styles.searchInput}
            aria-label="테이블 검색"
          />
        </div>
      )}
      
      <div className={responsive ? styles.responsiveWrapper : ''}>
        <table className={styles.table} role="table" aria-label={ariaLabel}>
          <thead>
            <tr role="row">
              {headers.map((header, index) => (
                <th
                  key={index}
                  role="columnheader"
                  scope="col"
                  onClick={() => handleSort(index)}
                  className={sortable ? styles.sortable : ''}
                  tabIndex={sortable ? 0 : undefined}
                  onKeyPress={(e) => {
                    if (sortable && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      handleSort(index);
                    }
                  }}
                  aria-sort={
                    sortConfig?.columnIndex === index
                      ? sortConfig.direction === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : 'none'
                  }
                >
                  {header}
                  {sortable && sortConfig?.columnIndex === index && (
                    <span className={styles.sortIcon} aria-hidden="true">
                      {sortConfig.direction === 'asc' ? ' ↑' : ' ↓'}
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={headers.length} className={styles.emptyState}>
                  검색 결과가 없습니다.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  role="row"
                  className={`${row.className || ''} ${row.highlighted ? styles.highlighted : ''}`}
                >
                  {row.cells.map((cell, cellIndex) => (
                    <td key={cellIndex} role="cell">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {paginated && totalPages > 1 && (
        <div className={styles.pagination} role="navigation" aria-label="테이블 페이지네이션">
          <button
            onClick={handlePreviousPage}
            disabled={currentPage === 1}
            className={styles.paginationButton}
            aria-label="이전 페이지"
          >
            이전
          </button>
          <span className={styles.pageInfo} aria-current="page">
            페이지 {currentPage} / {totalPages}
          </span>
          <button
            onClick={handleNextPage}
            disabled={currentPage >= totalPages}
            className={styles.paginationButton}
            aria-label="다음 페이지"
          >
            다음
          </button>
        </div>
      )}
    </div>
  );
}

BaseTable.propTypes = {
  /** Array of header labels */
  headers: PropTypes.arrayOf(PropTypes.string).isRequired,
  /** Array of row objects with id and cells */
  rows: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      cells: PropTypes.arrayOf(PropTypes.node).isRequired,
      className: PropTypes.string,
      highlighted: PropTypes.bool
    })
  ).isRequired,
  /** Enable column sorting */
  sortable: PropTypes.bool,
  /** Enable search functionality */
  searchable: PropTypes.bool,
  /** Enable pagination */
  paginated: PropTypes.bool,
  /** Number of rows per page */
  pageSize: PropTypes.number,
  /** Additional CSS class */
  className: PropTypes.string,
  /** Enable responsive wrapper */
  responsive: PropTypes.bool,
  /** ARIA label for the table */
  ariaLabel: PropTypes.string
};
