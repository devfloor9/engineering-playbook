import { SlideWrapper } from '../components/SlideWrapper';
import { CodeBlock } from '../components/CodeBlock';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

export default function Slide09() {
  return (
    <SlideWrapper accent="blue">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        컨트롤 플레인 로그 분석
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">CloudWatch Logs Insights 핵심 쿼리</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CodeBlock title="API 서버 에러 (400+) 분석" language="sql" delay={0.1}>
{`fields @timestamp, @message
| filter @logStream like /kube-apiserver-audit/
| filter responseStatus.code >= 400
| stats count() by responseStatus.code
| sort count desc`}
        </CodeBlock>

        <CodeBlock title="인증 실패 추적" language="sql" delay={0.2}>
{`fields @timestamp, @message
| filter @logStream like /authenticator/
| filter @message like /error/
  or @message like /denied/
| sort @timestamp desc`}
        </CodeBlock>

        <CodeBlock title="비인가 접근 시도 (403)" language="sql" delay={0.3}>
{`fields @timestamp, @message
| filter @logStream like /kube-apiserver-audit/
| filter responseStatus.code = 403
| stats count() by user.username
| sort count desc`}
        </CodeBlock>

        <CodeBlock title="API Throttling 탐지" language="sql" delay={0.4}>
{`fields @timestamp, @message
| filter @logStream like /kube-apiserver/
| filter @message like /throttle/
  or @message like /rate limit/
| stats count() by bin(5m)`}
        </CodeBlock>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 flex items-center gap-4 justify-center"
      >
        <Badge color="blue">필수 로그</Badge>
        <span className="text-base text-gray-400">audit + authenticator 로그는 프로덕션에서 항상 활성화 권장</span>
      </motion.div>
    </SlideWrapper>
  );
}
