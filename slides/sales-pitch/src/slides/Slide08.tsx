import { SlideWrapper, Card, Badge, FlowDiagram } from '@shared/components';
import { Cloud, ArrowRightLeft, Shield } from 'lucide-react';

export default function Slide08() {
  const nodes = [
    { id: 'legacy', label: 'VMware/온프레미스', x: 20, y: 60, width: 220, height: 70, color: 'gray', description: '레거시 인프라' },
    { id: 'migrate', label: 'AWS Transform', x: 320, y: 60, width: 210, height: 70, color: 'amber', description: '마이그레이션' },
    { id: 'eks', label: 'EKS 클라우드', x: 610, y: 15, width: 210, height: 70, color: 'blue', description: 'AI 워크로드' },
    { id: 'hybrid', label: 'Hybrid Nodes', x: 610, y: 120, width: 210, height: 70, color: 'purple', description: '온프레미스 EKS' },
  ];

  const edges = [
    { from: 'legacy', to: 'migrate', color: 'amber', label: 'TCO 40-60% 절감' },
    { from: 'migrate', to: 'eks', color: 'blue' },
    { from: 'migrate', to: 'hybrid', color: 'purple' },
  ];

  return (
    <SlideWrapper>
      <div className="flex items-center gap-4 mb-4">
        <Badge color="purple" size="lg" className="text-2xl px-5 py-2">기둥 3</Badge>
        <h2 className="text-5xl font-bold text-purple-300">하이브리드 & 마이그레이션</h2>
      </div>
      <p className="text-xl text-gray-400 mb-4">
        레거시 탈출이 AI 전환의 첫걸음입니다
      </p>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <FlowDiagram nodes={nodes} edges={edges} width={860} height={210} />

        <div className="grid grid-cols-3 gap-4">
          <Card color="amber" className="p-5">
            <Cloud className="w-12 h-12 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">VMware → AWS 마이그레이션</h4>
            <p className="text-sm text-gray-300">
              VM 워크로드를 컨테이너로 전환하여 AI-ready 인프라 확보. AWS Transform으로 체계적 전환 지원
            </p>
          </Card>

          <Card color="purple" className="p-5">
            <ArrowRightLeft className="w-12 h-12 text-purple-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-purple-300">Hybrid Nodes</h4>
            <p className="text-sm text-gray-300">
              온프레미스 서버도 EKS로 통합 관리. 데이터는 온프레미스, 컴퓨팅은 클라우드 — 규제 충족
            </p>
          </Card>

          <Card color="blue" className="p-5">
            <Shield className="w-12 h-12 text-blue-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">AI-Ready 전환 경로</h4>
            <p className="text-sm text-gray-300">
              레거시 → 클라우드 네이티브 → AI 플랫폼. 단계적 전환으로 리스크 최소화, 가치 극대화
            </p>
          </Card>
        </div>

        <div className="bg-purple-500/20 rounded-xl px-8 py-4 border-2 border-purple-400/60 text-center" style={{boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)'}}>
          <p className="text-2xl font-bold text-white">
            VMware → EKS 마이그레이션 시 TCO <span className="text-purple-300">40-60%</span> 절감
          </p>
          <p className="text-base text-gray-300 mt-1">
            라이선스 비용 제거 + 운영 자동화 + AI 워크로드 통합
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
