import React from 'react';

export default function GammaMeshDiagram({ locale = 'ko' }) {
  const isKo = locale === 'ko';

  const Box = ({ bg, label, sub, style: extra }) => (
    <div style={{ background: bg, color: '#fff', borderRadius: 8, padding: '0.45rem 0.6rem', textAlign: 'center', fontSize: '0.74rem', fontWeight: 600, ...extra }}>
      {label}
      {sub && <div style={{ fontSize: '0.62rem', opacity: 0.85, marginTop: 1 }}>{sub}</div>}
    </div>
  );

  const Arrow = ({ color = '#1565c0' }) => (
    <div style={{ textAlign: 'center', fontSize: '0.85rem', color, lineHeight: 1.2 }}>↓</div>
  );

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #0d47a1 0%, #1565c0 100%)', borderRadius: '12px 12px 0 0', padding: '0.85rem 1.25rem', color: 'white' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>
          {isKo ? '🔀 GAMMA 메시 구성 패턴' : '🔀 GAMMA Mesh Configuration Pattern'}
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>
          {isKo
            ? 'North-South (인그레스) vs East-West (메시) 트래픽 패턴 비교'
            : 'North-South (Ingress) vs East-West (Mesh) traffic pattern comparison'}
        </div>
      </div>

      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>

          {/* North-South */}
          <div style={{ flex: '1 1 240px', maxWidth: 300 }}>
            <div style={{ background: 'var(--ifm-color-emphasis-100)', border: '2px solid #1565c0', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0d47a1', marginBottom: '0.6rem', textAlign: 'center' }}>
                {isKo ? '🌐 North-South (인그레스)' : '🌐 North-South (Ingress)'}
              </div>
              <Box bg="#e53935" label="GatewayClass" sub={isKo ? '인프라 팀' : 'Infra Team'} />
              <Arrow />
              <Box bg="#fb8c00" label="Gateway" sub="parentRef: Gateway" />
              <Arrow />
              <Box bg="#43a047" label="HTTPRoute" sub={isKo ? '앱 팀' : 'App Team'} />
              <Arrow />
              <Box bg="#1565c0" label="Service A" />
            </div>
          </div>

          {/* Arrow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 36 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.4rem', color: '#9e9e9e' }}>→</div>
              <div style={{ fontSize: '0.58rem', color: '#9e9e9e', whiteSpace: 'pre-line', lineHeight: 1.3 }}>
                {isKo ? 'Service간\n통신' : 'Inter-\nservice'}
              </div>
            </div>
          </div>

          {/* East-West */}
          <div style={{ flex: '1 1 240px', maxWidth: 300 }}>
            <div style={{ background: 'var(--ifm-color-emphasis-100)', border: '2px solid #e65100', borderRadius: 10, padding: '0.85rem' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#e65100', marginBottom: '0.6rem', textAlign: 'center' }}>
                {isKo ? '🔄 East-West (GAMMA 메시)' : '🔄 East-West (GAMMA Mesh)'}
              </div>
              <Box bg="#43a047" label="HTTPRoute" sub={
                <span style={{ background: 'rgba(255,255,255,0.25)', borderRadius: 3, padding: '0 4px', fontWeight: 700 }}>
                  parentRef: Service ← {isKo ? '핵심' : 'Key'}
                </span>
              } />
              <Arrow color="#e65100" />
              <Box bg="#e65100" label="Service B" />
              <Arrow color="#e65100" />
              <Box bg="#bf360c" label="Pod B" />

              <div style={{ marginTop: '0.6rem', background: 'var(--ifm-color-emphasis-100)', border: '1px dashed #e65100', borderRadius: 8, padding: '0.4rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: '#bf360c', marginBottom: '0.25rem' }}>
                  {isKo ? 'L7 정책 적용' : 'L7 Policies'}
                </div>
                <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  {(isKo
                    ? ['재시도', '타임아웃', '트래픽 분할']
                    : ['Retry', 'Timeout', 'Traffic Split']
                  ).map(p => (
                    <span key={p} style={{ background: '#e65100', color: '#fff', borderRadius: 4, padding: '1px 5px', fontSize: '0.6rem', fontWeight: 600 }}>{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div style={{ marginTop: '0.85rem', background: 'var(--ifm-color-emphasis-100)', borderRadius: 8, padding: '0.5rem 0.8rem', display: 'flex', gap: '1.2rem', flexWrap: 'wrap', justifyContent: 'center' }}>
          <span style={{ fontSize: '0.68rem', color: '#616161' }}>
            <strong style={{ color: '#1565c0' }}>North-South</strong>: HTTPRoute → <strong>Gateway</strong> (parentRef)
          </span>
          <span style={{ fontSize: '0.68rem', color: '#616161' }}>
            <strong style={{ color: '#e65100' }}>East-West</strong>: HTTPRoute → <strong>Service</strong> (parentRef)
          </span>
        </div>
      </div>
    </div>
  );
}
