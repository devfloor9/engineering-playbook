import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { MapPin, Layers, Lock, Clock } from 'lucide-react';

export default function PvcFailures() {
  return (
    <SlideWrapper accent="amber">
      <Badge color="amber">Part 6</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">PVC 마운트 실패 4대 패턴</h1>

      <div className="grid grid-cols-2 gap-5">
        <Card title="AZ 불일치" icon={<MapPin size={22} />} accent="amber" delay={0.1}>
          <p>EBS 볼륨은 <span className="text-amber-400 font-bold">단일 AZ</span>에 존재</p>
          <p className="mt-2">Pod이 다른 AZ 노드에 스케줄링되면 마운트 실패</p>
          <p className="text-emerald-400 mt-2 font-semibold">해결: volumeBindingMode: WaitForFirstConsumer</p>
        </Card>
        <Card title="볼륨 제한 초과" icon={<Layers size={22} />} accent="amber" delay={0.2}>
          <p>인스턴스 타입마다 <span className="text-amber-400 font-bold">최대 EBS 볼륨 수</span> 제한</p>
          <p className="mt-2">Nitro: 타입별 상이 (최대 128개)</p>
          <p className="text-emerald-400 mt-2 font-semibold">해결: 더 큰 인스턴스 타입 또는 볼륨 분산</p>
        </Card>
        <Card title="ReadWriteOnce (RWO)" icon={<Lock size={22} />} accent="rose" delay={0.3}>
          <p>EBS는 RWO만 지원 — 동시에 <span className="text-rose-400 font-bold">여러 노드에서 마운트 불가</span></p>
          <p className="mt-2">Multi-Attach 에러 발생</p>
          <p className="text-emerald-400 mt-2 font-semibold">해결: 다중 접근 필요 시 EFS (ReadWriteMany)</p>
        </Card>
        <Card title="Detach 지연 (~6분)" icon={<Clock size={22} />} accent="amber" delay={0.4}>
          <p>이전 Pod 삭제 후에도 <span className="text-amber-400 font-bold">EBS 볼륨이 즉시 해제되지 않음</span></p>
          <p className="mt-2">AWS API 볼륨 detach 최대 6분 소요</p>
          <p className="text-rose-400 mt-2 font-semibold">강제 detach는 데이터 손실 위험!</p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
