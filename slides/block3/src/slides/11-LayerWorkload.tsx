import { SlideWrapper, Card } from '@shared/components';
import { Box, RefreshCw, TrendingUp, AlertCircle } from 'lucide-react';

export function LayerWorkloadSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-6 text-rose-400">Layer 5: 워크로드</h2>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <Card title="Pod 상태 이상" icon={<Box size={20} />} color="rose">
          <ul className="space-y-2">
            <li><strong>Pending</strong>: 리소스 부족, 스케줄링 실패</li>
            <li><strong>CrashLoopBackOff</strong>: 앱 크래시 반복</li>
            <li><strong>ImagePullBackOff</strong>: 이미지 가져오기 실패</li>
            <li><strong>OOMKilled</strong>: 메모리 초과</li>
            <li><strong>Evicted</strong>: 노드 리소스 압박</li>
          </ul>
        </Card>
        <Card title="Deployment 이슈" icon={<RefreshCw size={20} />} color="blue">
          <ul className="space-y-2">
            <li><strong>롤아웃 멈춤</strong>: maxUnavailable/maxSurge 확인</li>
            <li><strong>ReplicaSet 충돌</strong>: selector 중복</li>
            <li><strong>롤백 실패</strong>: revision history 확인</li>
          </ul>
        </Card>
        <Card title="HPA/VPA" icon={<TrendingUp size={20} />} color="emerald">
          <ul className="space-y-2">
            <li><strong>스케일링 안됨</strong>: metrics-server 확인</li>
            <li><strong>Flapping</strong>: stabilizationWindowSeconds 조정</li>
            <li><strong>HPA+VPA 충돌</strong>: VPA는 CPU 제외 모드</li>
          </ul>
        </Card>
        <Card title="Probe 실패" icon={<AlertCircle size={20} />} color="amber">
          <ul className="space-y-2">
            <li><strong>Readiness 실패</strong>: Service 엔드포인트 제외</li>
            <li><strong>Liveness 실패</strong>: 컨테이너 재시작</li>
            <li><strong>Startup 실패</strong>: 초기화 시간 부족</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
