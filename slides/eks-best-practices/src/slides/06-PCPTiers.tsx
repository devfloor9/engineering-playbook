import { SlideWrapper, CompareTable, Badge } from '@shared/components';
import { Layers } from 'lucide-react';

export default function PCPTiersSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Layers className="w-12 h-12 text-emerald-400" />
        Provisioned Control Plane (PCP)
      </h1>

      <p className="text-gray-400 mb-6">
        GA at re:Invent 2025. Customers set a <strong className="text-white">minimum performance floor</strong> for the Control Plane.
        VAS never scales down below the provisioned tier.
      </p>

      <CompareTable
        headers={['Tier', 'Max Objects', 'Inflight', 'etcd DB', 'SLA', 'Price/hr', 'CPI Config']}
        rows={[
          ['Standard', '1,200~3,100', '50~100', '10GB', '99.95%', '$0.10', '2 x 2~32 vCPU'],
          ['XL', '~3,800', '~283', '20GB', '99.99%', '$1.75', '2 x 64 vCPU'],
          ['2XL', '~4,500', '~400', '20GB', '99.99%', '$3.50', '2 x 96 vCPU'],
          ['4XL', '~6,750', '~400', '20GB', '99.99%', '$7.00', '3 x 96 vCPU'],
          ['8XL', '~13,500', '~400', '20GB', '99.99%', '$14.00', '6 x 96 vCPU'],
        ]}
        highlightCol={3}
      />

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
          <h3 className="text-emerald-400 font-bold mb-2">XL+ Exclusive Features</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>etcd DB 20GB (2x expansion)</li>
            <li>etcd Event Sharding (separate partition)</li>
            <li>API Server horizontal scaling (4XL: 3, 8XL: 6)</li>
            <li>99.99% SLA</li>
          </ul>
        </div>

        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
          <h3 className="text-blue-400 font-bold mb-2">Recommended Tier by CRD Scale</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li><Badge color="gray">Standard</Badge> &lt;10 CRDs, small scale</li>
            <li><Badge color="blue">XL</Badge> 10~30 CRDs, medium scale</li>
            <li><Badge color="emerald">2XL</Badge> 30+ CRDs, many controllers</li>
            <li><Badge color="amber">4XL+</Badge> Large-scale AI/ML pipelines</li>
          </ul>
        </div>
      </div>
    </SlideWrapper>
  );
}
