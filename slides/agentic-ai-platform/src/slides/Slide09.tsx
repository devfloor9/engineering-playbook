import { SlideWrapper, CompareTable, Badge } from '@shared/components';

export default function Slide09() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">AWS Native vs EKS Open Architecture</h2>
      <p className="text-gray-400 mb-6">Two complementary approaches — start managed, expand to open</p>
      <div className="flex-1 flex items-center">
        <CompareTable
          headers={['Criterion', 'AWS Native (Bedrock)', 'EKS + Open Stack']}
          highlightCol={2}
          rows={[
            ['Model Choice', '11 Bedrock models', 'All Open Weight models'],
            ['GPU Management', 'Serverless (managed)', 'Karpenter / Auto Mode'],
            ['Cost Model', 'Per-token billing', 'Spot instances (60–90% savings)'],
            ['Data Sovereignty', 'Regional (AWS managed)', 'Complete control (self-hosted)'],
            ['Latency', '200–400 ms (API call)', '50–100 ms (colocated)'],
          ]}
        />
      </div>
      <div className="mt-4 flex items-center gap-2 justify-center">
        <Badge color="amber" size="sm">Recommendation</Badge>
        <span className="text-sm text-gray-400">Start with AWS Native → Expand to EKS when Open Weight + hybrid is needed</span>
      </div>
    </SlideWrapper>
  );
}
