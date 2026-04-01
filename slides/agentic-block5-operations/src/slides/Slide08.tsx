import { SlideWrapper, Card } from '@shared/components';

export default function Slide08() {
  return (
    <SlideWrapper>
      <div className="p-12">
        <h2 className="text-5xl font-bold mb-8 text-green-400">RAGAS Evaluation</h2>
        <p className="text-xl text-gray-300 mb-8">
          Automated RAG quality assessment with specialized metrics
        </p>

        <div className="grid grid-cols-2 gap-6 mb-8">
          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-green-400">Core Metrics</h3>
            <div className="space-y-4">
              <div className="bg-gray-900/50 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-blue-400">Faithfulness</span>
                  <span className="text-2xl font-bold text-blue-300">0.92</span>
                </div>
                <p className="text-xs text-gray-400">Answer supported by retrieved context? (0-1)</p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-purple-400">Answer Relevancy</span>
                  <span className="text-2xl font-bold text-purple-300">0.88</span>
                </div>
                <p className="text-xs text-gray-400">Answer addresses the question? (0-1)</p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div className="bg-purple-500 h-2 rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-yellow-400">Context Precision</span>
                  <span className="text-2xl font-bold text-yellow-300">0.85</span>
                </div>
                <p className="text-xs text-gray-400">Retrieved chunks are relevant? (0-1)</p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>

              <div className="bg-gray-900/50 p-4 rounded">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold text-orange-400">Context Recall</span>
                  <span className="text-2xl font-bold text-orange-300">0.78</span>
                </div>
                <p className="text-xs text-gray-400">Ground truth covered in context? (0-1)</p>
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div className="bg-orange-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <h3 className="text-2xl font-semibold mb-4 text-purple-400">How RAGAS Works</h3>
            <div className="space-y-4">
              <div className="bg-gray-900/50 p-4 rounded border-l-4 border-green-500">
                <p className="font-semibold text-green-400 mb-2">1. Prepare Dataset</p>
                <p className="text-sm text-gray-400">
                  question, answer, contexts, ground_truth (optional)
                </p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded border-l-4 border-blue-500">
                <p className="font-semibold text-blue-400 mb-2">2. Run Evaluation</p>
                <p className="text-sm text-gray-400">
                  RAGAS uses LLM-as-Judge to score each metric
                </p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded border-l-4 border-purple-500">
                <p className="font-semibold text-purple-400 mb-2">3. Analyze Results</p>
                <p className="text-sm text-gray-400">
                  Identify weak points: retrieval vs generation issues
                </p>
              </div>

              <div className="bg-gray-900/50 p-4 rounded border-l-4 border-yellow-500">
                <p className="font-semibold text-yellow-400 mb-2">4. Iterate & Improve</p>
                <p className="text-sm text-gray-400">
                  Tune chunking, embedding, reranking, prompts
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-800/50 p-5 rounded-lg border border-blue-500/30">
            <h4 className="text-sm font-semibold mb-2 text-blue-400">Low Faithfulness?</h4>
            <p className="text-xs text-gray-400">Answer hallucinates or contradicts context</p>
            <p className="text-xs text-green-300 mt-2">→ Strengthen prompt: "Answer ONLY from context"</p>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-purple-500/30">
            <h4 className="text-sm font-semibold mb-2 text-purple-400">Low Context Precision?</h4>
            <p className="text-xs text-gray-400">Retrieved chunks are irrelevant noise</p>
            <p className="text-xs text-green-300 mt-2">→ Add reranker or tune embedding model</p>
          </div>

          <div className="bg-gray-800/50 p-5 rounded-lg border border-yellow-500/30">
            <h4 className="text-sm font-semibold mb-2 text-yellow-400">Low Context Recall?</h4>
            <p className="text-xs text-gray-400">Missing relevant chunks from retrieval</p>
            <p className="text-xs text-green-300 mt-2">→ Increase top-k or improve chunking strategy</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
