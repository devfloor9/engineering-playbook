import { SlideWrapper, Card, CompareTable } from '@shared/components';
import { FileText } from 'lucide-react';

export default function ReportSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <FileText aria-hidden="true" className="w-12 h-12 text-amber-400" />
        리포트에는 무엇이 실리나 (NfmReport v1.1)
      </h1>

      <CompareTable
        headers={['섹션', '내용', '실무 가치']}
        rows={[
          ['network_stats[]', 'flow별 상태 카운트·바이트·상태별 재전송/RTO·히스토그램 3종', '경로 품질의 1차 신호'],
          ['host_stats.interface_stats[]', 'ENA allowance 카운터 (bw/pps/conntrack/linklocal exceeded)', 'Nitro 레벨 드롭 감지'],
          ['process_stats', '에이전트 자체 CPU/메모리/추적 소켓 수', '에이전트 오버헤드 감시'],
          ['k8s_metadata', 'node_name, cluster_name', '클러스터 단위 필터링'],
        ]}
        highlightCol={1}
      />

      <div className="grid grid-cols-2 gap-6 mt-8">
        <Card title="ENA allowance가 왜 실무 포인트인가" color="amber">
          인스턴스 네트워크 한도 초과(대역폭·PPS·conntrack)로 인한 드롭이
          flow 지표와 <b>같은 리포트</b>에 실림 → 인스턴스 한도 초과와 흐름 지표를 함께 조사
        </Card>
        <Card title="전송의 결정적 증거" color="emerald">
          OTLP protobuf + gzip + <b>SigV4(서비스명 networkflowmonitor)</b> POST.
          에이전트 로그의 <span className="font-mono">status:200 ... publisher_endpoint</span>가
          해당 요청 수락의 증거입니다. 콘솔 조회·메타데이터 성공까지 보장하지는 않습니다. 실패는 <span className="font-mono">failed_reports</span>로 다음 리포트에 동봉
        </Card>
      </div>
    </SlideWrapper>
  );
}
