import React from 'react';

const issues = [
  { code: 'SUBNET_NOT_FOUND', msg: '클러스터 서브넷이 삭제됨', recoverable: 'warn', fix: '새 서브넷 연결 필요' },
  { code: 'SECURITY_GROUP_NOT_FOUND', msg: '클러스터 보안그룹이 삭제됨', recoverable: 'warn', fix: '보안그룹 재생성' },
  { code: 'IP_NOT_AVAILABLE', msg: '서브넷에 IP 부족', recoverable: 'ok', fix: '서브넷 추가/확장' },
  { code: 'VPC_NOT_FOUND', msg: 'VPC가 삭제됨', recoverable: 'no', fix: '클러스터 재생성 필요' },
  { code: 'ASSUME_ROLE_ACCESS_DENIED', msg: '클러스터 IAM Role 권한 문제', recoverable: 'ok', fix: 'IAM 정책 수정' },
  { code: 'KMS_KEY_DISABLED', msg: 'Secrets 암호화 KMS 키 비활성화', recoverable: 'ok', fix: 'KMS 키 재활성화' },
  { code: 'KMS_KEY_NOT_FOUND', msg: 'KMS 키 삭제됨', recoverable: 'no', fix: '복구 불가' },
];

const statusMap = {
  ok: { icon: '✅', label: '복구 가능', color: '#059669', bg: 'var(--ifm-color-emphasis-100)' },
  warn: { icon: '⚠️', label: '조건부 복구', color: '#d97706', bg: 'var(--ifm-color-emphasis-100)' },
  no: { icon: '❌', label: '복구 불가', color: '#dc2626', bg: 'var(--ifm-color-emphasis-100)' },
};

export default function ClusterHealthTable() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🏥 클러스터 헬스 이슈 코드</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>aws eks describe-cluster --query 'cluster.health'</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {issues.map((item) => {
          const st = statusMap[item.recoverable];
          return (
            <div key={item.code} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', padding: '0.55rem 0.8rem', borderRadius: 8, background: st.bg, border: `1px solid ${st.color}20`, alignItems: 'center' }}>
              <div>
                <code style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--ifm-font-color-base)' }}>{item.code}</code>
                <div style={{ fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-600)', marginTop: 2 }}>{item.msg}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-600)', marginTop: 2 }}>→ {item.fix}</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${st.color}15`, color: st.color, padding: '3px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {st.icon} {st.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
