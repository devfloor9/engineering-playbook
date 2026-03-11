import { SlideWrapper, Card } from '@shared/components';
import { Code, Database, Gauge, Lock } from 'lucide-react';

export function LayerAppSlide() {
  return (
    <SlideWrapper>
      <h2 className="text-3xl font-bold mb-6 text-purple-400">Layer 6: 애플리케이션</h2>
      <div className="grid grid-cols-2 gap-6 flex-1">
        <Card title="애플리케이션 로그" icon={<Code size={20} />} color="purple">
          <ul className="space-y-2">
            <li><strong>구조화 로깅</strong>: JSON 포맷으로 파싱 용이</li>
            <li><strong>로그 레벨</strong>: 동적 변경 지원 (DEBUG ↔ INFO)</li>
            <li><strong>분산 추적</strong>: X-Ray, Jaeger trace ID 전파</li>
            <li><strong>상관 ID</strong>: request-id로 요청 추적</li>
          </ul>
        </Card>
        <Card title="외부 의존성" icon={<Database size={20} />} color="blue">
          <ul className="space-y-2">
            <li><strong>RDS</strong>: 연결 풀 고갈, slow query</li>
            <li><strong>ElastiCache</strong>: 메모리 부족, eviction</li>
            <li><strong>SQS/SNS</strong>: 메시지 처리 지연</li>
            <li><strong>외부 API</strong>: timeout, circuit breaker 동작</li>
          </ul>
        </Card>
        <Card title="성능 이슈" icon={<Gauge size={20} />} color="amber">
          <ul className="space-y-2">
            <li><strong>높은 지연</strong>: P99 latency 모니터링</li>
            <li><strong>CPU throttling</strong>: CFS quota 영향</li>
            <li><strong>GC 압력</strong>: JVM/Go GC pause 확인</li>
            <li><strong>커넥션 리크</strong>: netstat/ss 확인</li>
          </ul>
        </Card>
        <Card title="보안 이슈" icon={<Lock size={20} />} color="rose">
          <ul className="space-y-2">
            <li><strong>IRSA</strong>: ServiceAccount 토큰 만료</li>
            <li><strong>Secret</strong>: 환경변수 vs 볼륨 마운트</li>
            <li><strong>mTLS</strong>: 인증서 갱신 실패</li>
          </ul>
        </Card>
      </div>
    </SlideWrapper>
  );
}
