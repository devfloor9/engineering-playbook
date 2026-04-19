import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { AlertTriangle, AlertOctagon, AlertCircle, Info } from 'lucide-react';

export default function Slide06() {
  return (
    <SlideWrapper accent="rose">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        에스컬레이션 매트릭스
      </motion.h2>
      <p className="text-lg text-gray-400 mb-8">Severity 분류 기준과 대응 체계</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="SEV-1: 전체 서비스 중단" icon={<AlertOctagon size={24} />} accent="rose" delay={0.1}>
          <div className="space-y-2">
            <Badge color="rose">즉시 대응</Badge>
            <ul className="space-y-1 text-base mt-2">
              <li>전체 사용자 영향</li>
              <li>컨트롤 플레인 장애 / 다수 노드 NotReady</li>
              <li>대응: 전원 호출, 15분 내 상태 공유</li>
              <li>AWS Support: Severity Critical</li>
            </ul>
          </div>
        </Card>

        <Card title="SEV-2: 주요 기능 장애" icon={<AlertTriangle size={24} />} accent="amber" delay={0.2}>
          <div className="space-y-2">
            <Badge color="amber">30분 내 대응</Badge>
            <ul className="space-y-1 text-base mt-2">
              <li>특정 서비스/기능 불가</li>
              <li>다수 Pod CrashLoop / 특정 AZ 장애</li>
              <li>대응: 온콜 + 해당 팀, 30분 내 상태 공유</li>
              <li>AWS Support: Severity Urgent</li>
            </ul>
          </div>
        </Card>

        <Card title="SEV-3: 성능 저하" icon={<AlertCircle size={24} />} accent="blue" delay={0.3}>
          <div className="space-y-2">
            <Badge color="blue">4시간 내 대응</Badge>
            <ul className="space-y-1 text-base mt-2">
              <li>응답 지연, 간헐적 에러</li>
              <li>일부 Pod 재시작 / HPA 미작동</li>
              <li>대응: 온콜 담당자, 업무 시간 내 해결</li>
              <li>AWS Support: Severity High</li>
            </ul>
          </div>
        </Card>

        <Card title="SEV-4: 경미한 이슈" icon={<Info size={24} />} accent="emerald" delay={0.4}>
          <div className="space-y-2">
            <Badge color="emerald">다음 스프린트</Badge>
            <ul className="space-y-1 text-base mt-2">
              <li>사용자 영향 없음</li>
              <li>로그 경고, 비효율적 설정</li>
              <li>대응: 백로그 등록, 정기 점검 시 처리</li>
              <li>AWS Support: Severity Normal</li>
            </ul>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
