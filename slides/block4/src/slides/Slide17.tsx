import { SlideWrapper, CompareTable } from '@shared/components';

export default function Slide17() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center">Litmus vs Chaos Mesh</h2>
      
      <div className="flex-1 flex flex-col justify-center">
        <CompareTable
          headers={['항목', 'Litmus Chaos', 'Chaos Mesh']}
          rows={[
            ['CNCF 상태', '인큐베이팅', '인큐베이팅'],
            ['UI/Dashboard', 'ChaosCenter (풍부)', 'Dashboard (간단)'],
            ['장애 유형', 'Pod, 노드, 네트워크', 'Pod, 네트워크, 스토리지, 커널'],
            ['워크플로우', 'ChaosEngine (선언적)', 'Workflow (선언적)'],
            ['학습 곡선', '보통', '낮음'],
            ['커뮤니티', '활발', '활발'],
            ['EKS 호환성', '우수', '우수'],
            ['권장 사용', '다양한 실험 + UI', '간단한 실험 + GitOps'],
          ]}
        />

        <div className="mt-6 space-y-3">
          <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
            <p className="text-sm text-blue-200 text-center">
              ✅ <span className="font-bold">Litmus:</span> ChaosCenter UI로 실험 관리, 
              다양한 실험 템플릿 제공
            </p>
          </div>

          <div className="p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
            <p className="text-sm text-cyan-200 text-center">
              ✅ <span className="font-bold">Chaos Mesh:</span> 간결한 YAML, 
              세밀한 장애 시나리오 (커널, 시간, JVM)
            </p>
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
