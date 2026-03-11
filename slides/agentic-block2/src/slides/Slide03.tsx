import { SlideWrapper, Card } from '@shared/components';
import { Network, Layers, Server, Activity } from 'lucide-react';

export default function Slide03() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-blue-400">Kgateway 아키텍처</h2>
        <p className="text-xl text-gray-300 mb-6">Gateway API 기반 추론 라우팅 전체 구조</p>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card color="blue" className="p-5">
            <Network className="w-8 h-8 text-blue-400 mb-3" />
            <h4 className="font-semibold mb-2 text-blue-300">Client Layer</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• API Clients</li>
              <li>• Agent SDK</li>
              <li>• Web Dashboard</li>
            </ul>
          </Card>

          <Card color="cyan" className="p-5">
            <Layers className="w-8 h-8 text-cyan-400 mb-3" />
            <h4 className="font-semibold mb-2 text-cyan-300">Gateway Layer</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• GatewayClass (kgateway)</li>
              <li>• Gateway 리소스</li>
              <li>• HTTPRoute 라우팅 규칙</li>
            </ul>
          </Card>

          <Card color="emerald" className="p-5">
            <Server className="w-8 h-8 text-emerald-400 mb-3" />
            <h4 className="font-semibold mb-2 text-emerald-300">Backend Services</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• vLLM (GPT-4, Claude)</li>
              <li>• TGI (Mixtral-8x7B)</li>
              <li>• 가중치 기반 분배</li>
            </ul>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <h4 className="text-lg font-semibold mb-3 text-purple-300">주요 컴포넌트</h4>
            <div className="space-y-2 text-sm text-gray-300">
              <div className="flex items-start gap-2">
                <span className="text-blue-400 font-mono">GatewayClass:</span>
                <span>Gateway 구현체 정의</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-cyan-400 font-mono">Gateway:</span>
                <span>리스너 및 라우팅 진입점</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-emerald-400 font-mono">HTTPRoute:</span>
                <span>헤더/경로 기반 라우팅</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-amber-400 font-mono">BackendLBPolicy:</span>
                <span>로드 밸런싱 정책</span>
              </div>
            </div>
          </Card>

          <Card className="p-5">
            <Activity className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-lg font-semibold mb-3 text-purple-300">트래픽 플로우</h4>
            <ol className="space-y-1 text-sm text-gray-300">
              <li>1. 클라이언트 요청 (x-model-id 헤더)</li>
              <li>2. Gateway에서 라우팅 규칙 매칭</li>
              <li>3. 가중치 기반 백엔드 선택</li>
              <li>4. 모델 백엔드로 요청 전달</li>
              <li>5. 추론 결과 반환</li>
            </ol>
          </Card>
        </div>

        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg border border-blue-500/30">
          <p className="text-sm text-blue-300">
            <span className="font-semibold">Gateway API 표준:</span> Kubernetes 네이티브 Gateway API로 벤더 중립적 설정 가능
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
