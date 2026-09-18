import { SlideWrapper, Card, CodeBlock, CompareTable } from '@shared/components';
import { Rocket } from 'lucide-react';

export default function NfmDeploySlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Rocket aria-hidden="true" className="w-12 h-12 text-blue-400" />
        EKS 배포 확인: 리소스 이름과 선행 조건
      </h1>

      <div className="grid grid-cols-2 gap-8 flex-1">
        <div className="space-y-4">
          <CodeBlock
            title="설치 후 확인 · 읽기 전용 (환경 변수 먼저 설정)"
            language="bash"
            code={`# 대상 계정의 profile·리전·클러스터 지정
: "\${AWS_PROFILE:?set AWS_PROFILE}"
: "\${AWS_REGION:?set AWS_REGION}"
: "\${CLUSTER:?set CLUSTER}"
aws eks describe-addon \\
  --profile "$AWS_PROFILE" \\
  --region "$AWS_REGION" \\
  --cluster-name "$CLUSTER" \\
  --addon-name aws-network-flow-monitoring-agent \\
  --query 'addon.{status:status,issues:health.issues}'`}
          />
          <Card title="선행 조건" color="blue">
            K8s 1.25+ &middot; <b>eks-pod-identity-agent</b> add-on 선행 &middot;
            IAM 정책 <span className="font-mono text-xs">CloudWatchNetworkFlowMonitorAgentPublishPolicy</span>
          </Card>
        </div>

        <div className="space-y-4">
          <CompareTable
            headers={['리소스', '이름']}
            rows={[
              ['add-on', 'aws-network-flow-monitoring-agent ("monitoring")'],
              ['네임스페이스', 'amazon-network-flow-monitor ("ing" 없음!)'],
              ['DaemonSet/라벨', 'aws-network-flow-monitor-agent'],
              ['이미지 내부명', 'aws-network-sonar-agent'],
            ]}
            highlightCol={1}
          />
          <Card title="제약" color="rose">
            <b>TCP 전용</b> (UDP/ICMP 불가) &middot; 커널 5.8+ &middot; cgroup v2 &middot;
            Fargate 미지원(DaemonSet·호스트 접근 필요) &middot; 지원 Linux 배포판·커널은 공식 지원표 확인
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
