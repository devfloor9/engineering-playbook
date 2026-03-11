import { SlideWrapper, Card } from '@shared/components';
import { CheckCircle, Target, Search, Layers } from 'lucide-react';

export default function Slide09() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
        RAGAS 핵심 메트릭
      </h2>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">Faithfulness (충실도)</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            답변이 제공된 컨텍스트에 얼마나 충실한지 측정 (환각 감지)
          </p>
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3 mb-3">
            <div className="text-xs text-gray-400 mb-1">계산 방식</div>
            <div className="text-sm text-emerald-300 font-mono">
              검증된 주장 수 / 전체 주장 수
            </div>
          </div>
          <div className="text-xs text-gray-400">
            1.0 = 모든 주장이 컨텍스트에서 지원됨<br/>
            0.0 = 심각한 환각 발생
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Answer Relevancy (관련성)</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            답변이 질문에 얼마나 관련있는지 측정
          </p>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3 mb-3">
            <div className="text-xs text-gray-400 mb-1">계산 방식</div>
            <div className="text-sm text-blue-300 font-mono">
              답변 → 질문 생성 → 유사도 비교
            </div>
          </div>
          <div className="text-xs text-gray-400">
            높은 점수 = 질문에 직접 관련된 답변<br/>
            낮은 점수 = 질문과 동떨어진 내용
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Search className="w-8 h-8 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Context Precision (정밀도)</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            검색된 컨텍스트 중 실제로 유용한 정보의 비율
          </p>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 mb-3">
            <div className="text-xs text-gray-400 mb-1">계산 방식</div>
            <div className="text-sm text-amber-300 font-mono">
              상위 랭킹에 관련 정보가 있는지
            </div>
          </div>
          <div className="text-xs text-gray-400">
            높은 점수 = 관련 컨텍스트가 상위에 배치<br/>
            낮은 점수 = 노이즈가 많음
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-8 h-8 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Context Recall (재현율)</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            정답 생성에 필요한 정보가 컨텍스트에 포함되어 있는지
          </p>
          <div className="bg-purple-500/10 border border-purple-500/30 rounded p-3 mb-3">
            <div className="text-xs text-gray-400 mb-1">계산 방식</div>
            <div className="text-sm text-purple-300 font-mono">
              추론 가능 문장 / 전체 문장
            </div>
          </div>
          <div className="text-xs text-gray-400">
            높은 점수 = 필요한 정보를 모두 검색<br/>
            낮은 점수 = 정보 누락
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
