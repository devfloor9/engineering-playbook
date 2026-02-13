import React from 'react';

export default function SolutionFeatureTable({ solution, color, features, limitations, locale = 'en' }) {
  const sectionLabels = {
    en: { features: 'Features', limitations: 'Limitations' },
    ko: { features: '장점', limitations: '한계' },
  };

  const labels = sectionLabels[locale] || sectionLabels.en;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`, borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{solution}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{labels.features} & {labels.limitations}</div>
      </div>

      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem' }}>
        {/* Features Section */}
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
            ✓ {labels.features}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {features.map((item, idx) => (
              <div key={idx} style={{ border: '1.5px solid #16a34a30', borderLeft: '4px solid #16a34a', borderRadius: 8, padding: '0.7rem 1rem', background: '#f0fdf4' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#15803d' }}>{item.feature}</span>
                  <span style={{ fontSize: '0.76rem', color: '#374151' }}>{item.benefit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations Section */}
        <div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#dc2626', marginBottom: '0.5rem', paddingLeft: '0.5rem' }}>
            ⚠ {labels.limitations}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {limitations.map((item, idx) => (
              <div key={idx} style={{ border: '1.5px solid #dc262630', borderLeft: '4px solid #dc2626', borderRadius: 8, padding: '0.7rem 1rem', background: '#fef2f2' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#991b1b' }}>{item.limitation}</span>
                  <span style={{ fontSize: '0.76rem', color: '#374151' }}>{item.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
