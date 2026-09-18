import React, {useId, useState} from 'react';
import PropTypes from 'prop-types';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Icon from '@site/src/components/Icon';
import styles from './TroubleshootingTable.module.css';

export default function TroubleshootingTable({issues, searchable = true, defaultExpanded = false}) {
  const {i18n} = useDocusaurusContext();
  const ko = i18n.currentLocale === 'ko';
  const id = useId();
  const [expandedIds, setExpandedIds] = useState(new Set(defaultExpanded ? issues.map(issue => issue.id) : []));
  const [searchTerm, setSearchTerm] = useState('');
  const labels = ko ? {critical: '심각', high: '높음', medium: '중간', low: '낮음'} : {critical: 'Critical', high: 'High', medium: 'Medium', low: 'Low'};
  const term = searchTerm.toLocaleLowerCase(ko ? 'ko' : 'en');
  const filteredIssues = issues.filter(issue => [issue.problem, issue.cause, issue.solution].some(value => value.toLocaleLowerCase(ko ? 'ko' : 'en').includes(term)));
  function toggle(issueId) {
    setExpandedIds(previous => {
      const next = new Set(previous);
      if (next.has(issueId)) next.delete(issueId); else next.add(issueId);
      return next;
    });
  }
  return <div data-ep-theme="manual" className={styles.troubleshootingWrapper} role="region" aria-label={ko ? '문제 해결 가이드' : 'Troubleshooting guide'}>
    {searchable && <div className={styles.searchBox}>
      <label htmlFor={`${id}-search`}>{ko ? '문제 검색' : 'Search issues'}</label>
      <input id={`${id}-search`} type="search" value={searchTerm} onChange={event => setSearchTerm(event.target.value)} className={styles.searchInput} />
    </div>}
    {filteredIssues.length === 0 && <p role="status">{ko ? '검색 결과가 없습니다.' : 'No matching issues.'}</p>}
    <div className={styles.issueList}>{filteredIssues.map((issue, index) => {
      const expanded = expandedIds.has(issue.id);
      const panel = `${id}-details-${index}`;
      return <div key={issue.id} className={styles.issueCard}>
        <button type="button" id={`${panel}-trigger`} className={styles.issueHeader}
          onClick={() => toggle(issue.id)} aria-expanded={expanded} aria-controls={panel}>
          <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={18} />
          <span className={styles.problemText}>{issue.problem}</span>
          {issue.severity && <span className={`${styles.severityBadge} ${styles[issue.severity]}`}>{labels[issue.severity]}</span>}
        </button>
        <div id={panel} hidden={!expanded} className={styles.issueDetails} role="region" aria-labelledby={`${panel}-trigger`}>
          <div><strong>{ko ? '원인:' : 'Cause:'}</strong><p>{issue.cause}</p></div>
          <div><strong>{ko ? '해결 방법:' : 'Solution:'}</strong><p>{issue.solution}</p></div>
        </div>
      </div>;
    })}</div>
  </div>;
}

TroubleshootingTable.propTypes = {
  issues: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired, problem: PropTypes.string.isRequired,
    cause: PropTypes.string.isRequired, solution: PropTypes.string.isRequired,
    severity: PropTypes.oneOf(['low', 'medium', 'high', 'critical']),
  })).isRequired,
  searchable: PropTypes.bool, defaultExpanded: PropTypes.bool,
};
