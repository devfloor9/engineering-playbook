import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import styles from './TroubleshootingTable.module.css';

/**
 * TroubleshootingTable Component
 * 
 * A specialized table for displaying troubleshooting information with expandable
 * rows showing problem, cause, and solution details.
 * 
 * @component
 * @example
 * const issues = [
 *   {
 *     id: '1',
 *     problem: 'Pod CrashLoopBackOff',
 *     cause: 'API 키 오류, 메모리 부족',
 *     solution: '시크릿 확인, 리소스 증가',
 *     severity: 'high'
 *   }
 * ];
 * return <TroubleshootingTable issues={issues} />
 */
export default function TroubleshootingTable({
  issues,
  searchable = true,
  defaultExpanded = false
}) {
  const [expandedIds, setExpandedIds] = useState(
    new Set(defaultExpanded ? issues.map(i => i.id) : [])
  );
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIssues = useMemo(() => {
    if (!searchTerm) return issues;
    
    const term = searchTerm.toLowerCase();
    return issues.filter(issue =>
      issue.problem.toLowerCase().includes(term) ||
      issue.cause.toLowerCase().includes(term) ||
      issue.solution.toLowerCase().includes(term)
    );
  }, [issues, searchTerm]);

  const toggleExpand = (id) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getSeverityClass = (severity) => {
    switch (severity) {
      case 'critical': return styles.critical;
      case 'high': return styles.high;
      case 'medium': return styles.medium;
      case 'low': return styles.low;
      default: return '';
    }
  };

  const getSeverityLabel = (severity) => {
    switch (severity) {
      case 'critical': return '심각';
      case 'high': return '높음';
      case 'medium': return '중간';
      case 'low': return '낮음';
      default: return '';
    }
  };

  return (
    <div className={styles.troubleshootingWrapper} role="region" aria-label="문제 해결 가이드">
      {searchable && (
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="문제 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            aria-label="문제 검색"
          />
        </div>
      )}
      
      {filteredIssues.length === 0 ? (
        <div className={styles.emptyState}>
          검색 결과가 없습니다.
        </div>
      ) : (
        <div className={styles.issueList}>
          {filteredIssues.map(issue => {
            const isExpanded = expandedIds.has(issue.id);
            const severityClass = getSeverityClass(issue.severity);
            
            return (
              <div key={issue.id} className={`${styles.issueCard} ${severityClass}`}>
                <div
                  className={styles.issueHeader}
                  onClick={() => toggleExpand(issue.id)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      toggleExpand(issue.id);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-controls={`issue-details-${issue.id}`}
                >
                  <span className={styles.expandIcon} aria-hidden="true">
                    {isExpanded ? '▼' : '▶'}
                  </span>
                  <span className={styles.problemText}>{issue.problem}</span>
                  {issue.severity && (
                    <span 
                      className={`${styles.severityBadge} ${severityClass}`}
                      aria-label={`심각도: ${getSeverityLabel(issue.severity)}`}
                    >
                      {getSeverityLabel(issue.severity)}
                    </span>
                  )}
                </div>
                
                {isExpanded && (
                  <div 
                    id={`issue-details-${issue.id}`}
                    className={styles.issueDetails}
                    role="region"
                  >
                    <div className={styles.detailSection}>
                      <strong className={styles.detailLabel}>원인:</strong>
                      <p className={styles.detailContent}>{issue.cause}</p>
                    </div>
                    <div className={styles.detailSection}>
                      <strong className={styles.detailLabel}>해결 방법:</strong>
                      <p className={styles.detailContent}>{issue.solution}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

TroubleshootingTable.propTypes = {
  /** Array of troubleshooting issues */
  issues: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      problem: PropTypes.string.isRequired,
      cause: PropTypes.string.isRequired,
      solution: PropTypes.string.isRequired,
      severity: PropTypes.oneOf(['low', 'medium', 'high', 'critical'])
    })
  ).isRequired,
  /** Enable search functionality */
  searchable: PropTypes.bool,
  /** Expand all issues by default */
  defaultExpanded: PropTypes.bool
};
