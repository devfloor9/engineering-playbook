import { SlideWrapper, Card, CodeBlock } from '@shared/components';

export default function Slide10() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Memory in AI Agents
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card title="Context Window">
              <div className="space-y-3 text-gray-300 text-sm">
                <p><strong>In-flight conversation state</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Recent messages (10-100)</li>
                  <li>System prompt</li>
                  <li>Temporary variables</li>
                </ul>
                <div className="mt-3 p-2 bg-blue-500/10 rounded text-xs">
                  Storage: In-memory, fast access
                </div>
              </div>
            </Card>

            <Card title="RAG (Retrieval-Augmented Generation)">
              <div className="space-y-3 text-gray-300 text-sm">
                <p><strong>External knowledge retrieval</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Vector similarity search</li>
                  <li>Top-K relevant documents</li>
                  <li>Injected into prompt</li>
                </ul>
                <div className="mt-3 p-2 bg-purple-500/10 rounded text-xs">
                  Storage: Milvus, Pinecone, Weaviate
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Conversation History">
              <div className="space-y-3 text-gray-300 text-sm">
                <p><strong>Persistent session state</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Multi-turn dialogs</li>
                  <li>User preferences</li>
                  <li>Session metadata</li>
                </ul>
                <div className="mt-3 p-2 bg-green-500/10 rounded text-xs">
                  Storage: Redis, PostgreSQL
                </div>
              </div>
            </Card>

            <Card title="Tool Patterns">
              <div className="space-y-3 text-gray-300 text-sm">
                <p><strong>Learned behaviors</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Successful tool sequences</li>
                  <li>Error recovery patterns</li>
                  <li>User-specific workflows</li>
                </ul>
                <div className="mt-3 p-2 bg-yellow-500/10 rounded text-xs">
                  Storage: Vector DB + metadata
                </div>
              </div>
            </Card>
          </div>
        </div>

        <Card title="Memory Configuration Example">
          <CodeBlock language="yaml" code={`memory:
  type: redis
  config:
    host: redis-master.svc
    ttl: 3600
    maxHistory: 50
  longTermMemory:
    enabled: true
    vectorStore:
      type: milvus
      collection: agent-memories`} />
        </Card>
      </div>
    </SlideWrapper>
  );
}
