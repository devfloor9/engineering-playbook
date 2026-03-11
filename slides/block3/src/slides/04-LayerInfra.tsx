import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { Server, Shield, Clock } from 'lucide-react';

const code = `# 클러스터 상태 확인
aws eks describe-cluster --name my-cluster \\
  --query 'cluster.status' --output text

# 노드 상태 확인
kubectl get nodes -o wide

# 비정상 Pod 확인
kubectl get pods -A | grep -v Running | grep -v Completed`;

export function LayerInfraSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-6 text-blue-400">Layer 1: 클러스터 인프라</h2>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="space-y-4">
          <Card title="First 30초 체크" icon={<Clock size={20} />} color="rose">
            <ul className="space-y-1">
              <li>클러스터 상태: ACTIVE / UPDATING / FAILED</li>
              <li>노드 Ready/NotReady 확인</li>
              <li>비정상 Pod 즉시 파악</li>
            </ul>
          </Card>
          <Card title="스코프 판별 (2분)" icon={<Shield size={20} />} color="amber">
            <ul className="space-y-1">
              <li>전체 클러스터 vs 특정 AZ</li>
              <li>특정 노드 그룹 vs 전체 노드</li>
              <li>특정 네임스페이스 vs 전체</li>
            </ul>
          </Card>
          <Card title="인프라 점검" icon={<Server size={20} />} color="blue">
            <ul className="space-y-1">
              <li>AWS Health Dashboard 확인</li>
              <li>EC2 인스턴스 상태 이벤트</li>
              <li>EBS 볼륨 상태</li>
            </ul>
          </Card>
        </div>
        <CodeBlock code={code} title="초기 진단 명령어" language="bash" />
      </div>
    </SlideWrapper>
  );
}
