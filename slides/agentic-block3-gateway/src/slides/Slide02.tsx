import React from 'react';
import { SlideWrapper, Card } from '@shared/components';

const Slide02: React.FC = () => {
  return (
    <SlideWrapper slideNumber={2} title="Why AI Gateway?">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-blue-400 mb-8">
          Different from Traditional API Gateway
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Traditional API Gateway">
            <ul className="space-y-3 text-lg text-gray-300">
              <li className="flex items-start">
                <span className="text-red-400 mr-3">✗</span>
                <span>Simple HTTP routing</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">✗</span>
                <span>No token awareness</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">✗</span>
                <span>Basic rate limiting</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">✗</span>
                <span>No cost tracking</span>
              </li>
              <li className="flex items-start">
                <span className="text-red-400 mr-3">✗</span>
                <span>Single provider</span>
              </li>
            </ul>
          </Card>

          <Card title="AI Gateway">
            <ul className="space-y-3 text-lg text-gray-300">
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span>Semantic caching</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span>Token rate limiting</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span>Cascade routing (cheap→premium)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span>Cost tracking & budget control</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span>100+ provider abstraction</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span>Prompt/completion observability</span>
              </li>
            </ul>
          </Card>
        </div>

        <div className="mt-8 p-6 bg-blue-900/30 border border-blue-500/30 rounded-lg">
          <p className="text-xl text-blue-300">
            <strong>Key Insight:</strong> AI workloads need specialized routing, caching, and cost optimization beyond traditional API gateways
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide02;
