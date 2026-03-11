import { SlideWrapper, CodeBlock, Card } from '@shared/components';

export default function Slide14() {
  const code = `apiVersion: networking.istio.io/v1
kind: DestinationRule
metadata:
  name: backend-circuit-breaker
spec:
  host: backend-service
  trafficPolicy:
    connectionPool:
      http:
        http1MaxPendingRequests: 50
        http2MaxRequests: 100
        maxRequestsPerConnection: 10
        maxRetries: 3
    outlierDetection:
      consecutive5xxErrors: 5
      interval: 30s
      baseEjectionTime: 30s
      maxEjectionPercent: 50`;

  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-6 text-center">Circuit Breaker 패턴</h2>
      
      <div className="flex-1 flex flex-col justify-center space-y-4">
        <Card className="p-4 bg-rose-500/10 border-rose-500/30">
          <p className="text-center text-gray-300">
            장애가 발생한 서비스로의 요청을 차단하여 <span className="text-rose-300 font-bold">연쇄 장애(Cascading Failure)</span>를 방지
          </p>
        </Card>

        <CodeBlock code={code} language="yaml" title="circuit-breaker.yaml" />
        
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Card className="p-3">
            <h4 className="font-semibold text-amber-300 mb-1">감지</h4>
            <p className="text-gray-400 text-xs">5회 연속 5xx 에러</p>
          </Card>
          <Card className="p-3">
            <h4 className="font-semibold text-rose-300 mb-1">격리</h4>
            <p className="text-gray-400 text-xs">30초간 인스턴스 제거</p>
          </Card>
          <Card className="p-3">
            <h4 className="font-semibold text-blue-300 mb-1">보호</h4>
            <p className="text-gray-400 text-xs">최대 50%까지 제거</p>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
