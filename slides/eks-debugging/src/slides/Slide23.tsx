import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/CodeBlock';
import { motion } from 'framer-motion';
import { Clock, ShieldAlert } from 'lucide-react';

export default function Slide23() {
  return (
    <SlideWrapper accent="blue">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        ResourceQuota + Timezone 이슈
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">간과하기 쉬운 두 가지 배포 함정</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="ResourceQuota 초과" icon={<ShieldAlert size={24} />} accent="blue" delay={0.1}>
          <div className="space-y-3">
            <p className="text-base">Namespace 리소스 한도 초과 시 Pod 생성 차단</p>
            <div className="bg-gray-950 rounded-lg p-3 mt-2">
              <p className="text-sm text-rose-400 font-mono">
                Error: exceeded quota: compute-quota
              </p>
            </div>
            <ul className="space-y-1 text-base mt-2">
              <li className="text-sm text-gray-400">진단: kubectl describe resourcequota -n ns</li>
              <li className="text-sm text-gray-400">확인: LimitRange도 함께 점검</li>
            </ul>
          </div>
        </Card>

        <Card title="Timezone / Locale 이슈" icon={<Clock size={24} />} accent="blue" delay={0.2}>
          <div className="space-y-3">
            <p className="text-base">컨테이너 기본 UTC &mdash; 로그 시간 불일치</p>
            <div className="bg-gray-950 rounded-lg p-3 mt-2">
              <pre className="text-sm text-emerald-300 font-mono whitespace-pre">
{`env:
- name: TZ
  value: "Asia/Seoul"
# JVM 추가:
- name: JAVA_OPTS
  value: "-Duser.timezone=Asia/Seoul"`}
              </pre>
            </div>
            <p className="text-sm text-rose-400 mt-2">
              Alpine/distroless: tzdata 패키지 설치 필수
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <CodeBlock title="ResourceQuota 설정 예시" language="yaml" delay={0.3}>
{`apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: production
spec:
  hard:
    requests.cpu: "100"        # 총 CPU requests 한도
    requests.memory: "200Gi"   # 총 메모리 requests 한도
    limits.cpu: "200"          # 총 CPU limits 한도
    limits.memory: "400Gi"     # 총 메모리 limits 한도
    pods: "100"                # 최대 Pod 수`}
        </CodeBlock>
      </div>
    </SlideWrapper>
  );
}
