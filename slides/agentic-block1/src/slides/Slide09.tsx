import { SlideWrapper, Card, Badge } from '@shared/components';
import { GitBranch, Package } from 'lucide-react';

export default function Slide09() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-amber-400 to-purple-400 bg-clip-text text-transparent">
        Kubernetes 생태계 솔루션 버드뷰
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <GitBranch className="w-8 h-8 text-amber-400" />
            <h3 className="text-xl font-semibold text-amber-300">도전과제별 솔루션 매핑</h3>
          </div>
          <p className="text-base text-gray-300">
            Kubernetes 네이티브 오픈소스 솔루션들이 각 도전과제를 효과적으로 해결
          </p>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <Badge color="red" size="lg">도전과제 1</Badge>
            <h4 className="text-lg font-semibold mb-2 text-red-300">GPU 모니터링 및 스케줄링</h4>
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Karpenter: GPU 노드 자동 프로비저닝</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>DCGM Exporter: GPU 메트릭 수집</span>
            </div>
          </Card>

          <Card className="p-5">
            <Badge color="cyan" size="lg">도전과제 2</Badge>
            <h4 className="text-lg font-semibold mb-2 text-cyan-300">동적 라우팅 및 스케일링</h4>
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
              <Package className="w-4 h-4 text-blue-400" />
              <span>Kgateway + LiteLLM: 추론 게이트웨이</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Package className="w-4 h-4 text-red-400" />
              <span>vLLM + llm-d: 분산 추론</span>
            </div>
          </Card>

          <Card className="p-5">
            <Badge color="blue" size="lg">도전과제 3</Badge>
            <h4 className="text-lg font-semibold mb-2 text-blue-300">토큰/세션 모니터링</h4>
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
              <Package className="w-4 h-4 text-purple-400" />
              <span>LangFuse: LLM 관측성 플랫폼</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Package className="w-4 h-4 text-amber-400" />
              <span>Prometheus + Grafana: 메트릭</span>
            </div>
          </Card>

          <Card className="p-5">
            <Badge color="emerald" size="lg">도전과제 4</Badge>
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">FM 파인튜닝 자동화</h4>
            <div className="flex items-center gap-2 text-sm text-gray-300 mb-1">
              <Package className="w-4 h-4 text-emerald-400" />
              <span>NeMo Framework: 분산 학습</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <Package className="w-4 h-4 text-blue-400" />
              <span>Kubeflow: 학습 파이프라인</span>
            </div>
          </Card>
        </div>

        <Card color="purple" className="p-5">
          <h4 className="text-lg font-semibold mb-2 text-purple-300">Agent 오케스트레이션</h4>
          <div className="flex items-center gap-2 text-base text-gray-300">
            <Package className="w-5 h-5 text-emerald-400" />
            <span>KAgent: Kubernetes Agent 프레임워크 (CRD 기반)</span>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
