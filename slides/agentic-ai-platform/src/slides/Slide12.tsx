import { SlideWrapper, Badge, CompareTable } from '@shared/components';

export default function Slide12() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-2">DRA: Dynamic Resource Allocation</h2>
      <p className="text-gray-400 mb-4">Kubernetes 1.34 GA — Advanced GPU management with critical constraints</p>

      <div className="flex gap-2 mb-6 justify-center">
        <Badge color="gray" size="sm">K8s 1.26 Alpha</Badge>
        <span className="text-gray-600">→</span>
        <Badge color="amber" size="sm">K8s 1.31 Beta</Badge>
        <span className="text-gray-600">→</span>
        <Badge color="blue" size="sm">K8s 1.33 Stable</Badge>
        <span className="text-gray-600">→</span>
        <Badge color="emerald" size="sm">K8s 1.34 GA ✓</Badge>
      </div>

      <CompareTable
        headers={['Node Provisioning', 'DRA Compatible', 'Notes']}
        highlightCol={1}
        rows={[
          ['Managed Node Group', '✅ Supported', 'Recommended for production'],
          ['Self-Managed Node Group', '✅ Supported', 'Manual configuration required'],
          ['Karpenter', '❌ Not Supported', 'Skips pods with ResourceClaims (#1231)'],
          ['EKS Auto Mode', '❌ Not Supported', 'Internal Karpenter — same limitation'],
        ]}
      />

      <div className="mt-4 bg-gray-900 rounded-lg p-4 border border-rose-500/30">
        <p className="text-rose-400 font-semibold text-sm mb-2">Why? The Chicken-and-Egg Problem</p>
        <p className="text-xs text-gray-400">
          Karpenter simulates pod requirements <span className="text-white">before</span> provisioning nodes.
          But DRA's ResourceSlice is published <span className="text-white">after</span> the node exists (by the DRA Driver).
          Karpenter cannot predict what GPU resources a node will advertise → skips DRA pods entirely.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Workaround: <code className="text-amber-400">IGNORE_DRA_REQUESTS</code> flag (PoC only — bin-packing & scale-down risks)
        </p>
      </div>
    </SlideWrapper>
  );
}
