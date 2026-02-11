import React from 'react';

const errors = [
  { code: 'AccessDenied', cause: '노드 IAM Role에 필요한 권한 부족', fix: 'eks:node-manager ClusterRole/ClusterRoleBinding 확인 및 복구', severity: 'high' },
  { code: 'AmiIdNotFound', cause: 'Launch Template의 AMI ID가 존재하지 않음', fix: '유효한 EKS optimized AMI ID로 업데이트', severity: 'med' },
  { code: 'AutoScalingGroupNotFound', cause: 'ASG가 삭제되었거나 존재하지 않음', fix: '노드 그룹 삭제 후 재생성', severity: 'high' },
  { code: 'ClusterUnreachable', cause: '노드가 EKS API 서버에 연결 불가', fix: 'VPC 설정, 보안그룹, 엔드포인트 접근성 확인', severity: 'high' },
  { code: 'Ec2SecurityGroupNotFound', cause: '지정된 보안그룹이 삭제됨', fix: '올바른 보안그룹 생성 후 노드그룹 재구성', severity: 'med' },
  { code: 'Ec2LaunchTemplateNotFound', cause: 'Launch Template이 삭제됨', fix: '새 Launch Template 생성 후 노드그룹 업데이트', severity: 'med' },
  { code: 'Ec2LaunchTemplateVersionMismatch', cause: 'Launch Template 버전 불일치', fix: '노드그룹이 참조하는 버전 확인 및 수정', severity: 'low' },
  { code: 'IamInstanceProfileNotFound', cause: '인스턴스 프로파일이 존재하지 않음', fix: 'IAM 인스턴스 프로파일 재생성', severity: 'med' },
  { code: 'IamNodeRoleNotFound', cause: '노드 IAM Role이 삭제됨', fix: 'IAM Role 재생성 후 필요 정책 연결', severity: 'high' },
  { code: 'AsgInstanceLaunchFailures', cause: 'EC2 인스턴스 시작 실패 (용량 부족 등)', fix: '다른 인스턴스 타입/AZ 추가, Service Quotas 확인', severity: 'med' },
  { code: 'NodeCreationFailure', cause: '노드 생성 일반 실패', fix: 'CloudTrail에서 상세 에러 확인', severity: 'med' },
  { code: 'InstanceLimitExceeded', cause: 'EC2 인스턴스 한도 초과', fix: 'Service Quotas에서 한도 증가 요청', severity: 'med' },
  { code: 'InsufficientFreeAddresses', cause: '서브넷의 가용 IP 주소 부족', fix: '서브넷 CIDR 확장 또는 새 서브넷 추가', severity: 'med' },
  { code: 'InternalFailure', cause: 'AWS 내부 오류', fix: '재시도, 지속시 AWS Support 문의', severity: 'low' },
];

const sevColors = {
  high: { color: '#dc2626', bg: '#fef2f2', dot: '🔴' },
  med: { color: '#d97706', bg: '#fffbeb', dot: '🟡' },
  low: { color: '#6b7280', bg: '#f9fafb', dot: '⚪' },
};

export default function NodeGroupErrorTable() {
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🖥️ Managed Node Group 에러 코드</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>aws eks describe-nodegroup --query 'nodegroup.health'</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {errors.map((e) => {
          const s = sevColors[e.severity];
          return (
            <div key={e.code} style={{ display: 'grid', gridTemplateColumns: '1fr', padding: '0.5rem 0.8rem', borderRadius: 8, background: s.bg, border: `1px solid ${s.color}15` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 3 }}>
                <span style={{ fontSize: '0.65rem' }}>{s.dot}</span>
                <code style={{ fontSize: '0.74rem', fontWeight: 700, color: '#1e293b' }}>{e.code}</code>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#6b7280' }}>{e.cause}</div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 500, marginTop: 2 }}>→ {e.fix}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
