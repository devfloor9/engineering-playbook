import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide14() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-emerald-400">Init Container vs Sidecar</h2>
      <p className="text-xl text-gray-300 mb-6">
        Init Container와 Native Sidecar의 차이점을 이해하고 적절히 선택하세요.
      </p>
      <CompareTable
        headers={['항목', 'Init Container', 'Native Sidecar (K8s 1.28+)', '일반 Sidecar']}
        rows={[
          [
            'restartPolicy',
            'Always (기본값 무시)',
            'Always (명시 필요)',
            'N/A (컨테이너 정의)',
          ],
          [
            '실행 시점',
            '메인 컨테이너 이전',
            '메인 컨테이너 이전',
            '메인 컨테이너와 동시',
          ],
          [
            '종료 시점',
            '작업 완료 후 즉시',
            '메인 컨테이너 종료 후',
            '메인 컨테이너와 동시',
          ],
          [
            '재시작 정책',
            '단일 실행 (재시작 없음)',
            '항상 실행 (재시작 가능)',
            '항상 실행',
          ],
          [
            '사용 사례',
            '설정 파일 생성, DB 마이그레이션',
            'Istio proxy, 로그 수집기',
            '모니터링 에이전트',
          ],
        ]}
      />
      <div className="mt-8 grid grid-cols-3 gap-4 text-sm">
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <h3 className="font-bold text-blue-400 mb-2">Init Container</h3>
          <p className="text-gray-300">
            초기화 작업 완료 후 종료. DB 스키마 마이그레이션, 설정 파일 다운로드 등.
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
          <h3 className="font-bold text-emerald-400 mb-2">Native Sidecar</h3>
          <p className="text-gray-300">
            메인 앱보다 오래 실행. Istio proxy, Fluent Bit, 모니터링 에이전트 등.
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
          <h3 className="font-bold text-amber-400 mb-2">일반 Sidecar</h3>
          <p className="text-gray-300">
            메인 앱과 동시 실행/종료. 종료 순서 제어 불가. Legacy 패턴.
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
