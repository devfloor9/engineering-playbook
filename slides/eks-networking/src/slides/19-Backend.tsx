import { SlideWrapper, Card, CompareTable } from '@shared/components';
import { Gauge } from 'lucide-react';

export default function BackendSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Gauge aria-hidden="true" className="w-12 h-12 text-orange-400" />
        백엔드: Scope → Insights → Monitor·NHI
      </h1>

      <CompareTable
        headers={['구성 요소', '역할']}
        rows={[
          ['Scope', '관측 대상 계정 집합 — Organizations 다중 계정 범위 지원'],
          ['Workload insights', 'Scope 전체 flow 집계 + metric별 top contributors (AZ 내/간, VPC 간)'],
          ['Monitor', 'local/remote 리소스 쌍(EKS 클러스터 포함) 상세 추적 — end-to-end 지표 + NHI'],
          ['NHI', '이진 지표: 100 = Degraded = 해당 구간 최소 1개 flow에 AWS 네트워크 이슈'],
        ]}
        highlightCol={0}
      />

      <div className="grid grid-cols-3 gap-4 mt-8">
        <Card title="NHI 해석의 범위" color="orange">
          NHI 0 = 관측 범위에서 AWS 네트워크 영향 미탐지. <b>앱 원인을 확정하거나 고객 네트워크 문제를 배제하지 않습니다</b>.
        </Card>
        <Card title="산정 로직은 비공개" color="gray">
          NHI가 AWS 네트워크 이슈를 판정하는 내부 알고리즘은 공개되지 않음
        </Card>
        <Card title="RTT는 sparse" color="amber">
          RTT는 항상 계산되는 값이 아님 — 공식 문서 명시. 빈 구간을 이상으로 오독하지 말 것
        </Card>
      </div>
    </SlideWrapper>
  );
}
