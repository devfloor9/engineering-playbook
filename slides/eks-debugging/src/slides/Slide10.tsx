import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { CompareTable } from '../components/CompareTable';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

export default function Slide10() {
  return (
    <SlideWrapper accent="amber">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        IRSA vs Pod Identity + 빈번한 함정
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">ServiceAccount → IAM Role 매핑 디버깅</p>

      <CompareTable
        headers={['구분', 'IRSA', 'Pod Identity']}
        rows={[
          ['설정 방식', 'SA annotation + OIDC Trust Policy', 'CLI 한 줄 (Association)'],
          ['Cross-account', 'OIDC Provider 공유 필요', '간단 (Role Trust만)'],
          ['디버깅', 'SA annotation, Trust Policy, OIDC 모두 확인', 'Association 존재 여부만 확인'],
          ['권장 대상', '기존 워크로드', '신규 워크로드'],
        ]}
        highlightCol={2}
        delay={0.1}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card title="IRSA 함정 #1" icon={<AlertTriangle size={20} />} accent="rose" delay={0.3}>
          <p className="text-base">SA annotation의 <span className="text-rose-400">Role ARN 오타</span> &mdash; 에러 메시지 없이 기본 권한으로 동작</p>
        </Card>
        <Card title="IRSA 함정 #2" icon={<AlertTriangle size={20} />} accent="rose" delay={0.4}>
          <p className="text-base">Trust Policy의 <span className="text-rose-400">namespace/sa 불일치</span> &mdash; AssumeRole 실패</p>
        </Card>
        <Card title="Pod Identity 함정" icon={<AlertTriangle size={20} />} accent="rose" delay={0.5}>
          <p className="text-base"><span className="text-rose-400">Pod 재시작 필수</span> &mdash; Association은 Pod 생성 시점에 적용</p>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="mt-4 flex items-center gap-3 justify-center"
      >
        <Badge color="amber">진단 명령</Badge>
        <code className="text-sm text-emerald-300 bg-gray-900 px-3 py-1 rounded">
          kubectl exec pod -- env | grep AWS
        </code>
      </motion.div>
    </SlideWrapper>
  );
}
