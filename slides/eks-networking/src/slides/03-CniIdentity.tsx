import { SlideWrapper, Card, CompareTable } from '@shared/components';
import { Network } from 'lucide-react';

export default function CniIdentitySlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-4 flex items-center gap-4">
        <Network aria-hidden="true" className="w-12 h-12 text-blue-400" />
        VPC CNI의 정체성: 오버레이 없는 L3 CNI
      </h1>
      <p className="text-xl text-gray-400 mb-8">
        Pod에 VPC의 <span className="text-blue-400 font-semibold">실제 IP</span>를 직접 할당 — 캡슐화 계층이 존재하지 않음
      </p>

      <CompareTable
        headers={['항목', 'VPC CNI (routed mode)', '오버레이 CNI (VXLAN 등)']}
        rows={[
          ['Pod IP', 'VPC 서브넷의 실제 IP', '별도 Pod CIDR (외부 라우팅 구성 필요)'],
          ['패킷 전달', 'L3 라우팅만 (캡슐화 없음)', 'VXLAN/Geneve 캡슐화'],
          ['성능 오버헤드', '오버레이 캡슐화 비용 없음', '캡슐화/역캡슐화 비용'],
          ['SG/NACL 적용', 'ENI SG / 서브넷 NACL, Pod별 SG는 별도 구성', '외부 패킷은 노드 IP, Pod 정책은 구현별'],
          ['제약', '서브넷 IP 소비 = 용량 계획', 'IP는 자유롭지만 관측·통합 복잡'],
        ]}
        highlightCol={1}
      />

      <div className="grid grid-cols-2 gap-6 mt-8">
        <Card title="장점" color="emerald">
          VPC Flow Logs에서 Pod IP 식별 가능. SG는 ENI, NACL은 서브넷에 적용됩니다.
          라우팅·보안 규칙이 허용하면 VPC에서 Pod IP로 직접 통신 가능합니다.
        </Card>
        <Card title="대가" color="amber">
          Pod가 서브넷 IP를 직접 소비 → 서브넷 사이징이 곧 클러스터 용량 계획.
          IPAM(ipamd)의 동작 이해가 운영의 핵심
        </Card>
      </div>
    </SlideWrapper>
  );
}
