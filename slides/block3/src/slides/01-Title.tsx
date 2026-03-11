import { SlideWrapper, Badge } from '@shared/components';
import { motion } from 'framer-motion';
import { Search, Layers } from 'lucide-react';

export function TitleSlide() {
  return (
    <SlideWrapper className="items-center justify-center text-center">
      <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} transition={{ duration: 0.6 }}>
        <div className="flex items-center justify-center gap-3 mb-6">
          <Search className="text-rose-400" size={48} />
          <Layers className="text-amber-400" size={48} />
        </div>
        <Badge color="rose" size="lg">Block 3</Badge>
        <h1 className="text-5xl font-extrabold mt-6 mb-4 bg-gradient-to-r from-rose-400 via-amber-400 to-orange-400 bg-clip-text text-transparent">
          EKS 장애 진단 및 대응
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl">
          6-Layer Framework로 체계적인 트러블슈팅
        </p>
        <p className="text-sm text-gray-600 mt-8">EKS 1.30+ | kubectl 1.30+ | AWS CLI v2</p>
      </motion.div>
    </SlideWrapper>
  );
}
