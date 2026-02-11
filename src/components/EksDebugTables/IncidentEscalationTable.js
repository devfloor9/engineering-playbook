import React from 'react';

const severities = [
  { level: 'P1', label: 'Critical', color: '#dc2626', bg: '#fef2f2', response: '5분 이내', escalation: '즉시 온콜 + 관리자', example: '컨트롤 플레인 장애, 전체 노드 NotReady', icon: '🔴' },
  { level: 'P2', label: 'High', color: '#ea580c', bg: '#fff7ed', response: '15분 이내', escalation: '온콜 팀', example: '특정 AZ 장애, 다수 Pod CrashLoopBackOff', icon: '🟠' },
  { level: 'P3', label: 'Medium', color: '#ca8a04', bg: '#fefce8', response: '1시간 이내', escalation: '담당 팀', example: 'HPA 스케일링 실패, 간헐적 타임아웃', icon: '🟡' },
  { level: 'P4', label: 'Low', color: '#2563eb', bg: '#eff6ff', response: '4시간 이내', escalation: '백로그', example: '단일 Pod 재시작, 비프로덕션 환경 이슈', icon: '🔵' },
];

export default function IncidentEscalationTable() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🚨 인시던트 대응 에스컬레이션 매트릭스</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>심각도별 초동 대응 시간 및 에스컬레이션 경로</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {severities.map((s) => (
          <div key={s.level} style={{ border: `1.5px solid ${s.color}30`, borderLeft: `4px solid ${s.color}`, borderRadius: 8, padding: '0.7rem 1rem', background: s.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1rem' }}>{s.icon}</span>
              <span style={{ background: s.color, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{s.level} - {s.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 600, color: s.color }}>⏱ {s.response}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.76rem', color: '#374151' }}>
              <span style={{ background: `${s.color}15`, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>에스컬레이션: {s.escalation}</span>
              <span style={{ color: '#6b7280', fontStyle: 'italic' }}>{s.example}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
