import { SlideWrapper, CompareTable, Card } from '@shared/components';
import { Cpu } from 'lucide-react';

export default function SockOpsSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Cpu aria-hidden="true" className="w-12 h-12 text-purple-400" />
        커널 측: 콜백별 수집 항목
      </h1>
      <p className="text-lg text-gray-400 mb-6">
        단일 <span className="font-mono text-purple-300">BPF_PROG_TYPE_SOCK_OPS</span> 프로그램,
        cgroup v2 attach — 연결을 차단하지 않도록 BPF_OK 반환
      </p>

      <CompareTable
        headers={['sock_ops 콜백', '기록되는 값']}
        rows={[
          ['TCP_CONNECT_CB / PASSIVE_ESTABLISHED_CB', '신규 소켓 등록 (client/server), connect_attempts'],
          ['STATE_CB', 'connect_duration, 종료 단계 플래그, CLOSE 시 최종 바이트 스냅샷'],
          ['RTT_CB', 'rtt_latest, rtt_smoothed (구커널은 srtt 폴백)'],
          ['RETRANS_CB', '재전송을 상태별 분리: retrans_syn / est / close'],
          ['RTO_CB', '타임아웃 상태별: rtos_syn / est / close'],
          ['PARSE_HDR_OPT / HDR_OPT_LEN', '송수신 바이트·세그먼트'],
        ]}
        highlightCol={0}
      />

      <div className="grid grid-cols-2 gap-6 mt-6">
        <Card title="왜 SYN/EST/CLOSE를 분리하나" color="purple">
          연결 <b>수립 단계</b> 손실(용량·경로·보안 설정 확인)과 <b>수립 이후</b> 손실(경로 품질 신호)을
          백엔드가 구분해 해석할 수 있게 함
        </Card>
        <Card title="샘플링은 입구에서만" color="emerald">
          신규 소켓 admit 시점에만 적용 — 추적 소켓은 계속 처리합니다. 다만 <b>맵 용량·추적 종료·처리 오류</b>로 관측이 누락될 수 있습니다.
        </Card>
      </div>
    </SlideWrapper>
  );
}
