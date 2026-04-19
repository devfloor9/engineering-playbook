import { SlideWrapper } from '../components/SlideWrapper';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';
import { Card } from '../components/Card';
import { Terminal, Wifi, Bug } from 'lucide-react';

export default function Netshoot() {
  return (
    <SlideWrapper accent="emerald">
      <Badge color="emerald">Networking</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">netshoot 실전 디버깅</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="Ephemeral Container" icon={<Bug size={22} />} accent="emerald" delay={0.1}>
          <p>기존 Pod에 디버그 컨테이너를 <span className="text-emerald-400 font-bold">직접 주입</span></p>
          <p className="text-gray-400 mt-2">Pod 재시작 없이 네트워크 진단 가능</p>
        </Card>
        <Card title="포함 도구" icon={<Terminal size={22} />} accent="emerald" delay={0.2}>
          <p>curl, dig, tcpdump, iperf3, ss, traceroute, mtr, nslookup</p>
          <p className="text-gray-400 mt-2">네트워크 디버깅에 필요한 모든 도구 포함</p>
        </Card>
        <Card title="독립 디버깅 Pod" icon={<Wifi size={22} />} accent="blue" delay={0.3}>
          <p>임시 Pod으로 클러스터 내부 네트워크 테스트</p>
          <p className="text-gray-400 mt-2">종료 시 자동 삭제 (--rm)</p>
        </Card>
      </div>

      <CodeBlock title="netshoot 실전 사용법" delay={0.4}>
{`# 기존 Pod에 ephemeral container로 추가
kubectl debug <pod-name> -it --image=nicolaka/netshoot

# 독립 디버깅 Pod 실행
kubectl run tmp-shell --rm -i --tty --image nicolaka/netshoot -- bash

# DNS 해석 확인
dig <service>.<namespace>.svc.cluster.local

# TCP 연결 테스트
curl -v http://<service>.<namespace>.svc.cluster.local:<port>/health

# 패킷 캡처 (특정 Pod IP 트래픽)
tcpdump -i any host <pod-ip> -n

# 소켓 상태 확인
ss -tunap`}
      </CodeBlock>
    </SlideWrapper>
  );
}
