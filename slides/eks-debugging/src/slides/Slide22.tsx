import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { TrendingUp, Layers } from 'lucide-react';

export default function Slide22() {
  return (
    <SlideWrapper accent="amber">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        HPA 미작동 + Sidecar 순서 문제
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">배포 후 자주 만나는 오토스케일링과 종료 순서 이슈</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="HPA 미작동 진단" icon={<TrendingUp size={24} />} accent="amber" delay={0.1}>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-amber-400">TARGETS: &lt;unknown&gt;인 경우</p>
            <ul className="space-y-2 text-base">
              <li><Badge color="rose">원인 1</Badge> metrics-server 미설치</li>
              <li><Badge color="rose">원인 2</Badge> Pod에 resource requests 미설정</li>
              <li><Badge color="rose">원인 3</Badge> HPA minReplicas &gt; Deployment replicas</li>
            </ul>
            <div className="mt-3 p-3 bg-gray-950 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">필수 확인 명령:</p>
              <code className="text-sm text-emerald-300 font-mono">kubectl get hpa</code>
              <br />
              <code className="text-sm text-emerald-300 font-mono">kubectl top pods</code>
              <p className="text-sm text-gray-500 mt-2">top pods 실패 시 = metrics-server 문제</p>
            </div>
            <div className="mt-2">
              <p className="text-sm text-amber-400 font-semibold">스케일다운 진동 방지:</p>
              <p className="text-sm text-gray-400">behavior.scaleDown.stabilizationWindowSeconds: 300</p>
            </div>
          </div>
        </Card>

        <Card title="Sidecar 종료 순서 문제" icon={<Layers size={24} />} accent="amber" delay={0.2}>
          <div className="space-y-3">
            <p className="text-lg font-semibold text-amber-400">종료 시 요청 유실 발생</p>
            <ul className="space-y-2 text-base">
              <li>Envoy/ADOT sidecar가 메인 앱보다 먼저 종료</li>
              <li>종료 시점에 "connection refused" 에러</li>
            </ul>

            <div className="mt-3 p-3 bg-gray-950 rounded-lg">
              <p className="text-sm font-semibold text-gray-300 mb-2">K8s 1.28 이전: preStop 트릭</p>
              <pre className="text-sm text-emerald-300 font-mono whitespace-pre">
{`app:   preStop sleep 5
envoy: preStop sleep 15`}
              </pre>
            </div>

            <div className="mt-2 p-3 bg-emerald-950/30 rounded-lg border border-emerald-500/20">
              <p className="text-sm font-semibold text-emerald-400 mb-2">K8s 1.29+: Native Sidecar</p>
              <pre className="text-sm text-emerald-300 font-mono whitespace-pre">
{`initContainers:
- name: envoy
  restartPolicy: Always  # sidecar
containers:
- name: app              # main`}
              </pre>
              <p className="text-sm text-gray-400 mt-1">시작: sidecar 먼저 / 종료: 메인 먼저</p>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
