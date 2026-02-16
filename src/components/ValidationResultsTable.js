import React, { useState, useMemo } from 'react';

/**
 * ValidationResultsTable - React component for visualizing document validation results
 * 
 * Displays validation status, issue counts, and severity breakdown for each document
 * in the agentic-ai-platform documentation set.
 */
const ValidationResultsTable = ({ validationData }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'document', direction: 'asc' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  // Sort and filter data
  const processedData = useMemo(() => {
    let filtered = validationData;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => item.status === filterStatus);
    }

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(item => item.category === filterCategory);
    }

    // Sort
    const sorted = [...filtered].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return sorted;
  }, [validationData, sortConfig, filterStatus, filterCategory]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getStatusBadge = (status) => {
    const styles = {
      pass: { bg: '#10b981', color: '#fff' },
      'needs-update': { bg: '#f59e0b', color: '#fff' },
      fail: { bg: '#ef4444', color: '#fff' },
      pending: { bg: '#6b7280', color: '#fff' }
    };

    const style = styles[status] || styles.pending;

    return (
      <span style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {status}
      </span>
    );
  };

  const getCategoryBadge = (category) => {
    const colors = {
      eks: '#3b82f6',
      gpu: '#8b5cf6',
      inference: '#ec4899',
      'vector-db': '#14b8a6',
      'agent-framework': '#f97316',
      'model-serving': '#06b6d4',
      mlops: '#84cc16',
      overview: '#6366f1'
    };

    return (
      <span style={{
        backgroundColor: colors[category] || '#6b7280',
        color: '#fff',
        padding: '2px 8px',
        borderRadius: '8px',
        fontSize: '11px',
        fontWeight: '500'
      }}>
        {category}
      </span>
    );
  };

  const getSeverityBar = (critical, important, minor) => {
    const total = critical + important + minor;
    if (total === 0) return <span style={{ color: '#10b981' }}>✓ No issues</span>;

    const criticalWidth = (critical / total) * 100;
    const importantWidth = (important / total) * 100;
    const minorWidth = (minor / total) * 100;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div style={{ display: 'flex', height: '20px', borderRadius: '4px', overflow: 'hidden' }}>
          {critical > 0 && (
            <div style={{
              width: `${criticalWidth}%`,
              backgroundColor: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {critical}
            </div>
          )}
          {important > 0 && (
            <div style={{
              width: `${importantWidth}%`,
              backgroundColor: '#f59e0b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {important}
            </div>
          )}
          {minor > 0 && (
            <div style={{
              width: `${minorWidth}%`,
              backgroundColor: '#fbbf24',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontSize: '11px',
              fontWeight: '600'
            }}>
              {minor}
            </div>
          )}
        </div>
        <div style={{ fontSize: '11px', color: '#6b7280' }}>
          Total: {total} issues
        </div>
      </div>
    );
  };

  // Calculate summary statistics
  const summary = useMemo(() => {
    return validationData.reduce((acc, item) => {
      acc.total++;
      if (item.status === 'pass') acc.passed++;
      if (item.status === 'needs-update') acc.needsUpdate++;
      if (item.status === 'fail') acc.failed++;
      acc.totalIssues += item.critical + item.important + item.minor;
      acc.criticalIssues += item.critical;
      return acc;
    }, { total: 0, passed: 0, needsUpdate: 0, failed: 0, totalIssues: 0, criticalIssues: 0 });
  }, [validationData]);

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', padding: '20px' }}>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>Total Documents</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#111827' }}>{summary.total}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#ecfdf5', borderRadius: '8px', border: '1px solid #10b981' }}>
          <div style={{ fontSize: '14px', color: '#059669', marginBottom: '4px' }}>Passed</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#059669' }}>{summary.passed}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fef3c7', borderRadius: '8px', border: '1px solid #f59e0b' }}>
          <div style={{ fontSize: '14px', color: '#d97706', marginBottom: '4px' }}>Needs Update</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#d97706' }}>{summary.needsUpdate}</div>
        </div>
        <div style={{ padding: '16px', backgroundColor: '#fee2e2', borderRadius: '8px', border: '1px solid #ef4444' }}>
          <div style={{ fontSize: '14px', color: '#dc2626', marginBottom: '4px' }}>Critical Issues</div>
          <div style={{ fontSize: '32px', fontWeight: '700', color: '#dc2626' }}>{summary.criticalIssues}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Status</option>
          <option value="pass">Pass</option>
          <option value="needs-update">Needs Update</option>
          <option value="fail">Fail</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          style={{
            padding: '8px 12px',
            borderRadius: '6px',
            border: '1px solid #d1d5db',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          <option value="all">All Categories</option>
          <option value="eks">EKS</option>
          <option value="gpu">GPU</option>
          <option value="inference">Inference</option>
          <option value="vector-db">Vector DB</option>
          <option value="agent-framework">Agent Framework</option>
          <option value="model-serving">Model Serving</option>
          <option value="mlops">MLOps</option>
          <option value="overview">Overview</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb' }}>
              <th
                onClick={() => handleSort('document')}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Document {sortConfig.key === 'document' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('category')}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th
                onClick={() => handleSort('status')}
                style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#374151',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
              >
                Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                Issues Breakdown
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#374151' }}>
                Last Validated
              </th>
            </tr>
          </thead>
          <tbody>
            {processedData.map((item, index) => (
              <tr
                key={item.id}
                style={{
                  borderBottom: '1px solid #e5e7eb',
                  backgroundColor: index % 2 === 0 ? '#fff' : '#f9fafb'
                }}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ fontWeight: '500', color: '#111827', marginBottom: '4px' }}>
                    {item.document}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {item.path}
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {getCategoryBadge(item.category)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {getStatusBadge(item.status)}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {getSeverityBar(item.critical, item.important, item.minor)}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#6b7280' }}>
                  {item.lastValidated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div style={{ marginTop: '16px', padding: '12px', backgroundColor: '#f9fafb', borderRadius: '6px', fontSize: '12px', color: '#6b7280' }}>
        <strong>Issue Severity:</strong>
        <span style={{ marginLeft: '12px', color: '#ef4444' }}>■ Critical</span>
        <span style={{ marginLeft: '12px', color: '#f59e0b' }}>■ Important</span>
        <span style={{ marginLeft: '12px', color: '#fbbf24' }}>■ Minor</span>
      </div>
    </div>
  );
};

export default ValidationResultsTable;
