import { SlideWrapper, CompareTable, Badge } from '@shared/components';

const statuses = [
  ['Pending', '스케줄링 대기', 'kubectl describe pod → Events 확인\nInsufficient cpu/memory, Unschedulable'],
  ['ContainerCreating', '컨테이너 생성 중', 'CNI IP 할당, 이미지 pull, volume mount\nkubectl describe → Events'],
  ['CrashLoopBackOff', '반복 크래시', 'kubectl logs --previous\n앱 에러, OOM, 설정 오류'],
  ['ImagePullBackOff', '이미지 실패', 'ECR 인증, 이미지 태그 존재 여부\nkubectl describe → Events'],
  ['OOMKilled', '메모리 초과', 'resources.limits.memory 증가\n메모리 릭 확인'],
  ['Evicted', '노드에서 축출', '노드 리소스 압박\nkubectl describe node → Conditions'],
  ['Terminating', '종료 중 멈춤', 'Finalizer 확인\nkubectl get pod -o json | jq .metadata.finalizers'],
];

export function PodStatusDiagnosisSlide() {
  return (
    <SlideWrapper>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-3xl font-bold text-rose-400">Pod 상태별 진단 가이드</h2>
        <Badge color="rose">Quick Ref</Badge>
      </div>
      <div className="flex-1 overflow-auto">
        <CompareTable
          headers={['상태', '의미', '진단 방법']}
          rows={statuses}
          highlightCol={0}
        />
      </div>
    </SlideWrapper>
  );
}
