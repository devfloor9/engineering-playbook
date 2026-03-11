import { SlideWrapper, Card, Badge } from '@shared/components';
import { Cloud, Zap, Shield, DollarSign } from 'lucide-react';

export default function Slide10() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-10 text-center bg-gradient-to-r from-orange-400 to-blue-400 bg-clip-text text-transparent">
        EKS 기반 해결 전략 개요
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Cloud className="w-10 h-10 text-orange-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-orange-300">Amazon EKS + AWS 서비스 통합</h3>
              <p className="text-lg text-gray-300">
                관리형 Kubernetes와 AWS 인프라의 완벽한 통합으로 운영 부담 최소화
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-5">
          <Card className="p-6">
            <Zap className="w-9 h-9 text-amber-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-amber-300">Karpenter 중심 자동화</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• GPU 노드 2-3분 내 프로비저닝</li>
              <li>• 워크로드 분석 후 최적 인스턴스 선택</li>
              <li>• Consolidation으로 비용 20-30% 절감</li>
            </ul>
          </Card>

          <Card className="p-6">
            <Shield className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-blue-300">EKS Auto Mode</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• Karpenter 자동 구성 및 관리</li>
              <li>• 핵심 컴포넌트 자동 업그레이드</li>
              <li>• 초기 구축 시간 80% 단축</li>
            </ul>
          </Card>

          <Card className="p-6">
            <DollarSign className="w-9 h-9 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-3 text-emerald-300">비용 최적화</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• Spot 인스턴스로 추론 비용 50-70% 절감</li>
              <li>• Savings Plans로 학습 비용 절감</li>
              <li>• 유휴 리소스 자동 정리</li>
            </ul>
          </Card>

          <Card color="orange" className="p-6">
            <h4 className="text-xl font-semibold mb-3 text-orange-300">AWS 통합</h4>
            <ul className="text-base text-gray-300 space-y-2">
              <li>• Amazon S3: 모델 및 데이터 저장</li>
              <li>• CloudWatch: 통합 모니터링</li>
              <li>• IAM: 세밀한 권한 관리</li>
            </ul>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
