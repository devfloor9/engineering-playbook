import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

export default function NetworkPolicySlide() {
  return (
    <SlideWrapper accent="rose">
      <Badge color="rose">Networking</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">NetworkPolicy 디버깅</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="Default Deny" icon={<Lock size={22} />} accent="rose" delay={0.1}>
          <p><code className="text-rose-400">podSelector: {'{}'}</code>로 모든 ingress 차단</p>
          <p className="mt-2">Allow 규칙 없이 적용하면 <span className="text-rose-400 font-bold">전체 트래픽 차단</span></p>
          <p className="text-gray-400 mt-1">반드시 Allow 규칙 선작성 후 적용</p>
        </Card>
        <Card title="AND vs OR 혼동" icon={<AlertTriangle size={22} />} accent="amber" delay={0.2}>
          <p className="text-amber-400 font-bold">indent 한 레벨 차이로 보안 정책이 완전히 달라짐</p>
          <p className="mt-2">같은 from 항목 = AND (교집합)</p>
          <p>별도 from 항목 = OR (합집합)</p>
        </Card>
        <Card title="네임스페이스 라벨" icon={<Shield size={22} />} accent="rose" delay={0.3}>
          <p>namespaceSelector는 <span className="text-rose-400 font-bold">네임스페이스에 라벨</span>이 있어야 동작</p>
          <p className="text-gray-400 mt-2">네임스페이스에 라벨 추가 필수:</p>
          <code className="text-emerald-400 text-base">kubectl label ns prod user=alice</code>
        </Card>
      </div>

      <CodeBlock title="AND vs OR 비교 — indent 차이에 주의" language="yaml" delay={0.4}>
{`# AND: "alice NS의 client Pod"만 허용
ingress:
- from:
  - namespaceSelector:        # ← 같은 from 항목
      matchLabels: {user: alice}
    podSelector:              # ← AND 결합
      matchLabels: {role: client}

# OR: "alice NS 전체" 또는 "모든 NS의 client Pod"
ingress:
- from:
  - namespaceSelector:        # ← 첫 번째 from
      matchLabels: {user: alice}
  - podSelector:              # ← 두 번째 from (OR)
      matchLabels: {role: client}`}
      </CodeBlock>
    </SlideWrapper>
  );
}
