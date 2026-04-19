import { SlideWrapper } from '../components/SlideWrapper';
import { Card } from '../components/Card';
import { Badge } from '../components/Badge';
import { BellOff, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AlertOptimization() {
  return (
    <SlideWrapper accent="amber">
      <Badge color="amber">Observability</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">알림 최적화 & Alert Fatigue 방지</h1>

      <div className="grid grid-cols-2 gap-5 mb-6">
        <Card title="Alert Fatigue 방지" icon={<BellOff size={22} />} accent="rose" delay={0.1}>
          <p>알림이 너무 많으면 운영팀이 <span className="text-rose-400 font-bold">알림을 무시</span></p>
          <p className="mt-2">P3/P4: Slack 채널만</p>
          <p>P1/P2만 PagerDuty로 전송</p>
          <p className="text-gray-400 mt-2">주기적 알림 규칙 리뷰 필수</p>
        </Card>
        <Card title="Composite Alarm 활용" icon={<Filter size={22} />} accent="emerald" delay={0.2}>
          <p>여러 시그널 조합으로 <span className="text-emerald-400 font-bold">실제 인시던트만 감지</span></p>
          <p className="mt-2">"에러율 증가 AND 지연시간 증가" = 서비스 장애</p>
          <p>"에러율 증가 AND Pod 재시작" = 앱 크래시</p>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-900 rounded-xl p-6 border border-amber-500/30"
      >
        <h3 className="text-xl font-bold text-amber-400 mb-4">권장 알림 채널 매트릭스</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-lg">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left py-3 px-4 text-gray-300">심각도</th>
                <th className="text-left py-3 px-4 text-gray-300">알림 채널</th>
                <th className="text-left py-3 px-4 text-gray-300">응답 SLA</th>
                <th className="text-left py-3 px-4 text-gray-300">예시</th>
              </tr>
            </thead>
            <tbody>
              {[
                { sev: 'P1 Critical', ch: 'PagerDuty + Phone', sla: '15분', ex: '서비스 전체 다운', color: 'text-rose-400' },
                { sev: 'P2 High', ch: 'Slack DM + PagerDuty', sla: '30분', ex: '부분 장애, 성능 저하', color: 'text-amber-400' },
                { sev: 'P3 Medium', ch: 'Slack 채널', sla: '4시간', ex: 'Pod 재시작, 리소스 경고', color: 'text-blue-400' },
                { sev: 'P4 Low', ch: 'Email / Jira', sla: '다음 영업일', ex: '디스크 증가, 인증서 만료', color: 'text-gray-400' },
              ].map((row, i) => (
                <tr key={i} className="border-b border-gray-800">
                  <td className={`py-3 px-4 font-bold ${row.color}`}>{row.sev}</td>
                  <td className="py-3 px-4 text-gray-300">{row.ch}</td>
                  <td className="py-3 px-4 text-gray-300">{row.sla}</td>
                  <td className="py-3 px-4 text-gray-400">{row.ex}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </SlideWrapper>
  );
}
