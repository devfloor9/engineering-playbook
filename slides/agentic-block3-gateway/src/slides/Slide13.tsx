import React from 'react';
import { SlideWrapper, Card, Badge } from '@shared/components';

const Slide13: React.FC = () => {
  return (
    <SlideWrapper slideNumber={13} title="MCP / A2A Protocol">
      <div className="space-y-8">
        <h2 className="text-4xl font-bold text-pink-400 mb-6">
          Agent Tool Connections
        </h2>

        <div className="grid grid-cols-2 gap-6">
          <Card title="Model Context Protocol (MCP)">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Badge color="pink">JSON-RPC</Badge>
                <Badge color="purple">Stateful</Badge>
              </div>

              <div className="p-4 bg-pink-900/30 border border-pink-500/30 rounded-lg">
                <div className="font-bold text-pink-300 mb-2">Purpose</div>
                <p className="text-gray-300 text-sm">
                  Standardized protocol for AI agents to discover and invoke tools/functions
                </p>
              </div>

              <div className="space-y-2 text-gray-300">
                <div className="font-bold text-pink-300 mb-2">Key Features</div>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Tool Discovery</strong> — Agents enumerate available tools</li>
                  <li>• <strong>Schema Validation</strong> — Type-safe function calls</li>
                  <li>• <strong>Session Management</strong> — Long-lived connections</li>
                  <li>• <strong>Bidirectional</strong> — Tools can push updates</li>
                </ul>
              </div>

              <div className="p-3 bg-gray-800/50 rounded text-xs font-mono text-gray-400">
                POST /mcp/v1/tools/call<br/>
                &#123; "method": "search_db",<br/>
                &nbsp;&nbsp;"params": &#123; "query": "..." &#125; &#125;
              </div>
            </div>
          </Card>

          <Card title="Agent-to-Agent (A2A)">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <Badge color="blue">HTTP/WebSocket</Badge>
                <Badge color="green">Peer-to-peer</Badge>
              </div>

              <div className="p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
                <div className="font-bold text-blue-300 mb-2">Purpose</div>
                <p className="text-gray-300 text-sm">
                  Direct communication between AI agents for collaborative workflows
                </p>
              </div>

              <div className="space-y-2 text-gray-300">
                <div className="font-bold text-blue-300 mb-2">Key Features</div>
                <ul className="space-y-2 text-sm">
                  <li>• <strong>Task Delegation</strong> — Agent A → Agent B</li>
                  <li>• <strong>Context Sharing</strong> — Shared state management</li>
                  <li>• <strong>Coordination</strong> — Multi-agent orchestration</li>
                  <li>• <strong>Streaming</strong> — Real-time progress updates</li>
                </ul>
              </div>

              <div className="p-3 bg-gray-800/50 rounded text-xs font-mono text-gray-400">
                POST /a2a/v1/delegate<br/>
                &#123; "to": "coding_agent",<br/>
                &nbsp;&nbsp;"task": "fix_bug", ... &#125;
              </div>
            </div>
          </Card>
        </div>

        <Card title="agentgateway Support">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-pink-900/30 rounded-lg">
              <div className="font-bold text-pink-300 mb-2">Stateful Sessions</div>
              <p className="text-sm text-gray-300">
                MCP requires long-lived JSON-RPC sessions — agentgateway maintains session context
              </p>
            </div>
            <div className="p-4 bg-purple-900/30 rounded-lg">
              <div className="font-bold text-purple-300 mb-2">Tool Poisoning Prevention</div>
              <p className="text-sm text-gray-300">
                Validates tool invocations against allowlist, prevents malicious tool injection
              </p>
            </div>
            <div className="p-4 bg-blue-900/30 rounded-lg">
              <div className="font-bold text-blue-300 mb-2">Per-session Authorization</div>
              <p className="text-sm text-gray-300">
                JWT-based auth per session, role-based tool access control
              </p>
            </div>
          </div>
        </Card>

        <div className="p-6 bg-gray-800/50 border border-gray-600/30 rounded-lg">
          <h3 className="text-xl font-bold text-gray-300 mb-4">Routing Configuration</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-pink-900/20 rounded">
              <div className="text-pink-400 font-mono mb-1">/mcp/v1/*</div>
              <div className="text-gray-400">→ agentgateway (MCP handler)</div>
            </div>
            <div className="p-3 bg-blue-900/20 rounded">
              <div className="text-blue-400 font-mono mb-1">/a2a/v1/*</div>
              <div className="text-gray-400">→ agentgateway (A2A handler)</div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-pink-900/30 border border-pink-500/30 rounded-lg">
          <p className="text-lg text-gray-300">
            <strong className="text-pink-400">Why agentgateway?</strong> Envoy data plane is stateless and not designed for AI-specific protocols like MCP/A2A
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
};

export default Slide13;
