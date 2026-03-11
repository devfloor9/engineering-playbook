import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { Layers } from 'lucide-react';

export default function Slide13() {
  const nativeSidecarCode = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: app-with-native-sidecar
spec:
  template:
    spec:
      initContainers:
      # Native Sidecar: restartPolicy: Always
      - name: log-collector
        image: fluentbit:latest
        restartPolicy: Always  # 핵심 설정!
        ports:
        - containerPort: 2020
        resources:
          requests:
            cpu: 50m
            memory: 64Mi
      containers:
      - name: app
        image: myapp:v1
        ports:
        - containerPort: 8080`;

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 text-emerald-400">Native Sidecar 컨테이너</h2>
      <p className="text-xl text-gray-300 mb-4">
        Kubernetes 1.28+ GA: 종료 순서를 보장하는 공식 사이드카 패턴
      </p>
      <div className="grid grid-cols-2 gap-6">
        <CodeBlock code={nativeSidecarCode} language="yaml" title="deployment.yaml" />
        <div className="space-y-4">
          <Card title="Native Sidecar 특징" icon={<Layers size={24} />} color="emerald">
            <ul className="space-y-2 text-sm">
              <li>• Init Container에 <code className="bg-gray-800 px-1 rounded">restartPolicy: Always</code></li>
              <li>• 메인 컨테이너보다 먼저 시작</li>
              <li>• 메인 컨테이너보다 나중에 종료</li>
              <li>• Istio proxy, 로그 수집기에 적합</li>
            </ul>
          </Card>
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-sm">
            <p className="font-semibold text-blue-400 mb-2">종료 순서 보장</p>
            <ol className="space-y-1 text-gray-300">
              <li>1. 일반 컨테이너(app)에 SIGTERM 전송</li>
              <li>2. 일반 컨테이너 종료 완료 대기</li>
              <li>3. Native Sidecar(log-collector)에 SIGTERM 전송</li>
              <li>4. Native Sidecar 종료</li>
            </ol>
          </div>
        </div>
      </div>
      <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-sm">
        <p className="text-amber-400 font-semibold mb-2">🎯 기존 문제 해결</p>
        <p className="text-gray-300">
          일반 사이드카는 메인 컨테이너와 동시에 SIGTERM을 수신하므로, Istio proxy가 먼저 종료되면
          메인 앱의 네트워크가 끊기는 문제가 발생. Native Sidecar는 이를 근본적으로 해결.
        </p>
      </div>
    </SlideWrapper>
  );
}
