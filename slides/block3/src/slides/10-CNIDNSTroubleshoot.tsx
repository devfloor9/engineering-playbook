import { SlideWrapper, CodeBlock } from '@shared/components';
import { Badge } from '@shared/components';

const cniCode = `# VPC CNI 상태 확인
kubectl get ds -n kube-system aws-node
kubectl logs -n kube-system -l k8s-app=aws-node --tail=20

# IP 할당 상태
kubectl get eniconfigs  # Custom Networking 사용 시
aws ec2 describe-network-interfaces \\
  --filters Name=description,Values="*eks*" \\
  --query 'NetworkInterfaces[].PrivateIpAddresses | length(@)'`;

const dnsCode = `# CoreDNS 상태 확인
kubectl get pods -n kube-system -l k8s-app=kube-dns
kubectl logs -n kube-system -l k8s-app=kube-dns --tail=20

# DNS 해석 테스트
kubectl run dnstest --image=busybox:1.36 --rm -it -- nslookup kubernetes.default

# DNS 성능 테스트
kubectl run dnsperf --image=busybox:1.36 --rm -it -- \\
  sh -c "time nslookup google.com"`;

export function CNIDNSTroubleshootSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-4 text-amber-400">CNI & DNS 트러블슈팅</h2>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge color="amber">VPC CNI</Badge>
          </div>
          <CodeBlock code={cniCode} title="CNI 진단" language="bash" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Badge color="blue">CoreDNS</Badge>
          </div>
          <CodeBlock code={dnsCode} title="DNS 진단" language="bash" />
        </div>
      </div>
    </SlideWrapper>
  );
}
