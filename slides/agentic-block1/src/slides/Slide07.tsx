import { SlideWrapper, Card, Badge } from '@shared/components';
import { Settings, Workflow, Zap, GitBranch } from 'lucide-react';

export default function Slide07() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">
        <Badge color="emerald" size="lg" className="text-2xl px-4 py-2">도전과제 4</Badge>
      </h2>
      <h3 className="text-4xl font-bold mb-8 text-center text-emerald-300">
        FM 파인튜닝과 자동화 파이프라인
      </h3>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Settings className="w-10 h-10 text-emerald-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-2xl font-semibold mb-2 text-emerald-300">핵심 문제</h4>
              <p className="text-lg text-gray-300">
                대규모 Foundation Model 파인튜닝은 복잡하고 시간이 오래 걸리며 자동화가 어려움
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Workflow className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-purple-300">분산 학습</h4>
            <p className="text-sm text-gray-300">
              멀티 GPU/멀티 노드 분산 학습 자동 구성
            </p>
          </Card>

          <Card className="p-5">
            <Zap className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">고속 통신</h4>
            <p className="text-sm text-gray-300">
              NCCL + EFA를 통한 GPU 간 고속 통신 최적화
            </p>
          </Card>

          <Card className="p-5">
            <GitBranch className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-amber-300">파이프라인 자동화</h4>
            <p className="text-sm text-gray-300">
              데이터 준비부터 배포까지 End-to-End 자동화
            </p>
          </Card>
        </div>

        <Card color="emerald" className="p-6">
          <h4 className="text-xl font-semibold mb-3 text-emerald-300">솔루션 스택</h4>
          <ul className="text-base text-gray-300 space-y-2">
            <li>• NVIDIA NeMo: 대규모 모델 학습 프레임워크</li>
            <li>• Kubeflow Training Operators: PyTorchJob, MPIJob 자동화</li>
            <li>• Karpenter Training NodePool: EFA 네트워크 최적화</li>
            <li>• MLflow: 모델 레지스트리 및 버전 관리</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
