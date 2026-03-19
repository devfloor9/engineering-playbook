import React from 'react';

const data = {
  ko: [
    { algorithm: 'random', affinity: '없음', addition: '영향 없음', removal: '영향 없음', cpu: '최소', recommended: false },
    { algorithm: 'maglev', affinity: '최대 90%', addition: '10% 재배치', removal: '제거된 백엔드 트래픽만 재배치', cpu: '낮음', recommended: true },
  ],
  en: [
    { algorithm: 'random', affinity: 'None', addition: 'No impact', removal: 'No impact', cpu: 'Minimal', recommended: false },
    { algorithm: 'maglev', affinity: 'Up to 90%', addition: '10% redistribution', removal: 'Only removed backend traffic redistributed', cpu: 'Low', recommended: true },
  ],
};

export default function AlgorithmComparisonTable({ locale = 'ko' }) {
  const rows = data[locale];
  const title = locale === 'ko' ? '🔄 로드밸런싱 알고리즘 비교' : '🔄 Load Balancing Algorithm Comparison';
  const subtitle = locale === 'ko' ? 'Cilium의 random vs maglev 알고리즘 특성' : 'Cilium random vs maglev algorithm characteristics';
  const headers = locale === 'ko'
    ? { algorithm: '알고리즘', affinity: '연결 고정성', addition: '백엔드 추가 시', removal: '백엔드 제거 시', cpu: 'CPU 오버헤드' }
    : { algorithm: 'Algorithm', affinity: 'Connection Affinity', addition: 'Backend Addition', removal: 'Backend Removal', cpu: 'CPU Overhead' };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--ifm-color-emphasis-100)' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.algorithm}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.affinity}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.addition}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.removal}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#0d47a1', borderBottom: '2px solid #1565c0' }}>{headers.cpu}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ background: row.recommended ? '#e3f2fd' : '#fff', borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: 700 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code style={{ background: row.recommended ? '#1565c0' : '#64b5f6', color: '#fff', padding: '2px 8px', borderRadius: 4, fontSize: '0.78rem' }}>{row.algorithm}</code>
                    {row.recommended && <span style={{ background: '#4caf50', color: '#fff', fontSize: '0.7rem', padding: '2px 6px', borderRadius: 4, fontWeight: 600 }}>추천</span>}
                  </div>
                </td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--ifm-font-color-base)', fontWeight: row.recommended ? 600 : 400 }}>{row.affinity}</td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--ifm-font-color-base)' }}>{row.addition}</td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: 'var(--ifm-font-color-base)' }}>{row.removal}</td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: '#2e7d32', fontWeight: 600 }}>{row.cpu}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
