import { SlideWrapper, Card, Badge } from '@shared/components';
import { HardDrive, Activity, AlertCircle } from 'lucide-react';

export function Slide09() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-blue-400">디스크 / 파일시스템 모니터</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card title="디스크 공간 모니터링" icon={<HardDrive className="w-5 h-5" />} color="blue">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">임계값 기반 감지</p>
                <ul className="space-y-1.5 text-sm text-gray-400">
                  <li>• <span className="text-emerald-400">정상</span>: 80% 미만</li>
                  <li>• <span className="text-amber-400">경고</span>: 80-90%</li>
                  <li>• <span className="text-rose-400">Critical</span>: 90% 이상</li>
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-gray-500 mb-1">주요 모니터링 경로</p>
                <div className="space-y-1 text-xs font-mono text-gray-400">
                  <div>• /var/lib/kubelet</div>
                  <div>• /var/lib/docker</div>
                  <div>• /var/log</div>
                </div>
              </div>
            </div>
          </Card>

          <Card title="I/O 성능 모니터링" icon={<Activity className="w-5 h-5" />} color="emerald">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 mb-1">측정 항목</p>
                <ul className="space-y-1.5 text-sm text-gray-400">
                  <li>• Read/Write 레이턴시</li>
                  <li>• IOPS (초당 I/O 작업)</li>
                  <li>• 처리량 (Throughput)</li>
                  <li>• I/O 대기 시간</li>
                </ul>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-rose-400">높은 I/O 지연 시</p>
                <p className="text-xs text-gray-500 mt-1">
                  Events 생성 및 성능 저하 알림
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-amber-400 font-bold mb-3">파일시스템 에러 감지</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-2">감지 가능한 에러</p>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li>• Read-only filesystem</li>
                    <li>• Filesystem corruption</li>
                    <li>• Mount point 문제</li>
                    <li>• Inode exhaustion</li>
                  </ul>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-2">대응 방식</p>
                  <ul className="space-y-1 text-sm text-gray-400">
                    <li>• Events 즉시 생성</li>
                    <li>• StorageReady=False 설정</li>
                    <li>• CloudWatch 알림</li>
                    <li>• Node Auto Repair 트리거</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl p-5 border border-purple-500/30">
          <h4 className="text-purple-400 font-bold mb-3">DiskPressure Condition</h4>
          <div className="flex items-center gap-3 mb-3">
            <Badge color="rose">Critical</Badge>
            <Badge color="amber">Auto Repair 트리거</Badge>
          </div>
          <p className="text-sm text-gray-300">
            디스크 공간이 임계값을 초과하면 Kubernetes는 <span className="text-purple-400">DiskPressure</span> Condition을 설정하고,
            Node Auto Repair가 활성화된 경우 자동으로 노드를 교체합니다.
          </p>
          <div className="mt-3 bg-gray-900/50 rounded-lg p-3 text-xs font-mono">
            <p className="text-purple-400">kubectl get nodes -o wide</p>
            <p className="text-gray-500 mt-1">NAME STATUS CONDITIONS</p>
            <p className="text-rose-400 mt-1">node-1 NotReady DiskPressure=True</p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
