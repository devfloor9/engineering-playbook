import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

const Slide07: React.FC = () => {
  return (
    <SlideWrapper slideNumber={7} title="Semantic Caching">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-blue-400 mb-6">
          30% Cost Reduction with Embedding-Based Caching
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Traditional Cache vs Semantic Cache">
            <div className="space-y-4">
              <div className="p-4 bg-red-900/30 border border-red-500/30 rounded-lg">
                <div className="font-bold text-red-300 mb-2">Traditional (Exact Match)</div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between">
                    <span>"How to make web crawler in Python?"</span>
                    <span className="text-green-400">✓</span>
                  </div>
                  <div className="flex justify-between">
                    <span>"How do I create Python web crawler?"</span>
                    <span className="text-red-400">✗</span>
                  </div>
                  <div className="flex justify-between">
                    <span>"Python web scraper tutorial"</span>
                    <span className="text-red-400">✗</span>
                  </div>
                  <p className="text-gray-500 mt-2">Same meaning, different wording = Cache MISS</p>
                </div>
              </div>

              <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                <div className="font-bold text-green-300 mb-2">Semantic Cache (Embedding)</div>
                <div className="space-y-2 text-sm text-gray-300">
                  <div className="flex justify-between items-center">
                    <span>"How to make web crawler in Python?"</span>
                    <span className="text-blue-400">0.95</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>"How do I create Python web crawler?"</span>
                    <span className="text-blue-400">0.92</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>"Python web scraper tutorial"</span>
                    <span className="text-blue-400">0.87</span>
                  </div>
                  <p className="text-gray-500 mt-2">Similarity &gt; 0.85 = Cache HIT ✓</p>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Threshold Selection">
            <div className="space-y-3">
              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300">Threshold: 0.95+</span>
                  <span className="text-red-400">Too Strict</span>
                </div>
                <div className="text-sm text-gray-500">~10% hit rate, very high accuracy</div>
              </div>

              <div className="p-3 bg-green-900/40 border-l-4 border-green-500 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="text-green-300 font-bold">Threshold: 0.85</span>
                  <span className="text-green-400">Recommended</span>
                </div>
                <div className="text-sm text-gray-300">~30% hit rate, high accuracy</div>
              </div>

              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300">Threshold: 0.75</span>
                  <span className="text-yellow-400">Risky</span>
                </div>
                <div className="text-sm text-gray-500">~50% hit rate, false positives</div>
              </div>

              <div className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between mb-1">
                  <span className="text-gray-300">Threshold: &lt;0.70</span>
                  <span className="text-red-400">Too Loose</span>
                </div>
                <div className="text-sm text-gray-500">High hit rate, wrong answers</div>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Cost Impact Example">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Without Cache</div>
              <div className="text-2xl font-bold text-red-400">$4,500/mo</div>
              <div className="text-xs text-gray-500">10K requests/day, all to LLM</div>
            </div>
            <div className="p-4 bg-green-900/30 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">With Semantic Cache</div>
              <div className="text-2xl font-bold text-green-400">$3,150/mo</div>
              <div className="text-xs text-gray-500">30% cached, 70% to LLM</div>
            </div>
            <div className="p-4 bg-blue-900/30 rounded-lg">
              <div className="text-sm text-gray-400 mb-2">Net Savings</div>
              <div className="text-2xl font-bold text-blue-400">$1,350/mo</div>
              <div className="text-xs text-gray-500">29% reduction + instant response</div>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
};

export default Slide07;
