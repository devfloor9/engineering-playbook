import { SlideWrapper, CodeBlock, Badge } from '@shared/components';

export function Slide11() {
  const basicCode = `# 패턴 1: Multi-AZ 균등 분배
topologySpreadConstraints:
- maxSkew: 1
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector:
    matchLabels:
      app: multi-az-app`;

  const minDomainsCode = `# 패턴 2: minDomains 활용
topologySpreadConstraints:
- maxSkew: 1
  minDomains: 3  # 반드시 3개 AZ 분산
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector:
    matchLabels:
      app: critical-service`;

  const combinedCode = `# 패턴 3: Anti-Affinity + Topology Spread 조합
topologySpreadConstraints:
- maxSkew: 1
  minDomains: 3
  topologyKey: topology.kubernetes.io/zone
  whenUnsatisfiable: DoNotSchedule
  labelSelector: {matchLabels: {app: combined-app}}

affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
    - labelSelector: {matchExpressions: [{key: app, operator: In, values: [combined-app]}]}
      topologyKey: kubernetes.io/hostname`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">TSC 실전 패턴</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="emerald">패턴 1: 기본</Badge>
        <Badge color="cyan">패턴 2: minDomains</Badge>
        <Badge color="purple">패턴 3: 조합</Badge>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <CodeBlock
          code={basicCode}
          language="yaml"
          title="패턴 1: 기본 Multi-AZ"
        />
        <CodeBlock
          code={minDomainsCode}
          language="yaml"
          title="패턴 2: 최소 AZ 보장"
        />
        <CodeBlock
          code={combinedCode}
          language="yaml"
          title="패턴 3: 다층 제약"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <h3 className="font-bold text-emerald-400 mb-2">패턴 1 (기본)</h3>
          <p className="text-gray-400 mb-1">• 9개 replica → AZ당 3개</p>
          <p className="text-gray-400 mb-1">• 복잡도: 낮음</p>
          <p className="text-xs text-gray-500">권장 replica: 3~12</p>
        </div>
        <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-4">
          <h3 className="font-bold text-cyan-400 mb-2">패턴 2 (minDomains)</h3>
          <p className="text-gray-400 mb-1">• 최소 3개 AZ 강제</p>
          <p className="text-gray-400 mb-1">• 복잡도: 중간</p>
          <p className="text-xs text-gray-500">권장 replica: 6~20</p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
          <h3 className="font-bold text-purple-400 mb-2">패턴 3 (조합)</h3>
          <p className="text-gray-400 mb-1">• AZ + 노드 분산</p>
          <p className="text-gray-400 mb-1">• 복잡도: 높음</p>
          <p className="text-xs text-gray-500">권장 replica: 12~50</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
