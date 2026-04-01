import React from 'react';
import { SlideWrapper, Card, Badge } from '@shared/components';

const Slide12: React.FC = () => {
  return (
    <SlideWrapper slideNumber={12} title="OpenClaw AI Gateway">
      <div className="space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-4xl font-bold text-green-400">OpenClaw</h2>
          <Badge color="green">226K+ GitHub Stars</Badge>
          <Badge color="blue">Alternative Approach</Badge>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <Card title="What is OpenClaw?">
            <div className="space-y-4 text-gray-300">
              <p className="text-lg">
                Universal AI agent framework with autonomous workflow capabilities.
              </p>
              <div className="p-4 bg-green-900/30 border border-green-500/30 rounded-lg">
                <div className="font-bold text-green-300 mb-2">Key Features</div>
                <ul className="space-y-2 text-sm">
                  <li>• Multi-agent orchestration</li>
                  <li>• Tool integration framework</li>
                  <li>• Workflow automation</li>
                  <li>• TypeScript/Node.js based</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card title="Deployment Options">
            <div className="space-y-3">
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="font-bold text-gray-300 mb-2">EC2 + CloudFormation</div>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Quick start template</li>
                  <li>• Single Bedrock model</li>
                  <li>• CloudWatch basic metrics</li>
                  <li>• Good for prototyping</li>
                </ul>
              </div>

              <div className="p-4 bg-green-900/30 border-l-4 border-green-500 rounded-lg">
                <div className="font-bold text-green-300 mb-2">EKS + Bifrost (Recommended)</div>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Multi-model routing</li>
                  <li>• Full observability stack</li>
                  <li>• Cost optimization</li>
                  <li>• Production-ready</li>
                </ul>
              </div>
            </div>
          </Card>
        </div>

        <Card title="EKS Deployment Architecture">
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-blue-800/30 rounded-lg text-center">
              <div className="text-2xl mb-2">🖥️</div>
              <div className="font-bold text-blue-300 mb-1">Graviton4</div>
              <div className="text-xs text-gray-400">ARM64 M8g Spot</div>
            </div>
            <div className="p-4 bg-purple-800/30 rounded-lg text-center">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-bold text-purple-300 mb-1">Bifrost</div>
              <div className="text-xs text-gray-400">Auto-routing</div>
            </div>
            <div className="p-4 bg-green-800/30 rounded-lg text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="font-bold text-green-300 mb-1">Langfuse</div>
              <div className="text-xs text-gray-400">LLM observability</div>
            </div>
            <div className="p-4 bg-orange-800/30 rounded-lg text-center">
              <div className="text-2xl mb-2">🔍</div>
              <div className="font-bold text-orange-300 mb-1">Hubble</div>
              <div className="text-xs text-gray-400">Network flows</div>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Cost Analysis">
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                <span className="text-gray-300">Gateway + Bifrost</span>
                <span className="text-green-400 font-bold">~$30/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                <span className="text-gray-300">Bedrock API</span>
                <span className="text-yellow-400 font-bold">~$15-40/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-800/50 rounded">
                <span className="text-gray-300">Observability</span>
                <span className="text-blue-400 font-bold">~$15/mo</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-900/30 border-t-2 border-green-500 rounded">
                <span className="text-green-300 font-bold">Total</span>
                <span className="text-green-400 font-bold text-xl">~$60-85/mo</span>
              </div>
            </div>
          </Card>

          <Card title="Key Advantages">
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span><strong>20-40% cheaper</strong> with Graviton4 + Spot</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span><strong>Multi-model</strong> content-based routing</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span><strong>3-layer observability</strong> (network/LLM/system)</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-3">✓</span>
                <span><strong>Auto-scaling</strong> with Karpenter</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide12;
