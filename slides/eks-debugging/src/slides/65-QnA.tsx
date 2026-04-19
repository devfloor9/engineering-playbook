import { SlideWrapper } from '../components/SlideWrapper';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { MessageCircleQuestion, BookOpen, ExternalLink } from 'lucide-react';

export default function QnA() {
  return (
    <SlideWrapper accent="orange">
      <div className="flex-1 flex flex-col items-center justify-center text-center -mt-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <MessageCircleQuestion size={80} className="text-[#ff9900] mx-auto mb-6" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-7xl font-bold mb-4"
        >
          Q&A
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-2xl text-gray-400 mb-10"
        >
          질문과 토론을 환영합니다
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col gap-4 items-center"
        >
          <div className="flex items-center gap-3 text-xl text-gray-300">
            <BookOpen size={24} className="text-[#ff9900]" />
            <span>문서: <span className="text-[#ff9900] font-semibold">devfloor9.github.io/engineering-playbook</span></span>
          </div>
          <div className="flex items-center gap-3 text-xl text-gray-300">
            <ExternalLink size={24} className="text-[#ff9900]" />
            <span>GitHub: <span className="text-[#ff9900] font-semibold">github.com/devfloor9/engineering-playbook</span></span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12"
        >
          <Badge color="orange">감사합니다</Badge>
        </motion.div>
      </div>
    </SlideWrapper>
  );
}
