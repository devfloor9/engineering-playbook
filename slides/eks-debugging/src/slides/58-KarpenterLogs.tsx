import { SlideWrapper } from '../components/SlideWrapper';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

export default function KarpenterLogs() {
  return (
    <SlideWrapper accent="blue">
      <Badge color="blue">Karpenter</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-4">Karpenter 로그 분석</h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="text-xl text-gray-400 mb-5"
      >
        핵심 로그 패턴과 CloudWatch Logs Insights 쿼리
      </motion.p>

      <div className="grid grid-cols-2 gap-5">
        <CodeBlock title="핵심 Karpenter 로그 패턴" delay={0.2}>
{`# 프로비저닝 성공
kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter \\
  | grep "launched"
# "launched nodeclaim" instance-type="c6i.2xlarge"
#   zone="us-east-1a" capacity-type="spot"

# 프로비저닝 실패
| grep "could not launch"
# "could not launch" err="InsufficientInstanceCapacity"

# Consolidation 실행
| grep "deprovisioning"
# "deprovisioning via consolidation" reason="underutilized"

# Spot 중단
| grep "interruption"
# "received spot interruption warning" time="2m"`}
        </CodeBlock>

        <CodeBlock title="CloudWatch Logs Insights 쿼리" language="sql" delay={0.3}>
{`# 인스턴스 타입별 프로비저닝 실패율
fields @timestamp, instanceType, err
| filter @message like /could not launch/
| stats count() by instanceType
| sort count desc

# Consolidation으로 절감된 노드 수
fields @timestamp, nodeclaim, reason
| filter @message like /deprovisioning/
| stats count() by bin(1h)

# Spot 중단 빈도
fields @timestamp, node
| filter @message like /spot interruption/
| stats count() by bin(1h)

# 노드 시작 시간 (프로비저닝 성능)
fields @timestamp, nodeclaim
| filter @message like /launched nodeclaim/
| stats avg(@duration) by instance-type`}
        </CodeBlock>
      </div>
    </SlideWrapper>
  );
}
