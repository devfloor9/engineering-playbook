import React from 'react';

const scenarios = [
  { id: 'A', label: 'VPC CNI', color: '#64748b', tcp: 12.41, udp: 10.00 },
  { id: 'B', label: 'Cilium+kp', color: '#8b5cf6', tcp: 12.34, udp: 7.92 },
  { id: 'C', label: 'kp-less', color: '#10b981', tcp: 12.34, udp: 7.92 },
  { id: 'D', label: 'ENI', color: '#3b82f6', tcp: 12.41, udp: 10.00 },
  { id: 'E', label: 'ENI+Tuned', color: '#059669', tcp: 12.40, udp: 7.96 },
];

const nicLimit = 12.5;

function Bar({ value, max, color, label, scenarioId, unit }) {
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
          background: `${color}cc`,
          height: '100%', borderRadius: '6px', transition: 'width 0.6s ease',
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
          paddingRight: '8px', boxSizing: 'border-box', minWidth: '70px',
        }}>
          <span style={{
            color: '#fff', fontSize: '0.78rem', fontWeight: 700,
            textShadow: '0 1px 2px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
          }}>
            {value.toFixed(2)} {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ThroughputChart() {
  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px',
    }}>
      {/* TCP Throughput */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0',
        borderRadius: '10px', padding: '1.2rem 1.5rem', marginBottom: '1rem',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'baseline', marginBottom: '1rem',
        }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: '#334155' }}>
            TCP Throughput (Gbps)
          </h4>
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>
            NIC limit: {nicLimit} Gbps
          </span>
        </div>
        <div>
          {scenarios.map(s => (
            <Bar
              key={`tcp-${s.id}`}
              value={s.tcp}
              max={14}
              color={s.color}
              label={s.label}
              scenarioId={s.id}
              unit="Gbps"
            />
          ))}
        </div>
        <div style={{
          marginTop: '0.8rem', paddingTop: '0.8rem',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6,
        }}>
          All scenarios saturated at NIC bandwidth (~12.4 Gbps).
          TCP throughput is not a differentiator across CNI configurations.
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
            Higher ≠ better · check loss rate
          </span>
        </div>
        <div>
          {scenarios.map(s => {
            const hasHighLoss = s.id === 'A' || s.id === 'D';
            return (
              <div key={`udp-${s.id}`} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
                <div style={{
                  width: '90px', textAlign: 'right', fontSize: '0.8rem',
                  fontWeight: 500, color: '#475569', flexShrink: 0,
                }}>
                  {s.id}: {s.label}
                </div>
                <div style={{
                  flex: 1, background: '#f1f5f9', borderRadius: '6px',
                  height: '28px', position: 'relative', overflow: 'visible',
                }}>
                  <div style={{
                    width: `${Math.max((s.udp / 14) * 100, 2)}%`,
                    background: hasHighLoss
                      ? 'linear-gradient(90deg, #fca5a5, #ef4444)'
                      : `${s.color}cc`,
                    height: '100%', borderRadius: '6px', transition: 'width 0.6s ease',
                    border: hasHighLoss ? '2px solid #ef4444' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                    paddingRight: '8px', boxSizing: 'border-box', minWidth: '70px',
                  }}>
                    <span style={{
                      color: '#fff', fontSize: '0.78rem', fontWeight: 700,
                      textShadow: '0 1px 2px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
                    }}>
                      {s.udp.toFixed(2)} Gbps
                    </span>
                  </div>
                  {hasHighLoss && (
                    <span style={{
                      position: 'absolute', right: '-90px', top: '50%',
                      transform: 'translateY(-50%)', fontSize: '0.7rem',
                      fontWeight: 600, color: '#ef4444', whiteSpace: 'nowrap',
                    }}>
                      ⚠ 20% loss
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{
          marginTop: '0.8rem', paddingTop: '0.8rem',
          borderTop: '1px solid #f1f5f9',
          fontSize: '0.78rem', color: '#64748b', lineHeight: 1.6,
        }}>
          <span style={{ color: '#ef4444', fontWeight: 600 }}>Red bars</span> indicate
          high throughput with 20%+ packet loss (no Bandwidth Manager).
          Effective data transfer is lower despite higher raw throughput.
        </div>
      </div>

      <p style={{
        textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8',
        fontStyle: 'italic', marginTop: '0.75rem', marginBottom: 0,
      }}>
        iperf3 · 10s duration · m6i.xlarge (12.5 Gbps baseline) · Median of 3+ runs
      </p>
    </div>
  );
}
