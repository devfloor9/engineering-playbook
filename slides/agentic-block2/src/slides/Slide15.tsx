import { SlideWrapper, Card } from '@shared/components';
import { Cloud, Shield, Zap, Network } from 'lucide-react';

export default function Slide15() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-6 text-orange-400">Bedrock AgentCore</h2>
        <p className="text-xl text-gray-400 mb-6">완전 관리형 AI Agent 런타임 및 MCP 프로토콜</p>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <Card className="p-6 bg-orange-900/20 border-orange-500/30">
            <Cloud className="w-10 h-10 text-orange-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-orange-300">AgentCore란?</h3>
            <p className="text-gray-400 mb-3">
              Amazon Bedrock AgentCore는 완전 관리형 AI 에이전트 프로덕션 런타임입니다
            </p>
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• 2025 AWS re:Invent 발표 (Preview)</li>
              <li>• MCP 프로토콜 네이티브 지원</li>
              <li>• 서버리스 실행 환경</li>
              <li>• CloudWatch Gen AI Observability 통합</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Network className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-blue-300">3계층 구조</h3>
            <div className="space-y-3">
              <div className="p-3 bg-orange-900/30 rounded">
                <div className="text-sm font-semibold text-orange-400 mb-1">AgentCore Runtime</div>
                <div className="text-xs text-gray-400">AI 에이전트 관리형 실행 환경 (Strands/LangGraph)</div>
              </div>
              <div className="p-3 bg-blue-900/30 rounded">
                <div className="text-sm font-semibold text-blue-400 mb-1">AgentCore Gateway</div>
                <div className="text-xs text-gray-400">MCP 프로토콜 라우터, Cognito JWT 인증</div>
              </div>
              <div className="p-3 bg-emerald-900/30 rounded">
                <div className="text-sm font-semibold text-emerald-400 mb-1">MCP Tools</div>
                <div className="text-xs text-gray-400">Lambda, EKS MCP 서버, 커스텀 도구</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Shield className="w-8 h-8 text-purple-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-purple-300">보안</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Cognito JWT 인증</li>
              <li>• IAM 권한 관리</li>
              <li>• VPC 프라이빗 엔드포인트</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Zap className="w-8 h-8 text-amber-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-amber-300">성능</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• 서버리스 오토스케일링</li>
              <li>• 도구 검색 최적화</li>
              <li>• 멀티 리전 지원</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Cloud className="w-8 h-8 text-cyan-400 mb-3" />
            <h4 className="text-lg font-semibold mb-2 text-cyan-300">관측성</h4>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• CloudWatch 메트릭 자동 수집</li>
              <li>• 엔드투엔드 트레이싱</li>
              <li>• 토큰 사용량 추적</li>
            </ul>
          </Card>
        </div>

        <div className="mt-4 p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
          <p className="text-sm text-amber-300">
            <span className="font-semibold">주의:</span> AgentCore는 Preview 단계이므로 프로덕션 적용 전 충분한 테스트 필요
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
