import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const issues = [
  { code: 'SUBNET_NOT_FOUND', msg: { ko: '클러스터 서브넷이 삭제됨', en: 'A cluster subnet was deleted' }, recoverable: 'warn', fix: { ko: 'update-cluster-config --resources-vpc-config로 서브넷 재지정', en: 'Re-specify subnets with update-cluster-config --resources-vpc-config' } },
  { code: 'SECURITY_GROUP_NOT_FOUND', msg: { ko: '클러스터 보안그룹이 삭제됨', en: 'The cluster security group was deleted' }, recoverable: 'warn', fix: { ko: 'update-cluster-config --resources-vpc-config로 보안그룹 재지정', en: 'Re-specify security groups with update-cluster-config --resources-vpc-config' } },
  { code: 'IP_NOT_AVAILABLE', msg: { ko: '서브넷에 IP 부족', en: 'Not enough IP addresses in the subnet' }, recoverable: 'ok', fix: { ko: '서브넷 추가/확장', en: 'Add or expand subnets' } },
  { code: 'VPC_NOT_FOUND', msg: { ko: 'VPC가 삭제됨', en: 'The VPC was deleted' }, recoverable: 'no', fix: { ko: '클러스터 재생성 필요', en: 'Cluster must be re-created' } },
  { code: 'ASSUME_ROLE_ACCESS_DENIED', msg: { ko: '클러스터 IAM Role assume 실패', en: 'Failed to assume the cluster IAM Role' }, recoverable: 'ok', fix: { ko: 'Role trust policy(eks.amazonaws.com)와 연결된 권한 정책을 각각 점검', en: 'Check the Role trust policy (eks.amazonaws.com) and the attached permission policies separately' } },
  { code: 'KMS_KEY_DISABLED', msg: { ko: 'Secrets 암호화 KMS 키 비활성화', en: 'The KMS key for Secrets encryption is disabled' }, recoverable: 'ok', fix: { ko: 'KMS 키 재활성화', en: 'Re-enable the KMS key' } },
  { code: 'KMS_KEY_NOT_FOUND', msg: { ko: 'KMS 키 삭제됨', en: 'The KMS key was deleted' }, recoverable: 'no', fix: { ko: '복구 불가', en: 'Not recoverable' } },
];

const statusMap = {
  ok: { icon: '✅', label: { ko: '복구 가능', en: 'Recoverable' }, color: '#059669', bg: 'var(--ifm-color-emphasis-100)' },
  warn: { icon: '⚠️', label: { ko: '조건부 복구', en: 'Conditionally recoverable' }, color: '#d97706', bg: 'var(--ifm-color-emphasis-100)' },
  no: { icon: '❌', label: { ko: '복구 불가', en: 'Not recoverable' }, color: '#dc2626', bg: 'var(--ifm-color-emphasis-100)' },
};

const title = { ko: '🏥 클러스터 헬스 이슈 코드', en: '🏥 Cluster health issue codes' };

export default function ClusterHealthTable() {
  const { i18n } = useDocusaurusContext();
  const lang = i18n.currentLocale === 'ko' ? 'ko' : 'en';
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #064e3b 0%, #065f46 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title[lang]}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>aws eks describe-cluster --query 'cluster.health'</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {issues.map((item) => {
          const st = statusMap[item.recoverable];
          return (
            <div key={item.code} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '0.5rem', padding: '0.55rem 0.8rem', borderRadius: 8, background: st.bg, border: `1px solid ${st.color}20`, alignItems: 'center' }}>
              <div>
                <code style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--ifm-font-color-base)' }}>{item.code}</code>
                <div style={{ fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-600)', marginTop: 2 }}>{item.msg[lang]}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-600)', marginTop: 2 }}>→ {item.fix[lang]}</div>
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${st.color}15`, color: st.color, padding: '3px 10px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 600, whiteSpace: 'nowrap' }}>
                {st.icon} {st.label[lang]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
