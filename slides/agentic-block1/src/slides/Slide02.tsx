import { SlideWrapper, Card } from '@shared/components';
import { Sparkles, Zap, Target } from 'lucide-react';

export default function Slide02() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-10 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Agentic AI 플랫폼이란?
      </h2>
      <div className="flex-1 flex flex-col justify-center space-y-6">
        <Card className="p-8">
          <div className="flex items-start gap-6">
            <Sparkles className="w-12 h-12 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-3xl font-semibold mb-4 text-blue-300">자율적 AI 에이전트 시스템</h3>
              <p className="text-xl text-gray-300 leading-relaxed">
                복잡한 작업을 독립적으로 수행하는 AI 에이전트들을 효율적으로 구축하고 운영하는 통합 플랫폼
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6">
            <Zap className="w-10 h-10 text-amber-400 mb-4" />
            <h4 className="text-2xl font-semibold mb-3 text-amber-300">핵심 특징</h4>
            <ul className="text-lg text-gray-400 space-y-2">
              <li>• 자율적 의사결정 및 작업 수행</li>
              <li>• 도구 및 리소스 동적 활용</li>
              <li>• 멀티모달 LLM 통합</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Target className="w-10 h-10 text-emerald-400 mb-4" />
            <h4 className="text-2xl font-semibold mb-3 text-emerald-300">플랫폼 목표</h4>
            <ul className="text-lg text-gray-400 space-y-2">
              <li>• 확장 가능한 AI 인프라</li>
              <li>• 자동화된 리소스 관리</li>
              <li>• 비용 효율적 운영</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
