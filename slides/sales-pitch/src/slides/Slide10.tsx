import { SlideWrapper, Card } from '@shared/components';
import { ShoppingCart, Landmark, Gamepad2, Factory, Radio } from 'lucide-react';

export default function Slide10() {
  return (
    <SlideWrapper className="slide-dense">
      <h2 className="text-5xl font-bold text-center mb-1 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        산업별 Agentic AI 시나리오
      </h2>
      <p className="text-sm text-gray-400 text-center mb-4">
        각 산업의 핵심 과제를 AI 에이전트가 해결합니다 — 모두 EKS 컨테이너 인프라 기반
      </p>

      <div className="flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-5 gap-3">
          <Card color="blue" className="p-3">
            <ShoppingCart className="w-6 h-6 text-blue-400 mb-2" />
            <h4 className="text-sm font-bold mb-1.5 text-blue-300">E-commerce</h4>
            <p className="text-xs text-white font-semibold mb-1">실시간 개인화 추천 에이전트</p>
            <p className="text-xs text-gray-400 mb-2">
              고객 클릭스트림 → RAG 기반 상품 추론 → 실시간 추천 API 응답.
              벡터DB + LLM + A/B 테스트 에이전트 조합
            </p>
            <div className="bg-blue-500/20 rounded px-2 py-1 border border-blue-500/40">
              <p className="text-xs text-white font-bold">전환율 <span className="text-blue-300">35%</span> 향상</p>
              <p className="text-xs text-gray-400">추천 응답 &lt;200ms</p>
            </div>
          </Card>

          <Card color="emerald" className="p-3">
            <Landmark className="w-6 h-6 text-emerald-400 mb-2" />
            <h4 className="text-sm font-bold mb-1.5 text-emerald-300">금융 (FSI)</h4>
            <p className="text-xs text-white font-semibold mb-1">이상거래 탐지 & 규제 준수 에이전트</p>
            <p className="text-xs text-gray-400 mb-2">
              거래 데이터 스트림 → 이상 패턴 감지 → 자동 차단 & 보고서 생성.
              Hybrid Nodes로 데이터 주권 보장
            </p>
            <div className="bg-emerald-500/20 rounded px-2 py-1 border border-emerald-500/40">
              <p className="text-xs text-white font-bold">정확도 <span className="text-emerald-300">99.2%</span></p>
              <p className="text-xs text-gray-400">온프레미스 데이터 보호</p>
            </div>
          </Card>

          <Card color="purple" className="p-3">
            <Gamepad2 className="w-6 h-6 text-purple-400 mb-2" />
            <h4 className="text-sm font-bold mb-1.5 text-purple-300">Gaming</h4>
            <p className="text-xs text-white font-semibold mb-1">AI NPC 대화 & 시나리오 에이전트</p>
            <p className="text-xs text-gray-400 mb-2">
              플레이어 대화 → LLM 추론 → 감정/맥락 기반 NPC 응답 생성.
              vLLM + llm-d로 TTFT 50ms 이하 달성
            </p>
            <div className="bg-purple-500/20 rounded px-2 py-1 border border-purple-500/40">
              <p className="text-xs text-white font-bold">몰입도 <span className="text-purple-300">2.5x</span></p>
              <p className="text-xs text-gray-400">100만 동시접속 지원</p>
            </div>
          </Card>

          <Card color="amber" className="p-3">
            <Factory className="w-6 h-6 text-amber-400 mb-2" />
            <h4 className="text-sm font-bold mb-1.5 text-amber-300">Manufacturing</h4>
            <p className="text-xs text-white font-semibold mb-1">비전 AI 품질검사 에이전트</p>
            <p className="text-xs text-gray-400 mb-2">
              라인 카메라 이미지 → 결함 분류 모델 추론 → 자동 불량 분리 & 리포팅.
              GPU MIG로 7개 라인 동시 처리
            </p>
            <div className="bg-amber-500/20 rounded px-2 py-1 border border-amber-500/40">
              <p className="text-xs text-white font-bold">불량률 <span className="text-amber-300">90%</span> 감소</p>
              <p className="text-xs text-gray-400">GPU 비용 75% 절감</p>
            </div>
          </Card>

          <Card color="cyan" className="p-3">
            <Radio className="w-6 h-6 text-cyan-400 mb-2" />
            <h4 className="text-sm font-bold mb-1.5 text-cyan-300">Telco</h4>
            <p className="text-xs text-white font-semibold mb-1">네트워크 자율 최적화 에이전트</p>
            <p className="text-xs text-gray-400 mb-2">
              기지국 트래픽 분석 → 대역폭 동적 할당 → 장애 예측 & 선제 대응.
              Edge Hybrid Nodes로 지연 최소화
            </p>
            <div className="bg-cyan-500/20 rounded px-2 py-1 border border-cyan-500/40">
              <p className="text-xs text-white font-bold">운영 효율 <span className="text-cyan-300">50%</span> 향상</p>
              <p className="text-xs text-gray-400">Edge 지연 &lt;10ms</p>
            </div>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
