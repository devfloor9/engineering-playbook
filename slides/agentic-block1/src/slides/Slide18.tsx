import { SlideWrapper, Card } from '@shared/components';
import { TrendingUp, Maximize2, Zap, ArrowRightLeft } from 'lucide-react';

export default function Slide18() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
        확장성 설계: 수평적 확장 전략
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <TrendingUp className="w-10 h-10 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-emerald-300">각 컴포넌트 독립적 확장</h3>
              <p className="text-lg text-gray-300">
                워크로드 특성에 맞춘 자동 스케일링으로 트래픽 변화에 유연하게 대응
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Maximize2 className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">Agent 확장</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• HPA: CPU/Memory 기반</li>
              <li>• KEDA: Redis 큐 길이</li>
              <li>• Prometheus 메트릭 기반</li>
              <li>• minReplicas: 2, maxReplicas: 20</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Zap className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-purple-300">Inference 확장</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• HPA: GPU Utilization</li>
              <li>• Karpenter: 노드 자동 프로비저닝</li>
              <li>• Spot + On-Demand 혼합</li>
              <li>• Consolidation: 비용 최적화</li>
            </ul>
          </Card>

          <Card className="p-5">
            <ArrowRightLeft className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-amber-300">Data 확장</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Milvus: Query/Index Nodes</li>
              <li>• Redis: Cluster Mode</li>
              <li>• S3: 무제한 스토리지</li>
              <li>• 독립적 컴포넌트 스케일링</li>
            </ul>
          </Card>
        </div>

        <Card color="emerald" className="p-6">
          <h4 className="text-xl font-semibold mb-3 text-emerald-300">End-to-End 자동화</h4>
          <div className="grid grid-cols-2 gap-4 text-base text-gray-300">
            <div>
              <strong className="text-gray-300">트래픽 급증:</strong>
              <p className="text-sm">KEDA → HPA → Pod 확장 → Karpenter → Node 프로비저닝</p>
            </div>
            <div>
              <strong className="text-gray-300">트래픽 감소:</strong>
              <p className="text-sm">HPA → Pod 축소 → Karpenter Consolidation → Node 정리</p>
            </div>
            <div>
              <strong className="text-gray-300">프로비저닝 시간:</strong>
              <p className="text-sm">Karpenter로 GPU 노드 2-3분 내 준비</p>
            </div>
            <div>
              <strong className="text-gray-300">비용 절감:</strong>
              <p className="text-sm">유휴 리소스 자동 정리로 20-30% 비용 절감</p>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
