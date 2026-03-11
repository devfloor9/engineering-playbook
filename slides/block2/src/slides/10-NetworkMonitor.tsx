import { SlideWrapper, Card, CodeBlock } from '@shared/components';
import { Network, Wifi, AlertTriangle } from 'lucide-react';

export function Slide10() {
  const cniCheckCode = `# CNI 플러그인 상태 확인
/opt/cni/bin/aws-k8s-agent health-check

# 네트워크 인터페이스 검증
ip link show
ip addr show

# DNS 연결성 테스트
nslookup kubernetes.default.svc.cluster.local`;

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-blue-400">네트워크 모니터</h2>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <Card title="네트워크 인터페이스" icon={<Network className="w-5 h-5" />} color="blue">
            <div className="space-y-3">
              <p className="text-xs text-gray-500">모니터링 대상</p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li>• eth0, eni* 인터페이스 상태</li>
                <li>• IP 주소 할당 여부</li>
                <li>• 링크 업/다운 상태</li>
                <li>• MTU 설정</li>
                <li>• 네트워크 장치 드라이버</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-blue-400">NetworkUnavailable Condition</p>
                <p className="text-xs text-gray-500 mt-1">
                  인터페이스 장애 시 자동 설정
                </p>
              </div>
            </div>
          </Card>

          <Card title="DNS 연결성" icon={<Wifi className="w-5 h-5" />} color="emerald">
            <div className="space-y-3">
              <p className="text-xs text-gray-500">검증 항목</p>
              <ul className="space-y-1.5 text-sm text-gray-400">
                <li>• CoreDNS 서비스 접근</li>
                <li>• 클러스터 내부 DNS 해석</li>
                <li>• 외부 DNS 쿼리</li>
                <li>• /etc/resolv.conf 설정</li>
                <li>• DNS 응답 시간</li>
              </ul>
              <div className="mt-3 pt-3 border-t border-gray-800">
                <p className="text-xs text-emerald-400">주기적 헬스 체크</p>
                <p className="text-xs text-gray-500 mt-1">
                  DNS 장애 조기 감지
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="bg-gray-900 rounded-xl p-5 border border-gray-700/50">
          <h4 className="text-purple-400 font-bold mb-3">CNI 플러그인 모니터링</h4>
          <CodeBlock code={cniCheckCode} language="bash" title="network-health-check.sh" />
        </div>

        <div className="bg-amber-900/20 rounded-xl p-5 border border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-amber-400 font-bold mb-3">네트워크 패킷 손실 감지</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 mb-2">감지 방법</p>
                  <ul className="space-y-1 text-gray-500">
                    <li>• 커널 네트워크 통계 분석</li>
                    <li>• /proc/net/dev 모니터링</li>
                    <li>• 에러 카운터 추적</li>
                    <li>• 드롭된 패킷 수 확인</li>
                  </ul>
                </div>
                <div>
                  <p className="text-gray-400 mb-2">대응</p>
                  <ul className="space-y-1 text-gray-500">
                    <li>• Warning Events 생성</li>
                    <li>• CloudWatch 메트릭 전송</li>
                    <li>• 패킷 손실률 추적</li>
                    <li>• 임계값 초과 시 알림</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-rose-900/30 to-red-900/30 rounded-xl p-4 border border-rose-500/30">
          <h4 className="text-rose-400 font-bold mb-2 text-sm">완전한 네트워크 단절</h4>
          <p className="text-sm text-gray-400">
            네트워크가 완전히 단절된 경우 NMA도 통신할 수 없어 감지가 제한됩니다.
            이러한 경우 <span className="text-rose-400">Kubernetes Node Controller</span>가 Node 상태를 NotReady로 설정합니다.
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
