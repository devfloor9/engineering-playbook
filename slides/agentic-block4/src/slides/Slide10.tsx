import { SlideWrapper, CodeBlock, Card } from '@shared/components';
import { Calendar, Zap } from 'lucide-react';

export default function Slide10() {
  const cronJobCode = `apiVersion: batch/v1
kind: CronJob
metadata:
  name: rag-evaluation
  namespace: genai-platform
spec:
  schedule: "0 6 * * *"  # 매일 오전 6시
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: evaluator
            image: your-registry/rag-evaluator:latest
            env:
            - name: OPENAI_API_KEY
              valueFrom:
                secretKeyRef:
                  name: openai-credentials
                  key: api-key
            command:
            - python
            - /app/evaluate.py
            - --config=/app/config/evaluation.yaml`;

  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-6 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
        RAGAS 자동화
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Calendar className="w-8 h-8 text-emerald-400" />
            <h3 className="text-xl font-bold text-white">CronJob 기반 정기 평가</h3>
          </div>
          <ul className="space-y-2 text-sm text-gray-300">
            <li>• <strong>일일 평가</strong>: 매일 오전 자동 실행</li>
            <li>• <strong>테스트 세트</strong>: S3에서 로드</li>
            <li>• <strong>결과 저장</strong>: S3 + 메트릭 게시</li>
            <li>• <strong>알림</strong>: Slack/SNS 통합</li>
          </ul>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-8 h-8 text-cyan-400" />
            <h3 className="text-xl font-bold text-white">품질 게이트</h3>
          </div>
          <div className="space-y-2">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2 text-sm">
              <strong className="text-emerald-300">Faithfulness</strong>: ≥ 0.8
            </div>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded p-2 text-sm">
              <strong className="text-blue-300">Answer Relevancy</strong>: ≥ 0.75
            </div>
            <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2 text-sm">
              <strong className="text-amber-300">Context Precision</strong>: ≥ 0.7
            </div>
            <div className="bg-purple-500/10 border border-purple-500/30 rounded p-2 text-sm">
              <strong className="text-purple-300">Context Recall</strong>: ≥ 0.7
            </div>
          </div>
        </Card>
      </div>

      <CodeBlock
        code={cronJobCode}
        language="yaml"
        title="rag-evaluation-cronjob.yaml"
      />
    </SlideWrapper>
  );
}
