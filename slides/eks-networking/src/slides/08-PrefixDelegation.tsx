import { SlideWrapper, Card, CompareTable } from '@shared/components';
import { Grid3x3 } from 'lucide-react';

export default function PrefixDelegationSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Grid3x3 aria-hidden="true" className="w-12 h-12 text-purple-400" />
        Prefix Delegation: /28 단위 할당
      </h1>
      <p className="text-lg text-gray-400 mb-6">
        <span className="font-mono text-purple-300">ENABLE_PREFIX_DELEGATION=true</span> (v1.9.0+)
        — 개별 IP 대신 <b>/28 프리픽스(연속 IP 16개)</b> 단위로 ENI에 할당 (IPv6는 /80)
      </p>

      <CompareTable
        headers={['항목', '기본 모드 (Secondary IP)', 'Prefix Delegation']}
        rows={[
          ['ENI 슬롯 1개', 'IP 1개', '/28 = IP 16개'],
          ['c5.xlarge max-pods 예시', '58 (기본 산식, hostNetwork 포함)', '110 (권장 설정, 물리 IP 한도 아님)'],
          ['EC2 API 부하', '여러 secondary IP를 한 번에 할당 가능', '/28 단위로 묶어 할당'],
          ['전제 조건', '-', '서브넷에 연속 /28 블록 필요'],
        ]}
        highlightCol={2}
      />

      <div className="grid grid-cols-2 gap-6 mt-8">
        <Card title="Prefix 모드의 Warm Pool" color="purple">
          <span className="font-mono">WARM_PREFIX_TARGET=1</span>이 기본입니다. WARM_IP_TARGET·MINIMUM_IP_TARGET이 우선하며, <b>서브넷 주소 소비 자체를 줄이지는 않습니다</b>.
        </Card>
        <Card title="서브넷 단편화 주의" color="rose">
          /28은 연속 16개 주소 — 단편화가 심하면 확보 실패, 개별 IP 폴백 <b>없음</b>.
          신규 전용 서브넷 또는 CIDR 예약과 함께 사용 권장
        </Card>
      </div>
    </SlideWrapper>
  );
}
