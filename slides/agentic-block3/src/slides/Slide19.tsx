import { SlideWrapper, CompareTable, Card } from '@shared/components';
import { BarChart3, TrendingUp } from 'lucide-react';

export default function Slide19() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <BarChart3 className="w-16 h-16 text-amber-400" />
          <h2 className="text-5xl font-bold text-amber-400">성능 비교</h2>
        </div>

        <div className="mb-8">
          <h3 className="text-3xl font-semibold text-cyan-400 mb-6">추론 엔진 벤치마크</h3>
          <CompareTable
            headers={["특성", "vLLM", "TGI", "llm-d"]}
            rows={[
              ["배칭", "Continuous", "Continuous", "Distributed"],
              ["KV Cache", "PagedAttention", "Flash", "Prefix-Aware"],
              ["처리량 (tok/s)", "2-24배 향상", "기본", "400%+ (캐시 적중 시)"],
              ["메모리 효율", "60-80% 절감", "중간", "Prefix 재사용"],
              ["프로덕션 사용", "Meta, Mistral AI", "Hugging Face", "Red Hat"],
              ["상태", "프로덕션", "유지보수 모드 (2025+)", "프로덕션"],
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card className="p-6 bg-gradient-to-r from-blue-900/40 to-purple-900/40">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-10 h-10 text-blue-400" />
              <h3 className="text-2xl font-semibold text-white">vLLM 장점</h3>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>✓ 최고 처리량 (2-24배)</li>
              <li>✓ PagedAttention 메모리 효율</li>
              <li>✓ FP8 KV Cache (v0.6+)</li>
              <li>✓ Multi-LoRA 서빙</li>
              <li>✓ 활발한 개발 및 커뮤니티</li>
            </ul>
          </Card>

          <Card className="p-6 bg-gradient-to-r from-cyan-900/40 to-emerald-900/40">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-10 h-10 text-cyan-400" />
              <h3 className="text-2xl font-semibold text-white">llm-d 장점</h3>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>✓ Prefix-Aware 라우팅</li>
              <li>✓ KV Cache 재사용 (400%+)</li>
              <li>✓ Kubernetes 네이티브</li>
              <li>✓ Gateway API 통합</li>
              <li>✓ 분산 추론 스케줄러</li>
            </ul>
          </Card>
        </div>

        <div className="mt-6 text-center p-4 bg-amber-900/30 rounded-lg">
          <p className="text-xl text-gray-300">
            <span className="text-amber-400 font-semibold">권장:</span> vLLM을 기본 엔진으로, llm-d를 분산 라우팅 계층으로 조합
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
