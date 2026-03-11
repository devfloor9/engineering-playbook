import { SlideWrapper, Card } from '@shared/components';
import { Shield, Lock, Key, ShieldCheck } from 'lucide-react';

export default function Slide19() {
  return (
    <SlideWrapper>
      <h2 className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-red-400 to-purple-400 bg-clip-text text-transparent">
        보안 아키텍처: 멀티 레이어 보안
      </h2>

      <div className="flex-1 flex flex-col justify-center space-y-5">
        <Card className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <Shield className="w-10 h-10 text-red-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-2xl font-semibold mb-2 text-red-300">다층 보안 모델</h3>
              <p className="text-lg text-gray-300">
                외부 접근부터 데이터 보안까지 계층적 보안 구조로 플랫폼 보호
              </p>
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-4">
          <Card className="p-5">
            <Key className="w-9 h-9 text-blue-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-blue-300">인증/인가</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• OIDC Provider (Cognito/Okta)</li>
              <li>• JWT 토큰 검증</li>
              <li>• API Key 관리</li>
              <li>• Kubernetes RBAC</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Lock className="w-9 h-9 text-purple-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-purple-300">네트워크 보안</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• mTLS (Istio)</li>
              <li>• NetworkPolicy 격리</li>
              <li>• Security Group 제어</li>
              <li>• Private Subnet 배치</li>
            </ul>
          </Card>

          <Card className="p-5">
            <ShieldCheck className="w-9 h-9 text-emerald-400 mb-3" />
            <h4 className="text-xl font-semibold mb-2 text-emerald-300">데이터 보안</h4>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• At-rest 암호화 (EBS, S3)</li>
              <li>• In-transit 암호화 (TLS)</li>
              <li>• Secrets Manager 통합</li>
              <li>• Pod Security Standards</li>
            </ul>
          </Card>
        </div>

        <Card color="red" className="p-6">
          <h4 className="text-xl font-semibold mb-3 text-red-300">보안 모범 사례</h4>
          <div className="grid grid-cols-2 gap-4 text-base text-gray-300">
            <div>
              <strong className="text-gray-300">네임스페이스 격리:</strong>
              <p className="text-sm">NetworkPolicy로 네임스페이스 간 통신 제한</p>
            </div>
            <div>
              <strong className="text-gray-300">최소 권한 원칙:</strong>
              <p className="text-sm">RBAC Role로 필요한 권한만 부여</p>
            </div>
            <div>
              <strong className="text-gray-300">시크릿 관리:</strong>
              <p className="text-sm">AWS Secrets Manager 또는 K8s Secrets 사용</p>
            </div>
            <div>
              <strong className="text-gray-300">정기 감사:</strong>
              <p className="text-sm">보안 스캔 및 취약점 패치</p>
            </div>
          </div>
        </Card>
      </div>
    </SlideWrapper>
  );
}
