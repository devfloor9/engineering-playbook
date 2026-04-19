import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { Badge } from '../components/Badge';
import { Cloud } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AutoVsStandard() {
  return (
    <SlideWrapper accent="orange">
      <div className="flex items-center gap-4 mb-6">
        <Cloud size={40} className="text-[#ff9900]" />
        <div>
          <Badge color="orange">Part 8</Badge>
          <h1 className="text-5xl font-bold mt-1">Auto Mode vs Standard Mode</h1>
        </div>
      </div>

      <CompareTable
        headers={['항목', 'Standard Mode', 'Auto Mode', '디버깅 영향']}
        highlightCol={2}
        rows={[
          ['노드 관리', '사용자 (MNG/Karpenter)', 'AWS 관리 (NodePool)', 'NodePool CRD로 상태 확인'],
          ['VPC CNI', '수동 설정/업그레이드', '자동 관리', 'Custom CNI 설정 불가'],
          ['GPU Driver', 'GPU Operator 설치', 'AWS 관리', 'devicePlugin=false 필수'],
          ['스토리지', 'EBS CSI 별도 설치', '내장 (gp3)', 'io2 BE 미지원, EFS 별도'],
          ['CoreDNS', 'Add-on 관리', '자동 관리', 'Custom 설정 제한'],
          ['노드 SSH', '가능 (MNG)', '제한적 (SSM)', 'kubectl debug node 필수'],
          ['Auto Scaling', 'Karpenter/CA', 'NodePool', 'Spot 중단 자동 처리'],
        ]}
        delay={0.2}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-5 bg-[#ff9900]/10 border border-[#ff9900]/30 rounded-xl p-4"
      >
        <p className="text-lg text-[#ff9900]">
          <span className="font-bold">핵심:</span> Auto Mode는 편리하지만 커스터마이징 제한 — GPU, 고성능 스토리지, Custom CNI가 필요하면 하이브리드 구성 필수
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
