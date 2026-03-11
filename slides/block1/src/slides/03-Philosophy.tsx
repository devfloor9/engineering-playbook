import { SlideWrapper, Card } from '@shared/components';
import { GitBranch, FileCode, Repeat, ShieldCheck } from 'lucide-react';

export default function PhilosophySlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-12 flex items-center gap-4">
        <GitBranch className="w-12 h-12 text-blue-400" />
        GitOps 철학과 원칙
      </h1>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card title="선언적 시스템" icon={<FileCode className="w-6 h-6" />} color="blue">
          <p className="mb-3">전체 시스템을 선언적으로 정의</p>
          <ul className="space-y-1 text-xs">
            <li>• 원하는 상태를 명시적으로 기술</li>
            <li>• Git을 단일 진실 공급원(SSOT)으로 사용</li>
            <li>• 버전 관리와 감사 추적 자동 확보</li>
          </ul>
        </Card>

        <Card title="자동 동기화" icon={<Repeat className="w-6 h-6" />} color="emerald">
          <p className="mb-3">Git 변경사항이 자동으로 클러스터 반영</p>
          <ul className="space-y-1 text-xs">
            <li>• 지속적인 상태 조정(Reconciliation)</li>
            <li>• Drift 감지 및 자동 복구</li>
            <li>• 수동 개입 최소화</li>
          </ul>
        </Card>

        <Card title="불변 배포" icon={<ShieldCheck className="w-6 h-6" />} color="purple">
          <p className="mb-3">배포는 항상 Git에서 시작</p>
          <ul className="space-y-1 text-xs">
            <li>• kubectl apply 직접 실행 금지</li>
            <li>• Pull 기반 배포 모델</li>
            <li>• 추적 가능한 모든 변경사항</li>
          </ul>
        </Card>

        <Card title="지속적 검증" icon={<Repeat className="w-6 h-6" />} color="amber">
          <p className="mb-3">실시간 상태 검증 및 알림</p>
          <ul className="space-y-1 text-xs">
            <li>• Health Check 지속 실행</li>
            <li>• 정책 위반 사전 차단</li>
            <li>• 롤백 자동화 가능</li>
          </ul>
        </Card>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
        <h3 className="text-xl font-bold text-blue-400 mb-3">핵심 가치</h3>
        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="text-2xl font-bold text-white mb-1">재현성</div>
            <div className="text-gray-400">언제든 동일한 상태 복원</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white mb-1">투명성</div>
            <div className="text-gray-400">모든 변경 이력 추적</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white mb-1">신뢰성</div>
            <div className="text-gray-400">자동화된 검증 및 복구</div>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
