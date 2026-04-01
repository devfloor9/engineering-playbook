import { SlideWrapper, Card } from '@shared/components';

export default function Slide09() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-purple-400">RAG Quality Pipeline</h2>
        <p className="text-xl text-gray-300 mb-8">
          Continuous evaluation, feedback collection, and iterative improvement
        </p>

        <div className="mb-8">
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-blue-400">Evaluate → Feedback → Improve Cycle</h3>
            <div className="bg-gray-900/50 p-6 rounded-lg">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="bg-blue-500/20 rounded-lg p-4 border border-blue-500/50">
                    <div className="text-3xl mb-2">📊</div>
                    <p className="font-semibold text-blue-400">Evaluate</p>
                    <p className="text-xs text-gray-400 mt-2">RAGAS metrics on test set</p>
                  </div>
                  <div className="text-blue-400 text-2xl my-2">→</div>
                </div>

                <div className="text-center">
                  <div className="bg-purple-500/20 rounded-lg p-4 border border-purple-500/50">
                    <div className="text-3xl mb-2">🔍</div>
                    <p className="font-semibold text-purple-400">Identify Issues</p>
                    <p className="text-xs text-gray-400 mt-2">Low scores? Root cause analysis</p>
                  </div>
                  <div className="text-purple-400 text-2xl my-2">→</div>
                </div>

                <div className="text-center">
                  <div className="bg-green-500/20 rounded-lg p-4 border border-green-500/50">
                    <div className="text-3xl mb-2">🔧</div>
                    <p className="font-semibold text-green-400">Fix & Tune</p>
                    <p className="text-xs text-gray-400 mt-2">Improve retrieval or prompt</p>
                  </div>
                  <div className="text-green-400 text-2xl my-2">→</div>
                </div>

                <div className="text-center">
                  <div className="bg-yellow-500/20 rounded-lg p-4 border border-yellow-500/50">
                    <div className="text-3xl mb-2">✅</div>
                    <p className="font-semibold text-yellow-400">Re-evaluate</p>
                    <p className="text-xs text-gray-400 mt-2">Verify improvement</p>
                  </div>
                  <div className="text-yellow-400 text-2xl my-2">↺</div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card>
            <h3 className="text-xl font-semibold mb-4 text-green-400">Automated Evaluation (CI/CD)</h3>
            <div className="bg-gray-900/50 p-4 rounded text-xs font-mono">
              <div className="text-green-300"># GitHub Actions workflow</div>
              <div className="text-gray-400">on: [push, pull_request]</div>
              <div className="text-blue-300 mt-2">jobs:</div>
              <div className="ml-4 text-blue-300">rag-evaluation:</div>
              <div className="ml-8 text-gray-400">- Checkout code</div>
              <div className="ml-8 text-gray-400">- Run RAGAS on test_set.json</div>
              <div className="ml-8 text-yellow-300">- Check quality gates:</div>
              <div className="ml-12 text-gray-400">faithfulness &gt;= 0.80</div>
              <div className="ml-12 text-gray-400">answer_relevancy &gt;= 0.75</div>
              <div className="ml-8 text-red-300">- Fail build if thresholds not met</div>
            </div>
          </Card>

          <Card>
            <h3 className="text-xl font-semibold mb-4 text-purple-400">Manual Annotation (Langfuse)</h3>
            <div className="space-y-3">
              <div className="bg-gray-900/50 p-3 rounded">
                <p className="font-semibold text-blue-400 mb-1">Annotation Queue</p>
                <p className="text-xs text-gray-400">Team reviews random sample of traces</p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded">
                <p className="font-semibold text-green-400 mb-1">Quality Labels</p>
                <p className="text-xs text-gray-400">Excellent / Good / Poor + Issue tags</p>
              </div>
              <div className="bg-gray-900/50 p-3 rounded">
                <p className="font-semibold text-yellow-400 mb-1">Feedback Loop</p>
                <p className="text-xs text-gray-400">Poor answers → Dataset for retraining</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-gradient-to-r from-blue-500/10 to-green-500/10 p-5 rounded-lg border border-blue-500/30">
          <h4 className="text-lg font-semibold mb-3 text-blue-300">Production Monitoring</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-400 mb-1">Daily RAGAS run on random 100 queries</p>
              <p className="text-green-300">→ Detect quality drift early</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">CloudWatch alarm if score drops &gt;10%</p>
              <p className="text-yellow-300">→ Alert ML team immediately</p>
            </div>
            <div>
              <p className="text-gray-400 mb-1">Weekly review meeting with RAGAS dashboard</p>
              <p className="text-blue-300">→ Prioritize improvements</p>
            </div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
