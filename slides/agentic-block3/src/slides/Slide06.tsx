import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { TrendingUp, Gauge } from 'lucide-react';

export default function Slide06() {
  const hpaYaml = `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: vllm-hpa
spec:
  scaleTargetRef:
    kind: Deployment
    name: vllm-deployment
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Pods
      pods:
        metric:
          name: vllm_num_requests_waiting
        target:
          type: AverageValue
          averageValue: "5"`;

  const metrics = [
    { name: 'vllm:num_requests_waiting', desc: '대기 중 요청 수' },
    { name: 'vllm:gpu_cache_usage_perc', desc: 'GPU KV 캐시 사용률' },
    { name: 'vllm:avg_generation_throughput', desc: '생성 처리량 (tokens/sec)' },
  ];

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-4 mb-6">
          <TrendingUp className="w-12 h-12 text-emerald-400" />
          <h2 className="text-4xl font-bold text-emerald-400">vLLM 자동 스케일링</h2>
        </div>

        <div className="grid grid-cols-2 gap-8">
          <div>
            <CodeBlock
              code={hpaYaml}
              language="yaml"
              title="HPA - 큐 깊이 메트릭 기반"
            />
          </div>

          <div className="space-y-6">
            <Card className="p-6 bg-gradient-to-r from-purple-900/40 to-blue-900/40">
              <div className="flex items-center gap-3 mb-4">
                <Gauge className="w-10 h-10 text-purple-400" />
                <h3 className="text-2xl font-semibold text-white">주요 메트릭</h3>
              </div>
              <div className="space-y-3">
                {metrics.map((m, idx) => (
                  <div key={idx} className="p-3 bg-gray-800/50 rounded">
                    <div className="text-cyan-400 font-mono text-sm">{m.name}</div>
                    <div className="text-gray-300 text-sm mt-1">{m.desc}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-cyan-900/40 to-emerald-900/40">
              <h3 className="text-xl font-semibold text-white mb-3">스케일링 트리거</h3>
              <ul className="space-y-2 text-gray-300">
                <li className="flex items-center gap-2">
                  <span className="text-emerald-400">▸</span>
                  <span>대기 요청 {">"} 5개: Scale Up</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-blue-400">▸</span>
                  <span>KV 캐시 사용률 {">"} 90%: 추가 Pod</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-purple-400">▸</span>
                  <span>유휴 시간 5분: Scale Down</span>
                </li>
              </ul>
            </Card>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
