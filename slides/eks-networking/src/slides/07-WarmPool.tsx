import { SlideWrapper, CompareTable, Card } from '@shared/components';
import { Database } from 'lucide-react';

export default function WarmPoolSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Database aria-hidden="true" className="w-12 h-12 text-emerald-400" />
        Warm Pool: Secondary IP 모드 타깃
      </h1>
      <p className="text-lg text-gray-400 mb-6">
        Pod 생성에 즉시 응답하기 위한 여유 IP 확보 — 퍼센트 임계가 아닌 <b className="text-emerald-400">절대치 타깃</b> 기반
      </p>

      <CompareTable
        headers={['변수', '기본값', '의미', '주의']}
        rows={[
          ['WARM_ENI_TARGET', '1', 'ENI 1개 분량의 IP를 여유로 유지', 'WARM_IP_TARGET 또는 MINIMUM_IP_TARGET 우선'],
          ['WARM_IP_TARGET', '없음', '여유 IP 개수 직접 지정', '대규모/high churn에서 사용 자제'],
          ['MINIMUM_IP_TARGET', '없음', '노드가 항상 보유할 IP 하한(floor)', 'WARM_IP_TARGET과 함께 설정'],
        ]}
        highlightCol={0}
      />

      <div className="grid grid-cols-2 gap-6 mt-8">
        <Card title="왜 기본값이 ENI 1개 통째인가" color="emerald">
          ENI attach는 <b>여러 초가 걸릴 수 있습니다</b>. Pod 급증 시 ENI 신규 attach 경로에 들어가면
          그 노드의 Pod 기동이 일괄 지연 → 여유를 크게 잡는 것이 의도된 설계
        </Card>
        <Card title="WARM_IP_TARGET 과소 설정의 함정" color="rose">
          작은 여유 풀은 IP 보충·반납 호출을 늘릴 수 있습니다. EC2 API 스로틀링은 같은 계정·리전의 <b>다른 노드 IP 할당에도 영향</b>을 줄 수 있습니다.
        </Card>
      </div>
    </SlideWrapper>
  );
}
