import { SlideWrapper } from '@shared/components';
import { FlowDiagram } from '../components/FlowDiagram';
import { Workflow } from 'lucide-react';

export default function NfmArchitectureSlide() {
  const nodes = [
    { id: 'app', label: 'App Pod', x: 20, y: 20, width: 110, height: 46, color: 'gray' },
    { id: 'kernel', label: '커널 TCP 스택', x: 20, y: 120, width: 130, height: 46, color: 'blue', description: 'sock_ops 콜백' },
    { id: 'bpf', label: 'eBPF: nfm_sock_ops', x: 230, y: 120, width: 170, height: 46, color: 'purple', description: 'cgroup v2 attach' },
    { id: 'agent', label: 'Rust 에이전트', x: 480, y: 120, width: 140, height: 46, color: 'emerald', description: '500ms 집계' },
    { id: 'k8s', label: 'Pod/EndpointSlice watcher', x: 440, y: 20, width: 220, height: 46, color: 'cyan', description: 'enrichment' },
    { id: 'backend', label: 'NFM 백엔드', x: 480, y: 230, width: 140, height: 46, color: 'amber', description: 'OTLP+gzip+SigV4' },
    { id: 'console', label: 'Workload insights / Monitor·NHI', x: 250, y: 310, width: 260, height: 46, color: 'orange' },
  ];

  const edges = [
    { from: 'app', to: 'kernel', label: 'TCP', color: 'gray' },
    { from: 'kernel', to: 'bpf', label: '소켓 이벤트', color: 'blue' },
    { from: 'bpf', to: 'agent', label: '맵 조회', color: 'purple' },
    { from: 'k8s', to: 'agent', label: 'IP:port → pod/service', color: 'cyan', style: 'dashed' as const },
    { from: 'agent', to: 'backend', label: '30s ±5s 지터, top-K 500', color: 'emerald' },
    { from: 'backend', to: 'console', color: 'amber' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Workflow aria-hidden="true" className="w-12 h-12 text-emerald-400" />
        전체 데이터 경로
      </h1>
      <p className="text-lg text-gray-400 mb-4">
        커널 수집 → 유저스페이스 집계·enrichment → <span className="font-mono text-amber-300">networkflowmonitorreports.&lt;region&gt;.api.aws/publish</span>
      </p>

      <FlowDiagram nodes={nodes} edges={edges} width={800} height={380} />
    </SlideWrapper>
  );
}
