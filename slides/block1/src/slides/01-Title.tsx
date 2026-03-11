import { SlideWrapper } from '@shared/components';
import { GitBranch, GitMerge } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TitleSlide() {
  return (
    <SlideWrapper className="justify-center items-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8"
      >
        <div className="flex justify-center items-center gap-6 mb-8">
          <GitBranch className="w-20 h-20 text-blue-400" />
          <GitMerge className="w-20 h-20 text-emerald-400" />
        </div>

        <h1 className="text-7xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          Block 1
        </h1>

        <h2 className="text-5xl font-bold text-white mt-4">
          GitOps 기반 EKS 클러스터 운영
        </h2>

        <p className="text-2xl text-gray-400 mt-8">
          Git을 단일 진실 공급원으로 활용한 선언적 인프라 관리
        </p>

        <div className="flex justify-center gap-8 mt-12 text-sm text-gray-500">
          <span>ArgoCD v2.13+ / v3</span>
          <span>•</span>
          <span>EKS Capabilities (GA)</span>
          <span>•</span>
          <span>Kubernetes 1.32</span>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
