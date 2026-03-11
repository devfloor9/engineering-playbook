import { SlideWrapper, CompareTable } from '@shared/components';
import { Cpu, Sparkles } from 'lucide-react';

export default function Slide13() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-8">
          <Cpu className="w-16 h-16 text-blue-400" />
          <h2 className="text-5xl font-bold text-blue-400">GPU 리소스 관리 개요</h2>
        </div>

        <div className="mb-8">
          <h3 className="text-3xl font-semibold text-purple-400 mb-6">두 가지 접근 방식</h3>
          <CompareTable
            headers={["특성", "Device Plugin", "DRA (Dynamic Resource Allocation)"]}
            rows={[
              ["할당 시점", "노드 시작 시 (정적)", "Pod 스케줄링 시 (동적)"],
              ["할당 단위", "전체 GPU만 가능", "GPU 분할 가능 (MIG, time-slicing)"],
              ["우선순위", "없음 (선착순)", "ResourceClaim 우선순위 지원"],
              ["멀티 리소스", "불가능", "Pod 수준에서 여러 리소스 조율"],
              ["Kubernetes 버전", "1.8+", "1.26+ (Alpha), 1.32+ (v1beta1), 1.33+ (GA)"],
              ["성숙도", "프로덕션", "1.33+ 프로덕션 준비"],
            ]}
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="p-6 bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Cpu className="w-10 h-10 text-blue-400" />
              <h4 className="text-2xl font-semibold text-white">Device Plugin</h4>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>• 레거시 GPU 관리 방식</li>
              <li>• 전체 GPU 단위로만 할당</li>
              <li>• 간단한 설정</li>
              <li>• 프로덕션 안정성</li>
            </ul>
          </div>

          <div className="p-6 bg-gradient-to-br from-cyan-900/40 to-emerald-900/40 rounded-xl">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-10 h-10 text-cyan-400" />
              <h4 className="text-2xl font-semibold text-white">DRA (1.33+)</h4>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li>• 유연한 GPU 파티셔닝</li>
              <li>• MIG, time-slicing 지원</li>
              <li>• 동적 리소스 할당</li>
              <li>• K8s 1.33+ GA 상태</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
