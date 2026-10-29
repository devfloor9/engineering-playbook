import React, { useState } from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const errors = [
  { id: 1, pattern: { ko: 'CrashLoopBackOff', en: 'CrashLoopBackOff' }, cause: { ko: '앱 크래시, 잘못된 설정, 의존성 미충족', en: 'App crash, misconfiguration, unmet dependency' }, fix: { ko: 'kubectl logs --previous, 앱 설정/환경변수 점검', en: 'kubectl logs --previous, check app configuration/environment variables' }, cat: 'workload' },
  { id: 2, pattern: { ko: 'ImagePullBackOff', en: 'ImagePullBackOff' }, cause: { ko: '이미지 미존재, 레지스트리 인증 실패', en: 'Image does not exist, registry authentication failure' }, fix: { ko: '이미지 이름/태그 확인, imagePullSecrets 설정', en: 'Check image name/tag, configure imagePullSecrets' }, cat: 'workload' },
  { id: 3, pattern: { ko: 'OOMKilled', en: 'OOMKilled' }, cause: { ko: '컨테이너 limit 초과 OOM 또는 노드 메모리 압박(MemoryPressure) 축출', en: 'OOM from exceeding the container limit, or eviction under node memory pressure (MemoryPressure)' }, fix: { ko: 'limit 초과면 메모리 limit 증가/누수 점검, 노드 압박이면 node 조건과 requests 대비 노드 용량 점검', en: 'If the limit was exceeded, raise the memory limit/check for leaks; if the node was under pressure, check node conditions and node capacity against requests' }, cat: 'workload' },
  { id: 4, pattern: { ko: 'Pending (스케줄링 불가)', en: 'Pending (unschedulable)' }, cause: { ko: '리소스 부족, nodeSelector 불일치', en: 'Insufficient resources, nodeSelector mismatch' }, fix: { ko: 'kubectl describe pod 이벤트 확인, 노드 용량/라벨 점검', en: 'Check kubectl describe pod events, check node capacity/labels' }, cat: 'workload' },
  { id: 5, pattern: { ko: 'CreateContainerConfigError', en: 'CreateContainerConfigError' }, cause: { ko: 'ConfigMap/Secret 미존재', en: 'ConfigMap/Secret does not exist' }, fix: { ko: '참조되는 ConfigMap/Secret 존재 여부 확인', en: 'Confirm the referenced ConfigMap/Secret exists' }, cat: 'workload' },
  { id: 6, pattern: { ko: 'Node NotReady', en: 'Node NotReady' }, cause: { ko: 'kubelet 장애, 리소스 압박', en: 'kubelet failure, resource pressure' }, fix: { ko: 'SSM으로 노드 접속, systemctl status kubelet', en: 'Connect to the node with SSM, systemctl status kubelet' }, cat: 'node' },
  { id: 7, pattern: { ko: 'FailedAttachVolume', en: 'FailedAttachVolume' }, cause: { ko: 'EBS 볼륨이 다른 노드에 attach된 상태(노드 장애·multi-attach·VolumeAttachment 미해제 등)', en: 'The EBS volume is attached to another node (node failure, multi-attach, VolumeAttachment not released, etc.)' }, fix: { ko: '볼륨을 점유한 노드 확인 후 이전 Pod/VolumeAttachment 정리, detach 완료 대기(미해제 시 약 6분 후 force-detach)', en: 'Identify the node holding the volume, clean up the previous Pod/VolumeAttachment, wait for detach to complete (if not released, force-detach after about 6 minutes)' }, cat: 'storage' },
  { id: 8, pattern: { ko: 'FailedMount', en: 'FailedMount' }, cause: { ko: 'EFS mount target/SG 설정 오류', en: 'EFS mount target/SG misconfiguration' }, fix: { ko: 'mount target 존재 및 TCP 2049 허용 확인', en: 'Confirm the mount target exists and TCP 2049 is allowed' }, cat: 'storage' },
  { id: 9, pattern: { ko: 'NetworkNotReady', en: 'NetworkNotReady' }, cause: { ko: 'VPC CNI 미시작', en: 'VPC CNI not started' }, fix: { ko: 'kubectl logs -n kube-system -l k8s-app=aws-node', en: 'kubectl logs -n kube-system -l k8s-app=aws-node' }, cat: 'network' },
  { id: 10, pattern: { ko: 'DNS resolution failed', en: 'DNS resolution failed' }, cause: { ko: 'CoreDNS 장애', en: 'CoreDNS failure' }, fix: { ko: 'CoreDNS Pod 상태/로그 확인, kubectl rollout restart', en: 'Check CoreDNS Pod status/logs, kubectl rollout restart' }, cat: 'network' },
  { id: 11, pattern: { ko: '401 Unauthorized / 403 Forbidden', en: '401 Unauthorized / 403 Forbidden' }, cause: { ko: '401=인증 실패(토큰·identity 매핑), 403=인가 실패(RBAC 권한 부족). aws-auth/Access Entry는 identity 매핑에 영향', en: '401 = authentication failure (token/identity mapping), 403 = authorization failure (insufficient RBAC permissions). aws-auth/Access Entry affects identity mapping' }, fix: { ko: '401이면 aws sts get-caller-identity와 aws-auth/Access Entry 매핑, 403이면 RBAC Role/Binding 확인', en: 'For 401, check aws sts get-caller-identity and the aws-auth/Access Entry mapping; for 403, check RBAC Role/Binding' }, cat: 'auth' },
  { id: 12, pattern: { ko: 'connection refused', en: 'connection refused' }, cause: { ko: 'Service Endpoint 없음, 포트 불일치', en: 'No Service Endpoint, port mismatch' }, fix: { ko: 'kubectl get endpoints, selector 및 포트 확인', en: 'kubectl get endpoints, check selector and ports' }, cat: 'network' },
  { id: 13, pattern: { ko: 'Evicted', en: 'Evicted' }, cause: { ko: '노드 리소스 압박 (DiskPressure 등)', en: 'Node resource pressure (DiskPressure, etc.)' }, fix: { ko: '노드 디스크 정리, Pod resource requests 조정', en: 'Clean up node disk, adjust Pod resource requests' }, cat: 'node' },
  { id: 14, pattern: { ko: 'FailedScheduling: Insufficient cpu/memory', en: 'FailedScheduling: Insufficient cpu/memory' }, cause: { ko: '클러스터 용량 부족', en: 'Insufficient cluster capacity' }, fix: { ko: 'Karpenter NodePool limits 증가, 노드 추가', en: 'Raise Karpenter NodePool limits, add nodes' }, cat: 'node' },
  { id: 15, pattern: { ko: 'Terminating (stuck)', en: 'Terminating (stuck)' }, cause: { ko: 'Finalizer 미완료, preStop hook 지연', en: 'Finalizer not completed, preStop hook delay' }, fix: { ko: 'Finalizer/프로세스 먼저 조사. --force --grace-period=0은 API 객체만 제거하며 프로세스 종료·finalizer 정리를 보장하지 않음(최후 수단)', en: 'Investigate the finalizer/process first. --force --grace-period=0 only removes the API object and does not guarantee process termination or finalizer cleanup (last resort)' }, cat: 'workload' },
  { id: 16, pattern: { ko: 'Back-off pulling image', en: 'Back-off pulling image' }, cause: { ko: '잘못된 이미지 이름/태그, 레지스트리 인증 실패(imagePullSecrets/ECR 권한), 큰 이미지 pull 타임아웃', en: 'Wrong image name/tag, registry authentication failure (imagePullSecrets/ECR permissions), pull timeout for a large image' }, fix: { ko: '이미지 이름/태그와 레지스트리 인증 확인, 이미지 최적화, ECR 같은 리전 레지스트리 사용', en: 'Check image name/tag and registry authentication, optimize the image, use a same-Region registry such as ECR' }, cat: 'workload' },
  { id: 17, pattern: { ko: 'readiness probe failed', en: 'readiness probe failed' }, cause: { ko: '앱 시작 지연, 헬스체크 엔드포인트 오류', en: 'Slow app startup, health check endpoint error' }, fix: { ko: 'startupProbe 추가, probe 타임아웃 조정', en: 'Add a startupProbe, adjust the probe timeout' }, cat: 'workload' },
  { id: 18, pattern: { ko: 'Too many pods', en: 'Too many pods' }, cause: { ko: '노드당 최대 Pod 수 초과', en: 'Maximum Pods per node exceeded' }, fix: { ko: 'max-pods 설정 확인, Prefix Delegation 활성화', en: 'Check the max-pods setting, enable Prefix Delegation' }, cat: 'node' },
];

