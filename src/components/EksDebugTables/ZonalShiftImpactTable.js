import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const rows = [
  { layer: { ko: 'ALB / NLB', en: 'ALB / NLB' }, impact: { ko: '해당 AZ Target Group에서 제거', en: 'Removed from the Target Group in that AZ' }, auto: true, manual: { ko: '-', en: '-' }, icon: '🔀' },
  { layer: { ko: 'EKS Service (kube-proxy)', en: 'EKS Service (kube-proxy)' }, impact: { ko: '해당 AZ의 Endpoint 가중치 제거', en: 'Endpoint weight removed for that AZ' }, auto: true, manual: { ko: '-', en: '-' }, icon: '🔀' },
  { layer: { ko: '기존 노드', en: 'Existing nodes' }, impact: { ko: '종료되지 않고 계속 실행되나, 해당 AZ 노드는 cordon되어 새 Pod 스케줄링이 차단됨', en: 'Keep running without termination, but nodes in that AZ are cordoned so new Pods are not scheduled' }, auto: true, manual: { ko: 'kubectl drain 으로 Pod 이동', en: 'Move Pods with kubectl drain' }, icon: '💻' },
  { layer: { ko: '기존 Pod', en: 'Existing Pods' }, impact: { ko: 'EndpointSlice에서 제거되어 트래픽은 차단되나 Pod 자체는 종료되지 않음(축출되지 않음)', en: 'Removed from EndpointSlices so traffic stops, but the Pods themselves are not terminated (not evicted)' }, auto: true, manual: { ko: 'drain 시 자동 재배치', en: 'Rescheduled automatically on drain' }, icon: '📦' },
  { layer: { ko: 'Karpenter NodePool', en: 'Karpenter NodePool' }, impact: { ko: 'AZ 설정 변경 없음, 해당 AZ에 새 노드 생성 가능', en: 'AZ settings unchanged; new nodes can still be created in that AZ' }, auto: false, manual: { ko: 'NodePool requirements 수정', en: 'Edit NodePool requirements' }, icon: '⚙️' },
  { layer: { ko: 'ASG (Managed Node Group)', en: 'ASG (Managed Node Group)' }, impact: { ko: 'AZ 리밸런싱이 일시 중단되고, 새 노드가 정상 AZ에서만 기동되도록 ASG가 갱신됨(EKS가 해당 ASG에서 장애 AZ를 제거)', en: 'AZ rebalancing is suspended and the ASG is updated so that new nodes launch only in healthy AZs (EKS removes the impaired AZ from the ASG)' }, auto: true, manual: { ko: '-', en: '-' }, icon: '📊' },
  { layer: { ko: 'EBS 볼륨', en: 'EBS volumes' }, impact: { ko: 'AZ에 고정, 이동 불가', en: 'Pinned to the AZ, cannot move' }, auto: false, manual: { ko: '스냅샷 → 다른 AZ에 복원', en: 'Snapshot → restore in another AZ' }, icon: '💾' },
  { layer: { ko: 'EFS Mount Target', en: 'EFS Mount Target' }, impact: { ko: '신규 마운트는 리전 DNS로 다른 AZ Mount Target 사용 가능, 기존 마운트는 자동 전환 안 됨', en: 'New mounts can use another AZ mount target via the Regional DNS name; existing mounts do not switch automatically' }, auto: false, manual: { ko: '해당 AZ 마운트 Pod 재마운트', en: 'Remount Pods mounted in that AZ' }, icon: '📁' },
];

const title = { ko: '⚡ ARC Zonal Shift 영향 범위', en: '⚡ ARC Zonal Shift impact scope' };
const subtitle = { ko: 'Zonal Shift는 트래픽 차단과 함께 해당 AZ 노드 cordon으로 신규 스케줄링도 차단합니다 — 각 계층별 영향 확인', en: 'Zonal Shift blocks traffic and also cordons the nodes in that AZ, blocking new scheduling — check the impact per layer' };
const headers = {
  ko: { layer: '계층', impact: 'Zonal Shift 영향', auto: '자동 조정', manual: '수동 작업' },
  en: { layer: 'Layer', impact: 'Zonal Shift impact', auto: 'Automatic', manual: 'Manual action' },
};

export default function ZonalShiftImpactTable() {
  const { i18n } = useDocusaurusContext();
  const lang = i18n.currentLocale === 'ko' ? 'ko' : 'en';
  const h = headers[lang];
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title[lang]}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle[lang]}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto auto', gap: 0, fontSize: '0.72rem', fontWeight: 700, color: 'var(--ifm-color-emphasis-600)', background: 'var(--ifm-background-surface-color)', padding: '0.6rem 1rem', borderBottom: '1px solid var(--ifm-color-emphasis-200)' }}>
          <span>{h.layer}</span><span>{h.impact}</span><span style={{ textAlign: 'center' }}>{h.auto}</span><span>{h.manual}</span>
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr auto auto', gap: 0, padding: '0.6rem 1rem', borderBottom: i < rows.length - 1 ? '1px solid #f1f5f9' : 'none', alignItems: 'center', fontSize: '0.78rem', background: i % 2 === 0 ? '#fff' : '#fafbfc' }}>
            <span style={{ fontWeight: 600, color: 'var(--ifm-font-color-base)' }}>{r.icon} {r.layer[lang]}</span>
            <span style={{ color: 'var(--ifm-color-emphasis-600)' }}>{r.impact[lang]}</span>
            <span style={{ textAlign: 'center', fontSize: '0.85rem' }}>{r.auto ? '✅' : '❌'}</span>
            <span style={{ color: r.manual[lang] === '-' ? '#94a3b8' : '#b45309', fontSize: '0.72rem', fontWeight: r.manual[lang] !== '-' ? 600 : 400 }}>{r.manual[lang]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
