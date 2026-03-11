import { SlideWrapper, Card } from '@shared/components';
import { RotateCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RecoverySlide() {
  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <RotateCcw className="w-10 h-10 text-rose-400" />
        장애 복구 & 롤백
      </h1>

      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card title="자동 Self-Heal" icon={<CheckCircle2 className="w-6 h-6" />} color="emerald">
          <p className="text-xs mb-3">Drift 감지 및 자동 복구</p>
          <ul className="text-xs space-y-2 text-gray-400">
            <li>• kubectl apply 수동 변경 감지</li>
            <li>• Git 상태로 자동 재동기화</li>
            <li>• 30초마다 Health Check</li>
          </ul>
          <div className="mt-3 p-2 bg-emerald-500/10 rounded text-xs text-emerald-400">
            syncPolicy.automated.selfHeal: true
          </div>
        </Card>

        <Card title="자동 Prune" icon={<AlertTriangle className="w-6 h-6" />} color="amber">
          <p className="text-xs mb-3">삭제된 리소스 정리</p>
          <ul className="text-xs space-y-2 text-gray-400">
            <li>• Git에서 제거된 리소스 감지</li>
            <li>• 클러스터에서 자동 삭제</li>
            <li>• Orphan 리소스 방지</li>
          </ul>
          <div className="mt-3 p-2 bg-amber-500/10 rounded text-xs text-amber-400">
            syncPolicy.automated.prune: true
          </div>
        </Card>

        <Card title="수동 롤백" icon={<RotateCcw className="w-6 h-6" />} color="blue">
          <p className="text-xs mb-3">이전 버전으로 복원</p>
          <ul className="text-xs space-y-2 text-gray-400">
            <li>• Git Revert로 커밋 되돌리기</li>
            <li>• ArgoCD UI에서 History 선택</li>
            <li>• 특정 Sync ID로 복원</li>
          </ul>
          <div className="mt-3 p-2 bg-blue-500/10 rounded text-xs text-blue-400">
            argocd app rollback APP REVISION
          </div>
        </Card>
      </div>

      <div className="bg-gray-900 rounded-xl p-6 border border-gray-700 mb-6">
        <h3 className="text-lg font-bold text-white mb-4">롤백 시나리오별 대응</h3>
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-rose-400 font-bold mb-3">긴급 장애 (5분 이내)</div>
            <ol className="space-y-2 text-gray-400">
              <li className="flex gap-2">
                <span className="text-rose-400">1.</span>
                <span>Git Revert로 커밋 되돌리기</span>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400">2.</span>
                <span>ArgoCD 자동 동기화 대기 (또는 수동 Sync)</span>
              </li>
              <li className="flex gap-2">
                <span className="text-rose-400">3.</span>
                <span>Health Check 통과 확인</span>
              </li>
            </ol>
          </div>

          <div>
            <div className="text-amber-400 font-bold mb-3">점진적 롤백 (30분 이내)</div>
            <ol className="space-y-2 text-gray-400">
              <li className="flex gap-2">
                <span className="text-amber-400">1.</span>
                <span>Argo Rollouts의 Canary 중단</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">2.</span>
                <span>트래픽을 Stable 버전으로 전환</span>
              </li>
              <li className="flex gap-2">
                <span className="text-amber-400">3.</span>
                <span>메트릭 모니터링 후 Git Revert</span>
              </li>
            </ol>
          </div>
        </div>
      </div>

      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
        <h3 className="text-purple-400 font-bold mb-2 text-sm">복구 원칙</h3>
        <p className="text-xs text-gray-400">
          모든 복구 작업은 Git을 통해 수행합니다. 직접 kubectl 사용은 금지하며,
          긴급 상황에서도 Git Revert → ArgoCD Sync 순서를 따릅니다.
        </p>
      </div>
    </SlideWrapper>
  );
}
