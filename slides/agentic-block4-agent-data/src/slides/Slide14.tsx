import { SlideWrapper, Card, FlowDiagram } from '@shared/components';

export default function Slide14() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Keycloak OIDC Authentication
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <Card title="Why Keycloak?">
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                Enterprise-grade identity and access management for agents
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li>OpenID Connect (OIDC) standard</li>
                <li>OAuth 2.0 flows</li>
                <li>Service account tokens</li>
                <li>Fine-grained permissions</li>
                <li>Multi-realm support</li>
                <li>SSO integration</li>
              </ul>
            </div>
          </Card>

          <Card title="Agent Authentication Flow">
            <div className="space-y-3 text-sm text-gray-300">
              <div>
                <strong className="text-blue-400">1. Agent Startup:</strong>
                <p className="ml-4 text-gray-400">Request service account token</p>
              </div>
              <div>
                <strong className="text-green-400">2. Token Validation:</strong>
                <p className="ml-4 text-gray-400">Keycloak verifies credentials</p>
              </div>
              <div>
                <strong className="text-purple-400">3. Access Token:</strong>
                <p className="ml-4 text-gray-400">JWT with roles & permissions</p>
              </div>
              <div>
                <strong className="text-yellow-400">4. API Calls:</strong>
                <p className="ml-4 text-gray-400">Bearer token in Authorization header</p>
              </div>
              <div>
                <strong className="text-orange-400">5. Token Refresh:</strong>
                <p className="ml-4 text-gray-400">Automatic renewal before expiry</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-8">
          <FlowDiagram
            nodes={[
              { id: 'agent', label: 'Agent Pod', color: 'blue' },
              { id: 'keycloak', label: 'Keycloak\nOIDC', color: 'green' },
              { id: 'milvus', label: 'Milvus API', color: 'purple' },
              { id: 'tools', label: 'External\nTools', color: 'yellow' },
            ]}
            edges={[
              { from: 'agent', to: 'keycloak', label: '1. Auth request' },
              { from: 'keycloak', to: 'agent', label: '2. JWT token' },
              { from: 'agent', to: 'milvus', label: '3. API call + token' },
              { from: 'agent', to: 'tools', label: '4. Tool call + token' },
            ]}
          />
        </div>

        <div className="mt-8 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
          <p className="text-sm text-gray-300 text-center">
            <strong className="text-green-400">Security Best Practice:</strong> All agent-to-service communication authenticated via OIDC tokens
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
