import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { RefreshCw, Bug, FileText } from 'lucide-react';

const code = `# 현재 로그 확인
kubectl logs <pod-name> -c <container>

# 이전 크래시 로그 확인
kubectl logs <pod-name> --previous

# 컨테이너 상태 상세
kubectl get pod <pod-name> -o jsonpath='{.status.containerStatuses[0].lastState}'

# 디버깅 컨테이너 (ephemeral)
kubectl debug -it <pod-name> --image=busybox --target=<container>`;

export function CrashLoopBackOffSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-6 text-rose-400">CrashLoopBackOff 분석</h2>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="space-y-4">
          <Card title="주요 원인" icon={<Bug size={20} />} color="rose">
            <ul className="space-y-2">
              <li><strong>앱 에러</strong>: 코드 버그, 설정 누락, 잘못된 환경변수</li>
              <li><strong>OOM</strong>: 메모리 limit 초과 → Exit Code 137</li>
              <li><strong>Permission</strong>: 파일/포트 권한 부족</li>
              <li><strong>Config</strong>: ConfigMap/Secret 마운트 실패</li>
              <li><strong>Dependency</strong>: DB, API 연결 실패</li>
            </ul>
          </Card>
          <Card title="Exit Code 해석" icon={<FileText size={20} />} color="amber">
            <ul className="space-y-1">
              <li><strong>0</strong>: 정상 종료 (restartPolicy 확인)</li>
              <li><strong>1</strong>: 앱 에러</li>
              <li><strong>137</strong>: SIGKILL (OOM 또는 preStop 타임아웃)</li>
              <li><strong>143</strong>: SIGTERM (graceful shutdown)</li>
            </ul>
          </Card>
          <Card title="해결 전략" icon={<RefreshCw size={20} />} color="emerald">
            <p>--previous 로그 → 원인 파악 → ephemeral container로 디버깅 → 수정 배포</p>
          </Card>
        </div>
        <CodeBlock code={code} title="CrashLoop 진단" language="bash" />
      </div>
    </SlideWrapper>
  );
}
