import React, { useState } from 'react';

const errors = [
  { id: 1, pattern: 'CrashLoopBackOff', cause: '앱 크래시, 잘못된 설정, 의존성 미충족', fix: 'kubectl logs --previous, 앱 설정/환경변수 점검', cat: 'workload' },
  { id: 2, pattern: 'ImagePullBackOff', cause: '이미지 미존재, 레지스트리 인증 실패', fix: '이미지 이름/태그 확인, imagePullSecrets 설정', cat: 'workload' },
  { id: 3, pattern: 'OOMKilled', cause: '메모리 limits 초과', fix: '메모리 limits 증가, 앱 메모리 누수 점검', cat: 'workload' },
  { id: 4, pattern: 'Pending (스케줄링 불가)', cause: '리소스 부족, nodeSelector 불일치', fix: 'kubectl describe pod 이벤트 확인, 노드 용량/라벨 점검', cat: 'workload' },
  { id: 5, pattern: 'CreateContainerConfigError', cause: 'ConfigMap/Secret 미존재', fix: '참조되는 ConfigMap/Secret 존재 여부 확인', cat: 'workload' },
  { id: 6, pattern: 'Node NotReady', cause: 'kubelet 장애, 리소스 압박', fix: 'SSM으로 노드 접속, systemctl status kubelet', cat: 'node' },
  { id: 7, pattern: 'FailedAttachVolume', cause: 'EBS 볼륨 다른 노드에 연결됨', fix: '이전 Pod 삭제, 볼륨 detach 대기 (~6분)', cat: 'storage' },
  { id: 8, pattern: 'FailedMount', cause: 'EFS mount target/SG 설정 오류', fix: 'mount target 존재 및 TCP 2049 허용 확인', cat: 'storage' },
  { id: 9, pattern: 'NetworkNotReady', cause: 'VPC CNI 미시작', fix: 'kubectl logs -n kube-system -l k8s-app=aws-node', cat: 'network' },
  { id: 10, pattern: 'DNS resolution failed', cause: 'CoreDNS 장애', fix: 'CoreDNS Pod 상태/로그 확인, kubectl rollout restart', cat: 'network' },
  { id: 11, pattern: 'Unauthorized / 403', cause: 'RBAC 권한 부족, aws-auth 설정 오류', fix: 'aws sts get-caller-identity, aws-auth/Access Entry 확인', cat: 'auth' },
  { id: 12, pattern: 'connection refused', cause: 'Service Endpoint 없음, 포트 불일치', fix: 'kubectl get endpoints, selector 및 포트 확인', cat: 'network' },
  { id: 13, pattern: 'Evicted', cause: '노드 리소스 압박 (DiskPressure 등)', fix: '노드 디스크 정리, Pod resource requests 조정', cat: 'node' },
  { id: 14, pattern: 'FailedScheduling: Insufficient cpu/memory', cause: '클러스터 용량 부족', fix: 'Karpenter NodePool limits 증가, 노드 추가', cat: 'node' },
  { id: 15, pattern: 'Terminating (stuck)', cause: 'Finalizer 미완료, preStop hook 지연', fix: 'Finalizer 확인, 필요시 --force --grace-period=0', cat: 'workload' },
  { id: 16, pattern: 'Back-off pulling image', cause: '이미지 크기 큰 경우 pull 타임아웃', fix: '이미지 최적화, ECR 같은 리전 레지스트리 사용', cat: 'workload' },
  { id: 17, pattern: 'readiness probe failed', cause: '앱 시작 지연, 헬스체크 엔드포인트 오류', fix: 'startupProbe 추가, probe 타임아웃 조정', cat: 'workload' },
  { id: 18, pattern: 'Too many pods', cause: '노드당 최대 Pod 수 초과', fix: 'max-pods 설정 확인, Prefix Delegation 활성화', cat: 'node' },
];

const categories = [
  { key: 'all', label: '전체', icon: '📋' },
  { key: 'workload', label: '워크로드', icon: '📦' },
  { key: 'node', label: '노드', icon: '💻' },
  { key: 'network', label: '네트워크', icon: '🌐' },
  { key: 'storage', label: '스토리지', icon: '💾' },
  { key: 'auth', label: '인증/인가', icon: '🔐' },
];

const catColors = {
  workload: '#3b82f6',
  node: '#ea580c',
  network: '#8b5cf6',
  storage: '#0891b2',
  auth: '#dc2626',
};

export default function ErrorQuickRefTable() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? errors : errors.filter((e) => e.cat === filter);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>🔍 에러 패턴 Quick Reference</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>에러 패턴 → 원인 → 해결 빠른 참조 ({filtered.length}건)</div>
      </div>
      <div style={{ background: '#f8fafc', borderLeft: '1px solid #e2e8f0', borderRight: '1px solid #e2e8f0', padding: '0.6rem 1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            style={{
              border: filter === c.key ? '2px solid #3b82f6' : '1px solid #d1d5db',
              borderRadius: 20, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 600,
              background: filter === c.key ? '#eff6ff' : '#fff', color: filter === c.key ? '#2563eb' : '#6b7280',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {c.icon} {c.label}
          </button>
        ))}
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 600, overflowY: 'auto' }}>
        {filtered.map((e) => {
          const c = catColors[e.cat] || '#6b7280';
          return (
            <div key={e.id} style={{ borderLeft: `4px solid ${c}`, borderRadius: 8, padding: '0.5rem 0.8rem', background: `${c}05`, border: `1px solid ${c}15` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 3 }}>
                <span style={{ background: '#1e293b', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>{e.id}</span>
                <code style={{ fontSize: '0.76rem', fontWeight: 700, color: c }}>{e.pattern}</code>
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
