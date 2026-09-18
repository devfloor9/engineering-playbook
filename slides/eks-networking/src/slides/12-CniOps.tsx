import { SlideWrapper, Card, CodeBlock, CompareTable } from '@shared/components';
import { Wrench } from 'lucide-react';

export default function CniOpsSlide() {
  return (
    <SlideWrapper>
      <h1 className="text-5xl font-bold mb-6 flex items-center gap-4">
        <Wrench aria-hidden="true" className="w-12 h-12 text-blue-400" />
        CNI 운영: 관측 지점과 IP 소진 대응
      </h1>

      <div className="grid grid-cols-2 gap-8 flex-1">
        <div className="space-y-4">
          <CodeBlock
            title="Linux 노드의 host namespace에서 조회"
            language="bash"
            code={`# ipamd 결정 로그
sudo tail -n 100 /var/log/aws-routed-eni/ipamd.log

# introspection (61679)
curl -fsS http://127.0.0.1:61679/v1/enis
curl -fsS http://127.0.0.1:61679/v1/pods

# Prometheus 메트릭 (61678 — 포트 다름!)
curl -fsS http://127.0.0.1:61678/metrics`}
          />
          <Card title="포트 혼동 주의" color="amber">
            introspection = <b>61679</b> / metrics = <b>61678</b>
          </Card>
        </div>

        <div className="space-y-4">
          <CompareTable
            headers={['순서', '용량 문제별 검토 옵션']}
            rows={[
              ['ENI 슬롯 부족', 'Prefix Delegation — 슬롯 효율 개선, /28 여유 주소 필요'],
              ['서브넷 주소 부족', '커스텀 네트워킹 — ENIConfig로 별도 Pod 서브넷 사용'],
              ['신규 클러스터', 'IPv6 검토 — 기존 IPv4 클러스터의 in-place 전환 불가'],
            ]}
          />
          <Card title="SGP (Security Groups for Pods)" color="purple">
            <span className="font-mono">ENABLE_POD_ENI=true</span> → VPC Resource Controller가
            trunk ENI(<span className="font-mono">aws-k8s-trunk-eni</span>) 생성, Pod별 branch ENI 연결.
            해당 Pod는 보조 IP 경로가 아닌 <b>branch ENI 경로</b>
          </Card>
        </div>
      </div>
    </SlideWrapper>
  );
}
