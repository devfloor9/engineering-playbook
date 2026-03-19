import { SlideWrapper, Badge } from '@shared/components';
import { Trophy } from 'lucide-react';

export default function Slide09() {
  const rows = [
    { category: '컨트롤 플레인', aws: 'PCP 전용 (99.99% SLA)', gcp: '공유 (99.95% SLA)', azure: '공유 (99.95% SLA)' },
    { category: '데이터 플레인 자동화', aws: 'Auto Mode + Karpenter', gcp: 'Autopilot + NAP', azure: 'NAP (Node Auto-provisioning)' },
    { category: 'AI 에이전트 런타임', aws: 'AgentCore (MCP 네이티브)', gcp: 'Vertex AI Agent Builder', azure: 'Azure AI Agent Service' },
    { category: 'GPU 최적화', aws: 'Karpenter + MIG/DRA 통합', gcp: 'MIG 지원 + GKE NAP', azure: 'MIG 지원' },
    { category: 'AI 전용 칩', aws: 'Inferentia2, Trainium', gcp: 'TPU v5e/v5p', azure: 'Maia 100 (제한적)' },
    { category: '마이그레이션', aws: 'Transform (K8s 통합)', gcp: 'Migrate to Containers', azure: 'Azure Migrate' },
    { category: 'GPU 인스턴스', aws: 'H100, L40S, Inf2, Trn', gcp: 'H100, A100, L4, L40S', azure: 'H100, A100, MI300X' },
  ];

  return (
    <SlideWrapper className="slide-dense">
      <div className="flex items-center gap-4 mb-4">
        <Trophy className="w-12 h-12 text-amber-400" />
        <h2 className="text-5xl font-bold text-amber-300">AWS 차별화</h2>
      </div>
      <p className="text-lg text-gray-400 mb-4">
        유일하게 컨트롤 플레인부터 AI 런타임까지 풀스택 제공
      </p>

      <div className="flex-1 flex flex-col justify-center">
        <div className="overflow-hidden rounded-xl border-2 border-gray-600">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-800">
                <th className="px-5 py-3 text-base font-bold text-white">비교 항목</th>
                <th className="px-5 py-3 text-base font-bold text-blue-300">AWS (EKS)</th>
                <th className="px-5 py-3 text-base font-bold text-gray-400">GCP (GKE)</th>
                <th className="px-5 py-3 text-base font-bold text-gray-400">Azure (AKS)</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'}>
                  <td className="px-5 py-2.5 text-sm font-semibold text-gray-200">{row.category}</td>
                  <td className="px-5 py-2.5 text-sm text-blue-300 font-bold">{row.aws}</td>
                  <td className="px-5 py-2.5 text-sm text-gray-500">{row.gcp}</td>
                  <td className="px-5 py-2.5 text-sm text-gray-500">{row.azure}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 bg-amber-500/20 rounded-xl px-6 py-3 border-2 border-amber-400/60 text-center" style={{boxShadow: '0 0 30px rgba(245, 158, 11, 0.2)'}}>
          <p className="text-base font-bold text-white">
            핵심 차별점: <span className="text-amber-300">전용 컨트롤 플레인(99.99% SLA)</span> + <span className="text-amber-300">MCP 네이티브 AgentCore</span> + <span className="text-amber-300">Auto Mode → Karpenter → Transform 통합 경로</span>
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
