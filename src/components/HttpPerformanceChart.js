import React from 'react';

const scenarios = [
  { id: 'A', label: 'VPC CNI', color: '#64748b', p99: 10.92, qps: 4104 },
  { id: 'B', label: 'Cilium+kp', color: '#8b5cf6', p99: 9.87, qps: 4045 },
  { id: 'C', label: 'kp-less', color: '#10b981', p99: 8.91, qps: 4019 },
  { id: 'D', label: 'ENI', color: '#3b82f6', p99: 8.75, qps: 4026 },
  { id: 'E', label: 'ENI+Tuned', color: '#059669', p99: 9.89, qps: 4182 },
];

const p99Max = 12;
const qpsMin = 4000;
const qpsMax = 4200;

function Bar({ value, max, color, label, scenarioId, isBest, bestLabel, direction }) {
  const pct = direction === 'lower'
    ? (value / max) * 100
    : ((value - qpsMin) / (qpsMax - qpsMin)) * 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
      <div style={{
        width: '90px',
        textAlign: 'right',
        fontSize: '0.8rem',
        fontWeight: 500,
        color: '#475569',
        flexShrink: 0,
      }}>
        {scenarioId}: {label}
      </div>
      <div style={{
        flex: 1,
        background: '#f1f5f9',
        borderRadius: '6px',
        height: '28px',
        position: 'relative',
        overflow: 'visible',
      }}>
        <div style={{
          width: `${Math.max(pct, 2)}%`,
          background: isBest
            ? `linear-gradient(90deg, ${color}cc, ${color})`
            : `${color}cc`,
          height: '100%',
          borderRadius: '6px',
          transition: 'width 0.6s ease',
          boxShadow: isBest ? `0 0 8px ${color}60` : 'none',
          border: isBest ? `2px solid ${color}` : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '8px',
          boxSizing: 'border-box',
          minWidth: '60px',
        }}>
          <span style={{
            color: '#fff',
            fontSize: '0.78rem',
            fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)',
            whiteSpace: 'nowrap',
          }}>
            {value.toLocaleString()}
          </span>
        </div>
        {isBest && (
          <span style={{
            position: 'absolute',
            right: '-70px',
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: '0.7rem',
            fontWeight: 600,
            color: color,
            whiteSpace: 'nowrap',
          }}>
            ✓ {bestLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export default function HttpPerformanceChart() {
  const lowestP99 = Math.min(...scenarios.map(s => s.p99));
  const highestQps = Math.max(...scenarios.map(s => s.qps));

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px',
    }}>
      {/* p99 Latency Section */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '1.2rem 1.5rem',
        marginBottom: '1rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '1rem',
        }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
            HTTP p99 Latency @QPS=1000 (ms)
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Lower is better
          </span>
        </div>
        <div style={{ paddingRight: '70px' }}>
          {scenarios.map(s => (
            <Bar
              key={`p99-${s.id}`}
              value={s.p99}
              max={p99Max}
              color={s.color}
              label={s.label}
              scenarioId={s.id}
              isBest={s.p99 === lowestP99}
              bestLabel="Lowest"
              direction="lower"
            />
          ))}
        </div>
      </div>

      {/* Max QPS Section */}
      <div style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: '10px',
        padding: '1.2rem 1.5rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '1rem',
        }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
            Maximum Achieved QPS
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Higher is better
          </span>
        </div>
        <div style={{ paddingRight: '70px' }}>
          {scenarios.map(s => (
            <Bar
              key={`qps-${s.id}`}
              value={s.qps}
              max={qpsMax}
              color={s.color}
              label={s.label}
              scenarioId={s.id}
              isBest={s.qps === highestQps}
              bestLabel="Highest"
              direction="higher"
            />
          ))}
        </div>
      </div>

      {/* Footer */}
      <p style={{
        textAlign: 'center',
        fontSize: '0.72rem',
        color: '#94a3b8',
        fontStyle: 'italic',
        marginTop: '0.75rem',
        marginBottom: 0,
      }}>
        Measurements at QPS=1000 · Optimal configurations vary by workload
      </p>
    </div>
  );
}
