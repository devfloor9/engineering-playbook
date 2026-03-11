import { SlideWrapper, Card, Badge } from '@shared/components';
import { Layers, ArrowDown } from 'lucide-react';

export default function Slide11() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-center bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
        플랫폼 아키텍처 전체 시스템
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-4">
        <Card color="blue" className="p-4">
          <div className="flex items-center gap-3">
            <Badge color="blue" size="md">Layer 1</Badge>
            <Layers className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-semibold text-blue-300">Client Layer</h3>
            <span className="text-sm text-gray-300 ml-auto">API Clients, Web UI, Agent SDK</span>
          </div>
        </Card>

        <div className="flex justify-center">
          <ArrowDown className="w-6 h-6 text-gray-600" />
        </div>

        <Card color="amber" className="p-4">
          <div className="flex items-center gap-3">
            <Badge color="amber" size="md">Layer 2</Badge>
            <Layers className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-semibold text-amber-300">Gateway Layer</h3>
            <span className="text-sm text-gray-300 ml-auto">Kgateway, Authentication, Rate Limiter</span>
          </div>
        </Card>

        <div className="flex justify-center">
          <ArrowDown className="w-6 h-6 text-gray-600" />
        </div>

        <Card color="emerald" className="p-4">
          <div className="flex items-center gap-3">
            <Badge color="emerald" size="md">Layer 3</Badge>
            <Layers className="w-6 h-6 text-emerald-400" />
            <h3 className="text-xl font-semibold text-emerald-300">Agent Layer</h3>
            <span className="text-sm text-gray-300 ml-auto">Kagent Controller, Agent Instances, Tool Registry</span>
          </div>
        </Card>

        <div className="flex justify-center">
          <ArrowDown className="w-6 h-6 text-gray-600" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card color="rose" className="p-4">
            <div className="flex flex-col gap-2">
              <Badge color="rose" size="md" className="w-fit">Layer 4</Badge>
              <h3 className="text-lg font-semibold text-pink-300">Model Serving</h3>
              <span className="text-xs text-gray-300">vLLM, TGI, llm-d</span>
            </div>
          </Card>

          <Card color="purple" className="p-4">
            <div className="flex flex-col gap-2">
              <Badge color="purple" size="md" className="w-fit">Layer 5</Badge>
              <h3 className="text-lg font-semibold text-purple-300">Data Layer</h3>
              <span className="text-xs text-gray-300">Milvus, Redis, S3</span>
            </div>
          </Card>

          <Card color="cyan" className="p-4">
            <div className="flex flex-col gap-2">
              <Badge color="cyan" size="md" className="w-fit">Layer 6</Badge>
              <h3 className="text-lg font-semibold text-cyan-300">Observability</h3>
              <span className="text-xs text-gray-300">LangFuse, Prometheus, Grafana</span>
            </div>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
