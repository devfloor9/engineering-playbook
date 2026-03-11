import { SlideWrapper, CodeBlock } from '@shared/components';
import { Network, GitBranch } from 'lucide-react';

export default function Slide11() {
  const workflowCode = `apiVersion: kagent.dev/v1alpha1
kind: Workflow
metadata:
  name: research-report-workflow
spec:
  displayName: "리서치 리포트 생성 워크플로우"

  # 워크플로우 단계
  steps:
    # 1단계: 정보 수집
    - name: research
      agent: research-agent
      input:
        topic: "{{ .input.topic }}"
        sources: ["web", "academic", "news"]
      output:
        - name: research_data
      timeout: 300s

    # 2단계: 데이터 분석 (병렬 실행)
    - name: analyze-trends
      agent: analysis-agent
      dependsOn: [research]
      input:
        data: "{{ .steps.research.output.research_data }}"
        analysis_type: "trend"
      parallel: true

    - name: analyze-sentiment
      agent: analysis-agent
      dependsOn: [research]
      input:
        data: "{{ .steps.research.output.research_data }}"
        analysis_type: "sentiment"
      parallel: true

    # 3단계: 리포트 작성
    - name: write-report
      agent: writer-agent
      dependsOn: [analyze-trends, analyze-sentiment]
      input:
        research: "{{ .steps.research.output.research_data }}"
        trends: "{{ .steps.analyze-trends.output }}"
        sentiment: "{{ .steps.analyze-sentiment.output }}"

  # 오류 처리
  errorHandling:
    onStepFailure: retry
    maxRetries: 3`;

  return (
    <SlideWrapper>
      <div className="flex-1 flex flex-col p-12">
        <div className="flex items-center gap-3 mb-6">
          <Network className="w-12 h-12 text-cyan-400" />
          <div>
            <h2 className="text-5xl font-bold text-cyan-400">멀티 에이전트 오케스트레이션</h2>
            <p className="text-xl text-gray-300">Workflow CRD로 에이전트 간 협업</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-blue-500/30">
            <GitBranch className="w-8 h-8 text-blue-400 mb-2" />
            <h4 className="text-sm font-semibold text-blue-300 mb-2">순차 실행</h4>
            <p className="text-xs text-gray-300">
              dependsOn으로 단계 간 의존성 정의하여 순차적으로 실행
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-emerald-500/30">
            <GitBranch className="w-8 h-8 text-emerald-400 mb-2" />
            <h4 className="text-sm font-semibold text-emerald-300 mb-2">병렬 실행</h4>
            <p className="text-xs text-gray-300">
              parallel: true로 독립적인 작업을 동시에 실행하여 시간 단축
            </p>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-purple-500/30">
            <GitBranch className="w-8 h-8 text-purple-400 mb-2" />
            <h4 className="text-sm font-semibold text-purple-300 mb-2">데이터 전달</h4>
            <p className="text-xs text-gray-300">
              템플릿 문법으로 이전 단계의 출력을 다음 단계에 전달
            </p>
          </div>
        </div>

        <CodeBlock
          code={workflowCode}
          language="yaml"
          title="Workflow CRD 예시"
        />

        <div className="mt-4 grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-800/50 rounded-lg border border-cyan-500/30">
            <h5 className="text-sm font-semibold text-cyan-300 mb-2">통신 방식</h5>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• <span className="text-cyan-400">Message Queue:</span> Redis/Kafka 기반 비동기 통신</li>
              <li>• <span className="text-blue-400">gRPC:</span> Direct Call로 동기 통신</li>
            </ul>
          </div>
          <div className="p-4 bg-gray-800/50 rounded-lg border border-amber-500/30">
            <h5 className="text-sm font-semibold text-amber-300 mb-2">오류 처리</h5>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• 단계 실패 시 자동 재시도</li>
              <li>• 전체 워크플로우 타임아웃 설정</li>
              <li>• 실패 시 알림 (Slack, Email)</li>
            </ul>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
