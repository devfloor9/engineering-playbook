import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { RefreshCw, Upload, RotateCcw, TrendingUp } from 'lucide-react';

export default function Slide12() {
  const deployCode = `# 1. Tool 리소스 배포
kubectl apply -f tools/

# 2. Agent 리소스 배포
kubectl apply -f agents/customer-support-agent.yaml

# 3. 배포 상태 확인
kubectl get agents -n ai-agents
kubectl get pods -n ai-agents -l app=customer-support-agent

# 4. 검증
kubectl port-forward svc/customer-support-agent 8080:8080
curl -X POST http://localhost:8080/chat \\
  -d '{"message": "안녕하세요"}'`;

  const updateCode = `# 설정 변경 및 적용
kubectl edit agent customer-support-agent -n ai-agents

# 롤링 업데이트 모니터링
kubectl rollout status deployment/customer-support-agent

# 롤백 (문제 발생 시)
kubectl rollout undo deployment/customer-support-agent`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-amber-400">Agent 라이프사이클</h2>
        <p className="text-xl text-gray-400 mb-6">배포, 업데이트, 롤백, 스케일링</p>

        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card className="p-5">
            <Upload className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">배포</h4>
            <p className="text-xs text-gray-400">
              CRD 적용으로 Deployment, Service, HPA 자동 생성
            </p>
          </Card>

          <Card className="p-5">
            <RefreshCw className="w-8 h-8 text-emerald-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">업데이트</h4>
            <p className="text-xs text-gray-400">
              롤링 업데이트로 무중단 설정 변경 및 모델 전환
            </p>
          </Card>

          <Card className="p-5">
            <RotateCcw className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">롤백</h4>
            <p className="text-xs text-gray-400">
              문제 발생 시 이전 버전으로 즉시 롤백 가능
            </p>
          </Card>

          <Card className="p-5">
            <TrendingUp className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-purple-300">스케일링</h4>
            <p className="text-xs text-gray-400">
              HPA/KEDA로 트래픽에 따라 자동 확장/축소
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <CodeBlock
            code={deployCode}
            language="bash"
            title="배포 절차"
          />
          <CodeBlock
            code={updateCode}
            language="bash"
            title="업데이트 및 롤백"
          />
        </div>

        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
            <h5 className="text-sm font-semibold text-blue-300 mb-2">카나리 배포</h5>
            <p className="text-xs text-gray-400">
              새 모델을 별도 에이전트로 배포하여 소량 트래픽으로 테스트
            </p>
          </div>
          <div className="p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/30">
            <h5 className="text-sm font-semibold text-emerald-300 mb-2">버전 관리</h5>
            <p className="text-xs text-gray-400">
              Git으로 CRD YAML 파일을 관리하여 변경 이력 추적
            </p>
          </div>
          <div className="p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
            <h5 className="text-sm font-semibold text-amber-300 mb-2">자동 복구</h5>
            <p className="text-xs text-gray-400">
              Pod 장애 시 Kubernetes가 자동으로 재시작하여 가용성 유지
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
