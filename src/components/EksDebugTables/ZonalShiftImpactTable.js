import React from 'react';

const rows = [
  { layer: 'ALB / NLB', impact: '해당 AZ Target Group에서 제거', auto: true, manual: '-', icon: '🔀' },
  { layer: 'EKS Service (kube-proxy)', impact: '해당 AZ의 Endpoint 가중치 제거', auto: true, manual: '-', icon: '🔀' },
  { layer: '기존 노드', impact: '계속 실행됨', auto: false, manual: 'kubectl drain 으로 Pod 이동', icon: '💻' },
  { layer: '기존 Pod', impact: '트래픽만 차단, Pod 자체는 실행 중', auto: false, manual: 'drain 시 자동 재배치', icon: '📦' },
  { layer: 'Karpenter NodePool', impact: 'AZ 설정 변경 없음, 해당 AZ에 새 노드 생성 가능', auto: false, manual: 'NodePool requirements 수정', icon: '⚙️' },
  { layer: 'ASG (Managed Node Group)', impact: '서브넷 목록 변경 없음, 해당 AZ에 스케일아웃 가능', auto: false, manual: 'ASG 서브넷 수정 (콘솔/IaC)', icon: '📊' },
  { layer: 'EBS 볼륨', impact: 'AZ에 고정, 이동 불가', auto: false, manual: '스냅샷 → 다른 AZ에 복원', icon: '💾' },
  { layer: 'EFS Mount Target', impact: '다른 AZ의 Mount Target 자동 사용', auto: true, manual: '-', icon: '📁' },
];

export default function ZonalShiftImpactTable() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>⚡ ARC Zonal Shift 영향 범위</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>Zonal Shift는 트래픽 라우팅만 변경합니다 — 각 계층별 영향 확인</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto auto', gap: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--ifm-color-emphasis-600)', background: 'var(--ifm-background-surface-color)', padding: '0.6rem 1rem', borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
          <span>계층</span><span>Zonal Shift 영향</span><span style={{ textAlign: 'center' }}>자동 조정</span><span>수동 작업</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto auto', gap: 0, padding: '0.6rem 1rem', borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center', fontSize: '0.78rem', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
            <span style={{ fontWeight: 600, color: 'var(--ifm-font-color-base)' }}>{r.icon} {r.layer}</span>
            <span style={{ color: 'var(--ifm-color-emphasis-600)' }}>{r.impact}</span>
            <span style={{ textAlign: 'center', fontSize: '0.85rem' }}>{r.auto ? '✅' : '❌'}</span>
            <span style={{ color: r.manual === '-' ? '#94a3b8' : '#b45309', fontSize: '0.72rem', fontWeight: r.manual !== '-' ? 600 : 400 }}>{r.manual}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
