import { SlideWrapper, Card } from '@shared/components';
import { Server, Database, Shield, Bot, Activity, Archive } from 'lucide-react';

export default function Slide03() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold text-center mb-2 text-cyan-300">
        왜 컨테이너/EKS가 Agentic AI의 기반인가
      </h2>
      <p className="text-xl text-gray-400 text-center mb-6">
        AI 에이전트 = 수십 개의 마이크로서비스 조합
      </p>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <div className="grid grid-cols-3 gap-5">
          <Card color="blue" className="p-5">
            <Server className="w-12 h-12 text-blue-400 mb-3" />
            <h4 className="text-xl font-bold mb-2 text-blue-300">LLM Serving</h4>
            <p className="text-base text-gray-300">
              vLLM, llm-d 기반 모델 추론 서버
            </p>
          </Card>

          <Card color="purple" className="p-5">
            <Database className="w-12 h-12 text-purple-400 mb-3" />
            <h4 className="text-xl font-bold mb-2 text-purple-300">Vector DB</h4>
            <p className="text-base text-gray-300">
              Milvus 등 RAG 파이프라인 핵심
            </p>
          </Card>

          <Card color="emerald" className="p-5">
            <Shield className="w-12 h-12 text-emerald-400 mb-3" />
            <h4 className="text-xl font-bold mb-2 text-emerald-300">API Gateway</h4>
            <p className="text-base text-gray-300">
              Bifrost/kgateway 트래픽 관리
            </p>
          </Card>

          <Card color="cyan" className="p-5">
            <Bot className="w-12 h-12 text-cyan-400 mb-3" />
            <h4 className="text-xl font-bold mb-2 text-cyan-300">Agent Runtime</h4>
            <p className="text-base text-gray-300">
              도구 호출, 메모리, 오케스트레이션
            </p>
          </Card>

          <Card color="amber" className="p-5">
            <Activity className="w-12 h-12 text-amber-400 mb-3" />
            <h4 className="text-xl font-bold mb-2 text-amber-300">Monitoring</h4>
            <p className="text-base text-gray-300">
              추론 지연, 비용, 품질 모니터링
            </p>
          </Card>

          <Card color="rose" className="p-5">
            <Archive className="w-12 h-12 text-rose-400 mb-3" />
            <h4 className="text-xl font-bold mb-2 text-rose-300">Model Registry</h4>
            <p className="text-base text-gray-300">
              모델 버전 관리, A/B 배포
            </p>
          </Card>
        </div>

        <div className="bg-cyan-500/20 rounded-xl px-8 py-4 border-2 border-cyan-400/60 text-center" style={{boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)'}}>
          <p className="text-xl text-white font-bold">
            프로덕션 AI 에이전트 = 평균 <span className="text-cyan-300">15~20개 Pod</span> 조합 — 컨테이너 오케스트레이션 없이는 운영 불가
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
