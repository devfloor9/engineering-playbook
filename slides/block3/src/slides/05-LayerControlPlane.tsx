import { SlideWrapper, Card, CompareTable } from '@shared/components';
import { Cpu, Key, FileText } from 'lucide-react';

const logTypes = [
  ['api', 'API Server 요청/응답 감사', 'API 호출 추적, 인증 문제'],
  ['audit', '감사 로그', '보안 이벤트, 리소스 변경 추적'],
  ['authenticator', '인증 로그', 'IAM-K8s 매핑 문제'],
  ['controllerManager', '컨트롤러 동작', 'ReplicaSet, Deployment 이슈'],
  ['scheduler', '스케줄링 결정', 'Pod 배치 실패 원인'],
];

export function LayerControlPlaneSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-6 text-blue-400">Layer 2: 컨트롤 플레인</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="API Server" icon={<Cpu size={20} />} color="blue">
          <p>API 응답 지연, 429 Throttling, 5xx 에러 진단</p>
        </Card>
        <Card title="인증/인가" icon={<Key size={20} />} color="amber">
          <p>IAM ↔ RBAC 매핑 오류, aws-auth ConfigMap 점검</p>
        </Card>
        <Card title="CloudWatch Logs" icon={<FileText size={20} />} color="emerald">
          <p>컨트롤 플레인 로그 5종 활성화 필수</p>
        </Card>
      </div>
      <CompareTable
        headers={['로그 타입', '내용', '진단 활용']}
        rows={logTypes}
        highlightCol={0}
      />
    </SlideWrapper>
  );
}
