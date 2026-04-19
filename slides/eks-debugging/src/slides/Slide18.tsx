import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { CodeBlock } from '../components/CodeBlock';
import { motion } from 'framer-motion';
import { Lock, Globe, Tag } from 'lucide-react';

export default function Slide18() {
  return (
    <SlideWrapper accent="amber">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        ImagePullBackOff 디버깅
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">3가지 주요 원인과 해결 방법</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card title="ECR 인증 실패" icon={<Lock size={24} />} accent="amber" delay={0.1}>
          <ul className="space-y-2 text-base">
            <li>ECR 토큰 12시간 만료</li>
            <li>Cross-account ECR 접근 정책</li>
            <li>노드 IAM Role에 ECR 권한 없음</li>
            <li className="text-amber-400 font-semibold mt-2">ecr:GetAuthorizationToken 필수</li>
          </ul>
        </Card>

        <Card title="Private Registry" icon={<Globe size={24} />} accent="amber" delay={0.2}>
          <ul className="space-y-2 text-base">
            <li>imagePullSecrets 미설정</li>
            <li>Secret의 docker-server URL 오류</li>
            <li>인증 정보 만료</li>
            <li className="text-amber-400 font-semibold mt-2">kubectl create secret docker-registry</li>
          </ul>
        </Card>

        <Card title="이미지 태그 문제" icon={<Tag size={24} />} accent="amber" delay={0.3}>
          <ul className="space-y-2 text-base">
            <li>존재하지 않는 태그</li>
            <li>:latest 태그 덮어쓰기</li>
            <li>멀티 아키텍처 이미지 불일치</li>
            <li className="text-amber-400 font-semibold mt-2">immutable 태그 사용 권장</li>
          </ul>
        </Card>
      </div>

      <CodeBlock title="ImagePullBackOff 진단 명령어" language="bash" delay={0.4}>
{`# 이벤트에서 상세 에러 메시지 확인
kubectl describe pod <pod-name> | grep -A 5 "Events:"

# ECR 인증 테스트
aws ecr get-login-password --region <region> | \\
  docker login --username AWS --password-stdin <account>.dkr.ecr.<region>.amazonaws.com

# imagePullSecrets 확인
kubectl get pod <pod-name> -o jsonpath='{.spec.imagePullSecrets}'

# 이미지 존재 여부 확인
aws ecr describe-images --repository-name <repo> --image-ids imageTag=<tag>`}
      </CodeBlock>
    </SlideWrapper>
  );
}
