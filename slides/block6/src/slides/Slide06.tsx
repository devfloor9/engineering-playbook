import { SlideWrapper, CodeBlock, Badge } from '@shared/components';

export function Slide06() {
  const affinityCode = `# Pod Affinity: 같은 노드/AZ에 배치
podAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
  - labelSelector:
      matchExpressions:
      - key: app
        operator: In
        values: ["redis"]
    topologyKey: kubernetes.io/hostname  # 같은 노드`;

  const antiAffinityCode = `# Pod Anti-Affinity: 다른 노드/AZ에 분산
podAntiAffinity:
  requiredDuringSchedulingIgnoredDuringExecution:
  - labelSelector:
      matchExpressions:
      - key: app
        operator: In
        values: ["api-server"]
    topologyKey: kubernetes.io/hostname  # 다른 노드`;

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-6 text-blue-400">Pod Affinity & Anti-Affinity</h1>

      <div className="mb-6 flex items-center gap-3">
        <Badge color="emerald">Pod 간 관계 기반</Badge>
        <Badge color="amber">topologyKey로 범위 제어</Badge>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-bold text-emerald-400 mb-3">Pod Affinity (가까이)</h2>
          <CodeBlock
            code={affinityCode}
            language="yaml"
            title="Cache Locality 최적화"
          />
          <div className="mt-3 text-sm text-gray-400">
            <p>• 레이턴시 최소화</p>
            <p>• 데이터 로컬리티</p>
            <p>• 빈번한 통신 워크로드</p>
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-rose-400 mb-3">Pod Anti-Affinity (멀리)</h2>
          <CodeBlock
            code={antiAffinityCode}
            language="yaml"
            title="고가용성 보장"
          />
          <div className="mt-3 text-sm text-gray-400">
            <p>• 장애 도메인 분리</p>
            <p>• 노드/AZ 간 분산</p>
            <p>• 단일 장애점 제거</p>
          </div>
        </div>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4 text-sm">
        <h3 className="font-bold text-purple-400 mb-2">topologyKey 범위</h3>
        <div className="grid grid-cols-3 gap-4 text-gray-300">
          <div><span className="text-blue-400">kubernetes.io/hostname</span> → 노드</div>
          <div><span className="text-cyan-400">topology.kubernetes.io/zone</span> → AZ</div>
          <div><span className="text-amber-400">topology.kubernetes.io/region</span> → 리전</div>
        </div>
      </div>
    </SlideWrapper>
  );
}
