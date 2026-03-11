import { SlideWrapper, Card } from '@shared/components';
import { Network, GitBranch, Shield, Zap } from 'lucide-react';

export default function Slide02() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <h2 className="text-5xl font-bold mb-8 text-blue-400">개요</h2>
        <p className="text-2xl text-gray-300 mb-8">
          대규모 AI 모델 서빙 환경에서 추론 요청의 효율적 라우팅과 에이전트 관리가 핵심입니다
        </p>

        <div className="grid grid-cols-2 gap-6 mt-6">
          <Card className="p-6">
            <Network className="w-10 h-10 text-blue-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-blue-300">Inference Gateway</h3>
            <p className="text-gray-300">
              요청 특성에 따른 최적의 모델 백엔드 선택
            </p>
            <p className="text-gray-300 mt-2">
              가중치 기반 로드 밸런싱으로 안정적인 서비스 제공
            </p>
          </Card>

          <Card className="p-6">
            <GitBranch className="w-10 h-10 text-emerald-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-emerald-300">Agent 관리</h3>
            <p className="text-gray-300">
              Kubernetes Operator 패턴 기반 에이전트 라이프사이클 관리
            </p>
            <p className="text-gray-300 mt-2">
              선언적 CRD로 에이전트, 도구, 워크플로우 정의
            </p>
          </Card>

          <Card className="p-6">
            <Shield className="w-10 h-10 text-purple-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-purple-300">고가용성</h3>
            <p className="text-gray-300">
              폴백, 재시도, 서킷 브레이커로 서비스 연속성 보장
            </p>
            <p className="text-gray-300 mt-2">
              점진적 배포로 안전한 모델 업데이트
            </p>
          </Card>

          <Card className="p-6">
            <Zap className="w-10 h-10 text-amber-400 mb-4" />
            <h3 className="text-2xl font-semibold mb-3 text-amber-300">동적 스케일링</h3>
            <p className="text-gray-300">
              HPA/KEDA 통합으로 트래픽에 따른 자동 확장
            </p>
            <p className="text-gray-300 mt-2">
              멀티 에이전트 오케스트레이션으로 복잡한 워크플로우 처리
            </p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
