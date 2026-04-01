import { SlideWrapper, Card, Badge } from '@shared/components';

export default function Slide07() {
  return (
    <SlideWrapper>
      <div className="space-y-8">
        <h2 className="text-5xl font-bold text-white mb-8">
          Tool Registry & Security
        </h2>

        <div className="grid grid-cols-2 gap-8">
          <Card title="Centralized Tool Registry">
            <div className="space-y-4 text-gray-300">
              <p className="text-sm">
                Kubernetes-native tool catalog with versioning and access control
              </p>
              <ul className="space-y-2 list-disc list-inside text-sm">
                <li>Tool CRDs as single source of truth</li>
                <li>Version management & rollback</li>
                <li>Dependency tracking</li>
                <li>Discovery & documentation</li>
              </ul>
            </div>
          </Card>

          <Card title="Security Measures">
            <div className="space-y-3">
              <div className="flex items-start space-x-3">
                <Badge color="red">Critical</Badge>
                <div className="text-sm text-gray-300">
                  <strong>Scope Limits:</strong> Tools only access declared resources
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge color="yellow">High</Badge>
                <div className="text-sm text-gray-300">
                  <strong>Poisoning Prevention:</strong> Tool validation & sandboxing
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Badge color="blue">Medium</Badge>
                <div className="text-sm text-gray-300">
                  <strong>Timeout Enforcement:</strong> Prevent runaway tools
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card title="Tool Execution Safeguards">
          <div className="grid grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="text-green-400 font-semibold mb-2">Authentication</h4>
              <ul className="space-y-1 text-gray-300 list-disc list-inside">
                <li>OIDC/OAuth2</li>
                <li>API key rotation</li>
                <li>Service accounts</li>
              </ul>
            </div>
            <div>
              <h4 className="text-purple-400 font-semibold mb-2">Authorization</h4>
              <ul className="space-y-1 text-gray-300 list-disc list-inside">
                <li>RBAC policies</li>
                <li>Resource quotas</li>
                <li>Network policies</li>
              </ul>
            </div>
            <div>
              <h4 className="text-blue-400 font-semibold mb-2">Monitoring</h4>
              <ul className="space-y-1 text-gray-300 list-disc list-inside">
                <li>Audit logging</li>
                <li>Usage metrics</li>
                <li>Anomaly detection</li>
              </ul>
            </div>
          </div>
        </Card>

        <div className="mt-8 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
          <p className="text-sm text-red-200">
            <strong>Security First:</strong> Every tool must pass validation before registration
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
