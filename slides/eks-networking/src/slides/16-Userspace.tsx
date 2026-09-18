import { SlideWrapper, CompareTable, Card } from '@shared/components';
import { Settings } from 'lucide-react';

export default function UserspaceSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Settings aria-hidden="true" className="w-12 h-12 text-emerald-400" />
        유저스페이스: 타이머 3종과 권한 축소
      </h1>

      <div className="grid grid-cols-2 gap-8 flex-1">
        <div>
          <CompareTable
            headers={['옵션', '기본값', '의미']}
            rows={[
              ['--aggregate-msecs', '500', 'BPF 맵 → flow 집계 주기'],
              ['--publish-secs / --jitter-secs', '30 / 5', '전송 주기 (실효 25~35초)'],
              ['--top-k', '500', 'flow 상한, 손실 상위 우선'],
              ['--notrack-secs', '65', '유휴 추적 종료 (백오프 6회=63s 커버)'],
              ['--report-compression', 'gzip', '전송 압축'],
              ['--kubernetes-metadata', 'off*', '*EKS add-on은 on으로 override'],
            ]}
            highlightCol={1}
          />
        </div>

        <div className="space-y-5">
          <Card title="Capability 드롭" color="purple">
            초기화 후 <span className="font-mono">CAP_SYS_ADMIN &middot;
            CAP_PERFMON &middot; CAP_NET_ADMIN</span>을 스스로 드롭 →
            BPF 맵 읽기용 <b className="font-mono">CAP_BPF</b> 유지. 그 외 권한은 배포 manifest와 기능 설정에 따라 달라집니다.
          </Card>
          <Card title="서드파티 경로" color="cyan">
            <span className="font-mono">--prometheus-workspace-id</span> → AMP remote write 직행.
            <span className="font-mono"> open-metrics</span> feature → 로컬 Prometheus 스크레이프 서버
            — 콘솔 없이 자체 Grafana 구성 가능
          </Card>
          <Card title="top-K의 의미" color="amber">
            리포트당 500 flow 상한, <b>손실 점수 상위, 동점이면 바이트 상위</b> 선별
            — 조용한 flow는 잘릴 수 있음을 해석 시 고려
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
