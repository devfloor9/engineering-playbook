import { SlideWrapper, Card } from '@shared/components';
import { Network, Globe, Shield, Wifi } from 'lucide-react';

export function LayerNetworkSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-6 text-amber-400">Layer 4: 네트워크</h2>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <Card title="VPC CNI" icon={<Network size={20} />} color="amber">
          <ul className="space-y-2">
            <li><strong>IP 할당 실패</strong>: 서브넷 IP 고갈 → WARM_ENI_TARGET 조정</li>
            <li><strong>ENI 제한</strong>: 인스턴스 타입별 최대 ENI 수 확인</li>
            <li><strong>Prefix Delegation</strong>: /28 prefix로 IP 확장</li>
            <li><strong>Custom Networking</strong>: Pod 전용 서브넷 분리</li>
          </ul>
        </Card>
        <Card title="CoreDNS" icon={<Globe size={20} />} color="blue">
          <ul className="space-y-2">
            <li><strong>DNS 해석 실패</strong>: CoreDNS Pod 상태 확인</li>
            <li><strong>높은 NXDOMAIN</strong>: ndots 설정 최적화</li>
            <li><strong>DNS 지연</strong>: NodeLocal DNS Cache 도입</li>
            <li><strong>외부 DNS</strong>: VPC DNS Resolver 확인</li>
          </ul>
        </Card>
        <Card title="Service & Ingress" icon={<Wifi size={20} />} color="emerald">
          <ul className="space-y-2">
            <li><strong>ClusterIP 접근 불가</strong>: kube-proxy 모드 확인</li>
            <li><strong>NodePort 연결 안됨</strong>: Security Group 점검</li>
            <li><strong>ALB 502/504</strong>: Target Group 헬스체크 확인</li>
          </ul>
        </Card>
        <Card title="NetworkPolicy" icon={<Shield size={20} />} color="purple">
          <ul className="space-y-2">
            <li><strong>통신 차단</strong>: Calico/Cilium policy 점검</li>
            <li><strong>기본 정책</strong>: default-deny 적용 여부</li>
            <li><strong>디버깅</strong>: calicoctl / hubble observe</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
