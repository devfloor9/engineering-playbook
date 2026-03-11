import { SlideWrapper, Card, Badge } from '@shared/components';
import { Target, CheckCircle } from 'lucide-react';

export default function Slide08() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        RAGAS 개요
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Target className="w-8 h-8 text-cyan-400" />
            <h3 className="text-2xl font-bold text-white">RAG 평가 프레임워크</h3>
          </div>
          <p className="text-gray-300 mb-4">
            RAGAS(RAG Assessment)는 RAG 파이프라인의 품질을 객관적으로 측정하는 오픈소스 프레임워크입니다.
          </p>
          <div className="space-y-2">
            <Badge color="cyan" size="lg">검색 품질</Badge>
            <Badge color="blue" size="lg">답변 충실도</Badge>
            <Badge color="purple" size="lg">답변 관련성</Badge>
            <Badge color="emerald" size="lg">정확성</Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">왜 필요한가?</h3>
          </div>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">▸</span>
              <div>
                <strong>복잡한 파이프라인</strong>
                <p className="text-sm text-gray-300">검색 → 컨텍스트 → 생성</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">▸</span>
              <div>
                <strong>환각 감지</strong>
                <p className="text-sm text-gray-300">답변이 컨텍스트에 충실한지</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">▸</span>
              <div>
                <strong>지속적 개선</strong>
                <p className="text-sm text-gray-300">품질 메트릭 기반 최적화</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <Card color="gray" className="p-6">
        <h3 className="text-2xl font-bold text-white mb-4">평가 포인트</h3>
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <div className="text-sm font-bold text-blue-300">검색 품질</div>
            <div className="text-xs text-gray-300 mt-1">Precision/Recall</div>
          </div>
          <div className="bg-gray-800 border border-emerald-500/30 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">✓</div>
            <div className="text-sm font-bold text-emerald-300">충실도</div>
            <div className="text-xs text-gray-300 mt-1">Faithfulness</div>
          </div>
          <div className="bg-gray-800 border border-amber-500/30 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">🎯</div>
            <div className="text-sm font-bold text-amber-300">관련성</div>
            <div className="text-xs text-gray-300 mt-1">Relevancy</div>
          </div>
          <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-3 text-center">
            <div className="text-3xl mb-2">📊</div>
            <div className="text-sm font-bold text-purple-300">정확성</div>
            <div className="text-xs text-gray-300 mt-1">Correctness</div>
          </div>
        </div>
      </Card>
    </SlideWrapper>
  );
}
