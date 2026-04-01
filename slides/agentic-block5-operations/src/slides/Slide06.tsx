import { SlideWrapper, Card, CodeBlock } from '@shared/components';

export default function Slide06() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-purple-400">SDK-Level Monitoring</h2>
        <p className="text-xl text-gray-300 mb-8">
          Deep visibility with Langfuse SDK in Agent Server (not client)
        </p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Integration Point</h3>
            <CodeBlock
              language="python"
              code={`# agent_server.py (Backend)
from langfuse import Langfuse
from langfuse.decorators import observe

langfuse = Langfuse(
    public_key=os.getenv("LANGFUSE_PK"),
    secret_key=os.getenv("LANGFUSE_SK"),
    host="https://langfuse.internal"
)

@observe(name="agent_execution")
def run_agent(user_query: str, user_id: str):
    langfuse_context.update_current_trace(
        user_id=user_id,
        tags=["production", "agent-v2"]
    )

    # Step 1: Vector search
    with langfuse_context.span("vector_search"):
        docs = search_kb(user_query)

    # Step 2: LLM reasoning
    response = llm.invoke(user_query)

    return response`}
            />
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-4 text-blue-400">What Gets Tracked</h3>
            <div className="space-y-3 text-sm">
              <div className="bg-gray-900/50 p-3 rounded">
                <p className="font-semibold text-green-400 mb-1">Nested Spans</p>
                <p className="text-gray-400">Query → Search → Rerank → LLM → Synthesis</p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded">
                <p className="font-semibold text-yellow-400 mb-1">Tool Calls</p>
                <p className="text-gray-400">Function name, args, duration, success/failure</p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded">
                <p className="font-semibold text-blue-400 mb-1">LLM Generation</p>
                <p className="text-gray-400">Model, input/output tokens, temperature, cost</p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded">
                <p className="font-semibold text-purple-400 mb-1">Metadata</p>
                <p className="text-gray-400">User ID, session ID, environment, version</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-green-500/10 to-blue-500/10 p-6 rounded-lg border border-green-500/30">
            <h4 className="text-lg font-semibold mb-3 text-green-400">Advantages</h4>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Full agent visibility</strong> — Step-by-step execution</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Prompt versioning</strong> — Track template changes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>A/B testing</strong> — Compare prompt variants</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Evaluation pipeline</strong> — Automated quality scoring</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 p-6 rounded-lg border border-yellow-500/30">
            <h4 className="text-lg font-semibold mb-3 text-yellow-400">Important: Server-Side Only</h4>
            <div className="space-y-3 text-gray-300">
              <p className="flex items-start gap-2">
                <span className="text-yellow-400 mt-1">⚠</span>
                <span><strong>Never in client code</strong> — Secret key exposure risk</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <span><strong>Agent Server</strong> — Backend API wraps LLM calls</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-400 mt-1">→</span>
                <span><strong>Gateway passthrough</strong> — Client → Gateway → Agent Server</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-green-400 mt-1">✓</span>
                <span><strong>Secure secrets</strong> — K8s Secret or AWS Secrets Manager</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
