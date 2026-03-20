import { SlideWrapper, Card } from '@shared/components';
import { TrendingDown, Calendar, Users } from 'lucide-react';

export default function Slide11() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold text-center mb-6 bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
        검증된 성과 & 행사 소개
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-6">
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-emerald-500/15 rounded-xl p-6 border-2 border-emerald-400/50 text-center" style={{boxShadow: '0 0 25px rgba(16, 185, 129, 0.15)'}}>
            <TrendingDown className="w-16 h-16 text-emerald-400 mx-auto mb-3" />
            <p className="text-6xl font-bold text-white mb-2">40-60%</p>
            <p className="text-lg text-emerald-200">TCO 절감</p>
            <p className="text-sm text-gray-400 mt-1">VMware → EKS 마이그레이션</p>
          </div>

          <div className="bg-blue-500/15 rounded-xl p-6 border-2 border-blue-400/50 text-center" style={{boxShadow: '0 0 25px rgba(59, 130, 246, 0.15)'}}>
            <TrendingDown className="w-16 h-16 text-blue-400 mx-auto mb-3" />
            <p className="text-6xl font-bold text-white mb-2">75%</p>
            <p className="text-lg text-blue-200">GPU 비용 절감</p>
            <p className="text-sm text-gray-400 mt-1">MIG + Karpenter + Caching</p>
          </div>

          <div className="bg-purple-500/15 rounded-xl p-6 border-2 border-purple-400/50 text-center" style={{boxShadow: '0 0 25px rgba(139, 92, 246, 0.15)'}}>
            <TrendingDown className="w-16 h-16 text-purple-400 mx-auto mb-3" />
            <p className="text-6xl font-bold text-white mb-2">80%</p>
            <p className="text-lg text-purple-200">운영 복잡도 감소</p>
            <p className="text-sm text-gray-400 mt-1">AgentCore 매니지드 전환</p>
          </div>
        </div>

        <div className="bg-gray-900 rounded-xl p-6 border border-cyan-500/30">
          <div className="flex items-center gap-4 mb-4">
            <Calendar className="w-12 h-12 text-cyan-400" />
            <div>
              <h3 className="text-3xl font-bold text-cyan-300">Modern Agentic Applications Day</h3>
              <p className="text-lg text-gray-400">2026년 4월 9일 (수) | 센터필드 18층</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-4">
            <Card color="blue" className="p-5">
              <h4 className="text-lg font-semibold text-blue-300 mb-1">Track 1: Modern Agentic Infra</h4>
              <p className="text-sm text-gray-300">EKS + GPU + vLLM + Hybrid Nodes — AI 인프라 Deep Dive</p>
            </Card>
            <Card color="emerald" className="p-5">
              <h4 className="text-lg font-semibold text-emerald-300 mb-1">Track 2: Modern Agentic Apps</h4>
              <p className="text-sm text-gray-300">AgentCore + Hosted MCP — 에이전트 개발 & 운영 실전 가이드</p>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 text-gray-400">
          <Users className="w-6 h-6" />
          <p className="text-lg">200명 한정 | 2개 트랙 | CTO, VP Engineering, 플랫폼 엔지니어링 리더 대상</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
