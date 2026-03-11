import { SlideWrapper } from '@shared/components';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

const takeaways = [
  '6-Layer 프레임워크로 체계적 진단: CP → Node → Network → Workload → Storage → Observability',
  'Top-down (증상→원인) 접근이 프로덕션 인시던트에 효과적',
  'First 5 Minutes: 클러스터 상태 → 스코프 판별 → 초동 대응',
  'Node NotReady: SSH 가능 여부로 진단 경로 분기',
  'Pod 상태별 진단 가이드: CrashLoop, OOM, Pending 각각 다른 접근',
  'kubectl debug (ephemeral container)로 라이브 디버깅',
  '자동화 도구 활용: k9s, eks-node-viewer, Robusta',
  '포스트모템으로 재발 방지 문서화',
];

export function TakeawaysSlide() {
  return (
    <SlideWrapper className="items-center justify-center">
      <h2 className="text-3xl font-bold mb-8 text-rose-400">Key Takeaways</h2>
      <div className="max-w-3xl space-y-4">
        {takeaways.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-start gap-3"
          >
            <CheckCircle2 className="text-emerald-400 mt-0.5 shrink-0" size={20} />
            <p className="text-gray-300">{item}</p>
          </motion.div>
        ))}
      </div>
    </SlideWrapper>
  );
}
