import { SlideWrapper, Card } from '@shared/components';
import { Activity, Shield, Zap, CheckCircle } from 'lucide-react';

export default function Slide02() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-emerald-400">Overview</h2>
      <p className="text-2xl text-gray-300 mb-8">
        Pod의 헬스체크와 라이프사이클 관리는 서비스 안정성과 가용성의 핵심입니다.
      </p>
      <div className="grid grid-cols-2 gap-6">
        <Card title="무중단 배포" icon={<Zap size={24} />} color="blue">
          롤링 업데이트 시 트래픽 유실 방지. Readiness Probe와 preStop Hook으로 안전한 전환 보장.
        </Card>
        <Card title="빠른 장애 감지" icon={<Activity size={24} />} color="rose">
          비정상 Pod 자동 격리 및 재시작. Liveness Probe로 데드락 상태 감지 및 복구.
        </Card>
        <Card title="리소스 최적화" icon={<CheckCircle size={24} />} color="amber">
          느린 시작 앱의 조기 재시작 방지. Startup Probe로 초기화 시간 확보.
        </Card>
        <Card title="데이터 무결성" icon={<Shield size={24} />} color="emerald">
          종료 시 진행 중인 요청 안전하게 완료. Graceful Shutdown으로 데이터 손실 방지.
        </Card>
      </div>
      <div className="mt-8 text-center text-gray-500 text-lg">
        Kubernetes Probe의 동작 원리부터 언어별 Graceful Shutdown 구현까지 Pod 라이프사이클 전체를 다룹니다.
      </div>
    </SlideWrapper>
  );
}
