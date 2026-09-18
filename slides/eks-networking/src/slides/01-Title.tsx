import { SlideWrapper } from '@shared/components';
import { Network, Activity, Cpu } from 'lucide-react';
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
          <Network aria-hidden="true" className="w-20 h-20 text-blue-400" />
          <Cpu aria-hidden="true" className="w-20 h-20 text-emerald-400" />
          <Activity aria-hidden="true" className="w-20 h-20 text-amber-400" />
        </div>

        <h1 className="text-7xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
          EKS Networking Deep Dive
        </h1>

        <h2 className="text-4xl font-bold text-white mt-4">
          VPC CNI 동작 원리 &middot; Network Flow Monitor
        </h2>

        <p className="text-2xl text-gray-400 mt-8">
          데이터패스 &middot; IPAM &middot; eBPF 관측의 내부 구조
        </p>

        <div className="flex justify-center gap-8 mt-12 text-sm text-gray-500">
          <span>VPC CNI · Linux IPv4 routed mode</span>
          <span>&middot;</span>
          <span>NFM agent 1.1.8 소스 기준</span>
          <span>&middot;</span>
          <span>공개 소스 검토: 2026-09-18</span>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
