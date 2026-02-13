import React from 'react';

const risks = {
  ko: [
    { vulnerability: 'Snippets 어노테이션을 통한 임의 설정 주입', severity: 'Critical', cvss: '9.8', impact: '전체 Ingress 트래픽 장악 가능' },
    { vulnerability: '스키마 검증 부재로 인한 잘못된 설정 전파', severity: 'High', cvss: '7.5', impact: '서비스 중단, 보안 정책 우회' },
    { vulnerability: 'RBAC 권한 상승 공격 (네임스페이스 격리 무력화)', severity: 'Critical', cvss: '9.1', impact: '크로스 네임스페이스 권한 탈취' },
    { vulnerability: 'EOL 이후 패치 종료', severity: 'Critical', cvss: 'N/A', impact: '제로데이 취약점 대응 불가' },
  ],
  en: [
    { vulnerability: 'Arbitrary config injection via Snippets annotations', severity: 'Critical', cvss: '9.8', impact: 'Full Ingress traffic hijacking' },
    { vulnerability: 'Invalid config propagation due to no schema validation', severity: 'High', cvss: '7.5', impact: 'Service disruption, security policy bypass' },
    { vulnerability: 'RBAC privilege escalation (namespace isolation bypass)', severity: 'Critical', cvss: '9.1', impact: 'Cross-namespace privilege theft' },
    { vulnerability: 'End of patches after EOL', severity: 'Critical', cvss: 'N/A', impact: 'No zero-day vulnerability response' },
  ],
};

const severityColors = {
  Critical: { color: '#dc2626', bg: '#fef2f2' },
  High: { color: '#ea580c', bg: '#fff7ed' },
};

export default function RiskAssessmentTable({ locale = 'ko' }) {
  const data = risks[locale] || risks.ko;
  const title = locale === 'ko' ? '⚠️ NGINX Ingress 보안 위험 평가' : '⚠️ NGINX Ingress Security Risk Assessment';
  const subtitle = locale === 'ko' ? '알려진 취약점 및 영향 범위' : 'Known vulnerabilities and impact scope';
  const headers = locale === 'ko'
    ? { vuln: '취약점 유형', severity: '심각도', cvss: 'CVSS 점수', impact: '영향 범위' }
    : { vuln: 'Vulnerability Type', severity: 'Severity', cvss: 'CVSS Score', impact: 'Impact Scope' };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((risk, idx) => {
          const sColor = severityColors[risk.severity];
          return (
            <div key={idx} style={{ border: `1.5px solid ${sColor.color}30`, borderLeft: `4px solid ${sColor.color}`, borderRadius: 8, padding: '0.7rem 1rem', background: sColor.bg }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#1f2937', flex: '1 1 auto' }}>{risk.vulnerability}</span>
                <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                  <span style={{ background: sColor.color, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>{risk.severity}</span>
                  <span style={{ background: '#334155', color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700 }}>CVSS: {risk.cvss}</span>
                </div>
              </div>
              <div style={{ fontSize: '0.76rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ fontWeight: 600, color: '#374151' }}>{headers.impact}:</span>
                <span>{risk.impact}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
