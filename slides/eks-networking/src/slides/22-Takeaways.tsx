import { SlideWrapper, Card } from '@shared/components';
import { CheckCircle2, Network, Activity } from 'lucide-react';

export default function TakeawaysSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-10 flex items-center gap-4">
        <CheckCircle2 aria-hidden="true" className="w-12 h-12 text-emerald-400" />
        Key Takeaways
      </h1>

      <div className="grid grid-cols-2 gap-8 flex-1">
        <Card title="VPC CNI" icon={<Network aria-hidden="true" className="w-6 h-6" />} color="blue">
          <ul className="space-y-3 mt-2 text-base list-disc list-inside">
            <li>L3 routed mode — L2 브리지 없음, 169.254.1.1은 <b>정적 next hop</b></li>
            <li>VPC 내부 egress는 소스 IP의 ENI, 외부는 SNAT 설정 확인</li>
            <li>warm pool은 <b>모드별 절대치 타깃</b>, IP 타깃 과소 설정은 API 호출 증가 위험</li>
            <li>IP 쿨다운 기본 30초 = kube-proxy 비동기성 보호</li>
            <li>일반 축소는 비강제 — <b>사용 중인 Pod IP 보호</b></li>
            <li>NetworkPolicy 진단 분기점 = <b>PolicyEndpoints CRD</b></li>
          </ul>
        </Card>

        <Card title="Network Flow Monitor" icon={<Activity aria-hidden="true" className="w-6 h-6" />} color="emerald">
          <ul className="space-y-3 mt-2 text-base list-disc list-inside">
            <li>패킷 캡처 아님 — <b>sock_ops 콜백 구독</b>, TCP 전용</li>
            <li>500ms 집계 → 30s±5s OTLP/SigV4 push, top-K 500(손실 우선)</li>
            <li>enrichment는 Pod+EndpointSlice watcher — service map의 원천</li>
            <li>ENA allowance 카운터로 <b>인스턴스 한도 초과까지</b> 한 리포트에</li>
            <li>NHI 100 = AWS 네트워크 영향 탐지, 0도 앱 원인 확정은 아님</li>
            <li>데이터 없음 → agent publish / Scope / Monitor <b>3계층 순서로</b></li>
          </ul>
        </Card>
      </div>

      <p className="text-gray-500 text-sm mt-6 text-center">
        상세 문서: EKS Best Practices → 네트워크 &amp; 성능 → VPC CNI 동작 원리 &middot; 운영 &amp; 안정성 → Network Flow Monitor
      </p>
    </SlideWrapper>
  );
}
