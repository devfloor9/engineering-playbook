import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide07() {
  return (
    <SlideWrapper>
      <h2 className="text-5xl font-bold mb-8 text-emerald-400">워크로드별 Probe 패턴</h2>
      <p className="text-xl text-gray-300 mb-6">
        애플리케이션 특성에 따라 Probe 타이밍을 조정하여 최적의 가용성을 확보하세요.
      </p>
      <CompareTable
        headers={['워크로드 유형', 'initialDelaySeconds', 'periodSeconds', 'failureThreshold', '이유']}
        rows={[
          [
            '웹 서비스 (Node.js, Python)',
            '10',
            '5',
            '3',
            '빠른 시작, 빠른 감지 필요',
          ],
          [
            'JVM 앱 (Spring Boot)',
            '0 (Startup Probe 사용)',
            '10',
            '3',
            '시작 느림, Startup으로 보호',
          ],
          [
            '데이터베이스 (PostgreSQL)',
            '30',
            '10',
            '5',
            '초기화 시간 길음',
          ],
          [
            '배치 워커',
            '5',
            '15',
            '2',
            '주기적 작업, 느슨한 감지',
          ],
          [
            'ML 추론 서비스',
            '0 (Startup: 60)',
            '10',
            '3',
            '모델 로딩 시간 긺',
          ],
        ]}
      />
      <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <h3 className="text-lg font-bold text-blue-400 mb-2">💡 타이밍 설계 공식</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-300">
          <p>
            <strong className="text-blue-300">최대 감지 시간</strong> = failureThreshold × periodSeconds
          </p>
          <p>
            <strong className="text-blue-300">최소 복구 시간</strong> = successThreshold × periodSeconds (Readiness만)
          </p>
        </div>
      </div>
    </SlideWrapper>
  );
}
