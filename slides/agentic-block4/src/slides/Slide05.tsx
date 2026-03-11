import { SlideWrapper, CodeBlock } from '@shared/components';
import { Server } from 'lucide-react';

export default function Slide05() {
  const deploymentCode = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: langfuse
  namespace: observability
spec:
  replicas: 2
  template:
    spec:
      containers:
        - name: langfuse
          image: langfuse/langfuse:2.75.0
          ports:
            - containerPort: 3000
          env:
            - name: DATABASE_URL
              value: "postgresql://langfuse:password@postgres:5432/langfuse"
            - name: NEXTAUTH_SECRET
              valueFrom:
                secretKeyRef:
                  name: langfuse-secret
                  key: nextauth-secret
          resources:
            requests:
              memory: "512Mi"
              cpu: "250m"
            limits:
              memory: "1Gi"
              cpu: "500m"`;

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
        LangFuse EKS 배포
      </h2>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Server className="w-8 h-8 text-cyan-400" />
          <h3 className="text-2xl font-bold text-white">Kubernetes Deployment</h3>
        </div>

        <CodeBlock
          code={deploymentCode}
          language="yaml"
          title="langfuse-deployment.yaml"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="bg-gray-800 border border-emerald-500/30 rounded-lg p-3">
          <h4 className="text-sm font-bold text-emerald-300 mb-1">PostgreSQL</h4>
          <p className="text-xs text-gray-300">메타데이터 저장소</p>
        </div>
        <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-3">
          <h4 className="text-sm font-bold text-blue-300 mb-1">HPA</h4>
          <p className="text-xs text-gray-300">자동 스케일링 (2-10)</p>
        </div>
        <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-3">
          <h4 className="text-sm font-bold text-purple-300 mb-1">Ingress</h4>
          <p className="text-xs text-gray-300">ALB + HTTPS</p>
        </div>
      </div>
    </SlideWrapper>
  );
}
