import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';
import { AlertTriangle, Layers, Settings } from 'lucide-react';

export default function AutoModeGpu() {
  return (
    <SlideWrapper accent="orange">
      <Badge color="orange">GPU + Auto Mode</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">Auto Mode에서의 GPU 워크로드</h1>

      <div className="grid grid-cols-3 gap-5 mb-6">
        <Card title="devicePlugin=false 필수" icon={<AlertTriangle size={22} />} accent="rose" delay={0.1}>
          <p>Auto Mode는 GPU Driver 자동 관리</p>
          <p className="mt-2">GPU Operator 설치 시 <span className="text-rose-400 font-bold">Device Plugin 충돌</span></p>
          <p className="text-emerald-400 mt-2 font-semibold">ClusterPolicy에서 반드시 비활성화</p>
        </Card>
        <Card title="레이블 비활성화" icon={<Settings size={22} />} accent="amber" delay={0.2}>
          <p>Auto Mode 노드에는 GPU Operator 스케줄링 방지</p>
          <p className="mt-2">MNG 노드에만 GPU Operator 배포</p>
          <p className="text-gray-400 mt-1">Taint로 GPU 워크로드 격리</p>
        </Card>
        <Card title="하이브리드 구성 (권장)" icon={<Layers size={22} />} accent="emerald" delay={0.3}>
          <p><span className="text-emerald-400 font-bold">Auto Mode: 일반 워크로드</span></p>
          <p><span className="text-purple-400 font-bold">MNG (GPU): GPU 전용</span></p>
          <p className="text-gray-400 mt-2">DCGM/GFD 메트릭은 정상 수집 가능</p>
        </Card>
      </div>

      <CodeBlock title="Auto Mode + GPU 하이브리드 설정" language="yaml" delay={0.4}>
{`# ClusterPolicy: Device Plugin 비활성화 필수
apiVersion: nvidia.com/v1
kind: ClusterPolicy
spec:
  driver:
    enabled: true
  devicePlugin:
    enabled: false    # ← Auto Mode 충돌 방지 핵심 설정
  dcgm:
    enabled: true     # 메트릭 수집 가능
  gfd:
    enabled: true     # GPU Feature Discovery 가능

# MNG 노드에 Taint 추가
# nvidia.com/gpu=true:NoSchedule
# GPU Pod에 Toleration 필수`}
      </CodeBlock>
    </SlideWrapper>
  );
}
