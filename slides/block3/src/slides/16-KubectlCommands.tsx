import { SlideWrapper, CodeBlock, Badge } from '@shared/components';

const code = `# === 클러스터 상태 ===
kubectl cluster-info
kubectl get componentstatuses    # deprecated but still useful
kubectl get nodes -o wide

# === Pod 진단 ===
kubectl get pods -A --field-selector=status.phase!=Running
kubectl describe pod <name> -n <ns>
kubectl logs <pod> --previous --tail=100
kubectl top pod --sort-by=memory -A

# === 이벤트 (시간순) ===
kubectl get events -A --sort-by='.lastTimestamp' | tail -30
kubectl get events --field-selector type=Warning -A

# === 네트워크 ===
kubectl get svc -A
kubectl get endpoints <svc-name>
kubectl run debug --image=nicolaka/netshoot --rm -it -- bash

# === 리소스 사용량 ===
kubectl top nodes
kubectl top pods --sort-by=cpu -A
kubectl describe node <name> | grep -A10 "Allocated"

# === Ephemeral Debug Container ===
kubectl debug -it <pod> --image=busybox --target=<container>
kubectl debug node/<node> -it --image=ubuntu`;

export function KubectlCommandsSlide() {
  return (
    <SlideWrapper>
      <div className="flex items-center gap-3 mb-4">
        <h2 className="text-3xl font-bold text-cyan-400">kubectl 진단 명령어 모음</h2>
        <Badge color="cyan">Cheat Sheet</Badge>
      </div>
      <div className="flex-1">
        <CodeBlock code={code} title="EKS 디버깅 필수 명령어" language="bash" />
      </div>
    </SlideWrapper>
  );
}
