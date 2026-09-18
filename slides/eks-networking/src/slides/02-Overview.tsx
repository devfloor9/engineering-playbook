import { SlideWrapper, Card, Badge } from '@shared/components';
import { Network, Activity } from 'lucide-react';

export default function OverviewSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-10">Agenda</h1>

      <div className="grid grid-cols-2 gap-8 flex-1">
        <Card title="Part 1 — VPC CNI 동작 원리" icon={<Network aria-hidden="true" className="w-6 h-6" />} color="blue">
          <ul className="space-y-3 mt-2 text-base">
            <li className="flex items-center gap-2">
              <Badge color="blue" size="sm">1</Badge> 두 개의 프로세스: CNI 바이너리 vs ipamd
            </li>
            <li className="flex items-center gap-2">
              <Badge color="blue" size="sm">2</Badge> L3 Routed Mode 데이터패스 — 169.254.1.1 정적 이웃
            </li>
            <li className="flex items-center gap-2">
              <Badge color="blue" size="sm">3</Badge> IPAM: Warm Pool &middot; Prefix Delegation &middot; IP 쿨다운
            </li>
            <li className="flex items-center gap-2">
              <Badge color="blue" size="sm">4</Badge> NetworkPolicy — 컨트롤러 + eBPF 에이전트
            </li>
          </ul>
        </Card>

        <Card title="Part 2 — Network Flow Monitor" icon={<Activity aria-hidden="true" className="w-6 h-6" />} color="emerald">
          <ul className="space-y-3 mt-2 text-base">
            <li className="flex items-center gap-2">
              <Badge color="emerald" size="sm">1</Badge> 패킷 캡처가 아니다 — sock_ops 콜백 구독
            </li>
            <li className="flex items-center gap-2">
              <Badge color="emerald" size="sm">2</Badge> 커널 → 유저스페이스 → 백엔드 전체 경로
            </li>
            <li className="flex items-center gap-2">
              <Badge color="emerald" size="sm">3</Badge> Kubernetes enrichment와 리포트 스키마
            </li>
            <li className="flex items-center gap-2">
              <Badge color="emerald" size="sm">4</Badge> EKS add-on 배포와 3계층 진단
            </li>
          </ul>
        </Card>
      </div>

      <p className="text-gray-500 text-sm mt-6 text-center">
        구현 설명은 고정된 공개 소스 리비전 기준입니다. 각 장 하단의 출처에서 전제와 지원 범위를 확인할 수 있습니다.
      </p>
    </SlideWrapper>
  );
}
