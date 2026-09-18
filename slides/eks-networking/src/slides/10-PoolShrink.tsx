import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { ShieldCheck } from 'lucide-react';

export default function PoolShrinkSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-8 flex items-center gap-4">
        <ShieldCheck aria-hidden="true" className="w-12 h-12 text-emerald-400" />
        일반 풀 축소는 사용 중인 Pod IP를 보호
      </h1>

      <div className="grid grid-cols-2 gap-8 flex-1">
        <div className="space-y-6">
          <Card title="비강제(non-force) 삭제 원칙" color="emerald">
            일반 축소 경로는 <span className="font-mono">force=false</span>로만 IP 반납 시도
            → 해당 IP가 Pod에 할당돼 있으면 데이터스토어가 <b>삭제를 거부</b>
          </Card>
          <Card title="외부 상태와의 재조정" color="amber">
            EC2 API로 해당 보조 IP가 <b>이미 detach됨을 재확인한</b> reconcile 경로에서만 발생
          </Card>
          <Card title="운영 함의" color="blue">
            일반 warm 타깃 축소의 반납 대상은 <b>미할당 여유분</b>입니다. 노드 종료·외부 ENI 변경까지 연결을 보장하는 것은 아닙니다.
          </Card>
        </div>

        <CodeBlock
          title="pkg/ipamd/ipamd.go 핵심 발췌 · 단독 실행 불가"
          language="go"
          code={`// tryUnassignIPFromENI:
// "Don't force the delete, since a freeable
//  IP might have been assigned to a pod"

DelIPv4CidrFromStore(
  eniID,
  toDelete.Cidr,
  false /* force */,
)`}
        />
      </div>
    </SlideWrapper>
  );
}
