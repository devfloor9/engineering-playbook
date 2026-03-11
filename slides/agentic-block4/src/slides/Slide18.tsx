import { SlideWrapper, Card } from '@shared/components';
import { CheckCircle, ArrowRight } from 'lucide-react';

export default function Slide18() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
        핵심 정리 &amp; 다음 단계
      </h2>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-400" />
            <h3 className="text-2xl font-bold text-white">핵심 요약</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 mt-1 border border-blue-500/30">
                <span className="text-blue-400 font-bold">1</span>
              </div>
              <div>
                <div className="text-white font-bold">Agent 모니터링</div>
                <div className="text-sm text-gray-300">LangFuse로 전체 추론 체인 가시화</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 mt-1 border border-purple-500/30">
                <span className="text-purple-400 font-bold">2</span>
              </div>
              <div>
                <div className="text-white font-bold">RAG 평가</div>
                <div className="text-sm text-gray-300">RAGAS로 품질 메트릭 자동화</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 mt-1 border border-cyan-500/30">
                <span className="text-cyan-400 font-bold">3</span>
              </div>
              <div>
                <div className="text-white font-bold">MLOps 파이프라인</div>
                <div className="text-sm text-gray-300">Kubeflow + MLflow + KServe 통합</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 mt-1 border border-emerald-500/30">
                <span className="text-emerald-400 font-bold">4</span>
              </div>
              <div>
                <div className="text-white font-bold">하이브리드 아키텍처</div>
                <div className="text-sm text-gray-300">SageMaker 학습 + EKS 서빙</div>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <ArrowRight className="w-8 h-8 text-cyan-400" />
            <h3 className="text-2xl font-bold text-white">다음 단계</h3>
          </div>
          <div className="space-y-4">
            <div className="bg-gray-800 border border-blue-500/30 rounded-lg p-3">
              <div className="text-blue-300 font-bold mb-1">1. 모니터링 구축</div>
              <div className="text-xs text-gray-300">
                • LangFuse EKS 배포<br/>
                • Grafana 대시보드 구성<br/>
                • 알림 규칙 설정
              </div>
            </div>
            <div className="bg-gray-800 border border-purple-500/30 rounded-lg p-3">
              <div className="text-purple-300 font-bold mb-1">2. 품질 평가 자동화</div>
              <div className="text-xs text-gray-300">
                • RAGAS 테스트 세트 구축<br/>
                • CronJob 정기 평가<br/>
                • 품질 게이트 설정
              </div>
            </div>
            <div className="bg-gray-800 border border-emerald-500/30 rounded-lg p-3">
              <div className="text-emerald-300 font-bold mb-1">3. MLOps 파이프라인</div>
              <div className="text-xs text-gray-300">
                • Kubeflow Pipelines 구축<br/>
                • MLflow 모델 레지스트리<br/>
                • KServe 배포 자동화
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card color="emerald" className="p-6 text-center">
        <p className="text-2xl font-bold text-white mb-2">
          안정적 운영과 지속적 개선
        </p>
        <p className="text-gray-300">
          모니터링 → 평가 → 학습 → 배포 → 운영의 완전한 순환 구조
        </p>
      </Card>
    </SlideWrapper>
  );
}
