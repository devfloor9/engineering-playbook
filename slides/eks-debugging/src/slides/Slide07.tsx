import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { Server, Database, Puzzle } from 'lucide-react';

export default function Slide07() {
  return (
    <SlideWrapper accent="blue">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-2"
      >
        <Badge color="blue">Part 2</Badge>
        <h2 className="text-3xl font-bold">컨트롤 플레인 디버깅</h2>
      </motion.div>
      <p className="text-lg text-gray-400 mb-8">EKS 컨트롤 플레인의 3대 구성 요소</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card title="API Server" icon={<Server size={24} />} accent="blue" delay={0.1}>
          <ul className="space-y-2 text-base">
            <li>모든 K8s 요청의 진입점</li>
            <li>인증(AuthN) / 인가(AuthZ) 처리</li>
            <li>Admission Control 실행</li>
            <li className="text-blue-400 font-semibold mt-3">장애 시: kubectl 명령 실패, 전체 영향</li>
            <li className="text-sm text-gray-500">CloudWatch: kube-apiserver-audit 로그</li>
          </ul>
        </Card>

        <Card title="etcd" icon={<Database size={24} />} accent="blue" delay={0.2}>
          <ul className="space-y-2 text-base">
            <li>클러스터 상태 저장소</li>
            <li>AWS 관리형 (직접 접근 불가)</li>
            <li>자동 백업 및 복구</li>
            <li className="text-blue-400 font-semibold mt-3">장애 시: 리소스 생성/수정 실패</li>
            <li className="text-sm text-gray-500">EKS Health: EtcdNotAvailable 코드</li>
          </ul>
        </Card>

        <Card title="Add-on" icon={<Puzzle size={24} />} accent="blue" delay={0.3}>
          <ul className="space-y-2 text-base">
            <li>CoreDNS: 클러스터 내 DNS 해석</li>
            <li>kube-proxy: Service 네트워킹</li>
            <li>VPC CNI: Pod IP 할당</li>
            <li>EBS CSI: 볼륨 관리</li>
            <li className="text-blue-400 font-semibold mt-3">장애 시: DNS/네트워크/스토리지 불가</li>
          </ul>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-gray-900 rounded-xl p-4 border border-blue-500/20"
      >
        <p className="text-base text-gray-400 text-center">
          EKS 컨트롤 플레인은 AWS 관리형 &mdash; API Server 로그와 Health 코드로 진단
        </p>
      </motion.div>
    </SlideWrapper>
  );
}
