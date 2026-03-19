import { SlideWrapper, Card } from '@shared/components';
import { BarChart3, PieChart, Cpu, TrendingDown } from 'lucide-react';

export default function Slide07() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
        Grafana 대시보드
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-8 h-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Agent Performance</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• 요청 처리량 (RPS)</li>
            <li>• 평균/P99 지연시간</li>
            <li>• 성공률 추이</li>
            <li>• 활성 세션 수</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <PieChart className="w-8 h-8 text-blue-400" />
            <h3 className="text-xl font-bold text-white">LLM Usage</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• 모델별 사용 비율</li>
            <li>• 토큰 소비량 추이</li>
            <li>• Rate Limit 근접도</li>
            <li>• 에러율 히트맵</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Cpu className="w-8 h-8 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">GPU Infrastructure</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• DCGM: GPU 사용률/메모리/온도</li>
            <li>• Karpenter 노드 프로비저닝</li>
            <li>• vLLM KV Cache 히트율</li>
            <li>• Kubecost Pod 비용 귀속</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <TrendingDown className="w-8 h-8 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Cost Dashboard</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• Bifrost: key/team/customer별 LLM 비용</li>
            <li>• Kubecost: 인프라 비용 분석</li>
            <li>• 예산 대비 사용률</li>
            <li>• 비용 최적화 기회</li>
          </ul>
        </Card>
      </div>

      <Card color="gray" className="p-6">
        <h3 className="text-2xl font-bold text-white mb-4">주요 알림 규칙</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="bg-gray-800 border border-red-500/30 rounded p-3">
              <div className="text-red-300 font-bold text-sm mb-1">Critical</div>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• 오류율 {">"} 5% (5분간)</li>
                <li>• GPU 온도 {">"} 85°C</li>
                <li>• P99 지연 {">"} 30초</li>
              </ul>
            </div>
          </div>
          <div className="space-y-2">
            <div className="bg-gray-800 border border-amber-500/30 rounded p-3">
              <div className="text-amber-300 font-bold text-sm mb-1">Warning</div>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>• 일일 LLM 비용 예산 초과</li>
                <li>• GPU 메모리 {">"} 90%</li>
                <li>• Rate Limit 에러 감지</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </SlideWrapper>
  );
}
