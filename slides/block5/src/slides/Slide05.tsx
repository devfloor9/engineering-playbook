import { SlideWrapper, CodeBlock } from '@shared/components';

export default function Slide05() {
  const probeConfig = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: rest-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: myapp/rest-api:v1.2.3
        ports:
        - containerPort: 8080

        # Startup Probe: 30초 이내 시작 완료 확인
        startupProbe:
          httpGet:
            path: /healthz
            port: 8080
          failureThreshold: 6
          periodSeconds: 5

        # Liveness Probe: 내부 헬스체크만 (외부 의존성 제외)
        livenessProbe:
          httpGet:
            path: /healthz
            port: 8080
          initialDelaySeconds: 0  # Startup 사용 시 0
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3

        # Readiness Probe: 외부 의존성 포함 가능
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
          timeoutSeconds: 3
          failureThreshold: 2
          successThreshold: 1

        lifecycle:
          preStop:
            exec:
              command: ["/bin/sh", "-c", "sleep 5"]
      terminationGracePeriodSeconds: 60`;

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 text-emerald-400">Probe 설정 패턴</h2>
      <p className="text-xl text-gray-300 mb-4">
        웹 서비스(REST API)의 표준 Probe 설정 예시
      </p>
      <CodeBlock code={probeConfig} language="yaml" title="deployment.yaml" />
      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3">
          <p className="font-semibold text-amber-400">Startup: 6 × 5s = 30초</p>
          <p className="text-gray-400">최대 30초 시작 대기</p>
        </div>
        <div className="bg-rose-500/10 border border-rose-500/30 rounded p-3">
          <p className="font-semibold text-rose-400">Liveness: 3 × 10s = 30초</p>
          <p className="text-gray-400">30초 후 재시작</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-3">
          <p className="font-semibold text-emerald-400">Readiness: 2 × 5s = 10초</p>
          <p className="text-gray-400">10초 후 Endpoints 제거</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
