import { SlideWrapper, Card } from '@shared/components';
import { GitBranch, Layers, Eye } from 'lucide-react';

export default function Slide14() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
        모델 배포 전략
      </h2>

      <div className="grid grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <GitBranch className="w-8 h-8 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">Canary 배포</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            신규 모델에 트래픽을 점진적으로 전환
          </p>
          <div className="space-y-2">
            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-2">
              <div className="text-xs text-gray-400 mb-1">단계</div>
              <div className="text-sm text-cyan-300">
                5% → 25% → 50% → 100%
              </div>
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 점진적 트래픽 전환</li>
              <li>• 메트릭 모니터링</li>
              <li>• 자동 롤백</li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-8 h-8 text-blue-400" />
            <h3 className="text-xl font-bold text-white">Blue-Green 배포</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            두 개의 동일한 환경을 유지하며 즉시 전환
          </p>
          <div className="space-y-2">
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2">
              <div className="text-xs text-gray-400 mb-1">방식</div>
              <div className="text-sm text-blue-300">
                Blue (현재) ↔ Green (신규)
              </div>
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 즉각적인 전환</li>
              <li>• 빠른 롤백</li>
              <li>• 제로 다운타임</li>
            </ul>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Eye className="w-8 h-8 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Shadow 배포</h3>
          </div>
          <p className="text-sm text-gray-300 mb-3">
            신규 모델에 복제된 트래픽을 전송하여 테스트
          </p>
          <div className="space-y-2">
            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2">
              <div className="text-xs text-gray-400 mb-1">방식</div>
              <div className="text-sm text-purple-300">
                프로덕션 트래픽 복제
              </div>
            </div>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 프로덕션 미영향</li>
              <li>• 실제 트래픽 테스트</li>
              <li>• 성능 비교 분석</li>
            </ul>
          </div>
        </Card>
      </div>

      <Card className="bg-gray-800/50 mt-6">
        <h3 className="text-xl font-bold text-white mb-4">KServe InferenceService 트래픽 분배</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3">
            <div className="text-sm font-bold text-cyan-300 mb-2">Canary 설정</div>
            <div className="text-xs font-mono text-gray-300">
              canaryTrafficPercent: 20<br/>
              latencyThreshold: 100ms<br/>
              errorRateThreshold: 5%
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded p-3">
            <div className="text-sm font-bold text-blue-300 mb-2">자동 롤백</div>
            <div className="text-xs font-mono text-gray-300">
              if error_rate {">"} 5%:<br/>
              &nbsp;&nbsp;rollback to previous<br/>
              &nbsp;&nbsp;send alert
            </div>
          </div>
        </div>
      </Card>
    </SlideWrapper>
  );
}
