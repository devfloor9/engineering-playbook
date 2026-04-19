import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';
import { Globe, AlertTriangle, Zap } from 'lucide-react';

export default function DnsDebugging() {
  return (
    <SlideWrapper accent="amber">
      <Badge color="amber">Networking</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">DNS 디버깅: CoreDNS & ndots</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="CoreDNS OOM" icon={<AlertTriangle size={22} />} accent="rose" delay={0.1}>
          <p>5,000+ Pod 클러스터에서 쿼리 급증 시 OOMKilled</p>
          <p className="mt-2 text-rose-400 font-semibold">클러스터 전체 DNS 해석 실패</p>
          <p className="text-gray-400 mt-1">해결: 메모리 증가 + NodeLocal DNSCache</p>
        </Card>
        <Card title="ndots:5 문제" icon={<Globe size={22} />} accent="amber" delay={0.2}>
          <p>외부 도메인 조회 시 <span className="text-amber-400 font-bold">5번 불필요한 쿼리</span> 발생</p>
          <p className="text-gray-400 mt-2">api.example.com → 4번 실패 후 성공</p>
          <p className="text-emerald-400 mt-1">해결: ndots:2 또는 trailing dot</p>
        </Card>
        <Card title="NodeLocal DNSCache" icon={<Zap size={22} />} accent="emerald" delay={0.3}>
          <p>각 노드에 DNS 캐시 제공 → CoreDNS 부하 감소</p>
          <p className="text-gray-400 mt-2">VPC DNS 한도: ENI당 1,024 pkt/s</p>
          <p className="text-emerald-400 mt-1">대규모 클러스터 필수</p>
        </Card>
      </div>

      <CodeBlock title="DNS 진단 명령어" delay={0.4}>
{`# CoreDNS 상태 확인
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl top pods -n kube-system -l k8s-app=kube-dns

# Pod 내부 resolv.conf 확인 (ndots 값)
kubectl exec <pod> -- cat /etc/resolv.conf

# DNS 해석 테스트
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup kubernetes.default`}
      </CodeBlock>
    </SlideWrapper>
  );
}
