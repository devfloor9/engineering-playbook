import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { Scale, TrendingUp, GitBranch } from 'lucide-react';

export default function Slide05() {
  const weightedCode = `apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: weighted-routing
spec:
  rules:
    - matches:
        - path:
            value: /v1/chat/completions
      backendRefs:
        # Primary 백엔드: 80% 트래픽
        - name: vllm-gpt4-v1
          port: 8000
          weight: 80
        # Secondary 백엔드: 20% 트래픽
        - name: vllm-gpt4-v2
          port: 8000
          weight: 20`;

  const canaryCode = `# 카나리 배포 - 점진적 트래픽 증가
backendRefs:
  - name: vllm-gpt4-stable  # 90%
    weight: 90
  - name: vllm-gpt4-canary   # 10%
    weight: 10

# 단계별 증가: 10% → 25% → 50% → 75% → 100%`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-emerald-400">로드 밸런싱</h2>
        <p className="text-xl text-gray-300 mb-6">가중치 기반 트래픽 분배와 카나리 배포</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <Scale className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">가중치 분배</h4>
            <p className="text-sm text-gray-300">
              백엔드별 트래픽 비율을 정밀하게 제어하여 안정적인 로드 밸런싱
            </p>
          </Card>

          <Card className="p-5">
            <GitBranch className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-purple-300">카나리 배포</h4>
            <p className="text-sm text-gray-300">
              새 모델 버전을 소량 트래픽으로 테스트 후 점진적으로 확대
            </p>
          </Card>

          <Card className="p-5">
            <TrendingUp className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">A/B 테스트</h4>
            <p className="text-sm text-gray-300">
              사용자 그룹별로 다른 모델 버전을 제공하여 성능 비교
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <CodeBlock
              code={weightedCode}
              language="yaml"
              title="가중치 기반 분배"
            />
          </div>

          <div>
            <CodeBlock
              code={canaryCode}
              language="yaml"
              title="카나리 배포 전략"
            />
            <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-purple-500/30">
              <h5 className="text-sm font-semibold text-purple-300 mb-2">카나리 배포 단계</h5>
              <ol className="text-xs text-gray-300 space-y-1">
                <li>1. 초기 단계: 5-10% 트래픽으로 시작</li>
                <li>2. 모니터링: 오류율, 지연 시간 확인</li>
                <li>3. 점진적 증가: 25% {"→"} 50% {"→"} 75% {"→"} 100%</li>
                <li>4. 롤백 준비: 문제 발생 시 즉시 0%로</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
