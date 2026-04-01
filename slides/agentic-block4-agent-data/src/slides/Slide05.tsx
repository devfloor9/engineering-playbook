import { SlideWrapper, Card, CodeBlock } from '@shared/components';

export default function Slide05() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Model Context Protocol (MCP)
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            <Card title="What is MCP?">
              <div className="space-y-4 text-gray-300">
                <p className="text-sm">
                  Standard protocol for connecting AI agents to external tools and data sources
                </p>
                <ul className="space-y-2 list-disc list-inside text-sm">
                  <li>Tool discovery & registration</li>
                  <li>Structured request/response</li>
                  <li>Security & authentication</li>
                  <li>Error handling & retries</li>
                </ul>
              </div>
            </Card>

            <Card title="MCP Benefits">
              <ul className="space-y-2 text-gray-300 text-sm">
                <li><strong>Standardization:</strong> Uniform tool interface</li>
                <li><strong>Portability:</strong> Tools work across agents</li>
                <li><strong>Security:</strong> Scoped permissions</li>
                <li><strong>Observability:</strong> Built-in tracing</li>
              </ul>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Tool Connection Example">
              <CodeBlock language="yaml" code={`apiVersion: kagent.dev/v1alpha1
kind: Tool
metadata:
  name: search-knowledge
spec:
  type: retrieval
  retrieval:
    vectorStore:
      type: milvus
      host: milvus-proxy.svc
      collection: knowledge
    search:
      topK: 5
      scoreThreshold: 0.7`} />
            </Card>

            <div className="text-center text-gray-400 text-sm p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
              <p>MCP enables secure, standardized agent-tool communication</p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
