import { SlideWrapper } from '@shared/components';
import { Brain, Server, Network, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Slide01() {
  return (
    <SlideWrapper className="items-center justify-center text-center">
      <div className="flex gap-6 mb-8">
        {[Brain, Server, Network, Cpu].map((Icon, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.15, duration: 0.5 }}
            className="w-14 h-14 rounded-xl bg-gray-900 border border-blue-500/30 flex items-center justify-center"
          >
            <Icon className="w-7 h-7 text-blue-400" />
          </motion.div>
        ))}
      </div>
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-5xl font-extrabold bg-gradient-to-r from-blue-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent mb-4"
      >
        Agentic AI Platform
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-xl text-gray-400 mb-2"
      >
        Production-Grade Multi-Model Systems on EKS
      </motion.p>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="text-sm text-gray-600"
      >
        2026.03 — devfloor9.github.io/engineering-playbook
      </motion.p>
    </SlideWrapper>
  );
}
