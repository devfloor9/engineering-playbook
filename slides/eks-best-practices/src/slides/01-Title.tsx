import { SlideWrapper } from '@shared/components';
import { Server, Shield, RefreshCw } from 'lucide-react';
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
          <Server className="w-20 h-20 text-blue-400" />
          <Shield className="w-20 h-20 text-emerald-400" />
          <RefreshCw className="w-20 h-20 text-amber-400" />
        </div>

        <h1 className="text-7xl font-black bg-gradient-to-r from-blue-400 via-emerald-400 to-amber-400 bg-clip-text text-transparent">
          EKS Best Practices
        </h1>

        <h2 className="text-4xl font-bold text-white mt-4">
          Control Plane &middot; AuthN/AuthZ &middot; Cross-Cluster HA
        </h2>

        <p className="text-2xl text-gray-400 mt-8">
          Advanced Architecture Guide for Production EKS Operations
        </p>

        <div className="flex justify-center gap-8 mt-12 text-sm text-gray-500">
          <span>EKS 1.32+</span>
          <span>&middot;</span>
          <span>Provisioned Control Plane (GA)</span>
          <span>&middot;</span>
          <span>ArgoCD 2.13+ / Flux v2.4+</span>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
