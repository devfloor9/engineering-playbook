import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { Server, AlertTriangle, HardDrive } from 'lucide-react';

const code = `# 노드 상태 상세 확인
kubectl describe node <node-name> | grep -A5 Conditions

# kubelet 로그 확인
ssh <node> "journalctl -u kubelet --since '30m ago' | tail -50"

# 리소스 사용량
kubectl top nodes
kubectl describe node <node> | grep -A5 "Allocated resources"`;

export function LayerNodeSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-6 text-orange-400">Layer 3: 노드 레이어</h2>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <div className="space-y-4">
          <Card title="노드 Conditions" icon={<AlertTriangle size={20} />} color="orange">
            <ul className="space-y-1">
              <li><strong>Ready</strong>: kubelet 정상 동작 여부</li>
              <li><strong>MemoryPressure</strong>: 메모리 부족</li>
              <li><strong>DiskPressure</strong>: 디스크 공간 부족</li>
              <li><strong>PIDPressure</strong>: 프로세스 수 초과</li>
              <li><strong>NetworkUnavailable</strong>: CNI 미설정</li>
            </ul>
          </Card>
          <Card title="리소스 압박" icon={<HardDrive size={20} />} color="amber">
            <ul className="space-y-1">
              <li>Eviction threshold: memory.available &lt; 100Mi</li>
              <li>nodefs.available &lt; 10%</li>
              <li>imagefs.available &lt; 15%</li>
            </ul>
          </Card>
          <Card title="containerd 이슈" icon={<Server size={20} />} color="rose">
            <p>이미지 pull 실패, 컨테이너 시작 실패, sandbox 생성 오류</p>
          </Card>
        </div>
        <CodeBlock code={code} title="노드 진단 명령어" language="bash" />
      </div>
    </SlideWrapper>
  );
}
