import React from 'react';
import { SlideWrapper, CompareTable } from '@shared/components';

const Slide11: React.FC = () => {
  const comparison = {
    title: 'Bifrost vs LiteLLM',
    headers: ['Feature', 'Bifrost (Go/Rust)', 'LiteLLM (Python)'],
    rows: [
      ['Language', 'Go/Rust', 'Python'],
      ['Throughput', '50x faster', 'Baseline'],
      ['Memory Usage', '1/10 of LiteLLM', 'Higher (Python runtime)'],
      ['Provider Support', '20+ core providers', '100+ providers'],
      ['Cascade Routing', 'Native', 'Native'],
      ['Semantic Cache', 'Native (Redis)', 'Native (Redis)'],
      ['Budget Control', 'Yes', 'Yes'],
      ['Langfuse Integration', 'success_callback', 'success_callback'],
      ['Python Ecosystem', 'API-only', 'LangChain/LlamaIndex native'],
      ['Kubernetes', 'Helm chart', 'Docker/Helm'],
      ['License', 'Apache 2.0', 'MIT'],
    ],
  };

  return (
    <SlideWrapper slideNumber={11} title="Bifrost vs LiteLLM">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-purple-400 mb-6">
          Performance vs Ecosystem Trade-off
        </h2>

        <CompareTable {...comparison} />

        <div className="grid grid-cols-2 gap-6 mt-8">
          <div className="p-6 bg-gradient-to-br from-purple-900/40 to-blue-900/40 border border-purple-500/30 rounded-lg">
            <h3 className="text-2xl font-bold text-purple-300 mb-4">Choose Bifrost</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-purple-400 mr-3">→</span>
                <span><strong>High throughput required</strong> — 10K+ req/day</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-3">→</span>
                <span><strong>Cost optimization critical</strong> — 50x better perf/cost</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-3">→</span>
                <span><strong>Kubernetes-native deployment</strong> — Helm chart ready</span>
              </li>
              <li className="flex items-start">
                <span className="text-purple-400 mr-3">→</span>
                <span><strong>Core providers sufficient</strong> — OpenAI, Anthropic, Bedrock, Azure</span>
              </li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-blue-900/40 to-green-900/40 border border-blue-500/30 rounded-lg">
            <h3 className="text-2xl font-bold text-blue-300 mb-4">Choose LiteLLM</h3>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">→</span>
                <span><strong>Python ecosystem</strong> — LangChain, LlamaIndex integration</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">→</span>
                <span><strong>100+ providers needed</strong> — Cohere, Hugging Face, etc.</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">→</span>
                <span><strong>Rapid prototyping</strong> — Fast iteration with Python</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-3">→</span>
                <span><strong>Mature documentation</strong> — Extensive guides & examples</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="p-6 bg-gray-800/50 border border-gray-600/30 rounded-lg">
          <h3 className="text-xl font-bold text-gray-300 mb-3">Performance Numbers</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-purple-900/30 rounded">
              <div className="text-3xl font-bold text-purple-400">50x</div>
              <div className="text-sm text-gray-400">Faster throughput</div>
            </div>
            <div className="text-center p-4 bg-green-900/30 rounded">
              <div className="text-3xl font-bold text-green-400">1/10</div>
              <div className="text-sm text-gray-400">Memory usage</div>
            </div>
            <div className="text-center p-4 bg-blue-900/30 rounded">
              <div className="text-3xl font-bold text-blue-400">&lt;5ms</div>
              <div className="text-sm text-gray-400">P99 routing latency</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg text-center">
          <p className="text-lg text-gray-300">
            <strong className="text-blue-400">Bottom Line:</strong> Same API, choose based on performance needs vs ecosystem requirements
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide11;
