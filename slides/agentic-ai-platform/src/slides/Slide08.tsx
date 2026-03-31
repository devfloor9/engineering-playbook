import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide08() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">Challenge → Solution Mapping</h2>
      <p className="text-gray-400 mb-6">Every challenge maps to a concrete platform feature with measurable impact</p>
      <div className="flex-1 flex items-center">
        <CompareTable
          headers={['Challenge', 'Platform Feature', 'Impact']}
          highlightCol={2}
          rows={[
            ['GPU Cost Overruns', 'Spot + Consolidation + MIG (Karpenter)', '85% cost reduction'],
            ['High Latency', 'llm-d KV Cache-aware routing', 'TTFT ↓ 50%'],
            ['Hallucination', 'Tool delegation + NeMo Guardrails', 'Accuracy ↑ 40%'],
            ['No Governance', 'Langfuse tracing + Bifrost budget control', 'Per-team cost control'],
            ['Model Drift', 'RAGAS evaluation + MLOps feedback loop', 'Continuous quality'],
          ]}
        />
      </div>
    </SlideWrapper>
  );
}
