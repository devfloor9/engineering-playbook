import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { Terminal, AlertTriangle } from 'lucide-react';

export function Slide08() {
  const dmesgExample = `[123456.789] kernel: BUG: soft lockup - CPU#2 stuck for 22s!
[123457.890] kernel: Out of memory: Kill process 12345 (java) score 800
[123458.901] kernel: I/O error, dev sda, sector 123456789`;

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-blue-400">커널 모니터</h2>

      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-900/30 to-cyan-900/30 rounded-xl p-5 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-3">
            <Terminal className="w-6 h-6 text-blue-400" />
            <h3 className="text-xl font-bold text-blue-300">dmesg 로그 분석</h3>
          </div>
          <p className="text-gray-300 text-sm">
            커널 메시지 버퍼를 실시간으로 분석하여 시스템 레벨 문제를 감지합니다.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Card title="감지 가능한 커널 문제" icon={<AlertTriangle className="w-5 h-5" />} color="amber">
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• <span className="text-amber-400">Soft Lockup</span>: CPU가 응답 없음</li>
              <li>• <span className="text-rose-400">OOM Killer</span>: 메모리 부족으로 프로세스 종료</li>
              <li>• <span className="text-orange-400">I/O Error</span>: 디스크 읽기/쓰기 실패</li>
              <li>• <span className="text-red-400">Kernel Panic</span>: 커널 크래시</li>
              <li>• <span className="text-yellow-400">Hardware Error</span>: 하드웨어 장애 징후</li>
            </ul>
          </Card>

          <Card title="모니터링 방식" icon={<Terminal className="w-5 h-5" />} color="emerald">
            <ul className="space-y-2 text-sm text-gray-400">
              <li>• 주기적 dmesg 스캔</li>
              <li>• 패턴 매칭 기반 분석</li>
              <li>• 심각도 레벨 분류</li>
              <li>• Node Condition 업데이트</li>
              <li>• Events 자동 생성</li>
            </ul>
          </Card>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-700/50">
          <h4 className="text-gray-400 font-bold mb-3 text-sm">dmesg 로그 예시</h4>
          <CodeBlock code={dmesgExample} language="bash" title="dmesg output" />
          <div className="mt-3 text-xs text-gray-500">
            → NMA가 이러한 패턴을 감지하면 즉시 Events를 생성하고 심각한 경우 Node Condition을 업데이트합니다.
          </div>
        </div>

        <div className="bg-rose-900/20 rounded-xl p-4 border border-rose-500/30">
          <h4 className="text-rose-400 font-bold mb-2 text-sm">OOM (Out of Memory) 처리</h4>
          <p className="text-sm text-gray-400">
            OOM Killer가 프로세스를 종료하면 NMA는 이를 감지하고 <span className="text-rose-400">MemoryPressure</span> Condition을 설정하여 Node Auto Repair를 트리거할 수 있습니다.
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
