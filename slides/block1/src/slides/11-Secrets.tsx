import { SlideWrapper, FlowDiagram, Card } from '@shared/components';
import { Lock } from 'lucide-react';

export default function SecretsSlide() {
  const nodes = [
    { id: 'eso', label: 'ESO Controller', x: 100, y: 100, width: 140, height: 60, color: 'blue' },
    { id: 'secret', label: 'ExternalSecret', x: 320, y: 100, width: 140, height: 60, color: 'emerald', description: 'CRD' },
    { id: 'sm', label: 'Secrets Manager', x: 540, y: 100, width: 150, height: 60, color: 'amber', description: 'AWS' },
    { id: 'k8s', label: 'K8s Secret', x: 320, y: 200, width: 140, height: 60, color: 'purple' },
  ];

  const edges = [
    { from: 'eso', to: 'secret', label: '1. Watch', color: 'blue' },
    { from: 'secret', to: 'sm', label: '2. Fetch (IRSA)', color: 'emerald' },
    { from: 'sm', to: 'secret', label: '3. Return', color: 'amber', style: 'dashed' as const },
    { from: 'secret', to: 'k8s', label: '4. Create/Update', color: 'purple' },
  ];

  return (
    <SlideWrapper>
      <h1 className="text-4xl font-bold mb-8 flex items-center gap-4">
        <Lock className="w-10 h-10 text-rose-400" />
        Secret 관리 (External Secrets Operator)
      </h1>

      <FlowDiagram nodes={nodes} edges={edges} width={750} height={300} />

      <div className="grid grid-cols-3 gap-4 mt-8">
        <Card title="중앙집중식 저장" color="blue">
          <ul className="text-xs space-y-2 text-gray-400">
            <li>• AWS Secrets Manager에 저장</li>
            <li>• Git에 암호화된 값 불필요</li>
            <li>• 감사 로깅 자동 활성화</li>
          </ul>
        </Card>

        <Card title="자동 동기화" color="emerald">
          <ul className="text-xs space-y-2 text-gray-400">
            <li>• ExternalSecret CRD 생성</li>
            <li>• ESO가 주기적으로 갱신</li>
            <li>• 로테이션 자동 반영</li>
          </ul>
        </Card>

        <Card title="접근 제어" color="amber">
          <ul className="text-xs space-y-2 text-gray-400">
            <li>• IRSA (IAM Roles for SA)</li>
            <li>• 최소 권한 원칙 적용</li>
            <li>• 네임스페이스별 분리</li>
          </ul>
        </Card>
      </div>

      <div className="mt-6 bg-rose-500/10 border border-rose-500/30 rounded-lg p-4">
        <h3 className="text-rose-400 font-bold mb-2 text-sm">보안 모범 사례</h3>
        <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
          <div>
            <strong className="text-white">금지:</strong> Git에 Secret 직접 커밋 (암호화 여부 무관)
          </div>
          <div>
            <strong className="text-white">권장:</strong> ExternalSecret CRD만 Git 저장, 실제 값은 Secrets Manager
          </div>
        </div>
      </div>
    </SlideWrapper>
  );
}
