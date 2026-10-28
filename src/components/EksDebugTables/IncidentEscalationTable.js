import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const severities = [
  { level: 'P1', label: 'Critical', color: '#dc2626', bg: 'var(--ifm-color-emphasis-100)', response: { ko: '5분 이내', en: 'within 5 minutes' }, escalation: { ko: '즉시 온콜 + 관리자', en: 'on-call immediately + manager' }, example: { ko: '컨트롤 플레인 장애, 전체 노드 NotReady', en: 'Control plane outage, all nodes NotReady' }, icon: '🔴' },
  { level: 'P2', label: 'High', color: '#ea580c', bg: 'var(--ifm-color-emphasis-100)', response: { ko: '15분 이내', en: 'within 15 minutes' }, escalation: { ko: '온콜 팀', en: 'on-call team' }, example: { ko: '특정 AZ 장애, 다수 Pod CrashLoopBackOff', en: 'Single-AZ failure, many Pods in CrashLoopBackOff' }, icon: '🟠' },
  { level: 'P3', label: 'Medium', color: '#ca8a04', bg: 'var(--ifm-color-emphasis-100)', response: { ko: '1시간 이내', en: 'within 1 hour' }, escalation: { ko: '담당 팀', en: 'owning team' }, example: { ko: 'HPA 스케일링 실패, 간헐적 타임아웃', en: 'HPA scaling failure, intermittent timeouts' }, icon: '🟡' },
  { level: 'P4', label: 'Low', color: '#2563eb', bg: 'var(--ifm-color-emphasis-100)', response: { ko: '4시간 이내', en: 'within 4 hours' }, escalation: { ko: '백로그', en: 'backlog' }, example: { ko: '단일 Pod 재시작, 비프로덕션 환경 이슈', en: 'Single Pod restart, non-production issue' }, icon: '🔵' },
];

const title = { ko: '🚨 인시던트 대응 에스컬레이션 매트릭스', en: '🚨 Incident response escalation matrix' };
const subtitle = { ko: '심각도별 초동 대응 시간 및 에스컬레이션 경로', en: 'Initial response time and escalation path by severity' };
const escalationLabel = { ko: '에스컬레이션', en: 'Escalation' };

export default function IncidentEscalationTable() {
  const { i18n } = useDocusaurusContext();
  const lang = i18n.currentLocale === 'ko' ? 'ko' : 'en';
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title[lang]}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle[lang]}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {severities.map((s) => (
          <div key={s.level} style={{ border: `1.5px solid ${s.color}30`, borderLeft: `4px solid ${s.color}`, borderRadius: 8, padding: '0.7rem 1rem', background: s.bg }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span style={{ fontSize: '1rem' }}>{s.icon}</span>
              <span style={{ background: s.color, color: '#fff', borderRadius: 6, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>{s.level} - {s.label}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.72rem', fontWeight: 600, color: s.color }}>⏱ {s.response[lang]}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', fontSize: '0.76rem', color: 'var(--ifm-font-color-base)' }}>
              <span style={{ background: `${s.color}15`, padding: '2px 8px', borderRadius: 10, fontWeight: 600 }}>{escalationLabel[lang]}: {s.escalation[lang]}</span>
              <span style={{ color: 'var(--ifm-color-emphasis-600)', fontStyle: 'italic' }}>{s.example[lang]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
