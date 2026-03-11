import { SlideWrapper, Card } from '@shared/components';
import { CloudCog, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function Slide15() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-emerald-400">ALB 연동 시 주의사항</h2>
      <p className="text-xl text-gray-300 mb-6">
        AWS Load Balancer Controller를 사용하는 경우, ALB 헬스체크와 Readiness Probe를 동기화해야 무중단 배포가 가능합니다.
      </p>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card title="ALB 헬스체크" icon={<CloudCog size={24} />} color="blue">
          <ul className="space-y-2 text-sm">
            <li>• <strong>실행 주체:</strong> AWS Load Balancer</li>
            <li>• <strong>체크 대상:</strong> Target Group의 IP:Port</li>
            <li>• <strong>실패 시:</strong> Target에서 제거 (트래픽 차단)</li>
            <li>• <strong>기본 간격:</strong> 30초</li>
            <li>• <strong>타임아웃:</strong> 5초</li>
          </ul>
        </Card>
        <Card title="Readiness Probe" icon={<CheckCircle2 size={24} />} color="emerald">
          <ul className="space-y-2 text-sm">
            <li>• <strong>실행 주체:</strong> kubelet</li>
            <li>• <strong>체크 대상:</strong> Pod 컨테이너</li>
            <li>• <strong>실패 시:</strong> Service Endpoints에서 제거</li>
            <li>• <strong>기본 간격:</strong> 10초</li>
            <li>• <strong>타임아웃:</strong> 1초</li>
          </ul>
        </Card>
      </div>
      <Card title="권장 설정 전략" icon={<AlertTriangle size={24} />} color="amber">
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-amber-300 mb-2">1. 동일한 경로 사용</p>
              <p className="text-gray-400">ALB와 Readiness Probe 모두 <code className="bg-gray-800 px-2 py-1 rounded">/ready</code> 사용</p>
            </div>
            <div>
              <p className="font-semibold text-amber-300 mb-2">2. Readiness 간격 짧게</p>
              <p className="text-gray-400">Readiness periodSeconds를 ALB보다 짧게 설정 (예: 5초)</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="font-semibold text-amber-300 mb-2">3. Pod Readiness Gates</p>
              <p className="text-gray-400">AWS LB Controller v2.5+에서 지원. ALB 등록 완료까지 Pod Ready 지연</p>
            </div>
            <div>
              <p className="font-semibold text-amber-300 mb-2">4. preStop Hook 필수</p>
              <p className="text-gray-400">5초 sleep으로 Endpoints 제거 시간 확보</p>
            </div>
          </div>
        </div>
      </Card>
      <div className="mt-4 bg-rose-500/10 border border-rose-500/30 rounded-lg p-3 text-sm">
        <p className="text-rose-400 font-semibold mb-2">❌ 흔한 실수</p>
        <p className="text-gray-300">
          ALB 헬스체크 경로와 Readiness Probe 경로가 다르면, Pod이 준비되지 않았는데도 ALB가 트래픽을 전송하여 502/503 에러 발생!
        </p>
      </div>
    </SlideWrapper>
  );
}
