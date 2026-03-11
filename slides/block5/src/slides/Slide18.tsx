import { SlideWrapper, Badge } from '@shared/components';
import { CheckCircle2 } from 'lucide-react';

export default function Slide18() {
  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col items-center justify-center">
        <CheckCircle2 className="w-24 h-24 text-emerald-400 mb-8" />
        <h2 className="text-6xl font-bold mb-12 text-emerald-400">Key Takeaways</h2>
        <div className="space-y-6 text-2xl text-gray-300 max-w-5xl">
          <div className="flex items-start gap-4 bg-gray-800/50 p-6 rounded-xl border border-emerald-500/30">
            <Badge color="emerald" size="lg">1</Badge>
            <p>
              <strong className="text-emerald-400">세 가지 Probe를 올바르게 구분:</strong> Startup은 초기화 보호,
              Liveness는 데드락 감지, Readiness는 트래픽 제어
            </p>
          </div>
          <div className="flex items-start gap-4 bg-gray-800/50 p-6 rounded-xl border border-blue-500/30">
            <Badge color="blue" size="lg">2</Badge>
            <p>
              <strong className="text-blue-400">Liveness에 외부 의존성 포함 금지:</strong> DB/Redis 장애 시
              Cascading Failure 발생. Readiness에서만 확인하세요.
            </p>
          </div>
          <div className="flex items-start gap-4 bg-gray-800/50 p-6 rounded-xl border border-amber-500/30">
            <Badge color="amber" size="lg">3</Badge>
            <p>
              <strong className="text-amber-400">preStop Hook 5초 sleep 필수:</strong> Endpoint 제거와 비동기로
              실행되므로 트래픽 유실 방지를 위해 대기 시간 확보
            </p>
          </div>
          <div className="flex items-start gap-4 bg-gray-800/50 p-6 rounded-xl border border-rose-500/30">
            <Badge color="rose" size="lg">4</Badge>
            <p>
              <strong className="text-rose-400">Graceful Shutdown 구현:</strong> SIGTERM 수신 시 새 요청 거부,
              진행 중 작업 완료, 타임아웃 설정으로 데이터 무결성 보장
            </p>
          </div>
          <div className="flex items-start gap-4 bg-gray-800/50 p-6 rounded-xl border border-purple-500/30">
            <Badge color="purple" size="lg">5</Badge>
            <p>
              <strong className="text-purple-400">Native Sidecar 활용:</strong> Kubernetes 1.28+에서
              restartPolicy: Always로 종료 순서 보장
            </p>
          </div>
        </div>
      </div>
      <div className="text-center text-gray-600 text-sm">
        Pod Health & Graceful Shutdown | EKS 1.30+ | Kubernetes 1.30+
      </div>
    </SlideWrapper>
  );
}
