import { SlideWrapper, Card } from '@shared/components';
import { TrendingUp, DollarSign, Clock, Cpu } from 'lucide-react';

export default function Slide06() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
        핵심 모니터링 메트릭
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">토큰 사용량</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-800 border border-emerald-500/30 rounded p-3">
              <div className="text-sm text-gray-300 mb-1">입력/출력 토큰</div>
              <div className="text-2xl font-bold text-emerald-300">{"llm_tokens_total{type}"}</div>
            </div>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• 모델별 사용량 추적</li>
              <li>• 테넌트별 집계</li>
              <li>• 시간대별 추이 분석</li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-8 h-8 text-cyan-400" />
            <h3 className="text-2xl font-bold text-white">GPU 인프라</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-800 border border-cyan-500/30 rounded p-3">
              <div className="text-sm text-gray-300 mb-1">DCGM Exporter → AMP → AMG</div>
              <div className="text-2xl font-bold text-cyan-300">GPU Metrics</div>
            </div>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• GPU 사용률, 메모리, 온도</li>
              <li>• SM(Streaming Multiprocessor) 효율</li>
              <li>• NVLink 대역폭</li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Clock className="w-8 h-8 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">지연시간</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-800 border border-blue-500/30 rounded p-3">
              <div className="text-sm text-gray-300 mb-1">E2E + LLM 추론</div>
              <div className="text-2xl font-bold text-blue-300">P50/P95/P99</div>
            </div>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Agent 전체 응답 시간</li>
              <li>• LLM 추론 시간</li>
              <li>• 도구 실행 시간</li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <DollarSign className="w-8 h-8 text-purple-400" />
            <h3 className="text-2xl font-bold text-white">비용 추적</h3>
          </div>
          <div className="space-y-3">
            <div className="bg-gray-800 border border-purple-500/30 rounded p-3">
              <div className="text-sm text-gray-300 mb-1">Bifrost + Kubecost</div>
              <div className="text-2xl font-bold text-purple-300">계층적 비용 추적</div>
            </div>
            <ul className="text-sm text-gray-300 space-y-1 ml-4">
              <li>• Bifrost: key/team/customer별 LLM 비용</li>
              <li>• Kubecost: Pod-level 인프라 비용 귀속</li>
              <li>• 예산 알림 설정</li>
            </ul>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
