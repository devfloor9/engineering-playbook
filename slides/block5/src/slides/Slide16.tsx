import { SlideWrapper, Card } from '@shared/components';
import { Bug, Terminal, Activity, FileSearch } from 'lucide-react';

export default function Slide16() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-emerald-400">헬스체크 디버깅 팁</h2>
      <p className="text-xl text-gray-300 mb-6">
        Probe 실패 시 빠르게 원인을 파악하는 방법들
      </p>
      <div className="grid grid-cols-2 gap-6">
        <Card title="Pod 이벤트 확인" icon={<Bug size={24} />} color="rose">
          <div className="space-y-2 text-sm">
            <code className="block bg-gray-800 p-2 rounded text-xs">kubectl describe pod POD_NAME</code>
            <p className="text-gray-400">
              Events 섹션에서 Probe 실패 이유 확인:
            </p>
            <ul className="text-gray-400 space-y-1">
              <li>• Liveness probe failed: ...</li>
              <li>• Readiness probe failed: ...</li>
              <li>• Container restart reason</li>
            </ul>
          </div>
        </Card>

        <Card title="컨테이너 내부 테스트" icon={<Terminal size={24} />} color="blue">
          <div className="space-y-2 text-sm">
            <code className="block bg-gray-800 p-2 rounded text-xs">kubectl exec -it POD_NAME -- /bin/sh</code>
            <p className="text-gray-400">
              컨테이너 내부에서 헬스체크 엔드포인트 직접 호출:
            </p>
            <code className="block bg-gray-800 p-2 rounded text-xs">curl -v http://localhost:8080/healthz</code>
            <p className="text-gray-400">응답 코드, 헤더, 바디 확인</p>
          </div>
        </Card>

        <Card title="Probe 로그 확인" icon={<FileSearch size={24} />} color="amber">
          <div className="space-y-2 text-sm">
            <code className="block bg-gray-800 p-2 rounded text-xs">kubectl logs POD_NAME</code>
            <p className="text-gray-400">
              애플리케이션 로그에서 헬스체크 요청 확인:
            </p>
            <ul className="text-gray-400 space-y-1">
              <li>• GET /healthz 요청 기록</li>
              <li>• 응답 시간 측정</li>
              <li>• 에러 스택 트레이스</li>
            </ul>
          </div>
        </Card>

        <Card title="네트워크 연결 확인" icon={<Activity size={24} />} color="emerald">
          <div className="space-y-2 text-sm">
            <code className="block bg-gray-800 p-2 rounded text-xs">kubectl exec POD -- nc -zv localhost 8080</code>
            <p className="text-gray-400">
              포트가 열려있는지 확인. tcpSocket Probe 디버깅에 유용.
            </p>
            <code className="block bg-gray-800 p-2 rounded text-xs">kubectl exec POD -- ping DB_HOST</code>
            <p className="text-gray-400">외부 의존성 연결 확인</p>
          </div>
        </Card>
      </div>
      <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm">
        <p className="font-semibold text-blue-400 mb-2">💡 일반적인 Probe 실패 원인</p>
        <div className="grid grid-cols-2 gap-4 text-gray-300">
          <ul className="space-y-1">
            <li>• 애플리케이션이 아직 시작 중</li>
            <li>• 포트 번호 불일치</li>
            <li>• 경로 오타 (/healthz vs /health)</li>
          </ul>
          <ul className="space-y-1">
            <li>• timeoutSeconds 너무 짧음</li>
            <li>• 외부 의존성 장애 (DB, Redis)</li>
            <li>• 메모리/CPU 부족으로 응답 지연</li>
          </ul>
        </div>
      </div>
    </SlideWrapper>
  );
}
