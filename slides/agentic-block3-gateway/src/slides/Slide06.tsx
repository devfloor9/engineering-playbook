import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

const Slide06: React.FC = () => {
  return (
    <SlideWrapper slideNumber={6} title="Cascade Routing Deep Dive">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-green-400 mb-6">
          73% Cost Savings with Intelligent Model Selection
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <Card title="How It Works">
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-green-900/30 rounded-lg">
                <div className="text-2xl font-bold text-green-400">1</div>
                <div>
                  <div className="font-bold text-green-300">Complexity Analysis</div>
                  <div className="text-sm text-gray-400">Token count, code blocks, query type</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-yellow-900/30 rounded-lg">
                <div className="text-2xl font-bold text-yellow-400">2</div>
                <div>
                  <div className="font-bold text-yellow-300">Start Cheap</div>
                  <div className="text-sm text-gray-400">GPT-3.5 Turbo ($0.0005/1K)</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-orange-900/30 rounded-lg">
                <div className="text-2xl font-bold text-orange-400">3</div>
                <div>
                  <div className="font-bold text-orange-300">Quality Check</div>
                  <div className="text-sm text-gray-400">Response quality score threshold</div>
                </div>
              </div>
              <div className="flex items-center gap-4 p-3 bg-red-900/30 rounded-lg">
                <div className="text-2xl font-bold text-red-400">4</div>
                <div>
                  <div className="font-bold text-red-300">Escalate if Needed</div>
                  <div className="text-sm text-gray-400">Haiku → GPT-4o → GPT-4 Turbo</div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="Cost Comparison">
            <div className="space-y-4">
              <div className="p-4 bg-red-900/30 border-l-4 border-red-500 rounded">
                <div className="text-sm text-gray-400 mb-1">All GPT-4 Turbo</div>
                <div className="text-3xl font-bold text-red-400">$50/day</div>
                <div className="text-sm text-gray-500">10,000 requests × $0.01/1K × 500 tokens</div>
              </div>

              <div className="p-4 bg-green-900/30 border-l-4 border-green-500 rounded">
                <div className="text-sm text-gray-400 mb-1">Cascade Routing</div>
                <div className="text-3xl font-bold text-green-400">$13.65/day</div>
                <div className="text-sm text-gray-500">50% cheap + 30% medium + 15% complex + 5% premium</div>
              </div>

              <div className="p-4 bg-gradient-to-r from-green-600/30 to-blue-600/30 rounded-lg text-center">
                <div className="text-4xl font-bold text-green-300">73% Savings</div>
                <div className="text-xl text-gray-300 mt-2">$36.35/day = $1,090/month</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="p-4 bg-green-800/30 rounded-lg text-center">
            <div className="text-xl font-bold text-green-300">50%</div>
            <div className="text-sm text-gray-400">Simple queries</div>
            <div className="text-xs text-green-400">GPT-3.5</div>
          </div>
          <div className="p-4 bg-yellow-800/30 rounded-lg text-center">
            <div className="text-xl font-bold text-yellow-300">30%</div>
            <div className="text-sm text-gray-400">Medium complexity</div>
            <div className="text-xs text-yellow-400">Claude Haiku</div>
          </div>
          <div className="p-4 bg-orange-800/30 rounded-lg text-center">
            <div className="text-xl font-bold text-orange-300">15%</div>
            <div className="text-sm text-gray-400">Complex queries</div>
            <div className="text-xs text-orange-400">GPT-4o</div>
          </div>
          <div className="p-4 bg-red-800/30 rounded-lg text-center">
            <div className="text-xl font-bold text-red-300">5%</div>
            <div className="text-sm text-gray-400">Very complex</div>
            <div className="text-xs text-red-400">GPT-4 Turbo</div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide06;
