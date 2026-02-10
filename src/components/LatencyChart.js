import React from 'react';

const scenarios = [
  { id: 'A', label: 'VPC CNI', color: '#64748b', rtt: 4894 },
  { id: 'B', label: 'Cilium+kp', color: '#8b5cf6', rtt: 4955 },
  { id: 'C', label: 'kp-less', color: '#10b981', rtt: 5092 },
  { id: 'D', label: 'ENI', color: '#3b82f6', rtt: 4453 },
  { id: 'E', label: 'ENI+Tuned', color: '#059669', rtt: 3135 },
];

const rttMax = 5500;

function Bar({ value, max, color, label, scenarioId, isBest }) {
  const pct = (value / max) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
      <div style={{
        width: '90px', textAlign: 'right', fontSize: '0.8rem',
        fontWeight: 500, color: '#475569', flexShrink: 0,
      }}>
        {scenarioId}: {label}
      </div>
      <div style={{
        flex: 1, background: '#f1f5f9', borderRadius: '6px',
        height: '28px', position: 'relative', overflow: 'visible',
      }}>
        <div style={{
          width: `${Math.max(pct, 2)}%`,
          background: isBest ? `linear-gradient(90deg, ${color}cc, ${color})` : `${color}cc`,
          height: '100%', borderRadius: '6px', transition: 'width 0.6s ease',
          boxShadow: isBest ? `0 0 8px ${color}60` : 'none',
          border: isBest ? `2px solid ${color}` : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: '8px', boxSizing: 'border-box', minWidth: '70px',
        }}>
          <span style={{
            color: '#fff', fontSize: '0.78rem', fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
          }}>
            {value.toLocaleString()} µs
          </span>
        </div>
        {isBest && (
          <span style={{
            position: 'absolute', right: '-70px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '0.7rem',
            fontWeight: 600, color: color, whiteSpace: 'nowrap',
          }}>
            ✓ Lowest
          </span>
        )}
      </div>
    </div>
  );
}

export default function LatencyChart() {
  const lowestRtt = Math.min(...scenarios.map(s => s.rtt));
  const baseline = scenarios[0].rtt;

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px',
    }}>
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: '10px', padding: '1.2rem 1.5rem',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', marginBottom: '1rem',
        }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
            Pod-to-Pod RTT (µs)
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Lower is better
          </span>
        </div>
        <div style={{ paddingRight: '70px' }}>
          {scenarios.map(s => (
            <Bar
              key={`rtt-${s.id}`}
              value={s.rtt}
              max={rttMax}
              color={s.color}
              label={s.label}
              scenarioId={s.id}
              isBest={s.rtt === lowestRtt}
            />
          ))}
        </div>
        {/* Improvement summary */}
        <div style={{
          marginTop: '1rem', paddingTop: '0.8rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ fontWeight: 600, color: '#059669' }}>-36%</span> vs Baseline (A→E)
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ fontWeight: 600, color: '#3b82f6' }}>-9%</span> ENI native routing (A→D)
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ fontWeight: 600, color: '#059669' }}>-30%</span> Tuning effect (D→E)
          </div>
        </div>
      </div>
      <p style={{
        textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8',
        fontStyle: 'italic', marginTop: '0.75rem', marginBottom: 0,
      }}>
        Median of 3+ measurements · Single AZ (ap-northeast-2a) · m6i.xlarge nodes
      </p>
    </div>
  );
}
