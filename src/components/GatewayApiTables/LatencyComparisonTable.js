import React from 'react';

const data = {
  ko: [
    { component: 'L4 로드밸런서', alb: 'ALB: 10ms', nlb: 'NLB: 0.4ms', improvement: '96', isTotal: false },
    { component: 'L7 프록시', alb: 'NGINX: 5ms', nlb: 'eBPF+Envoy: 3.1ms', improvement: '38', isTotal: false },
    { component: '총 레이턴시', alb: '15ms', nlb: '3.5ms', improvement: '77', isTotal: true },
  ],
  en: [
    { component: 'L4 Load Balancer', alb: 'ALB: 10ms', nlb: 'NLB: 0.4ms', improvement: '96', isTotal: false },
    { component: 'L7 Proxy', alb: 'NGINX: 5ms', nlb: 'eBPF+Envoy: 3.1ms', improvement: '38', isTotal: false },
    { component: 'Total Latency', alb: '15ms', nlb: '3.5ms', improvement: '77', isTotal: true },
  ],
};

export default function LatencyComparisonTable({ locale = 'ko' }) {
  const rows = data[locale];
  const title = locale === 'ko' ? '⚡ 레이턴시 비교 분석' : '⚡ Latency Comparison Analysis';
  const subtitle = locale === 'ko' ? 'ALB+NGINX vs NLB+Cilium 성능 비교' : 'ALB+NGINX vs NLB+Cilium performance comparison';
  const headers = locale === 'ko'
    ? { component: '구성 요소', alb: 'ALB + NGINX', nlb: 'NLB + Cilium', improvement: '개선율' }
    : { component: 'Component', alb: 'ALB + NGINX', nlb: 'NLB + Cilium', improvement: 'Improvement' };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f8f4' }}>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600, color: '#1b5e20', borderBottom: '2px solid #2e7d32' }}>{headers.component}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#1b5e20', borderBottom: '2px solid #2e7d32' }}>{headers.alb}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#1b5e20', borderBottom: '2px solid #2e7d32' }}>{headers.nlb}</th>
              <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: '#1b5e20', borderBottom: '2px solid #2e7d32' }}>{headers.improvement}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} style={{ background: row.isTotal ? '#e8f5e9' : '#fff', borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '0.7rem 1rem', fontSize: '0.82rem', fontWeight: row.isTotal ? 700 : 600, color: '#374151' }}>{row.component}</td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: '#6b7280' }}>{row.alb}</td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center', fontSize: '0.78rem', color: '#2e7d32', fontWeight: 600 }}>{row.nlb}</td>
                <td style={{ padding: '0.7rem 1rem', textAlign: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                    <div style={{ width: 60, height: 18, background: '#e8f5e9', borderRadius: 4, overflow: 'hidden', border: '1px solid #4caf50' }}>
                      <div style={{ width: `${row.improvement}%`, height: '100%', background: 'linear-gradient(90deg, #4caf50 0%, #66bb6a 100%)' }}></div>
                    </div>
                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#2e7d32' }}>{row.improvement}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
