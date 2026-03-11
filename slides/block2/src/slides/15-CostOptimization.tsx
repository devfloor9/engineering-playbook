import { SlideWrapper, CompareTable, Badge } from '@shared/components';
import { DollarSign, TrendingDown } from 'lucide-react';

export function Slide15() {
  const resourceHeaders = ['리소스', '요구사항', '월간 비용 (예상)'];
  const resourceRows = [
    ['NMA CPU', '100-200m', '$0.50 - $1.00'],
    ['NMA Memory', '200-400Mi', '$0.30 - $0.60'],
    ['NMA Network', '1-2MB/min', '$0.10'],
    ['NTH (추가)', '50m CPU, 64Mi RAM', '$0.30'],
  ];

  const cloudwatchHeaders = ['항목', '비용', '최적화 방법'];
  const cloudwatchRows = [
    ['커스텀 메트릭', '$0.30/metric/month', '필요한 메트릭만 활성화'],
    ['이벤트', '$1.00/million events', '심각도 필터링'],
    ['로그 수집', '$0.50/GB ingested', '보존 기간 조정'],
    ['로그 저장', '$0.03/GB/month', '자동 삭제 정책'],
  ];

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-blue-400">비용 최적화</h2>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-emerald-900/30 to-cyan-900/30 rounded-xl p-5 border border-emerald-500/30">
          <div className="flex items-center gap-3 mb-3">
            <TrendingDown className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-bold text-emerald-300">NMA는 매우 경량 도구입니다</h3>
          </div>
          <p className="text-gray-300">
            각 노드당 최소한의 리소스만 사용하며, 대규모 클러스터에서도 비용 부담이 적습니다.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-lg font-bold text-blue-400 mb-3 flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              리소스 사용량 및 비용
            </h4>
            <CompareTable headers={resourceHeaders} rows={resourceRows} />
            <div className="mt-2 text-xs text-gray-500">
              * 100 노드 클러스터 기준 월 $80-150 예상
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold text-cyan-400 mb-3">CloudWatch 비용</h4>
            <CompareTable headers={cloudwatchHeaders} rows={cloudwatchRows} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-emerald-900/20 rounded-xl p-5 border border-emerald-500/30">
            <h4 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
              <Badge color="emerald">권장</Badge>
              비용 절감 전략
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• <span className="text-emerald-400">Spot 인스턴스</span>: 최대 90% 절감</li>
              <li>• <span className="text-blue-400">메트릭 필터링</span>: 중요 메트릭만 수집</li>
              <li>• <span className="text-purple-400">로그 보존</span>: 7-30일로 제한</li>
              <li>• <span className="text-amber-400">이벤트 임계값</span>: 심각한 문제만</li>
              <li>• <span className="text-cyan-400">Prometheus 우선</span>: CW 보완용</li>
            </ul>
          </div>

          <div className="bg-rose-900/20 rounded-xl p-5 border border-rose-500/30">
            <h4 className="text-rose-400 font-bold mb-3 flex items-center gap-2">
              <Badge color="rose">주의</Badge>
              비용 증가 요인
            </h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• <span className="text-rose-400">모든 메트릭 전송</span>: CloudWatch에</li>
              <li>• <span className="text-orange-400">빈번한 이벤트</span>: 필터링 없이</li>
              <li>• <span className="text-red-400">장기 로그 보존</span>: 90일 이상</li>
              <li>• <span className="text-amber-400">불필요한 알림</span>: 중복 설정</li>
              <li>• <span className="text-yellow-400">커스텀 메트릭 과다</span>: 수백 개</li>
            </ul>
          </div>
        </div>

        <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/30">
          <h4 className="text-purple-400 font-bold mb-2 text-sm">ROI (투자 대비 효과)</h4>
          <p className="text-sm text-gray-300">
            NMA + NTH를 사용하면 노드 장애로 인한 다운타임을 줄이고 Spot 인스턴스를 안전하게 사용할 수 있어,
            <span className="text-purple-400 font-semibold"> 초기 모니터링 비용($100-200/월)을 훨씬 초과하는 비용 절감 효과</span>를 얻을 수 있습니다.
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
