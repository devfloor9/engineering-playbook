import { SlideWrapper } from '../components/SlideWrapper';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { Shield, Layers, Bug } from 'lucide-react';

export default function Slide01() {
  return (
    <SlideWrapper accent="orange">
      <div className="flex flex-col items-center justify-center h-full min-h-[80vh] gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-4"
        >
          <Bug size={48} className="text-[#ff9900]" />
          <Shield size={48} className="text-[#ff9900]" />
          <Layers size={48} className="text-[#ff9900]" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-5xl font-extrabold text-center leading-tight"
        >
          EKS 디버깅 마스터 가이드
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-xl text-gray-400 text-center"
        >
          6-Layer 프레임워크와 프로덕션 패턴
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex items-center gap-4 mt-4"
        >
          <Badge color="orange">Level 400</Badge>
          <Badge color="gray">EKS 1.32+</Badge>
          <Badge color="gray">Session 1 / 2</Badge>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
          className="text-lg text-gray-500 mt-8"
        >
          컨트롤 플레인 &middot; 노드 &middot; 워크로드 &middot; Health Check 불일치
        </motion.p>
      </div>
    </SlideWrapper>
  );
}
