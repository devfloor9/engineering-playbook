import React from 'react';

const data = {
  ko: [
    { feature: 'Basic Auth', cost: 'Lambda 실행 비용', estimate: '~$2-10 (100만 요청 기준)' },
    { feature: 'IP Allowlist', cost: 'WAF IP Set + 규칙', estimate: '$5 (Web ACL) + $1 (규칙) = $6' },
    { feature: 'Rate Limiting', cost: 'WAF Rate-Based Rule', estimate: '$5 (Web ACL) + $1 (규칙) + $0.60/백만 요청' },
    { feature: 'Body Size', cost: 'WAF Body Size Rule', estimate: 'WAF 비용에 포함' },
    { feature: 'WAF 전체', cost: 'Web ACL + 규칙 + 요청', estimate: '~$20-100/월 (트래픽에 따라)' },
  ],
  en: [
    { feature: 'Basic Auth', cost: 'Lambda execution cost', estimate: '~$2-10 (per 1M requests)' },
    { feature: 'IP Allowlist', cost: 'WAF IP Set + rules', estimate: '$5 (Web ACL) + $1 (rule) = $6' },
    { feature: 'Rate Limiting', cost: 'WAF Rate-Based Rule', estimate: '$5 (Web ACL) + $1 (rule) + $0.60/1M requests' },
    { feature: 'Body Size', cost: 'WAF Body Size Rule', estimate: 'Included in WAF cost' },
    { feature: 'WAF Total', cost: 'Web ACL + rules + requests', estimate: '~$20-100/mo (depends on traffic)' },
  ],
};

export default function AwsCostTable({ locale = 'ko' }) {
  const items = data[locale];

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>💰 {locale === 'ko' ? 'AWS Native 추가 비용' : 'AWS Native Additional Costs'}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{locale === 'ko' ? 'WAF 및 Lambda 기반 기능별 예상 비용' : 'Estimated costs for WAF and Lambda-based features'}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {items.map((item, idx) => (
          <div key={idx} style={{ border: '1.5px solid var(--ifm-color-emphasis-200)', borderLeft: '4px solid #2e7d32', borderRadius: 8, padding: '0.7rem 1rem', background: idx === items.length - 1 ? '#f1f8e9' : 'var(--ifm-color-emphasis-100)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.3rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#2e7d32' }}>{item.feature}</span>
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--ifm-font-color-base)', marginBottom: '0.2rem' }}>{item.cost}</div>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#2e7d32', background: 'var(--ifm-color-emphasis-100)', padding: '0.3rem 0.6rem', borderRadius: 6, display: 'inline-block' }}>
              {item.estimate}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
