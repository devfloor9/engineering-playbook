const cni = 'https://github.com/aws/amazon-vpc-cni-k8s/blob/dd78f8bb498e5a581bd29565476bb1bf6f4fd96e/';
const nfm = 'https://github.com/aws/network-flow-monitor-agent/blob/3bf328bc44c53ffb2a35696e58484c06fc4259f8/';
const cw = 'https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/';
const source = (label: string, href: string) => ({ label, href });
const cniReadme = source('VPC CNI README', `${cni}README.md`);
const agent = source('NFM 구현·기본값', `${nfm}nfm-controller/src/lib.rs`);
const install = source('AWS EKS add-on 설치', `${cw}CloudWatch-NetworkFlowMonitor-agents-kubernetes-eks.html`);
const metrics = source('AWS NFM 지표·NHI', `${cw}CloudWatch-NetworkFlowMonitor-cw-metrics.html`);

export const slideDetails = [
  { title: 'EKS Networking Deep Dive', sources: [cniReadme, agent] },
  { title: '목차', sources: [cniReadme, source('NFM 동작 원리', `${cw}CloudWatch-NetworkFlowMonitor-inside-network-flow-monitor.html`)] },
  { title: 'VPC CNI: 오버레이 없는 L3', sources: [cniReadme, source('VPC CNI 설계', `${cni}docs/cni-proposal.md`)] },
  { title: 'CNI 바이너리와 ipamd', sources: [cniReadme, source('CNI 실행 주체', 'https://kubernetes.io/docs/concepts/extend-kubernetes/compute-storage-net/network-plugins/')] },
  { title: 'IPv4 데이터패스', sources: [source('라우팅 드라이버', `${cni}cmd/routed-eni-cni-plugin/driver/driver.go`), cniReadme] },
  { title: 'host veth 이름', sources: [source('이름 생성 소스', `${cni}pkg/networkutils/names.go`)] },
  { title: 'Secondary IP Warm Pool', sources: [cniReadme, source('타깃 설계', `${cni}docs/eni-and-ip-target.md`)] },
  { title: 'Prefix Delegation', sources: [source('AWS Prefix 모드', 'https://docs.aws.amazon.com/eks/latest/best-practices/prefix-mode-linux.html'), cniReadme] },
  { title: 'IP 쿨다운', sources: [cniReadme, source('IP datastore', `${cni}pkg/ipamd/datastore/data_store.go`)] },
  { title: '일반 풀 축소', sources: [source('ipamd 반납·reconcile', `${cni}pkg/ipamd/ipamd.go`)] },
  { title: 'NetworkPolicy', sources: [source('AWS NetworkPolicy', 'https://docs.aws.amazon.com/eks/latest/userguide/cni-network-policy.html')] },
  { title: 'CNI 관측과 용량', sources: [cniReadme, source('AWS 커스텀 네트워킹', 'https://docs.aws.amazon.com/eks/latest/best-practices/custom-networking.html')] },
  { title: 'NFM: TCP 소켓 통계', sources: [source('AWS 수집 범위', `${cw}CloudWatch-NetworkFlowMonitor-inside-network-flow-monitor.html`), metrics] },
  { title: 'NFM 데이터 경로', sources: [agent, source('OTLP 전송', `${nfm}nfm-controller/src/reports/publisher_endpoint.rs`)] },
  { title: 'sock_ops 콜백', sources: [source('콜백 구현', `${nfm}nfm-common/src/sock_ops_handler.rs`), source('eBPF 진입점', `${nfm}nfm-bpf/src/main.rs`)] },
  { title: '타이머와 권한', sources: [agent, source('손실 우선 필터', `${nfm}nfm-controller/src/events/event_filter_top_loss.rs`)] },
  { title: 'Kubernetes 메타데이터', sources: [source('Pod·EndpointSlice watcher', `${nfm}nfm-controller/src/kubernetes/kubernetes_metadata_collector.rs`)] },
  { title: 'NFM 리포트', sources: [source('리포트 스키마', `${nfm}nfm-controller/src/reports/report.rs`), source('OTLP 전송', `${nfm}nfm-controller/src/reports/publisher_endpoint.rs`)] },
  { title: 'Scope·Monitor·NHI', sources: [metrics, source('AWS NFM 개요', `${cw}CloudWatch-NetworkFlowMonitor.html`)] },
  { title: 'EKS 배포 확인', sources: [install, source('Linux 지원표', `${cw}CloudWatch-NetworkFlowMonitor-agents-versions.html`)] },
  { title: '3계층 진단', sources: [install, source('AWS 문제 해결', `${cw}CloudWatch-NetworkFlowMonitor-troubleshooting.html`)] },
  { title: '핵심 정리', sources: [cniReadme, agent, metrics] },
];
