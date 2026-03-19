import { SlideWrapper, Card } from '@shared/components';
import { Shield, ArrowRight } from 'lucide-react';

export default function Slide20() {
  const strategies = [
    {
      event: 'Karpenter consolidation',
      strategy: 'vLLM graceful drain + llm-d drain-aware routing',
      config: '--shutdown-timeout=240, PDB maxUnavailable=1, budgets: nodes=1',
    },
    {
      event: 'EKS upgrade',
      strategy: 'Blue/Green NodePool + weight-based shift',
      config: 'GREEN NodePool → pre-load → weight shift → delete BLUE',
    },
    {
      event: 'Long-running sessions',
      strategy: 'AgentCore Runtime (microVM)',
      config: 'AICC consultations, multi-step workflows',
    },
    {
      event: 'Future: GPU live migration',
      strategy: 'CRIU-based checkpoint/restore',
      config: 'KV Cache preservation (pending maturity)',
    },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Shield className="w-16 h-16 text-emerald-400" />
          <h2 className="text-5xl font-bold text-emerald-400">무중단 운영 전략</h2>
        </div>

        <div className="space-y-4">
          {strategies.map((item, idx) => (
            <Card key={idx} color={idx === 0 ? 'blue' : idx === 1 ? 'purple' : idx === 2 ? 'emerald' : 'cyan'} className="p-6">
              <div className="grid grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Event</h3>
                  <p className="text-xl font-bold text-white">{item.event}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Strategy</h3>
                  <p className="text-lg text-gray-300">{item.strategy}</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 mb-2">Key Config</h3>
                  <p className="text-sm text-gray-400 font-mono">{item.config}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card color="amber" className="p-8 mt-8">
          <div className="flex items-center gap-4 mb-4">
            <ArrowRight className="w-10 h-10 text-amber-400" />
            <h3 className="text-2xl font-bold text-white">핵심 원칙</h3>
          </div>
          <div className="grid grid-cols-2 gap-6 text-lg text-gray-300">
            <div className="flex items-start gap-3">
              <span className="text-emerald-400">✓</span>
              <span><strong>진행 중인 요청 보호</strong>: graceful drain + drain-aware routing</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-cyan-400">✓</span>
              <span><strong>점진적 전환</strong>: Blue/Green + weight-based shift</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-purple-400">✓</span>
              <span><strong>제어된 consolidation</strong>: Karpenter budgets + PDB</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-amber-400">✓</span>
              <span><strong>장기 세션 격리</strong>: AgentCore microVM runtime</span>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
