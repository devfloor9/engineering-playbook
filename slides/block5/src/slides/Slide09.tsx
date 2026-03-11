import { SlideWrapper, Card } from '@shared/components';
import { AlertCircle, CheckCircle2, XCircle } from 'lucide-react';

export default function Slide09() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-emerald-400">SIGTERM 처리</h2>
      <p className="text-xl text-gray-300 mb-6">
        SIGTERM은 애플리케이션에게 정상 종료를 요청하는 신호입니다.
      </p>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card title="SIGTERM이란?" icon={<AlertCircle size={24} />} color="blue">
          <ul className="space-y-2 text-sm">
            <li>• Unix/Linux 신호 15번</li>
            <li>• "정상 종료하세요" 요청</li>
            <li>• 애플리케이션이 처리 가능</li>
            <li>• 무시하면 일정 시간 후 SIGKILL</li>
          </ul>
        </Card>
        <Card title="SIGKILL (강제 종료)" icon={<XCircle size={24} />} color="rose">
          <ul className="space-y-2 text-sm">
            <li>• Unix/Linux 신호 9번</li>
            <li>• OS가 프로세스 강제 종료</li>
            <li>• 애플리케이션이 처리 불가</li>
            <li>• 데이터 손실 위험</li>
          </ul>
        </Card>
      </div>
      <Card title="올바른 SIGTERM 처리 흐름" icon={<CheckCircle2 size={24} />} color="emerald">
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold">1.</span>
            <p>SIGTERM 수신 시 <code className="bg-gray-800 px-2 py-1 rounded">isShuttingDown = true</code></p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold">2.</span>
            <p>새로운 요청 수신 중단 (HTTP server.close())</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold">3.</span>
            <p>진행 중인 요청 완료 대기</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold">4.</span>
            <p>DB 연결, 파일 핸들러 등 리소스 정리</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="text-emerald-400 font-bold">5.</span>
            <p><code className="bg-gray-800 px-2 py-1 rounded">process.exit(0)</code> 호출</p>
          </div>
        </div>
      </Card>
      <div className="mt-6 bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
        <p className="text-amber-400 font-semibold mb-2">⏱️ 타임아웃 설정 필수</p>
        <p className="text-gray-300">
          Graceful Shutdown이 <code className="bg-gray-800 px-2 py-1 rounded">terminationGracePeriodSeconds</code>를
          초과하면 SIGKILL로 강제 종료됩니다. 반드시 여유 시간을 두고 타임아웃을 설정하세요.
        </p>
      </div>
    </SlideWrapper>
  );
}
