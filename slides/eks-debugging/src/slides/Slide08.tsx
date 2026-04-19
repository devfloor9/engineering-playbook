import { SlideWrapper } from '../components/SlideWrapper';
import { FlowDiagram } from '../components/FlowDiagram';
import { motion } from 'framer-motion';

const nodes = [
  { id: 'start', label: 'API 접근 실패', x: 350, y: 10, color: 'rose', width: 180, height: 45 },
  { id: 'auth', label: 'HTTP 401?', x: 350, y: 80, color: 'amber', width: 180, height: 45 },
  { id: 'authz', label: 'HTTP 403?', x: 350, y: 180, color: 'amber', width: 180, height: 45 },
  { id: 'token', label: '토큰 만료?', x: 350, y: 280, color: 'amber', width: 180, height: 45 },
  // Solutions
  { id: 'fix_authn', label: 'aws-auth / Access Entry 확인', x: 620, y: 80, color: 'emerald', width: 230, height: 45 },
  { id: 'fix_authz', label: 'RBAC 권한 확인 (can-i)', x: 620, y: 180, color: 'emerald', width: 230, height: 45 },
  { id: 'fix_token', label: 'SDK 버전 업그레이드', x: 620, y: 280, color: 'emerald', width: 230, height: 45 },
  { id: 'fix_other', label: 'SG / VPC 엔드포인트 확인', x: 350, y: 360, color: 'emerald', width: 180, height: 45 },
  // Detail labels
  { id: 'lbl_yes1', label: 'Yes', x: 555, y: 85, color: 'rose', width: 45, height: 30 },
  { id: 'lbl_yes2', label: 'Yes', x: 555, y: 185, color: 'rose', width: 45, height: 30 },
  { id: 'lbl_yes3', label: 'Yes', x: 555, y: 285, color: 'rose', width: 45, height: 30 },
];

const edges = [
  { from: 'start', to: 'auth', color: 'rose' },
  { from: 'auth', to: 'fix_authn', color: 'amber', label: 'Yes' },
  { from: 'auth', to: 'authz', color: 'gray', label: 'No' },
  { from: 'authz', to: 'fix_authz', color: 'amber', label: 'Yes' },
  { from: 'authz', to: 'token', color: 'gray', label: 'No' },
  { from: 'token', to: 'fix_token', color: 'amber', label: 'Yes' },
  { from: 'token', to: 'fix_other', color: 'gray', label: 'No' },
];

export default function Slide08() {
  return (
    <SlideWrapper accent="rose">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        API Server 접근 실패 Decision Tree
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">HTTP 상태 코드별 진단 경로</p>

      <FlowDiagram nodes={nodes} edges={edges} width={900} height={420} />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-4 grid grid-cols-3 gap-4 text-base"
      >
        <div className="bg-gray-900 rounded-lg p-3 border border-rose-500/20">
          <p className="text-rose-400 font-semibold">401 Unauthorized</p>
          <p className="text-gray-400 text-sm">인증 실패 &mdash; IAM 자격증명 문제</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-amber-500/20">
          <p className="text-amber-400 font-semibold">403 Forbidden</p>
          <p className="text-gray-400 text-sm">인가 실패 &mdash; RBAC 권한 부족</p>
        </div>
        <div className="bg-gray-900 rounded-lg p-3 border border-blue-500/20">
          <p className="text-blue-400 font-semibold">SA Token 만료</p>
          <p className="text-gray-400 text-sm">1시간 기본 만료 &mdash; SDK 자동 갱신 필요</p>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
