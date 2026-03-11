import { SlideWrapper, Card, CompareTable } from '@shared/components';
import { Wrench, Zap, Eye } from 'lucide-react';

const tools = [
  ['eks-node-viewer', 'Node 리소스 사용량 실시간 TUI', 'Karpenter 팀 제공'],
  ['k9s', '터미널 기반 K8s 관리 UI', 'Pod, 로그, 이벤트 통합 뷰'],
  ['kubectl-neat', 'YAML 정리 (불필요 필드 제거)', '깔끔한 리소스 비교'],
  ['kubeshark', 'K8s 네트워크 트래픽 분석', 'Wireshark for K8s'],
  ['Robusta', 'K8s 자동 진단 + 알림', 'CrashLoop 자동 분석'],
  ['AWS FIS', 'Fault Injection Simulator', 'Chaos Engineering 도구'],
];

export function AutomatedToolsSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-6 text-purple-400">자동화된 진단 도구</h2>
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card title="실시간 모니터링" icon={<Eye size={20} />} color="emerald">
          <p>eks-node-viewer, k9s로 클러스터 상태 실시간 확인</p>
        </Card>
        <Card title="자동 진단" icon={<Zap size={20} />} color="amber">
          <p>Robusta, Kubeshark로 문제 자동 탐지 및 분석</p>
        </Card>
        <Card title="카오스 테스트" icon={<Wrench size={20} />} color="purple">
          <p>AWS FIS, Litmus로 장애 시나리오 사전 검증</p>
        </Card>
      </div>
      <CompareTable
        headers={['도구', '설명', '특징']}
        rows={tools}
        highlightCol={0}
      />
    </SlideWrapper>
  );
}
