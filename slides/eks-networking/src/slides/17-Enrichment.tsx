import { SlideWrapper, Card } from '@shared/components';
import { FlowDiagram } from '../components/FlowDiagram';
import { Tags } from 'lucide-react';

export default function EnrichmentSlide() {
  const nodes = [
    { id: 'pod', label: 'Pod watcher', x: 20, y: 20, width: 150, height: 46, color: 'blue', description: '덮어쓰지 않음' },
    { id: 'eps', label: 'EndpointSlice watcher', x: 20, y: 120, width: 190, height: 46, color: 'emerald', description: 'service-name 라벨' },
    { id: 'map', label: 'IP → (port → pod/ns/service)', x: 300, y: 70, width: 240, height: 46, color: 'purple' },
    { id: 'flow', label: 'flow enrichment', x: 630, y: 70, width: 150, height: 46, color: 'amber', description: 'service map의 원천' },
  ];

  const edges = [
    { from: 'pod', to: 'map', color: 'blue' },
    { from: 'eps', to: 'map', label: '우선', color: 'emerald' },
    { from: 'map', to: 'flow', label: 'local/remote 조회', color: 'purple' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Tags aria-hidden="true" className="w-12 h-12 text-cyan-400" />
        Kubernetes Enrichment: Pod·Service 식별
      </h1>
      <p className="text-lg text-gray-400 mb-4">EKS 콘솔 service map이 가능한 이유</p>

      <FlowDiagram nodes={nodes} edges={edges} width={800} height={190} />

      <div className="grid grid-cols-3 gap-4 mt-6">
        <Card title="EndpointSlice가 우선" color="emerald">
          service 이름은 <span className="font-mono">kubernetes.io/service-name</span> 라벨에서.
          Pod 이벤트는 EndpointSlice가 채운 엔트리를 <b>덮어쓰지 않음</b> (정보가 더 풍부)
        </Card>
        <Card title="ephemeral 포트 문제" color="amber">
          client flow의 local pod는 어느 포트로 열었는지 알 수 없음 →
          "그 IP의 <b>모든 포트가 같은 pod</b>일 때"만 확정
        </Card>
        <Card title="TCP 전용" color="rose">
          UDP ContainerPort는 무시. IPv4-mapped IPv6(<span className="font-mono">::ffff:...</span>)는
          IPv4로 재조회. 집계 실행 로그: <span className="font-mono">Flow enrichment completed.</span>
        </Card>
      </div>
    </SlideWrapper>
  );
}
