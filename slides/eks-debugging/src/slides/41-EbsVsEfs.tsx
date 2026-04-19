import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';

export default function EbsVsEfs() {
  return (
    <SlideWrapper accent="blue">
      <Badge color="blue">Storage</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">EBS vs EFS 비교</h1>

      <CompareTable
        headers={['항목', 'EBS (gp3)', 'EFS']}
        highlightCol={1}
        rows={[
          ['접근 모드', 'ReadWriteOnce (단일 노드)', 'ReadWriteMany (다중 노드)'],
          ['성능', '최대 16,000 IOPS / 1,000 MB/s', '탄력적 처리량 (Bursting/Provisioned)'],
          ['AZ 제약', '단일 AZ 종속', '다중 AZ 자동 복제'],
          ['적합 시나리오', 'DB, StatefulSet, 단일 Pod', '공유 파일, CMS, 로그 수집'],
          ['비용', '용량 + IOPS 기반 과금', '사용량 기반 과금 (GB당)'],
          ['CSI Driver', 'ebs.csi.aws.com', 'efs.csi.aws.com'],
          ['Auto Mode', '내장 지원 (gp3 기본)', 'EFS CSI 별도 설치 필요'],
          ['주요 제약', 'Multi-Attach 불가, AZ 종속', 'Mount Target SG TCP 2049 필수'],
        ]}
        delay={0.2}
      />

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
      >
        <p className="text-lg text-blue-300">
          <span className="font-bold">핵심 판단 기준:</span> 여러 Pod이 동시에 같은 볼륨에 접근해야 하면 EFS,
          단일 Pod 고성능 I/O가 필요하면 EBS (gp3)를 선택
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
