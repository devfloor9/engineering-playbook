import React from 'react';

const data = {
  ko: [
    { key: '요청 타임아웃', value: '10초' },
    { key: '최대 재시도', value: '3회 (100ms 백오프)' },
    { key: '특징', value: 'Gateway 없이 Service 간 직접 L7 정책 적용' },
  ],
  en: [
    { key: 'Request Timeout', value: '10 seconds' },
    { key: 'Max Retries', value: '3 (100ms backoff)' },
    { key: 'Feature', value: 'Direct L7 policy between Services without Gateway' },
  ],
};

export default function GammaEffectsTable({ locale = 'ko' }) {
  const items = data[locale];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #00695c 0%, #00897b 100%)', borderRadius: '12px 12px 0 0', padding: '0.75rem 1.25rem', color: 'white' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>⚙️ {locale === 'ko' ? 'GAMMA 효과 (HTTPRoute → Service 직접 연결)' : 'GAMMA Effects (HTTPRoute → Service Direct Attachment)'}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem 0.8rem', background: '#f8f9fa', borderRadius: 8, borderLeft: '3px solid #00897b' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#424242' }}>{item.key}</span>
            <span style={{ fontSize: '0.78rem', color: '#616161', fontWeight: 500 }}>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
