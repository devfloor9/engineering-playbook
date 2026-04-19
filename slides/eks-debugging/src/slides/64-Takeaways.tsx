import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { Lightbulb, Layers, Eye, Shield, Zap } from 'lucide-react';

export default function Takeaways() {
  return (
    <SlideWrapper accent="emerald">
      <Badge color="emerald">Wrap-up</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-8">핵심 교훈 5가지</h1>

      <div className="grid grid-cols-1 gap-5">
        <Card title="1. 체계적 디버깅: 계층별 접근" icon={<Layers size={24} />} accent="blue" delay={0.1}>
          <p className="text-xl">Pod → Node → 네트워크 → 스토리지 순서로 레이어별 진단. <span className="text-blue-400 font-bold">kubectl describe와 Events가 항상 출발점.</span></p>
        </Card>
        <Card title="2. 선제적 옵저버빌리티: 문제 전에 감지" icon={<Eye size={24} />} accent="emerald" delay={0.2}>
          <p className="text-xl">Container Insights + Prometheus + ADOT 3종 세트. <span className="text-emerald-400 font-bold">Composite Alarm으로 False Positive 제거.</span></p>
        </Card>
        <Card title="3. Auto Mode의 트레이드오프 이해" icon={<Zap size={24} />} accent="orange" delay={0.3}>
          <p className="text-xl">편의성 vs 커스터마이징. <span className="text-[#ff9900] font-bold">GPU, 고성능 스토리지, Custom CNI가 필요하면 하이브리드 구성 필수.</span></p>
        </Card>
        <Card title="4. GPU/AI 워크로드는 별도 디버깅 스킬" icon={<Lightbulb size={24} />} accent="purple" delay={0.4}>
          <p className="text-xl">XID 에러 코드 숙지, vLLM 파라미터 이해, NCCL 네트워크 요구사항. <span className="text-purple-400 font-bold">devicePlugin=false는 Auto Mode 필수 설정.</span></p>
        </Card>
        <Card title="5. 운영 자동화: Alert → Auto-Remediation" icon={<Shield size={24} />} accent="rose" delay={0.5}>
          <p className="text-xl">알림 피로 방지 + EventBridge Lambda 자동 복구. <span className="text-rose-400 font-bold">MTTD를 30분 → 5분 → 1분으로 단축.</span></p>
        </Card>
      </div>
    </SlideWrapper>
  );
}
