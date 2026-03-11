import { SlideWrapper, Card } from '@shared/components';
import { Boxes, Layers, RefreshCw, Shield } from 'lucide-react';

export default function Slide08() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-10 text-center bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        왜 Kubernetes인가?
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Boxes className="w-10 h-10 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-blue-300">AI 워크로드를 위한 이상적인 플랫폼</h3>
              <p className="text-lg text-gray-300">
                Kubernetes는 Agentic AI 플랫폼의 모든 도전과제를 해결할 수 있는 기반 인프라를 제공
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <Layers className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-purple-300">선언적 리소스 관리</h4>
            <p className="text-base text-gray-400 mb-3">
              YAML/CRD를 통한 Infrastructure as Code
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• GPU Device Plugin으로 GPU 추상화</li>
              <li>• 버전 관리 및 재현 가능한 배포</li>
            </ul>
          </Card>

          <Card className="p-6">
            <RefreshCw className="w-9 h-9 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-emerald-300">자동 스케일링 및 복구</h4>
            <p className="text-base text-gray-400 mb-3">
              HPA, KEDA를 통한 메트릭 기반 자동 확장
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Self-healing: Pod 자동 재시작</li>
              <li>• Rolling Update: 무중단 배포</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Shield className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-amber-300">풍부한 AI/ML 생태계</h4>
            <p className="text-base text-gray-400 mb-3">
              Kubeflow, vLLM, NVIDIA GPU Operator 등
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• Kubernetes Native 설계</li>
              <li>• 활발한 커뮤니티 및 지원</li>
            </ul>
          </Card>

          <Card className="p-6 bg-blue-900/20 border-blue-700">
            <h4 className="text-xl font-semibold mb-3 text-blue-300">클라우드 이식성</h4>
            <p className="text-base text-gray-400 mb-3">
              AWS, GCP, Azure, 온프레미스 모두 지원
            </p>
            <ul className="text-sm text-gray-500 space-y-1">
              <li>• 벤더 종속 최소화</li>
              <li>• 하이브리드/멀티 클라우드 전략</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
