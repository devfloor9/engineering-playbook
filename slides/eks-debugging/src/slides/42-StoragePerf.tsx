import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';
import { Gauge, ArrowUpCircle, Trash2 } from 'lucide-react';

export default function StoragePerf() {
  return (
    <SlideWrapper accent="blue">
      <Badge color="blue">Storage</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">스토리지 성능 최적화</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="gp3 IOPS 튜닝" icon={<Gauge size={22} />} accent="blue" delay={0.1}>
          <p>기본: 3,000 IOPS / 125 MB/s</p>
          <p>최대: <span className="text-blue-400 font-bold">16,000 IOPS / 1,000 MB/s</span></p>
          <p className="text-gray-400 mt-2">IOPS:처리량 비율 최소 4:1</p>
        </Card>
        <Card title="볼륨 확장" icon={<ArrowUpCircle size={22} />} accent="emerald" delay={0.2}>
          <p><code className="text-emerald-400">allowVolumeExpansion: true</code> 필수</p>
          <p className="mt-2">PVC patch로 온라인 확장 가능</p>
          <p className="text-rose-400 mt-2 font-semibold">볼륨 축소는 불가!</p>
        </Card>
        <Card title="고아 볼륨 정리" icon={<Trash2 size={22} />} accent="amber" delay={0.3}>
          <p>Finalizer 수동 제거 시 <span className="text-amber-400 font-bold">고아 EBS 볼륨</span> 발생</p>
          <p className="mt-2">주기적으로 available 상태 볼륨 확인</p>
          <p className="text-gray-400 mt-1">비용 낭비 방지</p>
        </Card>
      </div>

      <CodeBlock title="스토리지 성능 관리" delay={0.4}>
{`# gp3 고성능 StorageClass 생성
cat <<EOF | kubectl apply -f -
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata: { name: fast-ebs }
provisioner: ebs.csi.aws.com
parameters: { type: gp3, iops: "16000", throughput: "1000" }
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF

# 볼륨 확장 (온라인)
kubectl patch pvc <pvc> -p '{"spec":{"resources":{"requests":{"storage":"50Gi"}}}}'

# 고아 볼륨 찾기
aws ec2 describe-volumes --filters "Name=tag:kubernetes.io/created-for/pvc/name,Values=*" \\
  --query 'Volumes[?State==\`available\`].{ID:VolumeId,PVC:Tags[?Key==\`kubernetes.io/created-for/pvc/name\`]|[0].Value}'`}
      </CodeBlock>
    </SlideWrapper>
  );
}
