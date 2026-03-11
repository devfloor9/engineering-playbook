import { SlideWrapper, Card, Badge } from '@shared/components';
import { FolderTree, Shield } from 'lucide-react';

export default function Slide17() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        네임스페이스 구성 전략
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <FolderTree className="w-10 h-10 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-blue-300">관심사 분리 및 보안 격리</h3>
              <p className="text-lg text-gray-300">
                기능별 네임스페이스 분리로 명확한 경계와 독립적인 리소스 관리
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <Badge className="mb-2 bg-amber-500/20 text-amber-300">ai-gateway</Badge>
            <h4 className="text-lg font-semibold mb-2 text-amber-300">Gateway 네임스페이스</h4>
            <p className="text-sm text-gray-400 mb-2">Kgateway, Auth Service, Rate Limiter</p>
            <div className="text-xs text-gray-500">
              Pod Security: restricted, Istio injection: enabled
            </div>
          </Card>

          <Card className="p-5">
            <Badge className="mb-2 bg-emerald-500/20 text-emerald-300">ai-agents</Badge>
            <h4 className="text-lg font-semibold mb-2 text-emerald-300">Agents 네임스페이스</h4>
            <p className="text-sm text-gray-400 mb-2">Kagent Controller, Agent Pods, Tool Registry</p>
            <div className="text-xs text-gray-500">
              Pod Security: baseline, Istio injection: enabled
            </div>
          </Card>

          <Card className="p-5">
            <Badge className="mb-2 bg-pink-500/20 text-pink-300">ai-inference</Badge>
            <h4 className="text-lg font-semibold mb-2 text-pink-300">Inference 네임스페이스</h4>
            <p className="text-sm text-gray-400 mb-2">vLLM Deployments, TGI, GPU Nodes</p>
            <div className="text-xs text-gray-500">
              Pod Security: privileged (GPU 접근)
            </div>
          </Card>

          <Card className="p-5">
            <Badge className="mb-2 bg-purple-500/20 text-purple-300">ai-data</Badge>
            <h4 className="text-lg font-semibold mb-2 text-purple-300">Data 네임스페이스</h4>
            <p className="text-sm text-gray-400 mb-2">Milvus Cluster, Redis Cluster</p>
            <div className="text-xs text-gray-500">
              Pod Security: baseline, StatefulSet 기반
            </div>
          </Card>

          <Card className="p-5">
            <Badge className="mb-2 bg-cyan-500/20 text-cyan-300">observability</Badge>
            <h4 className="text-lg font-semibold mb-2 text-cyan-300">Observability 네임스페이스</h4>
            <p className="text-sm text-gray-400 mb-2">LangFuse, Prometheus, Grafana, OTEL Collector</p>
            <div className="text-xs text-gray-500">
              Pod Security: baseline, 메트릭 통합
            </div>
          </Card>

          <Card className="p-5 bg-blue-900/20 border-blue-700">
            <Shield className="w-8 h-8 text-blue-400 mb-2" />
            <h4 className="text-lg font-semibold mb-2 text-blue-300">리소스 격리</h4>
            <p className="text-sm text-gray-400">
              ResourceQuota, NetworkPolicy로 네임스페이스 간 격리 및 할당량 관리
            </p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
