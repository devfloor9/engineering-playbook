import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide14() {
  const data = [
    {
      criterion: 'Model Selection',
      native: 'Bedrock catalog only (Claude, Llama via Bedrock)',
      eks: 'Any open-weight model (Llama, Qwen, DeepSeek, custom)',
    },
    {
      criterion: 'GPU Management',
      native: 'Zero — fully serverless',
      eks: 'Karpenter autoscaling, manual NodePool tuning',
    },
    {
      criterion: 'Cost Optimization',
      native: 'Pay-per-token, predictable pricing',
      eks: 'Spot instances, Consolidation → 70-80% savings',
    },
    {
      criterion: 'Operational Burden',
      native: 'Minimal — AWS manages everything',
      eks: 'Moderate — requires K8s/GPU expertise',
    },
    {
      criterion: 'Hybrid Support',
      native: 'Limited (VPC integration only)',
      eks: 'Full EKS Hybrid Nodes (on-prem GPU)',
    },
    {
      criterion: 'Time to Production',
      native: '~1 week',
      eks: '~2-3 weeks (with EKS Auto Mode)',
    },
  ];

  return (
    <SlideWrapper>
      <h2 className="text-6xl font-bold mb-2">AWS Native vs EKS Comparison</h2>
      <p className="text-gray-400 mb-4">Choosing the right approach for your workload</p>
      <div className="flex-1 overflow-auto">
        <CompareTable
          headers={['Criterion', 'AWS Native (Bedrock)', 'EKS Open Architecture']}
          data={data}
          leftColor="amber"
          rightColor="blue"
        />
      </div>
      <div className="mt-4 text-center text-sm text-gray-500">
        Hybrid approach: Start with AWS Native, expand to EKS for open models
      </div>
    </SlideWrapper>
  );
}
