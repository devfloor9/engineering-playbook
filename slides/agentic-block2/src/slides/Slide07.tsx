import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { MapPin, Zap, DollarSign } from 'lucide-react';

export default function Slide07() {
  const topologyCode = `apiVersion: v1
kind: Service
metadata:
  name: vllm-inference
  annotations:
    # Kubernetes 1.33+ Topology-Aware Routing
    service.kubernetes.io/topology-mode: "Auto"
spec:
  selector:
    app: vllm
  ports:
    - port: 8000
  # 토폴로지 인식 라우팅 활성화
  trafficDistribution: PreferClose`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-cyan-400">Topology-Aware Routing</h2>
        <p className="text-xl text-gray-300 mb-6">Kubernetes 1.33+ 크로스 AZ 최적화</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-5">
            <MapPin className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">동일 AZ 우선</h4>
            <p className="text-sm text-gray-300">
              동일 가용영역 내 Pod 간 통신을 우선시하여 지연 시간 감소
            </p>
          </Card>

          <Card className="p-5">
            <DollarSign className="w-8 h-8 text-emerald-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">비용 절감</h4>
            <p className="text-sm text-gray-300">
              크로스 AZ 데이터 전송 비용 최대 90% 절감
            </p>
          </Card>

          <Card className="p-5">
            <Zap className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">성능 향상</h4>
            <p className="text-sm text-gray-300">
              P50 지연 시간 30% 감소, P99 지연 시간 50% 감소
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <CodeBlock
              code={topologyCode}
              language="yaml"
              title="Topology-Aware Service 설정"
            />
          </div>

          <Card className="p-6">
            <h4 className="text-lg font-semibold mb-4 text-purple-300">효과 비교</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                <span className="text-sm text-gray-300">크로스 AZ 트래픽</span>
                <span className="text-xl font-bold text-red-400">↓ 90%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                <span className="text-sm text-gray-300">P50 지연 시간</span>
                <span className="text-xl font-bold text-emerald-400">↓ 30%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                <span className="text-sm text-gray-300">P99 지연 시간</span>
                <span className="text-xl font-bold text-blue-400">↓ 50%</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                <span className="text-sm text-gray-300">데이터 전송 비용</span>
                <span className="text-xl font-bold text-purple-400">↓ 90%</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-cyan-500/30">
          <p className="text-sm text-cyan-300">
            <span className="font-semibold">활용 시나리오:</span> 멀티 AZ 배포, 대규모 추론 워크로드, 비용 최적화가 중요한 경우
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
