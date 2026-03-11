import { SlideWrapper, Badge } from '@shared/components';
import { Lightbulb, CheckCircle, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function TakeawaysSlide() {
  const takeaways = [
    {
      title: 'GitOps = 단일 진실 공급원',
      desc: 'Git이 모든 인프라와 애플리케이션의 상태를 정의하고, 수동 변경은 금지합니다.',
      color: 'blue',
    },
    {
      title: 'EKS Capabilities 활용',
      desc: 'ArgoCD를 EKS Capability로 운영하여 운영 오버헤드를 제거하고 AWS 네이티브 통합을 확보합니다.',
      color: 'emerald',
    },
    {
      title: 'ApplicationSets로 멀티클러스터',
      desc: 'Hub-and-Spoke 아키텍처로 수십~수백 개 클러스터를 중앙에서 일관되게 관리합니다.',
      color: 'amber',
    },
    {
      title: 'Progressive Delivery 필수',
      desc: 'Argo Rollouts로 Canary/Blue-Green 배포를 구현하고, 자동 롤백으로 안정성을 확보합니다.',
      color: 'purple',
    },
    {
      title: 'External Secrets Operator',
      desc: 'Secret을 Git에 저장하지 말고, ESO + Secrets Manager 조합으로 중앙 관리합니다.',
      color: 'rose',
    },
    {
      title: 'CI/CD 책임 분리',
      desc: 'CI는 빌드와 테스트, CD(ArgoCD)는 배포와 동기화를 담당합니다.',
      color: 'cyan',
    },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-12 flex items-center gap-4">
        <Lightbulb className="w-12 h-12 text-amber-400" />
        Key Takeaways
      </h1>

      <div className="grid grid-cols-2 gap-6">
        {takeaways.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gray-900 rounded-xl p-6 border border-gray-700/50 hover:border-gray-600 transition-colors"
          >
            <div className="flex items-start gap-3 mb-3">
              <CheckCircle className={`w-6 h-6 text-${item.color}-400 flex-shrink-0 mt-1`} />
              <h3 className={`text-lg font-bold text-${item.color}-400`}>{item.title}</h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
          </motion.div>
        ))}
      </div>

      <div className="mt-12 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-cyan-500/20 rounded-xl p-8 border border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-white mb-2">다음 단계</h3>
            <p className="text-gray-400">
              Block 2에서는 KRO/ACK를 활용한 Kubernetes 네이티브 인프라 관리를 다룹니다.
            </p>
          </div>
          <ArrowRight className="w-12 h-12 text-cyan-400" />
        </div>
      </div>

      <div className="mt-8 flex justify-center gap-4">
        <Badge color="blue">ArgoCD v2.13+ / v3</Badge>
        <Badge color="emerald">EKS Capabilities (GA)</Badge>
        <Badge color="amber">Kubernetes 1.32</Badge>
      </div>
    </SlideWrapper>
  );
}
