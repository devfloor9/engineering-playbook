import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

const i18n = {
  en: {
    title: 'Inference Throughput',
    unit: 'tokens/sec',
    higherBetter: 'Higher is better',
    scoutLabel: 'Llama 4 Scout',
    maverickLabel: 'Llama 4 Maverick',
    best: 'Best',
  },
  ko: {
    title: '추론 처리량',
    unit: 'tokens/sec',
    higherBetter: '높을수록 좋음',
    scoutLabel: 'Llama 4 Scout',
    maverickLabel: 'Llama 4 Maverick',
    best: '최적',
  },
};

const scoutData = [
  { id: 'A', label: 'p5/H100', color: '#64748b', value: 4200 },
  { id: 'B', label: 'p4d/A100', color: '#8b5cf6', value: 1800 },
  { id: 'C', label: 'g6e/L40S', color: '#f59e0b', value: 1400 },
  { id: 'D', label: 'trn2', color: '#3b82f6', value: 3500 },
  { id: 'E', label: 'inf2', color: '#10b981', value: 2800 },
];

const maverickData = [
  { id: 'A', label: 'p5/H100', color: '#64748b', value: 2800 },
  { id: 'D', label: 'trn2', color: '#3b82f6', value: 2200 },
];

function Bar({ value, max, color, label, scenarioId, isBest, bestLabel, isDark }) {
  const pct = (value / max) * 100;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
      <div style={{
        width: '90px',
        textAlign: 'right',
        fontSize: '0.8rem',
        fontWeight: 500,
        color: isDark ? '#e2e8f0' : '#475569',
        flexShrink: 0,
      }}>
        {scenarioId}: {label}
      </div>
      <div style={{
        flex: 1,
        background: isDark ? '#334155' : '#f1f5f9',
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

export default function InferenceThroughputChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const theme = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    bgSurface: isDark ? '#1e293b' : '#ffffff',
    bgHeader: isDark ? '#0f172a' : '#f9fafb',
    border: isDark ? '#334155' : '#e5e7eb',
  };

  const highestScout = Math.max(...scoutData.map(s => s.value));
  const highestMaverick = Math.max(...maverickData.map(s => s.value));
  const maxValue = 5000;

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '720px',
    }}>
      {/* Scout Section */}
      <div style={{
        background: theme.bgSurface,
        border: `1px solid ${theme.border}`,
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
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: isDark ? '#f1f5f9' : '#334155' }}>
            {t.scoutLabel}
          </h4>
          <span style={{ fontSize: '0.75rem', color: theme.textSecondary, fontStyle: 'italic' }}>
            {t.higherBetter}
          </span>
        </div>
        <div style={{ paddingRight: '70px' }}>
          {scoutData.map(s => (
            <Bar
              key={`scout-${s.id}`}
              value={s.value}
              max={maxValue}
              color={s.color}
              label={s.label}
              scenarioId={s.id}
              isBest={s.value === highestScout}
              bestLabel={t.best}
              isDark={isDark}
            />
          ))}
        </div>
      </div>

      {/* Maverick Section */}
      <div style={{
        background: theme.bgSurface,
        border: `1px solid ${theme.border}`,
        borderRadius: '10px',
        padding: '1.2rem 1.5rem',
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: '1rem',
        }}>
          <h4 style={{ margin: 0, fontSize: '0.95rem', color: isDark ? '#f1f5f9' : '#334155' }}>
            {t.maverickLabel}
          </h4>
          <span style={{ fontSize: '0.75rem', color: theme.textSecondary, fontStyle: 'italic' }}>
            {t.higherBetter}
          </span>
        </div>
        <div style={{ paddingRight: '70px' }}>
          {maverickData.map(s => (
            <Bar
              key={`maverick-${s.id}`}
              value={s.value}
              max={maxValue}
              color={s.color}
              label={s.label}
              scenarioId={s.id}
              isBest={s.value === highestMaverick}
              bestLabel={t.best}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
