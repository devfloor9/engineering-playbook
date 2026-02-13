import React from 'react';

const difficultyStyles = {
  ko: {
    '쉬움': { bg: '#e8f5e9', border: '#4caf50', color: '#2e7d32' },
    '중간': { bg: '#fff3e0', border: '#ff9800', color: '#e65100' },
    '어려움': { bg: '#ffebee', border: '#f44336', color: '#c62828' },
  },
  en: {
    'Easy': { bg: '#e8f5e9', border: '#4caf50', color: '#2e7d32' },
    'Medium': { bg: '#fff3e0', border: '#ff9800', color: '#e65100' },
    'Hard': { bg: '#ffebee', border: '#f44336', color: '#c62828' },
  },
};

const data = {
  ko: [
    { feature: 'Basic Auth', aws: '중간', cilium: '중간', nginx: '쉬움', envoy: '중간', kgateway: '쉬움' },
    { feature: 'IP Allowlist', aws: '쉬움', cilium: '쉬움', nginx: '쉬움', envoy: '쉬움', kgateway: '쉬움' },
    { feature: 'Rate Limiting', aws: '중간', cilium: '중간', nginx: '쉬움', envoy: '쉬움', kgateway: '쉬움' },
    { feature: 'URL Rewrite', aws: '쉬움', cilium: '쉬움', nginx: '쉬움', envoy: '쉬움', kgateway: '쉬움' },
    { feature: 'Body Size', aws: '중간', cilium: '어려움', nginx: '쉬움', envoy: '쉬움', kgateway: '쉬움' },
    { feature: 'Custom Error', aws: '쉬움', cilium: '어려움', nginx: '중간', envoy: '쉬움', kgateway: '쉬움' },
    { feature: 'Header Routing', aws: '쉬움', cilium: '쉬움', nginx: '쉬움', envoy: '쉬움', kgateway: '쉬움' },
    { feature: 'Cookie Affinity', aws: '쉬움', cilium: '어려움', nginx: '쉬움', envoy: '중간', kgateway: '쉬움' },
  ],
  en: [
    { feature: 'Basic Auth', aws: 'Medium', cilium: 'Medium', nginx: 'Easy', envoy: 'Medium', kgateway: 'Easy' },
    { feature: 'IP Allowlist', aws: 'Easy', cilium: 'Easy', nginx: 'Easy', envoy: 'Easy', kgateway: 'Easy' },
    { feature: 'Rate Limiting', aws: 'Medium', cilium: 'Medium', nginx: 'Easy', envoy: 'Easy', kgateway: 'Easy' },
    { feature: 'URL Rewrite', aws: 'Easy', cilium: 'Easy', nginx: 'Easy', envoy: 'Easy', kgateway: 'Easy' },
    { feature: 'Body Size', aws: 'Medium', cilium: 'Hard', nginx: 'Easy', envoy: 'Easy', kgateway: 'Easy' },
    { feature: 'Custom Error', aws: 'Easy', cilium: 'Hard', nginx: 'Medium', envoy: 'Easy', kgateway: 'Easy' },
    { feature: 'Header Routing', aws: 'Easy', cilium: 'Easy', nginx: 'Easy', envoy: 'Easy', kgateway: 'Easy' },
    { feature: 'Cookie Affinity', aws: 'Easy', cilium: 'Hard', nginx: 'Easy', envoy: 'Medium', kgateway: 'Easy' },
  ],
};

export default function DifficultyComparisonTable({ locale = 'ko' }) {
  const items = data[locale];
  const styles = difficultyStyles[locale];

  const renderCell = (difficulty) => {
    const style = styles[difficulty];
    return (
      <div style={{
        background: style.bg,
        border: `2px solid ${style.border}`,
        borderRadius: 6,
        padding: '0.4rem 0.6rem',
        textAlign: 'center',
        fontWeight: 600,
        fontSize: '0.74rem',
        color: style.color
      }}>
        {difficulty}
      </div>
    );
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: '100%', margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #bf360c 0%, #d84315 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>⚖️ {locale === 'ko' ? '구현 난이도 비교' : 'Implementation Difficulty Comparison'}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{locale === 'ko' ? '기능별 구현체 난이도 평가' : 'Feature implementation difficulty by solution'}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
          <thead>
            <tr>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'left', background: '#f5f5f5', borderBottom: '2px solid #e0e0e0', fontWeight: 700, fontSize: '0.76rem', color: '#424242', minWidth: '120px' }}>{locale === 'ko' ? '기능' : 'Feature'}</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', background: '#fff8f0', borderBottom: '2px solid #ff9800', fontWeight: 700, fontSize: '0.74rem', color: '#424242', minWidth: '120px' }}>AWS Native</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', background: '#f0f7ff', borderBottom: '2px solid #2196f3', fontWeight: 700, fontSize: '0.74rem', color: '#424242', minWidth: '120px' }}>Cilium</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', background: '#f1f8f4', borderBottom: '2px solid #4caf50', fontWeight: 700, fontSize: '0.74rem', color: '#424242', minWidth: '120px' }}>NGINX Fabric</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', background: '#fff5f5', borderBottom: '2px solid #f44336', fontWeight: 700, fontSize: '0.74rem', color: '#424242', minWidth: '120px' }}>Envoy GW</th>
              <th style={{ padding: '0.6rem 0.8rem', textAlign: 'center', background: '#f8f5fa', borderBottom: '2px solid #9c27b0', fontWeight: 700, fontSize: '0.74rem', color: '#424242', minWidth: '120px' }}>kGateway</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} style={{ background: idx % 2 === 0 ? '#fafafa' : '#fff' }}>
                <td style={{ padding: '0.7rem 0.8rem', fontWeight: 600, color: '#212121', borderBottom: '1px solid #e0e0e0' }}>{item.feature}</td>
                <td style={{ padding: '0.7rem 0.8rem', borderBottom: '1px solid #e0e0e0' }}>{renderCell(item.aws)}</td>
                <td style={{ padding: '0.7rem 0.8rem', borderBottom: '1px solid #e0e0e0' }}>{renderCell(item.cilium)}</td>
                <td style={{ padding: '0.7rem 0.8rem', borderBottom: '1px solid #e0e0e0' }}>{renderCell(item.nginx)}</td>
                <td style={{ padding: '0.7rem 0.8rem', borderBottom: '1px solid #e0e0e0' }}>{renderCell(item.envoy)}</td>
                <td style={{ padding: '0.7rem 0.8rem', borderBottom: '1px solid #e0e0e0' }}>{renderCell(item.kgateway)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
