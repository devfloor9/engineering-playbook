import React from 'react';

const data = {
  ko: [
    { symptom: 'HTTPRoute Accepted=False', cause: 'Gateway가 HTTPRoute를 거부함', solution: '1. ReferenceGrant 확인 2. GatewayClass 올바른지 확인 3. 네임스페이스 정책 확인' },
    { symptom: 'HTTPRoute Programmed=False', cause: '데이터플레인 구성 실패', solution: '1. 백엔드 Service 존재 확인 2. 컨트롤러 로그 확인 3. TLS Secret 유효성 확인' },
    { symptom: '503 Service Unavailable', cause: '백엔드 엔드포인트 없음', solution: '1. Service의 Endpoints 확인 2. Pod selector 일치 여부 확인 3. Pod 상태 확인 (Ready)' },
    { symptom: 'TLS 인증서 오류', cause: 'Secret이 올바르지 않음', solution: '1. Secret 타입 kubernetes.io/tls 확인 2. tls.crt, tls.key 존재 확인 3. 인증서 유효기간 확인' },
    { symptom: '404 Not Found', cause: '경로 매칭 실패', solution: '1. PathPrefix vs Exact 타입 확인 2. 대소문자 구분 여부 확인 3. URL 인코딩 확인' },
    { symptom: 'Gateway 주소 없음', cause: 'LoadBalancer 생성 실패', solution: '1. 클라우드 제공자 쿼터 확인 2. 서브넷 IP 고갈 여부 확인 3. 어노테이션 오타 확인' },
  ],
  en: [
    { symptom: 'HTTPRoute Accepted=False', cause: 'Gateway rejected HTTPRoute', solution: '1. Check ReferenceGrant 2. Verify GatewayClass 3. Check namespace policies' },
    { symptom: 'HTTPRoute Programmed=False', cause: 'Data plane config failure', solution: '1. Verify backend Service exists 2. Check controller logs 3. Verify TLS Secret validity' },
    { symptom: '503 Service Unavailable', cause: 'No backend endpoints', solution: '1. Check Service Endpoints 2. Verify Pod selector match 3. Check Pod status (Ready)' },
    { symptom: 'TLS Certificate Error', cause: 'Invalid Secret', solution: '1. Verify Secret type kubernetes.io/tls 2. Check tls.crt, tls.key exist 3. Verify certificate validity' },
    { symptom: '404 Not Found', cause: 'Route matching failure', solution: '1. Check PathPrefix vs Exact type 2. Check case sensitivity 3. Check URL encoding' },
    { symptom: 'No Gateway Address', cause: 'LoadBalancer creation failed', solution: '1. Check cloud provider quota 2. Check subnet IP exhaustion 3. Check annotation typos' },
  ],
};

export default function TroubleshootingTable({ locale = 'ko' }) {
  const rows = data[locale];
  const title = locale === 'ko' ? '🔧 Gateway API 트러블슈팅 가이드' : '🔧 Gateway API Troubleshooting Guide';
  const subtitle = locale === 'ko' ? '일반적인 문제와 해결 방법' : 'Common issues and solutions';

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #b71c1c 0%, #c62828 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {rows.map((row, idx) => (
          <div key={idx} style={{ border: '1.5px solid #c6282820', borderLeft: '4px solid #c62828', borderRadius: 8, padding: '0.7rem 1rem', background: '#fff' }}>
            <div style={{ marginBottom: '0.4rem' }}>
              <span style={{ background: '#ffebee', color: '#c62828', padding: '3px 10px', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700 }}>
                ❌ {row.symptom}
              </span>
            </div>
            <div style={{ marginBottom: '0.4rem' }}>
              <span style={{ background: '#fff3e0', color: '#e65100', padding: '2px 8px', borderRadius: 4, fontSize: '0.74rem', fontWeight: 600 }}>
                원인: {row.cause}
              </span>
            </div>
            <div style={{ fontSize: '0.76rem', color: '#374151', paddingLeft: '0.5rem', borderLeft: '3px solid #4caf50', marginLeft: '0.2rem' }}>
              <strong style={{ color: '#2e7d32' }}>해결:</strong> {row.solution}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
