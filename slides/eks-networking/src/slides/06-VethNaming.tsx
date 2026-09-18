import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { Hash } from 'lucide-react';

export default function VethNamingSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <Hash aria-hidden="true" className="w-12 h-12 text-cyan-400" />
        host veth 이름 생성 규칙
      </h1>

      <div className="grid grid-cols-2 gap-8 flex-1">
        <div className="space-y-6">
          <Card title="결정적(deterministic) 생성" color="cyan">
            <span className="font-mono text-cyan-300">eni</span> 접두사(기본값, ≤4자,{' '}
            <span className="font-mono">AWS_VPC_K8S_CNI_VETHPREFIX</span>로 변경 가능) +{' '}
            <span className="font-mono">namespace.podName</span> SHA-1의 <b>앞 11자(hex)</b>
          </Card>
          <Card title="Pod 내부 확인" color="blue">
            <div className="font-mono text-sm space-y-1">
              <div>default via 169.254.1.1 dev eth0</div>
              <div>? (169.254.1.1) at 2a:09:...  <span className="text-rose-400">PERM</span></div>
            </div>
          </Card>
          <Card title="실무 포인트" color="amber">
            veth 이름에서 Pod 역추적 = 해시 입력 재계산 또는 라우팅 엔트리 대조.
            <span className="font-mono"> ip route show to "$POD_IP"</span>가 가장 빠름
          </Card>
        </div>

        <CodeBlock
          title="기본 인터페이스 이름 재계산 (Python)"
          language="python"
          code={`import hashlib

namespace = "default"
pod_name = "web-0"
key = f"{namespace}.{pod_name}"
suffix = hashlib.sha1(key.encode()).hexdigest()[:11]
print(f"eni{suffix}")
# 기본 인터페이스(index=0) 예시`}
        />
      </div>
    </SlideWrapper>
  );
}
