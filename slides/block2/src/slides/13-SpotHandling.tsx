import { SlideWrapper, Card, Badge, CodeBlock } from '@shared/components';
import { Zap, DollarSign, Shield } from 'lucide-react';

export function Slide13() {
  const deploymentCode = `apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: aws-node-termination-handler
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: aws-node-termination-handler
  template:
    spec:
      serviceAccountName: aws-node-termination-handler
      containers:
      - name: aws-node-termination-handler
        image: public.ecr.aws/aws-ec2/aws-node-termination-handler:v1.22.0
        env:
        - name: NODE_NAME
          valueFrom:
            fieldRef:
              fieldPath: spec.nodeName
        - name: ENABLE_SPOT_INTERRUPTION_DRAINING
          value: "true"
        - name: ENABLE_SCHEDULED_EVENT_DRAINING
          value: "true"`;

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-blue-400">Spot 인스턴스 처리</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Card title="Spot 중단 알림" icon={<Zap className="w-5 h-5" />} color="rose">
            <div className="space-y-2 text-sm">
              <Badge color="rose">2분 사전 알림</Badge>
              <p className="text-gray-400 mt-2">
                EC2가 Spot 인스턴스를 회수하기 2분 전에 메타데이터를 통해 알림을 제공합니다.
              </p>
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500">메타데이터 엔드포인트</p>
                <p className="text-xs font-mono text-rose-400 mt-1">
                  /latest/meta-data/spot/instance-action
                </p>
              </div>
            </div>
          </Card>

          <Card title="비용 절감" icon={<DollarSign className="w-5 h-5" />} color="emerald">
            <div className="space-y-2 text-sm">
              <Badge color="emerald">최대 90% 절감</Badge>
              <p className="text-gray-400 mt-2">
                NTH를 사용하면 Spot 인스턴스의 중단을 안전하게 처리하여 비용 절감 효과를 극대화할 수 있습니다.
              </p>
              <ul className="text-xs text-gray-500 space-y-1 mt-3">
                <li>• On-Demand 대비 저렴</li>
                <li>• 서비스 중단 최소화</li>
                <li>• 자동화된 복구</li>
              </ul>
            </div>
          </Card>

          <Card title="고가용성" icon={<Shield className="w-5 h-5" />} color="purple">
            <div className="space-y-2 text-sm">
              <Badge color="purple">무중단 전환</Badge>
              <p className="text-gray-400 mt-2">
                Spot + On-Demand 혼합 구성으로 안정성과 비용 효율성을 동시에 달성합니다.
              </p>
              <ul className="text-xs text-gray-500 space-y-1 mt-3">
                <li>• 다중 인스턴스 타입</li>
                <li>• 다중 가용 영역</li>
                <li>• 자동 Fallback</li>
              </ul>
            </div>
          </Card>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-700/50">
          <h4 className="text-blue-400 font-bold mb-3">NTH 배포 예시 (IMDS Mode)</h4>
          <CodeBlock code={deploymentCode} language="yaml" title="node-termination-handler.yaml" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-500/30">
            <h4 className="text-amber-400 font-bold mb-3 text-sm">권장 구성</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• Spot: 70-80% (워크로드 대부분)</li>
              <li>• On-Demand: 20-30% (중요 서비스)</li>
              <li>• 여러 인스턴스 타입 사용</li>
              <li>• 3개 이상 가용 영역 분산</li>
              <li>• PodDisruptionBudget 설정</li>
            </ul>
          </div>

          <div className="bg-cyan-900/20 rounded-xl p-4 border border-cyan-500/30">
            <h4 className="text-cyan-400 font-bold mb-3 text-sm">처리 단계</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>1. Spot 중단 알림 감지 (2분 전)</li>
              <li>2. Node Cordon (새 Pod 차단)</li>
              <li>3. Pod Drain (안전하게 이동)</li>
              <li>4. Kubernetes가 다른 노드에 재배치</li>
              <li>5. 인스턴스 종료 (서비스 무중단)</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
