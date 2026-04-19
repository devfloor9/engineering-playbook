import { SlideWrapper } from '../components/SlideWrapper';
import { CompareTable } from '../components/CompareTable';
import { Badge } from '../components/Badge';
import { CodeBlock } from '../components/CodeBlock';

export default function CudaXidErrors() {
  return (
    <SlideWrapper accent="purple">
      <Badge color="purple">GPU/AI</Badge>
      <h1 className="text-5xl font-bold mt-2 mb-6">CUDA XID 에러 패턴</h1>

      <CompareTable
        headers={['XID', '의미', '원인', '조치']}
        highlightCol={3}
        rows={[
          ['31', 'GPU memory page fault', '잘못된 메모리 접근', '드라이버 업데이트, 메모리 할당 검증'],
          ['48', 'Double bit ECC error', '하드웨어 메모리 결함', '노드 교체 필수 (영구 결함)'],
          ['74', 'NVLink error', 'GPU 간 통신 실패', 'NVLink 토폴로지 확인, 케이블 점검'],
          ['79', 'GPU fallen off the bus', 'PCIe 통신 단절', '노드 교체 필수 (하드웨어 결함)'],
          ['43', 'GPU stopped responding', 'GPU 응답 없음', '노드 재시작 필요'],
          ['94', 'Contained error', '메모리 무결성 오류', 'ECC 모드 확인, 노드 교체 검토'],
        ]}
        delay={0.2}
      />

      <div className="mt-5">
        <CodeBlock title="XID 에러 확인 방법" delay={0.4}>
{`# 커널 로그에서 XID 에러 검색
kubectl debug node/<gpu-node> -it --image=ubuntu
dmesg | grep -i "xid"

# 출력 예시 (하드웨어 결함)
# [123.456] NVRM: Xid (PCI:0000:10:1c): 79, GPU has fallen off the bus.
# → XID 48, 79: 즉시 노드 교체 필요`}
        </CodeBlock>
      </div>
    </SlideWrapper>
  );
}
