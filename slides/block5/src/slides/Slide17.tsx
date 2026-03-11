import { SlideWrapper, Card, Badge } from '@shared/components';
import { CheckCircle, Shield, Zap, Target } from 'lucide-react';

export default function Slide17() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-emerald-400">운영 베스트 프랙티스</h2>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card title="Probe 설계 원칙" icon={<Target size={24} />} color="blue">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Liveness는 애플리케이션 <strong>자체 상태만</strong> 확인</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Readiness는 <strong>의존성 포함</strong> 가능</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Startup Probe로 <strong>느린 시작 앱 보호</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>failureThreshold는 <strong>3 이상</strong> 권장</span>
            </li>
          </ul>
        </Card>

        <Card title="Graceful Shutdown 원칙" icon={<Shield size={24} />} color="emerald">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>preStop Hook에 <strong>5초 sleep</strong> 필수</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>terminationGracePeriodSeconds <strong>60초</strong> 권장</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>SIGTERM 핸들러에 <strong>타임아웃</strong> 설정</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-400">•</span>
              <span>종료 중 <strong>새 요청 거부</strong></span>
            </li>
          </ul>
        </Card>

        <Card title="ALB 통합" icon={<Zap size={24} />} color="amber">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>ALB와 Readiness <strong>동일한 경로</strong> 사용</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>Pod Readiness Gates <strong>활성화</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>ALB healthcheck interval <strong>10초</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-amber-400">•</span>
              <span>healthy/unhealthy threshold <strong>2회</strong></span>
            </li>
          </ul>
        </Card>

        <Card title="모니터링 & 알림" icon={<CheckCircle size={24} />} color="rose">
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="text-rose-400">•</span>
              <span>Probe 실패율 <strong>모니터링</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400">•</span>
              <span>Pod 재시작 횟수 <strong>추적</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400">•</span>
              <span>Graceful Shutdown 시간 <strong>측정</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-rose-400">•</span>
              <span>5xx 에러율 <strong>알림 설정</strong></span>
            </li>
          </ul>
        </Card>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 text-center">
          <Badge color="emerald" size="lg">✅ 무중단 배포</Badge>
          <p className="text-gray-400 mt-2">Probe + Graceful Shutdown</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-3 text-center">
          <Badge color="blue" size="lg">✅ 빠른 복구</Badge>
          <p className="text-gray-400 mt-2">적절한 Probe 타이밍</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-center">
          <Badge color="amber" size="lg">✅ 데이터 보호</Badge>
          <p className="text-gray-400 mt-2">충분한 종료 시간</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