const categories = [
  { key: 'all', label: { ko: '전체', en: 'All' }, icon: '📋' },
  { key: 'workload', label: { ko: '워크로드', en: 'Workload' }, icon: '📦' },
  { key: 'node', label: { ko: '노드', en: 'Node' }, icon: '💻' },
  { key: 'network', label: { ko: '네트워크', en: 'Network' }, icon: '🌐' },
  { key: 'storage', label: { ko: '스토리지', en: 'Storage' }, icon: '💾' },
  { key: 'auth', label: { ko: '인증/인가', en: 'AuthN/AuthZ' }, icon: '🔐' },
];

const catColors = {
  workload: '#3b82f6',
  node: '#ea580c',
  network: '#8b5cf6',
  storage: '#0891b2',
  auth: '#dc2626',
};

const title = { ko: '🔍 에러 패턴 Quick Reference', en: '🔍 Error pattern quick reference' };
const subtitle = {
  ko: (n) => `에러 패턴 → 원인 → 해결 빠른 참조 (${n}건)`,
  en: (n) => `Error pattern → cause → resolution quick reference (${n} entries)`,
};

export default function ErrorQuickRefTable() {
  const { i18n } = useDocusaurusContext();
  const lang = i18n.currentLocale === 'ko' ? 'ko' : 'en';
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? errors : errors.filter((e) => e.cat === filter);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title[lang]}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle[lang](filtered.length)}</div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', borderLeft: '1px solid var(--ifm-color-emphasis-200)', borderRight: '1px solid var(--ifm-color-emphasis-200)', padding: '0.6rem 1rem', display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setFilter(c.key)}
            style={{
              border: filter === c.key ? '2px solid #3b82f6' : '1px solid var(--ifm-color-emphasis-300)',
              borderRadius: 20, padding: '3px 12px', fontSize: '0.72rem', fontWeight: 600,
              background: filter === c.key ? '#eff6ff' : '#fff', color: filter === c.key ? '#2563eb' : '#6b7280',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {c.icon} {c.label[lang]}
          </button>
        ))}
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.3rem', maxHeight: 600, overflowY: 'auto' }}>
        {filtered.map((e) => {
          const c = catColors[e.cat] || '#6b7280';
          return (
            <div key={e.id} style={{ borderLeft: `4px solid ${c}`, borderRadius: 8, padding: '0.5rem 0.8rem', background: `${c}05`, border: `1px solid ${c}15` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: 3 }}>
                <span style={{ background: 'var(--ifm-color-emphasis-800)', color: '#fff', borderRadius: '50%', width: 20, height: 20, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 700, flexShrink: 0 }}>{e.id}</span>
                <code style={{ fontSize: '0.76rem', fontWeight: 700, color: c }}>{e.pattern[lang]}</code>
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
