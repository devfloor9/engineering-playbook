import React from 'react';

const metrics = [
  { label: 'HTTP p99 @QPS=1000', v4: '3.94ms', v104: '3.64ms', pct4: 55, pct104: 51, diff: '-8%', diffColor: '#059669', diffNote: '(within noise)' },
  { label: 'Max Achieved QPS', v4: '4,405', v104: '4,221', pct4: 88, pct104: 84, diff: '-4.2%', diffColor: '#dc2626' },
  { label: 'TCP Throughput (Gbps)', v4: '12.3', v104: '12.4', pct4: 98, pct104: 99, diff: '~identical', diffColor: '#059669' },
  { label: 'DNS Resolution p50', v4: '2ms', v104: '2ms', pct4: 40, pct104: 40, diff: 'identical', diffColor: '#059669' },
];

function MetricRow({ metric }) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ fontSize: '0.85rem', fontWeight: 500, color: '#1f2937', marginBottom: '0.4rem' }}>
        {metric.label}
      </div>
      {/* 4 Services bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
        <div style={{ width: '80px', textAlign: 'right', fontSize: '0.72rem', color: '#6b7280', flexShrink: 0 }}>
          4 Svc
        </div>
        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '22px' }}>
          <div style={{
            width: `${metric.pct4}%`,
            background: '#93c5fd',
            height: '100%',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '8px',
            minWidth: '50px',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#1e3a5f' }}>{metric.v4}</span>
          </div>
        </div>
      </div>
      {/* 104 Services bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div style={{ width: '80px', textAlign: 'right', fontSize: '0.72rem', color: '#6b7280', flexShrink: 0 }}>
          104 Svc
        </div>
        <div style={{ flex: 1, background: '#f1f5f9', borderRadius: '4px', height: '22px', position: 'relative' }}>
          <div style={{
            width: `${metric.pct104}%`,
            background: '#3b82f6',
            height: '100%',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            paddingRight: '8px',
            minWidth: '50px',
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff' }}>{metric.v104}</span>
          </div>
          <span style={{
            position: 'absolute',
            right: '-90px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.72rem',
            fontWeight: 600,
            color: metric.diffColor,
            whiteSpace: 'nowrap',
          }}>
            {metric.diff} {metric.diffNote || ''}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ServiceScalingChart() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px',
    }}>
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '1.2rem 1.5rem',
      }}>
        {/* Header with legend */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}>
          <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
            4 Services vs 104 Services — eBPF O(1) hash map lookup
          </span>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '14px', height: '10px', background: '#93c5fd', borderRadius: '2px' }} />
              <span style={{ fontSize: '0.75rem', color: '#374151' }}>4 Services</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <div style={{ width: '14px', height: '10px', background: '#3b82f6', borderRadius: '2px' }} />
              <span style={{ fontSize: '0.75rem', color: '#374151' }}>104 Services</span>
            </div>
          </div>
        </div>

        <div style={{ paddingRight: '90px' }}>
          {metrics.map((m, i) => <MetricRow key={i} metric={m} />)}
        </div>
      </div>

      {/* Insight box */}
      <div style={{
        background: '#f0fdf4',
        border: '2px solid #10b981',
        borderRadius: '8px',
        padding: '0.8rem 1rem',
        marginTop: '0.75rem',
      }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#065f46', marginBottom: '0.3rem' }}>
          Key Insight
        </div>
        <div style={{ fontSize: '0.78rem', color: '#065f46', lineHeight: 1.6 }}>
          eBPF maintains O(1) performance regardless of service count. With iptables (kube-proxy),
          service lookup degrades O(n) as rules increase — significant at 500+ services.
        </div>
      </div>
    </div>
  );
}
