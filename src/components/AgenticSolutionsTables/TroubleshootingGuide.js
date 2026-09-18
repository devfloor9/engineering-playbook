import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import ManualTable from '../ArchitectureTables/ManualTable';
const TroubleshootingGuide = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const headers = isKo ? ["문제 유형", "확인 사항", "해결 도구"] : ["Configuration", "Cost per Job", "Time to Complete"];
  const data = isKo ? [["**스케줄링 실패**", "Device Plugin, Toleration, GPU 가용성", "`kubectl describe pod`, `kubectl get nodes`"], ["**메모리 부족**", "GPU 메모리 크기, 배치 크기, MIG 설정", "`nvidia-smi`, vLLM 설정"], ["**노드 프로비저닝 실패**", "NodePool 설정, IAM 권한, 인스턴스 가용성", "`kubectl logs -n karpenter`, AWS Console"], ["**드라이버 문제**", "드라이버 버전, CUDA 호환성", "`nvidia-smi`, GPU Operator 로그"], ["**네트워크 성능**", "EFA 활성화, Security Group, 인스턴스 타입", "`fi_info -p efa`, NCCL 로그"], ["**Spot 중단**", "인스턴스 다양성, PDB, Graceful shutdown", "CloudWatch Events, Karpenter 로그"]] : [["**On-Demand p4d.24xlarge (2 nodes)**", "$524", "8 hours"], ["**Spot p4d.24xlarge (2 nodes, 70% discount)**", "$157", "8.5 hours (with 1 interruption)"], ["**Spot p5.48xlarge (1 node, newer gen)**", "$196", "5 hours (faster GPU)"]];
  return <ManualTable title={isKo ? 'GPU 워크로드 트러블슈팅' : 'GPU Workload Troubleshooting'} headers={headers} rows={data} numericColumns={isKo ? [] : [1, 2]} />;
};
export default TroubleshootingGuide;
