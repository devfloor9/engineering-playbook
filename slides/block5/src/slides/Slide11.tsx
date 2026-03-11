import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { Clock } from 'lucide-react';

export default function Slide11() {
  const preStopExample = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: myapp
spec:
  template:
    spec:
      containers:
      - name: app
        image: myapp:v1
        lifecycle:
          preStop:
            exec:
              command:
              - /bin/sh
              - -c
              - sleep 5  # Endpoints 제거 대기
      terminationGracePeriodSeconds: 60`;

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 text-emerald-400">preStop Hook 활용</h2>
      <p className="text-xl text-gray-300 mb-6">
        preStop Hook은 컨테이너 종료 전에 실행되는 정리 작업입니다.
      </p>
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <CodeBlock code={preStopExample} language="yaml" title="deployment.yaml" />
        </div>
        <div className="space-y-4">
          <Card title="preStop Hook 목적" icon={<Clock size={24} />} color="blue">
            <ul className="space-y-2 text-sm">
              <li>• Endpoint 제거 시간 확보</li>
              <li>• kube-proxy iptables 업데이트 대기</li>
              <li>• 새 트래픽 유입 차단</li>
              <li>• 5초 sleep 권장</li>
            </ul>
          </Card>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 text-sm">
            <p className="text-amber-400 font-semibold mb-2">⚠️ 중요</p>
            <p className="text-gray-300">
              preStop Hook과 Endpoint 제거는 <strong>비동기</strong>로 동시에 시작됩니다.
              sleep 없이는 종료 중인 Pod으로 트래픽이 계속 유입되어 502/503 에러 발생!
            </p>
          </div>
        </div>
      </div>
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-lg p-4 text-sm">
        <p className="text-rose-400 font-semibold mb-2">❌ 흔한 실수: kill -TERM 1 불필요</p>
        <p className="text-gray-300">
          Kubernetes는 preStop Hook 완료 후 자동으로 컨테이너의 PID 1에 SIGTERM을 전송합니다.
          preStop에서 별도로 <code className="bg-gray-800 px-2 py-1 rounded">kill -TERM 1</code>을 실행하면
          SIGTERM이 중복 전송되며, 예상과 다르게 동작할 수 있습니다.
        </p>
      </div>
    </SlideWrapper>
  );
}
