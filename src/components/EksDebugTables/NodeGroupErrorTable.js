import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const errors = [
  { code: 'AccessDenied', cause: { ko: 'eks:node-manager ClusterRole/ClusterRoleBinding 등 노드 관리용 Kubernetes RBAC 객체가 삭제/변경됨', en: 'Kubernetes RBAC objects for node management, such as the eks:node-manager ClusterRole/ClusterRoleBinding, were deleted or changed' }, fix: { ko: '삭제된 eks:node-manager ClusterRole/ClusterRoleBinding 등 RBAC 리소스 복구(노드 IAM 권한이 아니라 K8s RBAC 문제)', en: 'Restore the deleted RBAC resources such as the eks:node-manager ClusterRole/ClusterRoleBinding (a K8s RBAC problem, not a node IAM permission problem)' }, severity: 'high' },
  { code: 'AmiIdNotFound', cause: { ko: 'Launch Template의 AMI ID가 존재하지 않음', en: 'The AMI ID in the Launch Template does not exist' }, fix: { ko: '유효한 EKS optimized AMI ID로 업데이트', en: 'Update to a valid EKS optimized AMI ID' }, severity: 'med' },
  { code: 'AutoScalingGroupNotFound', cause: { ko: 'ASG가 삭제되었거나 존재하지 않음', en: 'The ASG was deleted or does not exist' }, fix: { ko: '동일한 이름/설정으로 ASG 재생성 시 복구될 수 있음(먼저 시도). 안 되면 노드 그룹 삭제 후 재생성', en: 'Re-creating the ASG with the same name/settings may recover it (try this first). If not, delete and re-create the node group' }, severity: 'high' },
  { code: 'ClusterUnreachable', cause: { ko: '노드가 EKS API 서버에 연결 불가', en: 'Nodes cannot connect to the EKS API server' }, fix: { ko: 'VPC 설정, 보안그룹, 엔드포인트 접근성 확인', en: 'Check VPC settings, security groups, and endpoint reachability' }, severity: 'high' },
  { code: 'Ec2SecurityGroupNotFound', cause: { ko: '지정된 보안그룹이 삭제됨', en: 'The specified security group was deleted' }, fix: { ko: '노드 그룹의 보안그룹 참조는 변경 불가(불변). 삭제된 리소스는 다른 SG로 대체되지 않으므로 보통 노드 그룹 재생성 필요', en: 'The node group\'s security group reference cannot be changed (immutable). A deleted resource is not replaced by another SG, so the node group usually has to be re-created' }, severity: 'med' },
  { code: 'Ec2LaunchTemplateNotFound', cause: { ko: 'Launch Template이 삭제됨', en: 'The Launch Template was deleted' }, fix: { ko: '삭제된 Launch Template ID는 복원되지 않음. 버전 업데이트는 동일 템플릿 계보에만 적용되므로 보통 노드 그룹 재생성 필요', en: 'A deleted Launch Template ID is not restored. Version updates apply only within the same template lineage, so the node group usually has to be re-created' }, severity: 'med' },
  { code: 'Ec2LaunchTemplateVersionMismatch', cause: { ko: 'Launch Template 버전 불일치', en: 'Launch Template version mismatch' }, fix: { ko: '노드그룹이 참조하는 버전 확인 및 수정', en: 'Check and correct the version the node group references' }, severity: 'low' },
  { code: 'IamInstanceProfileNotFound', cause: { ko: '인스턴스 프로파일이 존재하지 않음', en: 'The instance profile does not exist' }, fix: { ko: 'IAM 인스턴스 프로파일 재생성', en: 'Re-create the IAM instance profile' }, severity: 'med' },
  { code: 'IamNodeRoleNotFound', cause: { ko: '노드 IAM Role이 삭제됨', en: 'The node IAM Role was deleted' }, fix: { ko: 'IAM Role 재생성 후 필요 정책 연결', en: 'Re-create the IAM Role and attach the required policies' }, severity: 'high' },
  { code: 'AsgInstanceLaunchFailures', cause: { ko: 'EC2 인스턴스 시작 실패 (용량 부족 등)', en: 'EC2 instance launch failure (insufficient capacity, etc.)' }, fix: { ko: '다른 인스턴스 타입/AZ 추가, Service Quotas 확인', en: 'Add other instance types/AZs, check Service Quotas' }, severity: 'med' },
  { code: 'NodeCreationFailure', cause: { ko: '노드 생성 일반 실패', en: 'General node creation failure' }, fix: { ko: 'CloudTrail에서 상세 에러 확인', en: 'Check the detailed error in CloudTrail' }, severity: 'med' },
  { code: 'InstanceLimitExceeded', cause: { ko: 'EC2 인스턴스 한도 초과', en: 'EC2 instance limit exceeded' }, fix: { ko: 'Service Quotas에서 한도 증가 요청', en: 'Request a limit increase in Service Quotas' }, severity: 'med' },
  { code: 'InsufficientFreeAddresses', cause: { ko: '노드 그룹에 연결된 서브넷의 가용 IP 주소 부족', en: 'The subnets associated with the node group lack available IP addresses' }, fix: { ko: '기존 관리형 노드 그룹의 서브넷 목록은 UpdateNodegroupConfig로 바꿀 수 없음. IP가 충분한 서브넷(필요하면 VPC에 보조 CIDR을 연결해 만든 서브넷)을 지정해 새 노드 그룹을 만들고 워크로드를 옮김', en: 'The subnet list of an existing managed node group cannot be changed with UpdateNodegroupConfig. Create a new node group in subnets with enough free IPs (if needed, subnets created from a secondary CIDR associated with the VPC) and move the workloads' }, severity: 'med' },
  { code: 'InternalFailure', cause: { ko: 'AWS 내부 오류', en: 'AWS internal error' }, fix: { ko: '재시도, 지속시 AWS Support 문의', en: 'Retry; if it persists, contact AWS Support' }, severity: 'low' },
];

const sevColors = {
  high: { color: '#dc2626', bg: 'var(--ifm-color-emphasis-100)', dot: '🔴' },
  med: { color: '#d97706', bg: 'var(--ifm-color-emphasis-100)', dot: '🟡' },
  low: { color: 'var(--ifm-color-emphasis-600)', bg: 'var(--ifm-color-emphasis-100)', dot: '⚪' },
};

const title = { ko: '🖥️ Managed Node Group 에러 코드', en: '🖥️ Managed Node Group error codes' };

export default function NodeGroupErrorTable() {
  const { i18n } = useDocusaurusContext();
  const lang = i18n.currentLocale === 'ko' ? 'ko' : 'en';
  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #78350f 0%, #92400e 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title[lang]}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>aws eks describe-nodegroup --query 'nodegroup.health'</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
        {errors.map((e) => {
          const s = sevColors[e.severity];
          return (
            <div key={e.code} style={{ display: 'grid', gridTemplateColumns: '1fr', padding: '0.5rem 0.8rem', borderRadius: 8, background: s.bg, border: `1px solid ${s.color}15` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 3 }}>
                <span style={{ fontSize: '0.65rem' }}>{s.dot}</span>
                <code style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--ifm-font-color-base)' }}>{e.code}</code>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--ifm-color-emphasis-600)' }}>{e.cause[lang]}</div>
              <div style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 500, marginTop: 2 }}>→ {e.fix[lang]}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
