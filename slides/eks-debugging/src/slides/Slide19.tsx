import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { motion } from 'framer-motion';
import { HeartPulse, FileText, TrendingUp, Layers, Clock, ShieldAlert } from 'lucide-react';

export default function Slide19() {
  return (
    <SlideWrapper accent="amber">
      <motion.h2
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-3xl font-bold mb-2"
      >
        "배포는 됐는데 안 되는" 6가지 패턴
      </motion.h2>
      <p className="text-lg text-gray-400 mb-6">Pod은 Running인데 서비스가 정상 동작하지 않는 경우</p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
        <Card title="Probe 실패 루프" icon={<HeartPulse size={22} />} accent="rose" delay={0.1}>
          <p className="text-base">Running 0/1 Ready</p>
          <p className="text-sm text-gray-500 mt-1">path 불일치, initialDelay 부족, timeout 부족</p>
          <Badge color="rose">Slide 20</Badge>
        </Card>

        <Card title="ConfigMap/Secret 미반영" icon={<FileText size={22} />} accent="amber" delay={0.15}>
          <p className="text-base">설정 변경이 적용되지 않음</p>
          <p className="text-sm text-gray-500 mt-1">subPath, envFrom 은 자동 업데이트 불가</p>
          <Badge color="amber">Slide 21</Badge>
        </Card>

        <Card title="HPA 미작동" icon={<TrendingUp size={22} />} accent="amber" delay={0.2}>
          <p className="text-base">TARGETS: unknown</p>
          <p className="text-sm text-gray-500 mt-1">metrics-server 미설치, requests 미설정</p>
          <Badge color="amber">Slide 22</Badge>
        </Card>

        <Card title="Sidecar 순서 문제" icon={<Layers size={22} />} accent="amber" delay={0.25}>
          <p className="text-base">종료 시 요청 유실</p>
          <p className="text-sm text-gray-500 mt-1">K8s 1.29+ Native Sidecar 해결</p>
          <Badge color="amber">Slide 22</Badge>
        </Card>

        <Card title="Timezone 이슈" icon={<Clock size={22} />} accent="blue" delay={0.3}>
          <p className="text-base">로그 시간 불일치 (UTC)</p>
          <p className="text-sm text-gray-500 mt-1">TZ 환경변수, tzdata 패키지</p>
          <Badge color="blue">Slide 23</Badge>
        </Card>

        <Card title="ResourceQuota 초과" icon={<ShieldAlert size={22} />} accent="blue" delay={0.35}>
          <p className="text-base">exceeded quota 에러</p>
          <p className="text-sm text-gray-500 mt-1">Namespace 리소스 한도 초과</p>
          <Badge color="blue">Slide 23</Badge>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-5 text-center text-base text-gray-500"
      >
        다음 슬라이드에서 각 패턴을 상세히 다룹니다
      </motion.div>
    </SlideWrapper>
  );
}
