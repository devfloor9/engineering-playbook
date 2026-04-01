import { SlideWrapper, Card, CodeBlock } from '@shared/components';

export default function Slide13() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Multi-Tenant Isolation
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card title="Partition Key Strategy">
              <div className="space-y-4 text-gray-300">
                <p className="text-sm">
                  Logical data separation within a single collection
                </p>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>Tenant ID as partition key</li>
                  <li>Query-time filtering</li>
                  <li>Shared index optimization</li>
                  <li>Cost-efficient for many tenants</li>
                </ul>
                <div className="mt-4 p-3 bg-blue-500/10 rounded text-xs">
                  <strong>Use case:</strong> SaaS with 1000+ small tenants
                </div>
              </div>
            </Card>

            <Card title="Namespace Separation">
              <div className="space-y-4 text-gray-300">
                <p className="text-sm">
                  Physical isolation with dedicated collections
                </p>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>Collection per tenant</li>
                  <li>Independent indexes</li>
                  <li>Better performance isolation</li>
                  <li>Easier data migration</li>
                </ul>
                <div className="mt-4 p-3 bg-purple-500/10 rounded text-xs">
                  <strong>Use case:</strong> Enterprise with large, distinct tenants
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Partition Key Example">
              <CodeBlock language="python" code={`# Insert with partition key
collection.insert([
  {
    "tenant_id": "acme-corp",
    "text": "Product docs",
    "embedding": [0.1, 0.2, ...]
  }
])

# Query with filter
results = collection.search(
  data=[query_vector],
  anns_field="embedding",
  param={"metric": "COSINE"},
  limit=5,
  expr='tenant_id == "acme-corp"'
)`} />
            </Card>

            <Card title="Isolation Guarantees">
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Data never crosses tenant boundaries</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Query results filtered by tenant ID</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Resource quotas per tenant</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-green-400">✓</span>
                  <span>Audit logs track tenant access</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
