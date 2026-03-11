import { SlideWrapper, Card, Badge } from '@shared/components';
import { Eye, TrendingUp } from 'lucide-react';

export default function Slide03() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        Agent 모니터링 개요
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-8 h-8 text-blue-400" />
            <h3 className="text-2xl font-bold text-white">LLM Observability</h3>
          </div>
          <p className="text-gray-300 mb-4">
            LangFuse를 활용한 Agentic AI 애플리케이션의 전체 실행 흐름 추적
          </p>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge color="blue" size="lg">트레이스</Badge>
              <span className="text-sm text-gray-300">LLM 호출 체인 추적</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="emerald" size="lg">토큰</Badge>
              <span className="text-sm text-gray-300">사용량 및 비용 분석</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge color="purple" size="lg">품질</Badge>
              <span className="text-sm text-gray-300">응답 품질 평가</span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-8 h-8 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">핵심 기능</h3>
          </div>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">▸</span>
              <div>
                <strong>전체 추론 체인 가시화</strong>
                <p className="text-sm text-gray-300">Agent → Tool → LLM 흐름</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">▸</span>
              <div>
                <strong>실시간 디버깅</strong>
                <p className="text-sm text-gray-300">프롬프트 및 응답 내용 검토</p>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400 mt-1">▸</span>
              <div>
                <strong>비용 추적</strong>
                <p className="text-sm text-gray-300">모델/테넌트별 비용 분석</p>
              </div>
            </li>
          </ul>
        </Card>
      </div>

      <Card color="blue" className="p-4">
        <p className="text-blue-300 text-center">
          <strong>Self-hosted 배포</strong>로 데이터 주권 확보 + 비용 최적화
        </p>
      </Card>
    </SlideWrapper>
  );
}
