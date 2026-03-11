import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide19() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">비용 vs 가용성 트레이드오프</h2>
      
      <div className="flex-1 flex flex-col justify-center">
        <CompareTable
          headers={['레벨', '핵심 역량', 'RTO/RPO', '비용 영향', '복잡성']}
          rows={[
            ['Level 1\n기본', 'Pod 수준 복원력\nProbe, PDB, Graceful Shutdown', '분 단위', '최소\n(기존 비용)', '낮음'],
            ['Level 2\nMulti-AZ', 'AZ 장애 내성\nTopology Spread, Karpenter', '초~분 단위', '중간\n(Cross-AZ 트래픽)', '중간'],
            ['Level 3\nCell-Based', 'Blast Radius 격리\nCell Architecture, Shuffle Sharding', '초 단위', '높음\n(Cell 별 오버헤드)', '높음'],
            ['Level 4\nMulti-Region', '리전 장애 내성\nActive-Active, Global Accelerator', '~0\n(거의 무중단)', '매우 높음\n(리전 별 인프라)', '매우 높음'],
          ]}
        />

        <div className="mt-6 space-y-3">
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-emerald-200 text-center">
              ✅ <span className="font-bold">대부분의 서비스:</span> Level 2 (Multi-AZ)로 충분 — 
              99.9%+ SLA 달성 가능
            </p>
          </div>

          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-sm text-amber-200 text-center">
              ⚠️ <span className="font-bold">SLA 99.99%+ 요구:</span> Level 3+ 고려 — 
              비용 대비 효과 분석 필수
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
