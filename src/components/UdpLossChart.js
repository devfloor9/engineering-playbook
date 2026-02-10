import React from 'react';

const scenarios = [
  { id: 'A', label: 'VPC CNI', color: '#64748b', loss: 20.39, throughput: 10.00 },
  { id: 'B', label: 'Cilium+kp', color: '#8b5cf6', loss: 0.94, throughput: 7.92 },
  { id: 'C', label: 'kp-less', color: '#10b981', loss: 0.69, throughput: 7.92 },
  { id: 'D', label: 'ENI', color: '#3b82f6', loss: 20.42, throughput: 10.00 },
  { id: 'E', label: 'ENI+Tuned', color: '#059669', loss: 0.03, throughput: 7.96 },
];

const lossMax = 25;

function LossBar({ scenario, isBest, isWorst }) {
  const { id, label, color, loss } = scenario;
  const pct = (loss / lossMax) * 100;
  const isHigh = loss > 5;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
      <div style={{
        width: '90px', textAlign: 'right', fontSize: '0.8rem',
        fontWeight: 500, color: '#475569', flexShrink: 0,
      }}>
        {id}: {label}
      </div>
      <div style={{
        flex: 1, background: '#f1f5f9', borderRadius: '6px',
        height: '28px', position: 'relative', overflow: 'visible',
      }}>
        <div style={{
          width: `${Math.max(pct, 2)}%`,
          background: isHigh
            ? 'linear-gradient(90deg, #fca5a5, #ef4444)'
            : isBest
              ? `linear-gradient(90deg, ${color}cc, ${color})`
              : `${color}cc`,
          height: '100%', borderRadius: '6px', transition: 'width 0.6s ease',
          boxShadow: isBest ? `0 0 8px ${color}60` : 'none',
          border: isBest ? `2px solid ${color}` : isHigh ? '2px solid #ef4444' : 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: '8px', boxSizing: 'border-box', minWidth: '60px',
        }}>
          <span style={{
            color: '#fff', fontSize: '0.78rem', fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
          }}>
            {loss}%
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
        {isWorst && (
          <span style={{
            position: 'absolute', right: '-58px', top: '50%',
            transform: 'translateY(-50%)', fontSize: '0.7rem',
            fontWeight: 600, color: '#ef4444', whiteSpace: 'nowrap',
          }}>
            ⚠ High
          </span>
        )}
      </div>
    </div>
  );
}

function ThroughputBar({ scenario }) {
  const { id, label, color, throughput } = scenario;
  const tpMin = 7;
  const tpMax = 11;
  const pct = ((throughput - tpMin) / (tpMax - tpMin)) * 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
      <div style={{
        width: '90px', textAlign: 'right', fontSize: '0.8rem',
        fontWeight: 500, color: '#475569', flexShrink: 0,
      }}>
        {id}: {label}
      </div>
      <div style={{
        flex: 1, background: '#f1f5f9', borderRadius: '6px',
        height: '28px', position: 'relative', overflow: 'visible',
      }}>
        <div style={{
          width: `${Math.max(pct, 2)}%`,
          background: `${color}cc`,
          height: '100%', borderRadius: '6px', transition: 'width 0.6s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: '8px', boxSizing: 'border-box', minWidth: '70px',
        }}>
          <span style={{
            color: '#fff', fontSize: '0.78rem', fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
          }}>
            {throughput.toFixed(2)} Gbps
          </span>
        </div>
      </div>
    </div>
  );
}

export default function UdpLossChart() {
  const lowestLoss = Math.min(...scenarios.map(s => s.loss));
  const highestLoss = Math.max(...scenarios.map(s => s.loss));

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px',
    }}>
      {/* UDP Packet Loss */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: '10px', padding: '1.2rem 1.5rem', marginBottom: '1rem',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', marginBottom: '1rem',
        }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
            UDP Packet Loss (%)
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Lower is better
          </span>
        </div>
        <div style={{ paddingRight: '70px' }}>
          {scenarios.map(s => (
            <LossBar
              key={`loss-${s.id}`}
              scenario={s}
              isBest={s.loss === lowestLoss}
              isWorst={s.loss === highestLoss && s.id !== 'A'}
            />
          ))}
        </div>
        <div style={{
          marginTop: '1rem', paddingTop: '0.8rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex', gap: '1.5rem', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ fontWeight: 600, color: '#059669' }}>680×</span> improvement (A→E)
          </div>
          <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
            <span style={{ fontWeight: 600, color: '#ef4444' }}>20%+</span> loss without Bandwidth Manager (A, D)
          </div>
        </div>
      </div>

      {/* UDP Throughput */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: '10px', padding: '1.2rem 1.5rem',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', marginBottom: '1rem',
        }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
            UDP Throughput (Gbps)
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
            Higher is better · but check loss rate
          </span>
        </div>
        <div>
          {scenarios.map(s => (
            <ThroughputBar key={`tp-${s.id}`} scenario={s} />
          ))}
        </div>
        <div style={{
          marginTop: '0.8rem', paddingTop: '0.8rem',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6,
        }}>
          ⚠ High throughput with high loss (A, D) means lower effective data transfer.
          Bandwidth Manager + BBR (E) optimizes for reliable delivery.
        </div>
      </div>

      <p style={{
        textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8',
        fontStyle: 'italic', marginTop: '0.75rem', marginBottom: 0,
      }}>
        iperf3 UDP test · 10s duration · Median of 3+ measurements
      </p>
    </div>
  );
}
