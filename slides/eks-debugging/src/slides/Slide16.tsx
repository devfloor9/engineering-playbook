import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/CodeBlock';
import { motion } from 'framer-motion';
import { RotateCcw, Terminal, FileQuestion, Zap } from 'lucide-react';

export default function Slide16() {
  return (
    <SlideWrapper accent="rose">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        CrashLoopBackOff 디버깅
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">4가지 주요 원인과 진단 방법</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card title="앱 크래시" icon={<RotateCcw size={20} />} accent="rose" delay={0.1}>
          <p className="text-base">uncaught exception, panic, segfault</p>
          <p className="text-sm text-gray-500 mt-2">로그에 스택트레이스 확인</p>
        </Card>
        <Card title="CMD/ENTRYPOINT 오류" icon={<Terminal size={20} />} accent="rose" delay={0.2}>
          <p className="text-base">잘못된 실행 명령어 또는 경로</p>
          <p className="text-sm text-gray-500 mt-2">Dockerfile 확인</p>
        </Card>
        <Card title="Config 누락" icon={<FileQuestion size={20} />} accent="rose" delay={0.3}>
          <p className="text-base">환경변수, 설정 파일 미마운트</p>
          <p className="text-sm text-gray-500 mt-2">ConfigMap/Secret 확인</p>
        </Card>
        <Card title="OOMKilled" icon={<Zap size={20} />} accent="rose" delay={0.4}>
          <p className="text-base">메모리 limits 초과로 강제 종료</p>
          <p className="text-sm text-gray-500 mt-2">limits 조정 필요</p>
        </Card>
      </div>

      <CodeBlock title="CrashLoopBackOff 진단 명령어" language="bash" delay={0.5}>
{`# 이전 (크래시된) 컨테이너 로그 확인
kubectl logs <pod-name> -n <namespace> --previous

# Pod 이벤트 확인 (OOMKilled 여부)
kubectl describe pod <pod-name> -n <namespace>

# 멀티컨테이너 Pod에서 특정 컨테이너 로그
kubectl logs <pod-name> -c <container-name> --previous

# 컨테이너 종료 사유 확인
kubectl get pod <pod-name> -o jsonpath='{.status.containerStatuses[0].lastState}'`}
      </CodeBlock>
    </SlideWrapper>
  );
}
