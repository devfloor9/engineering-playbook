import { SlideWrapper, Card } from '@shared/components';
import { Brain, Zap, Network, Gauge } from 'lucide-react';

export default function Slide14() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center text-pink-300">
        Model Serving Layer
      </h2>
      <h3 className="text-3xl font-semibold mb-8 text-center text-gray-400">
        vLLM + llm-d 분산 추론
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Brain className="w-10 h-10 text-pink-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-pink-300">역할: 고성능 LLM 추론 엔진</h3>
              <p className="text-lg text-gray-300">
                vLLM으로 메모리 효율적 추론 제공, llm-d로 요청 지능적 분산
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <Zap className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-blue-300">vLLM (Inference Engine)</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• PagedAttention: 메모리 효율 극대화</li>
              <li>• Continuous Batching: 처리량 향상</li>
              <li>• H100/H200 GPU 완벽 지원</li>
              <li>• OpenAI 호환 API</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Network className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-purple-300">llm-d (Request Router)</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• Prefix-aware 라우팅</li>
              <li>• vLLM 인스턴스 간 부하 분산</li>
              <li>• Prometheus 메트릭 기반 라우팅</li>
              <li>• Kubernetes Service 통합</li>
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <Gauge className="w-8 h-8 text-emerald-400 mb-2" />
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">자동 스케일링</h4>
            <p className="text-sm text-gray-300">
              큐 깊이 메트릭 기반 HPA로 vLLM Pod 자동 확장
            </p>
          </Card>

          <Card color="rose" className="p-5">
            <h4 className="text-lg font-semibold mb-2 text-pink-300">GPU 할당</h4>
            <p className="text-sm text-gray-300">
              resource requests/limits로 GPU 할당, DRA로 유연한 관리
            </p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
