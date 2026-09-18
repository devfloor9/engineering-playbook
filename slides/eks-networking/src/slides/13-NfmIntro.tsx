import { SlideWrapper, Card, CompareTable } from '@shared/components';
import { Activity } from 'lucide-react';

export default function NfmIntroSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-4 flex items-center gap-4">
        <Activity aria-hidden="true" className="w-12 h-12 text-emerald-400" />
        Network Flow Monitor: TCP 소켓 통계 수집
      </h1>
      <p className="text-xl text-gray-400 mb-8">
        커널 TCP 스택이 올려주는 <b className="text-emerald-400">소켓 이벤트 콜백(sock_ops)</b>만 구독
        — TCP 페이로드를 수집하지 않음
      </p>

      <CompareTable
        headers={['항목', 'NFM 에이전트', '패킷 캡처 (미러링/XDP)']}
        rows={[
          ['수집 방식', 'sock_ops 커널 콜백', '패킷 복제/후킹'],
          ['오버헤드', '콜백·맵·유저스페이스 집계 비용', '트래픽 비례'],
          ['수집 범위', 'TCP 소켓 지표 (RTT·재전송·RTO)', '구성에 따른 헤더·페이로드'],
          ['연결 개입', 'BPF_OK 반환, 연결 차단 로직 없음', '경로에 따라 존재'],
        ]}
        highlightCol={1}
      />

      <div className="grid grid-cols-2 gap-6 mt-8">
        <Card title="오픈소스" color="emerald">
          <span className="font-mono">aws/network-flow-monitor-agent</span> — Rust, Apache-2.0, 커널 5.8+.
          수집 항목과 전송 경로를 <b>코드 수준에서 검증 가능</b>
        </Card>
        <Card title="핵심 가치: NHI" color="purple">
          관측된 흐름의 <b>AWS 네트워크 영향 신호(Network Health Indicator)</b>를 제공합니다. NHI 정상만으로 앱 문제라고 확정할 수는 없습니다.
        </Card>
      </div>
    </SlideWrapper>
  );
}
