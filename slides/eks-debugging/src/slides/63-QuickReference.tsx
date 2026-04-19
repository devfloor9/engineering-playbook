import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { Badge } from '../components/Badge';
import { BookOpen } from 'lucide-react';

export default function QuickReference() {
  return (
    <SlideWrapper accent="orange">
      <div className="flex items-center gap-4 mb-6">
        <BookOpen size={36} className="text-[#ff9900]" />
        <div>
          <Badge color="orange">Quick Reference</Badge>
          <h1 className="text-5xl font-bold mt-1">Top 10 에러 빠른 참조표</h1>
        </div>
      </div>

      <CompareTable
        headers={['에러 / 증상', '원인', '핵심 명령어']}
        highlightCol={2}
        rows={[
          ['CrashLoopBackOff', '앱 크래시, 설정 오류, OOM', 'kubectl logs <pod> --previous'],
          ['ImagePullBackOff', '이미지 미존재, 인증 실패', 'kubectl describe pod → Events'],
          ['Pending (노드 부족)', '리소스 부족, Taint 불일치', 'kubectl describe pod → FailedScheduling'],
          ['OOMKilled', '메모리 limits 초과', 'kubectl describe pod → Last State'],
          ['Service Endpoints <none>', 'Selector/Label 불일치', 'kubectl get endpoints <svc>'],
          ['DNS 해석 실패', 'CoreDNS OOM, ndots:5', 'kubectl logs -n kube-system -l k8s-app=kube-dns'],
          ['PVC Pending', 'AZ 불일치, CSI 권한', 'kubectl describe pvc → Events'],
          ['EBS Attach 실패', '볼륨 제한 초과, Detach 지연', 'kubectl describe pod → FailedAttachVolume'],
          ['GPU not found', 'Driver 미설치, Device Plugin', 'kubectl get clusterpolicy -A'],
          ['NCCL Timeout', 'SG 차단, EFA 미설치', 'kubectl logs <pod> | grep NCCL'],
        ]}
        delay={0.2}
      />
    </SlideWrapper>
  );
}
