# EKS 디버깅 마스터 가이드 — 발표자 노트 & 데이터 소스

> **슬라이드 URL**: https://devfloor9.github.io/engineering-playbook/slides/eks-debugging/
> **총 슬라이드**: 65장 (Session 1: #1-32, Session 2: #33-65)
> **대상 레벨**: Level 400 (EKS 운영 경험자)
> **예상 소요 시간**: Session 1 약 90분, Session 2 약 90분

---

## Session 1: 컨트롤 플레인 · 노드 · 워크로드 · Health Check

---

### Slide 1 — EKS 디버깅 마스터 가이드 (타이틀)

**스크립트**:
오늘 세션에서는 EKS 환경에서 발생하는 장애를 체계적으로 진단하고 해결하는 6-Layer 프레임워크를 다룹니다. Level 400 세션으로, EKS를 프로덕션에서 운영하는 분들을 대상으로 합니다. 총 2개 세션으로 나뉘며, 첫 번째 세션에서는 컨트롤 플레인, 노드, 워크로드, Health Check 불일치를 다루겠습니다.

---

### Slide 2 — 왜 체계적 디버깅인가?

**스크립트**:
비체계적 디버깅의 MTTR은 평균 4시간인 반면, 체계적 접근은 평균 30분으로 약 8배 차이가 납니다. 핵심은 "증상 → 레이어 분류 → 스코프 판별 → Decision Tree → 근본 원인 해결"의 4단계 프레임워크입니다. 이 패턴을 반복 훈련하면 대부분의 EKS 장애를 30분 내에 해결할 수 있습니다.

**데이터 소스**:
- MTTR 4시간 vs 30분: Google SRE Book (Chapter 12: Effective Troubleshooting) 및 AWS Support 케이스 통계 기반 경험적 수치
- Ref: [Google SRE Book — Effective Troubleshooting](https://sre.google/sre-book/effective-troubleshooting/)

---

### Slide 3 — EKS 디버깅 6-Layer 프레임워크

**스크립트**:
6-Layer는 컨트롤 플레인, 노드, 네트워크, 워크로드, 스토리지, 옵저버빌리티입니다. 상위 레이어부터 하위로 순차 점검하는 것이 원칙이며, 상위 레이어 장애가 하위에 전파될 수 있다는 점을 기억하세요. 예를 들어, 컨트롤 플레인의 API Server 장애는 노드 등록 실패, Pod 스케줄링 실패로 이어집니다.

**데이터 소스**:
- Kubernetes 공식 문서: [Troubleshooting Clusters](https://kubernetes.io/docs/tasks/debug/debug-cluster/)
- EKS Best Practices Guide: [Debugging](https://aws.github.io/aws-eks-best-practices/)

---

### Slide 4 — Top-down vs Bottom-up 접근

**스크립트**:
프로덕션 인시던트에서는 Top-down을 권장합니다. 사용자 증상에서 시작해 원인을 좁혀가는 방식이 MTTR을 최소화합니다. Bottom-up은 마이그레이션 후 검증이나 정기 점검에 적합합니다. 온콜 엔지니어는 Top-down, 플랫폼 팀은 Bottom-up으로 역할을 분리하는 것이 효과적입니다.

**데이터 소스**:
- Google SRE Workbook: [Debugging — General Principles](https://sre.google/workbook/debugging/)

---

### Slide 5 — First 5 Minutes 체크리스트

**스크립트**:
인시던트 발생 후 첫 5분이 가장 중요합니다. 30초 내에 클러스터 상태, 노드 상태, 비정상 Pod을 확인하고, 2분 내에 영향 범위를 판별합니다. "단일 Pod인가? 같은 노드인가? 같은 AZ인가?"를 빠르게 판단하는 것이 핵심입니다. 5분 시점에서 상세 진단으로 넘어갑니다.

**데이터 소스**:
- PagerDuty Incident Response Guide: [First 5 Minutes](https://response.pagerduty.com/)
- Kubernetes 공식: `kubectl get pods -A | grep -v Running` 패턴

---

### Slide 6 — 에스컬레이션 매트릭스

**스크립트**:
SEV-1부터 SEV-4까지 4단계로 분류합니다. SEV-1은 전체 서비스 중단으로 즉시 전원 호출, AWS Support Severity Critical로 케이스를 오픈합니다. SEV-2는 주요 기능 장애로 30분 내 대응. 실제 운영에서는 이 매트릭스를 사전에 합의하고 Runbook에 포함해야 합니다.

**데이터 소스**:
- AWS Support Severity Levels: [AWS Support Plans](https://aws.amazon.com/premiumsupport/plans/)
- PagerDuty Severity Levels: [Incident Priority](https://support.pagerduty.com/docs/incident-priority)

---

### Slide 7 — 컨트롤 플레인 디버깅

**스크립트**:
EKS 컨트롤 플레인은 AWS 관리형이므로 API Server, etcd에 직접 접근할 수 없습니다. 대신 CloudWatch의 kube-apiserver-audit 로그와 EKS Health 코드(EtcdNotAvailable 등)로 진단합니다. Add-on인 CoreDNS, kube-proxy, VPC CNI는 사용자 관리 영역이므로 직접 디버깅이 가능합니다.

**데이터 소스**:
- EKS Control Plane Logging: [Amazon EKS Control Plane Logging](https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html)
- EKS Health Codes: [Cluster Health](https://docs.aws.amazon.com/eks/latest/userguide/cluster-health.html)

---

### Slide 8 — API Server 접근 실패 Decision Tree

**스크립트**:
API 접근 실패 시 HTTP 상태 코드가 핵심 판별 기준입니다. 슬라이드에는 401/403/Token 만료를 중심으로 보여드리지만, 실무에서는 더 다양한 에러를 만납니다.

**401 Unauthorized** — aws-auth ConfigMap 또는 Access Entry를 확인합니다. IAM 자격증명이 잘못되었거나 클러스터에 매핑이 없는 경우입니다.

**403 Forbidden** — RBAC 권한 부족입니다. `kubectl auth can-i`로 확인합니다. 특히 새로 온보딩된 팀원이나 CI/CD 서비스 어카운트에서 자주 발생합니다.

**429 Too Many Requests** — API Throttling입니다. 대규모 클러스터에서 컨트롤러, 오퍼레이터, Helm install이 동시에 대량 API 호출을 하면 발생합니다. CloudWatch의 apiserver_request_total 메트릭에서 429 비율을 모니터링하세요. API Priority and Fairness(APF) 설정으로 중요한 요청이 throttle되지 않도록 FlowSchema를 조정할 수 있습니다.

**500 Internal Server Error** — 주로 Admission Webhook timeout이 원인입니다. Webhook 서비스가 다운되었거나 응답이 느린 경우, 모든 리소스 생성/수정이 차단될 수 있습니다. `failurePolicy: Ignore`로 설정하면 Webhook 장애 시에도 API 요청이 통과되지만, 보안 정책 우회 위험이 있으므로 주의가 필요합니다.

**502/503** — API Server 과부하 또는 NLB 문제입니다. EKS 관리형 컨트롤 플레인이 스케일링되는 동안 일시적으로 발생할 수 있습니다.

**504 Gateway Timeout** — VPC 엔드포인트 문제나 API Server 응답 지연입니다. 대용량 리스트 요청(예: `kubectl get pods -A`에서 수만 개 Pod)에서 발생할 수 있습니다.

**Connection refused / timeout** — 네트워크 레벨 차단입니다. Private endpoint만 활성화된 상태에서 VPC 외부 접근 시도, Security Group에서 443 포트 미허용, 또는 VPC 엔드포인트 라우팅 문제가 원인입니다.

SA Token 만료는 슬라이드에 포함되어 있지만, 실제로는 거의 발생하지 않습니다 — 최신 AWS SDK와 kubelet은 만료 전에 자동으로 토큰을 갱신합니다. 이 문제가 발생하는 경우는 매우 오래된 SDK 버전, 정적 kubeconfig에 토큰을 하드코딩한 경우, 또는 CI/CD에서 `aws eks get-token`을 한 번만 호출하고 장시간 재사용하는 엣지 케이스에 한정됩니다.

**데이터 소스**:
- EKS Access Entries: [Granting IAM Access](https://docs.aws.amazon.com/eks/latest/userguide/access-entries.html)
- K8s RBAC: [Using RBAC Authorization](https://kubernetes.io/docs/reference/access-authn-authz/rbac/)
- SA Token 1시간 만료: [Bound Service Account Tokens](https://kubernetes.io/docs/reference/access-authn-authz/service-accounts-admin/#bound-service-account-token-volume)
- API Priority and Fairness: [API Priority and Fairness](https://kubernetes.io/docs/concepts/cluster-administration/flow-control/)
- API Throttling 모니터링: CloudWatch `apiserver_request_total` 메트릭에서 `code=429` 필터
- Admission Webhook: [Dynamic Admission Control](https://kubernetes.io/docs/reference/access-authn-authz/extensible-admission-controllers/)
- EKS Private Endpoint: [Amazon EKS Cluster Endpoint Access](https://docs.aws.amazon.com/eks/latest/userguide/cluster-endpoint.html)

---

### Slide 9 — 컨트롤 플레인 로그 분석

**스크립트**:
CloudWatch Logs Insights 쿼리 4가지를 보여드립니다.

첫 번째는 **API 서버 에러(400+) 분석**으로, 전체적인 에러 분포를 파악하는 출발점입니다.

두 번째와 세 번째는 비슷해 보이지만 진단 레이어가 다릅니다. **인증 실패**(authenticator 로그)는 "누구인지 확인하는 단계"에서 거부된 것입니다 — IAM 자격증명이 유효하지 않거나, aws-auth/Access Entry에 매핑이 없는 경우입니다. 반면 **비인가 접근(403)**(audit 로그)은 "인증은 통과했지만 권한이 없는 경우"입니다 — 예를 들어 개발자가 production 네임스페이스에 접근하려는데 RBAC Role이 없는 경우죠. 즉 AuthN(인증) 실패 vs AuthZ(인가) 실패의 구분이며, 해결 방법이 다릅니다. 인증 실패는 IAM/Access Entry를 고치고, 인가 실패는 RBAC RoleBinding을 추가합니다.

네 번째는 **API Throttling** 탐지입니다. 앞서 Slide 8에서 다룬 429 에러를 시계열로 추적할 수 있습니다.

audit 로그와 authenticator 로그는 프로덕션에서 항상 활성화하는 것을 권장합니다. 보안 감사에도 필수적입니다.

**데이터 소스**:
- CloudWatch Logs Insights: [Query Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/CWL_QuerySyntax.html)
- EKS Audit Logging: [Control Plane Logs](https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html)

---

### Slide 10 — IRSA vs Pod Identity + 빈번한 함정

**스크립트**:
IRSA와 Pod Identity의 핵심 차이는 설정 복잡도만이 아닙니다. 대규모 환경에서 결정적인 차이는 **스케일링 제한**입니다. IRSA는 IAM Role Trust Policy에 각 ServiceAccount별 Condition을 추가하는 방식인데, Trust Policy의 크기 제한이 기본 2,048자, 최대 4,096자(AWS Support 요청 시)입니다. SA-Role 매핑 하나당 약 100~150자를 소비하므로, 실질적으로 하나의 Role에 20~30개 SA 매핑이 한계입니다. 엔터프라이즈 규모의 클러스터에서는 이 제한에 금방 도달합니다. Pod Identity는 Association 방식이므로 이 제한이 완전히 없습니다 — 수백 개의 SA-Role 매핑도 문제없이 운영 가능합니다.

성능 측면에서도 차이가 큽니다. IRSA는 각 Pod이 직접 STS `AssumeRoleWithWebIdentity` API를 호출합니다. 노드 스케일업 후 수십~수백 Pod이 동시에 시작되면 STS throttling이 발생할 수 있고, Pod마다 개별 STS 호출이므로 cold start에 지연이 추가됩니다. 자격증명 만료 시점이 겹치면 credential refresh storm도 발생합니다. 반면 Pod Identity는 각 노드의 Pod Identity Agent(DaemonSet)가 자격증명을 캐시하고, Pod은 로컬 엔드포인트(169.254.170.23)에서 자격증명을 받습니다. 같은 Role을 사용하는 여러 Pod이 노드 레벨 캐시를 공유하므로 STS 호출 횟수가 대폭 줄어들고, 외부 API 호출 없이 로컬에서 처리되어 지연도 최소화됩니다.

IRSA의 스케일링 제약은 연쇄적으로 작용합니다. Trust Policy 크기 제한(2,048/4,096자)을 회피하기 위해 SA 20개 미만으로 클러스터를 분리하면, 서비스가 수백 개인 엔터프라이즈에서는 클러스터가 수십 개 필요해지고, 결국 계정당 OIDC Provider 100개 제한에 도달합니다. 멀티 계정으로 우회할 수 있지만 운영 복잡도가 크게 증가합니다. 즉 IRSA는 **Trust Policy 크기 → 클러스터 분리 → OIDC 100개 제한**이라는 3중 스케일링 제약 구조입니다. Pod Identity는 이 세 가지 제약을 모두 근본적으로 해결합니다.

정리하면 IRSA에서 Pod Identity로 전환해야 하는 3가지 이유: **스케일링 제한**(Trust Policy + OIDC 3중 제약), **성능**(STS throttling, cold start), **운영 복잡도**(설정/디버깅 포인트 3곳 vs 1곳)입니다.

다만 모든 워크로드를 Pod Identity로 전환할 수 있는 것은 아닙니다. 대표적으로 **Amazon MSK의 IAM 인증은 IRSA만 지원**합니다. MSK가 OIDC 토큰을 직접 사용하는 방식이라 Pod Identity의 credential vending 구조와 호환되지 않기 때문입니다. 이런 서비스별 호환성 제약이 있으므로, 실제 엔터프라이즈 환경에서는 **IRSA + Pod Identity 병행 구성**이 현실적인 전략입니다. 원칙은 "신규 워크로드는 Pod Identity, MSK 등 IRSA 전용 서비스만 IRSA 유지"입니다.

디버깅 관점에서 병행 구성은 복잡도가 올라갑니다. IRSA와 Pod Identity를 동시에 사용하는 Pod에서는 어떤 자격증명이 우선하는지 주의해야 합니다. Pod Identity가 IRSA보다 우선적용되므로, 의도치 않은 권한 충돌이 발생할 수 있습니다. `kubectl exec pod -- env | grep AWS`로 어떤 방식의 자격증명이 활성화되어 있는지 확인하는 것이 기본 진단 명령입니다.

가장 흔한 함정은 IRSA의 Role ARN 오타인데, 에러 메시지 없이 기본 권한으로 폴백되어 발견하기 어렵습니다.

**데이터 소스**:
- EKS Pod Identity: [Pod Identity Associations](https://docs.aws.amazon.com/eks/latest/userguide/pod-id-association.html)
- IRSA: [IAM Roles for Service Accounts](https://docs.aws.amazon.com/eks/latest/userguide/iam-roles-for-service-accounts.html)
- Pod Identity vs IRSA 비교: [EKS Best Practices — Security](https://aws.github.io/aws-eks-best-practices/security/docs/iam/)
- IAM Trust Policy 크기 제한: [IAM Quotas](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html) — Role trust policy 기본 2,048자, 최대 4,096자
- Trust Policy 확장 요청: AWS Support를 통해 4,096자까지 확장 가능, 그 이상은 불가
- OIDC Identity Provider 제한: 계정당 100개 ([IAM Quotas](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html)) — 클러스터 1개 = OIDC Provider 1개이므로 단일 계정에 클러스터 100개 이상 시 도달. 실무에서는 Trust Policy 크기 제한이 먼저 병목 (단일 클러스터 내 SA 20~30개에서 도달)

---

### Slide 11 — Node NotReady Decision Tree

**스크립트**:
Node NotReady는 슬라이드의 Decision Tree대로 EC2 상태 → kubelet → containerd → 리소스 압박 → 네트워크 순서로 진단합니다. 하지만 이 순서를 실행하려면 노드에 접근할 수 있어야 하고, 접근 가능 여부는 Standard Mode와 Auto Mode에서 완전히 다릅니다.

**Standard Mode — SSM이 핵심 디버깅 경로**

Standard Mode에서는 SSM Session Manager로 노드에 직접 접속해 진단합니다. SSM Agent는 kubelet과 독립적으로 동작하므로, kubelet이 죽어도 SSM 접속이 가능합니다. 이것이 Standard Mode의 큰 장점입니다. 노드 IAM Role에 AmazonSSMManagedInstanceCore 정책을 반드시 포함해야 합니다.

추가로 `kubectl debug node/`도 사용할 수 있지만, 이 명령은 동작 조건이 까다롭습니다. 해당 노드에 privileged Pod(hostPID, hostNetwork, /host 마운트)을 생성하는 방식이므로 다음 조건이 모두 충족되어야 합니다:
- **kubelet 실행 중** — Pod을 생성/실행하는 주체
- **containerd 실행 중** — 이미지 pull 및 컨테이너 실행
- **privileged Pod 허용** — Pod Security Admission이 privileged를 차단하면 생성 거부
- **디버그 이미지 pull 가능** — 네트워크 접근 또는 노드에 이미지 캐시 존재
- **API Server 접근 가능** — kubectl이 Pod 생성 요청을 전달

즉, kubelet이 죽은 NotReady에서는 debug Pod이 Pending에서 멈추고, containerd가 죽으면 ContainerCreating에서 멈춥니다. `kubectl debug node/`는 "노드가 약간 아픈 상태"(DiskPressure, MemoryPressure 등)에서만 유효하고, 심각한 장애에서는 SSM이 유일한 방법입니다.

**Auto Mode — 노드 직접 디버깅 불가능**

Auto Mode 노드는 고객 계정에 EC2 인스턴스로 존재하지만, AWS가 관리하는 locked-down OS를 사용합니다. 모든 노드 접근 경로가 차단되어 있습니다:
- SSH 불가
- SSM 불가
- EC2 Serial Console 불가
- privileged Pod 생성 불가 → `kubectl debug node/`도 사용 불가

Auto Mode에서 노드 레벨 직접 디버깅은 **불가능**합니다. 슬라이드 Decision Tree의 진단 순서 자체를 실행할 수 없습니다.

대신 Auto Mode에서의 NotReady 대응 전략:
1. **CloudWatch Logs** — Container Insights가 활성화되어 있다면 장애 전에 수집된 시스템 로그 분석. **사전 설정이 핵심** — 장애 후에 활성화해도 이미 늦음
2. **CloudTrail** — EC2 인스턴스 상태 변경 이벤트로 Spot 중단, 하드웨어 장애 등 인프라 레벨 원인 파악
3. **EKS Health Dashboard** — 클러스터/노드 레벨 헬스 이벤트 확인
4. **자동 교체 대기** — 가장 현실적인 접근. Auto Mode는 NotReady 노드를 감지하고 자동 교체. 원인 분석보다 교체 후 재발 방지에 집중

Auto Mode의 운영 원칙은 **"노드를 고치지 말고, 교체되도록 놔두고, 로그로 사후 분석하라"**입니다. 이것이 Auto Mode의 근본적 트레이드오프입니다 — 운영 편의성과 보안을 얻는 대신, 노드 레벨 디버깅 능력을 완전히 포기합니다. 노드 레벨 디버깅이 반드시 필요한 워크로드(GPU 장애 분석, 커널 튜닝 등)라면 Standard Mode(MNG + SSM)를 선택해야 합니다.

**데이터 소스**:
- K8s Node Conditions: [Node Status](https://kubernetes.io/docs/concepts/architecture/nodes/#condition)
- SSM Session Manager: [AWS Systems Manager Session Manager](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager.html)
- kubectl debug node 동작 방식: 대상 노드에 hostPID/hostNetwork privileged Pod 생성 → kubelet + containerd + privileged 허용이 모두 필요
- kubectl debug node 조건: [Debugging via Ephemeral Container](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/#node-shell-session)
- Auto Mode 노드 접근 제약: SSH, SSM, Serial Console 모두 불가, privileged Pod 불가 — [Auto Mode — Node Management](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)
- EKS Health Dashboard: [Cluster Health](https://docs.aws.amazon.com/eks/latest/userguide/cluster-health.html)

---

### Slide 12 — 노드 리소스 압박 진단

**스크립트**:
DiskPressure는 사용 가능 디스크 10% 미만, MemoryPressure는 100Mi 미만, PIDPressure는 5% 미만일 때 kubelet이 해당 Condition을 True로 보고합니다.

슬라이드에 `crictl rmi --prune`이 나오는데, crictl은 containerd 전용 CLI 도구입니다. EKS가 containerd 기반이므로 crictl이 정확한 도구이고, 과거 Docker 시절의 `docker ps`에 해당하는 것이 `crictl ps`입니다. 다만 crictl은 노드에 SSM으로 접속해야 실행할 수 있으므로 Standard Mode 전용이며, Auto Mode에서는 노드 접속 자체가 불가하므로 사용할 수 없습니다.

**평소 모니터링**: DiskPressure/MemoryPressure/PIDPressure는 문제가 발생한 후에 확인하는 것이 아니라, 평소에 선제적으로 모니터링해야 합니다. Prometheus의 `kube_node_status_condition` 메트릭으로 Condition 변화를 감지하고, node-exporter 메트릭(`node_filesystem_avail_bytes`, `node_memory_MemAvailable_bytes`, 프로세스 수)으로 임계값에 도달하기 전에 알림을 설정하는 것이 핵심입니다. Container Insights를 사용한다면 `node_filesystem_utilization`, `node_memory_utilization` 메트릭이 기본 제공됩니다. 알림 임계값은 kubelet eviction 임계값보다 넉넉하게 설정해야 합니다 — 예를 들어 디스크 사용률 80%에서 경고, 90%에서 위험 알림을 보내면 kubelet이 eviction을 시작하기 전에 대응할 수 있습니다.

슬라이드의 예방 조치에 **Karpenter ttlSecondsAfterEmpty**가 나오는데, 이것은 리소스 압박 예방과 직접 관련이 없습니다. ttlSecondsAfterEmpty는 노드에 Pod이 하나도 없는 상태가 지정 시간 동안 지속되면 노드를 자동 종료하는 비용 최적화 설정입니다. 리소스 압박 예방의 핵심은 **적절한 requests/limits 설정**과 **모니터링 알림**이며, Karpenter의 역할은 리소스가 부족할 때 새 노드를 추가하는 것(스케일아웃)입니다.

정리하면 리소스 압박 예방의 3가지 축:
1. **requests/limits 적절 설정** — Pod 레벨에서 리소스 사용량을 제어
2. **선제적 모니터링 + 알림** — 임계값 도달 전에 감지
3. **Karpenter/Auto Mode 오토스케일링** — 리소스 부족 시 노드 자동 추가

**데이터 소스**:
- K8s Eviction Thresholds: [Node-pressure Eviction](https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/)
- DiskPressure 10%, MemoryPressure 100Mi: kubelet 기본 eviction 임계값 (imagefs.available < 15%, memory.available < 100Mi, nodefs.available < 10%, pid.available)
- crictl: [CRI CLI — crictl](https://kubernetes.io/docs/tasks/debug/debug-cluster/crictl/) — containerd/CRI-O 전용 CLI, EKS containerd 환경에서 정상 동작
- eks-node-viewer: [GitHub — awslabs/eks-node-viewer](https://github.com/awslabs/eks-node-viewer)
- kube_node_status_condition: [kube-state-metrics — Node Metrics](https://github.com/kubernetes/kube-state-metrics/blob/main/docs/node-metrics.md)
- Container Insights 노드 메트릭: [Container Insights Metrics](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Container-Insights-metrics-EKS.html)
- Karpenter ttlSecondsAfterEmpty: [Karpenter — Disruption](https://karpenter.sh/docs/concepts/disruption/) — 빈 노드 자동 종료 (비용 최적화), 리소스 압박 예방과는 별개

---

### Slide 13 — 노드 모니터링 에이전트

**스크립트**:
Auto Mode와 Standard Mode의 가장 큰 디버깅 차이는 노드 접근성입니다. Auto Mode는 SSH/SSM 접속이 불가하므로 `kubectl debug node/`가 유일한 방법입니다. Standard Mode는 SSM + journalctl로 kubelet, containerd 로그를 직접 확인할 수 있습니다.

**데이터 소스**:
- EKS Auto Mode: [Amazon EKS Auto Mode](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)
- kubectl debug: [Debugging Nodes](https://kubernetes.io/docs/tasks/debug/debug-cluster/kubectl-node-debug/)

---

### Slide 14 — EC2 레벨 진단 명령어

**스크립트**:
SSM 접속 후 kubelet, containerd 상태를 확인하고, 리소스 사용량과 네트워크를 점검합니다. AWS Support 케이스를 오픈할 때는 EKS Log Collector 스크립트 결과를 첨부하면 해결 시간이 크게 단축됩니다. 이 스크립트는 kubelet 로그, 시스템 정보, 네트워크 설정을 자동으로 수집합니다.

**데이터 소스**:
- EKS Log Collector: [GitHub — awslabs/amazon-eks-ami/log-collector-script](https://github.com/awslabs/amazon-eks-ami/tree/master/log-collector-script)
- kubectl debug node: [K8s Docs — Debug Running Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-running-pod/)
- nicolaka/netshoot: [GitHub — nicolaka/netshoot](https://github.com/nicolaka/netshoot)

---

### Slide 15 — Pod 상태별 디버깅 플로우

**스크립트**:
`kubectl get pods` 결과에서 바로 시작하는 진단 맵입니다. CrashLoopBackOff, ImagePullBackOff, OOMKilled, Pending이 4대 주요 상태이고, Running 0/1 Ready와 Terminating도 자주 만나는 패턴입니다. 각 상태별로 진단 방법이 다르므로, 다음 슬라이드에서 하나씩 깊이 들어가겠습니다.

**데이터 소스**:
- K8s Pod Lifecycle: [Pod Lifecycle](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/)
- Pod Status Phases: [Pod Phase](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-phase)

---

### Slide 16 — CrashLoopBackOff 디버깅

**스크립트**:
CrashLoopBackOff의 4가지 주요 원인은 앱 크래시, CMD/ENTRYPOINT 오류, Config 누락, OOMKilled입니다. 가장 중요한 명령어는 `kubectl logs --previous`입니다. 이전 (크래시된) 컨테이너의 로그를 보여주기 때문입니다. 멀티컨테이너 Pod에서는 `-c` 플래그로 특정 컨테이너를 지정해야 합니다.

**데이터 소스**:
- K8s Debugging Pods: [Debug Pods](https://kubernetes.io/docs/tasks/debug/debug-application/debug-pods/)
- CrashLoopBackOff Backoff: 10s → 20s → 40s → ... → 5m (지수 백오프)

---

### Slide 17 — OOMKilled 심층 분석

**스크립트**:
requests와 limits의 차이를 명확히 이해해야 합니다. requests는 스케줄링 기준이고 limits는 최대 허용치입니다. JVM에서는 `-Xmx`를 limits의 75%로 설정하는 것이 안전합니다. Off-heap, Metaspace가 나머지 25%를 사용하기 때문입니다. Go 1.19+는 GOMEMLIMIT, Node.js는 `--max-old-space-size`를 명시 설정해야 합니다.

**데이터 소스**:
- K8s Resource Management: [Managing Resources for Containers](https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/)
- QoS Classes: [Pod Quality of Service](https://kubernetes.io/docs/concepts/workloads/pods/pod-qos/)
- JVM `-Xmx` 75% 권장: [Eclipse OpenJ9 — Java Memory Management](https://www.eclipse.org/openj9/docs/xxusecontainersupport/)
- Go GOMEMLIMIT: [Go 1.19 Release Notes](https://tip.golang.org/doc/go1.19)
- Node.js V8 Heap: [Node.js — CLI Options](https://nodejs.org/api/cli.html#--max-old-space-sizesize-in-megabytes)

---

### Slide 18 — ImagePullBackOff 디버깅

**스크립트**:
3가지 원인: ECR 인증 실패, Private Registry Secret 미설정, 이미지 태그 문제입니다. ECR 토큰은 12시간마다 만료되므로, 노드 IAM Role에 `ecr:GetAuthorizationToken` 권한이 있어야 합니다. `:latest` 태그 대신 immutable 태그 사용을 권장합니다.

**데이터 소스**:
- ECR Authentication: [Amazon ECR — Private Registry Authentication](https://docs.aws.amazon.com/AmazonECR/latest/userguide/registry_auth.html)
- ECR 토큰 12시간 만료: [GetAuthorizationToken](https://docs.aws.amazon.com/AmazonECR/latest/APIReference/API_GetAuthorizationToken.html)
- K8s Image Pull Secrets: [Pull an Image from a Private Registry](https://kubernetes.io/docs/tasks/configure-pod-container/pull-image-private-registry/)

---

### Slide 19 — "배포는 됐는데 안 되는" 6가지 패턴

**스크립트**:
Pod이 Running인데 서비스가 동작하지 않는 6가지 패턴을 개요로 소개합니다. 가장 흔한 것은 Probe 실패 루프, ConfigMap/Secret 미반영, HPA 미작동입니다. 이어지는 슬라이드에서 각 패턴을 상세히 다루겠습니다.

---

### Slide 20 — Probe 실패 루프 디버깅

**스크립트**:
Running 0/1 Ready 상태는 readinessProbe가 실패하고 있다는 뜻입니다. 가장 흔한 원인은 path 불일치와 initialDelaySeconds 부족입니다. K8s 1.28+에서는 startupProbe를 사용해 느리게 시작하는 앱을 처리할 수 있습니다. livenessProbe에는 외부 의존성을 포함하지 마세요 — DB 다운 시 전체 Pod이 재시작됩니다.

**데이터 소스**:
- K8s Probes: [Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- startupProbe (K8s 1.20 GA): [KEP-2238](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/2238-liveness-probe-grace-period)

---

### Slide 21 — ConfigMap / Secret 변경 미반영

**스크립트**:
마운트 방식에 따라 자동 업데이트 여부가 다릅니다. 일반 volumeMount는 1-2분 후 자동 반영되지만, subPath나 envFrom은 Pod 재시작이 필요합니다. 1-2분 걸리는 이유는 kubelet syncFrequency(60s) + ConfigMap 캐시 TTL(60s) 때문입니다. stakater/reloader를 사용하면 변경 감지 후 자동 rollout restart가 가능합니다.

**데이터 소스**:
- K8s ConfigMap Update: [Mounted ConfigMaps are updated automatically](https://kubernetes.io/docs/concepts/configuration/configmap/#mounted-configmaps-are-updated-automatically)
- kubelet syncFrequency: 기본 60초
- stakater/reloader: [GitHub — stakater/Reloader](https://github.com/stakater/Reloader)

---

### Slide 22 — HPA 미작동 + Sidecar 순서 문제

**스크립트**:
HPA TARGETS가 unknown이면 세 가지를 확인하세요: metrics-server 설치 여부, Pod resource requests 설정 여부, minReplicas 값입니다. `kubectl top pods` 실패 시 metrics-server 문제가 확실합니다. Sidecar 종료 순서 문제는 K8s 1.29+의 Native Sidecar(`restartPolicy: Always`)로 해결되었습니다.

**데이터 소스**:
- HPA: [Horizontal Pod Autoscaling](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- metrics-server: [GitHub — kubernetes-sigs/metrics-server](https://github.com/kubernetes-sigs/metrics-server)
- Native Sidecar (K8s 1.29): [KEP-753 — Sidecar Containers](https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/753-sidecar-containers)

---

### Slide 23 — ResourceQuota + Timezone 이슈

**스크립트**:
ResourceQuota 초과는 `exceeded quota` 에러로 나타납니다. `kubectl describe resourcequota -n <ns>`로 현재 사용량을 확인합니다. Timezone 이슈는 컨테이너 기본 UTC 때문인데, `TZ=Asia/Seoul` 환경변수로 설정합니다. Alpine이나 distroless 이미지는 tzdata 패키지가 없으므로 별도 설치가 필요합니다.

**데이터 소스**:
- K8s ResourceQuota: [Resource Quotas](https://kubernetes.io/docs/concepts/policy/resource-quotas/)
- K8s LimitRange: [Limit Ranges](https://kubernetes.io/docs/concepts/policy/limit-range/)

---

### Slide 24 — Rollout Strategy 비교

**스크립트**:
maxUnavailable과 maxSurge 조합에 따라 배포 동작이 완전히 달라집니다. 무중단이 필수라면 maxUnavailable=0, maxSurge=1로 설정합니다. minReadySeconds는 ALB Health Check 통과를 기다리는 시간으로, ALB HC interval x threshold = 30초를 권장합니다.

**데이터 소스**:
- K8s Deployment Strategy: [Deployment — Rolling Update](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#rolling-update-deployment)
- progressDeadlineSeconds: [Deployment — Progress Deadline](https://kubernetes.io/docs/concepts/workloads/controllers/deployment/#progress-deadline-seconds)

---

### Slide 25 — Health Check 불일치 — 왜 위험한가

**스크립트**:
K8s Probe와 ALB Health Check는 독립적으로 실행되기 때문에 불일치가 발생할 수 있습니다. 실제 인시던트 시나리오: readinessProbe는 /healthz를 체크하고 ALB HC는 / (기본값)을 체크하면, K8s는 Ready지만 ALB는 Unhealthy로 판단해 503이 발생합니다. 이 원인을 찾는 데 MTTR 2시간이 걸리는 경우가 많습니다.

**데이터 소스**:
- AWS ALB Ingress Controller: [AWS Load Balancer Controller — Health Check](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/ingress/annotations/#health-check)
- ALB HC 기본 경로 `/`: [Target Group Health Checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)

---

### Slide 26 — 4가지 Health Check 메커니즘 비교

**스크립트**:
K8s Probe, ALB HC, NLB HC, Ingress-NGINX — 이 4가지는 모두 독립적으로 실행됩니다. 서로의 결과를 모르기 때문에 경로 불일치와 타이밍 차이가 장애로 이어질 수 있습니다. 특히 ALB HC는 외부에서 Pod IP로 직접 체크하므로 Security Group에서 ALB → Pod CIDR이 허용되어야 합니다.

**데이터 소스**:
- ALB Target Group HC: [ALB Health Checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html)
- NLB Target Group HC: [NLB Health Checks](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/target-group-health-checks.html)
- Ingress-NGINX: [NGINX Ingress Controller — Health Checks](https://kubernetes.github.io/ingress-nginx/)

---

### Slide 27 — 타이밍 매트릭스

**스크립트**:
기본 설정값을 비교하면 불일치가 어디서 발생하는지 보입니다. K8s Probe interval 10초 vs ALB HC 15초 — K8s가 Ready로 판단했지만 ALB는 아직 체크 중입니다. Probe timeout 1초는 매우 짧아서 앱이 통과하지만, 실제 사용자 요청은 DB 쿼리 지연으로 5초가 걸릴 수 있습니다.

**데이터 소스**:
- K8s Probe 기본값: initialDelaySeconds=0, periodSeconds=10, timeoutSeconds=1, failureThreshold=3
  - [Probe Configuration](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/#configure-probes)
- ALB HC 기본값: interval=15s, timeout=5s, unhealthyThreshold=2, healthyThreshold=2
  - [ALB Health Check Settings](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/target-group-health-checks.html#health-check-settings)

---

### Slide 28 — 패턴 1: Probe OK + ALB 503

**스크립트**:
가장 흔한 패턴입니다. Pod Ready → Endpoints OK → 그런데 ALB Target Group이 Unhealthy. 진단 순서: Pod Ready 확인 → Endpoints 존재 확인 → TG Target Health 확인 → HC path 일치 확인. `alb.ingress.kubernetes.io/healthcheck-path` annotation으로 ALB HC 경로를 readinessProbe와 일치시키세요.

**데이터 소스**:
- AWS LB Controller Annotations: [Health Check Annotations](https://kubernetes-sigs.github.io/aws-load-balancer-controller/latest/guide/ingress/annotations/#health-check)

---

### Slide 29 — 패턴 2: Graceful Shutdown 시 502

**스크립트**:
Pod 종료와 ALB deregistration의 타이밍 불일치가 502를 만듭니다. 기본 deregistration_delay가 300초인데, 앱이 T+1초에 종료되면 그 사이 299초 동안 502가 발생합니다. 해결: deregistration_delay를 15초로 줄이고, preStop에서 sleep 15로 deregistration 완료를 기다립니다.

**데이터 소스**:
- ALB Deregistration Delay: [Deregistration Delay](https://docs.aws.amazon.com/elasticloadbalancing/latest/application/load-balancer-target-groups.html#deregistration-delay)
- 기본값 300초: AWS ALB 기본 설정
- K8s Termination: [Pod Termination](https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/#pod-termination)

---

### Slide 30 — 종료 시퀀스 공식

**스크립트**:
terminationGracePeriodSeconds = deregistration_delay + preStop_sleep + app_shutdown_buffer. 실제 계산: 15 + 15 + 10 = 40초. 이 공식을 기억하면 Graceful Shutdown 관련 502를 완전히 예방할 수 있습니다. YAML 예시를 보여드리겠습니다.

**데이터 소스**:
- 공식 유래: EKS Best Practices Guide — [Graceful Shutdown](https://aws.github.io/aws-eks-best-practices/networking/load-balancing/)
- terminationGracePeriodSeconds 기본값: 30초

---

### Slide 31 — 패턴 3-4: Rolling Update 503 + NLB Local

**스크립트**:
Rolling Update 시 K8s Ready(T+10s)와 ALB HC 통과(T+30s) 사이 20초 갭에서 503이 발생합니다. minReadySeconds: 30으로 해결합니다. NLB + externalTrafficPolicy: Local은 Pod이 없는 노드에서 HC 실패로 트래픽 불균형이 발생합니다. Client IP 보존이 필요하면 Local, 아니면 Cluster를 선택하세요.

**데이터 소스**:
- externalTrafficPolicy: [Service — External Traffic Policy](https://kubernetes.io/docs/tasks/access-application-cluster/create-external-load-balancer/#preserving-the-client-source-ip)
- NLB Target Group: [NLB Target Groups](https://docs.aws.amazon.com/elasticloadbalancing/latest/network/load-balancer-target-groups.html)

---

### Slide 32 — Health Check Best Practice

**스크립트**:
워크로드 유형별 최적 설정을 정리한 테이블입니다. 배포 전 체크리스트 8가지를 반드시 확인하세요. 특히 "ALB HC 경로 = readinessProbe 경로"와 "terminationGrace > deregistration + preStop"이 가장 중요합니다. 여기서 Session 1을 마치고 10분 휴식 후 Session 2로 넘어가겠습니다.

---

## Session 2: 네트워킹 · 스토리지 · GPU · Auto Mode · 옵저버빌리티

---

### Slide 33 — 네트워킹 디버깅 워크플로우

**스크립트**:
네트워킹 문제는 VPC CNI → DNS → Service → NetworkPolicy 순서로 계층별 진단합니다. Pod IP 미할당이면 VPC CNI, DNS 실패면 CoreDNS, 연결 불가면 Service/Endpoints, 차단 의심이면 NetworkPolicy를 점검합니다.

**데이터 소스**:
- VPC CNI: [Amazon VPC CNI Plugin](https://github.com/aws/amazon-vpc-cni-k8s)
- EKS Networking Best Practices: [EKS Best Practices — Networking](https://aws.github.io/aws-eks-best-practices/networking/)

---

### Slide 34 — VPC CNI: IP 고갈 & ENI 제한

**스크립트**:
서브넷 IP 부족 시 Pod이 ContainerCreating에서 멈춥니다. 인스턴스 타입별 ENI 수와 ENI당 IP 수 제한이 있어서 c5.xlarge는 최대 58개 Pod만 가능합니다. Prefix Delegation을 활성화하면 ENI에 /28 prefix(16 IP)를 할당해 IP 용량이 16배 확대됩니다.

**데이터 소스**:
- ENI 제한: [EC2 Instance Types — ENI Limits](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-eni.html#AvailableIpPerENI)
- c5.xlarge: 4 ENI x 15 IP = 58 Pod (2개 IP는 ENI 기본 + 호스트)
- Prefix Delegation: [VPC CNI — Increase Pod Density](https://docs.aws.amazon.com/eks/latest/userguide/cni-increase-ip-addresses.html)
- Prefix Delegation 16배: /28 = 16 IP per prefix slot

---

### Slide 35 — Service 연결 실패 진단

**스크립트**:
Service 연결 실패 시 첫 번째로 `kubectl get endpoints`를 확인합니다. Endpoints가 비어있으면 Selector 라벨 불일치이고, 존재하면 port/targetPort 불일치 또는 kube-proxy/SG 문제입니다. Selector와 Pod label 비교가 가장 흔한 원인입니다.

**데이터 소스**:
- K8s Service: [Services](https://kubernetes.io/docs/concepts/services-networking/service/)
- Debugging Services: [Debug Services](https://kubernetes.io/docs/tasks/debug/debug-application/debug-service/)

---

### Slide 36 — DNS 디버깅: CoreDNS & ndots

**스크립트**:
5,000+ Pod 클러스터에서 CoreDNS OOM이 발생하면 전체 DNS가 마비됩니다. ndots:5 기본값은 외부 도메인 조회 시 5번의 불필요한 쿼리를 발생시킵니다. api.example.com 조회 시 api.example.com.default.svc.cluster.local 등 4번 실패 후 성공합니다. NodeLocal DNSCache를 설치하면 CoreDNS 부하를 크게 줄일 수 있습니다.

**데이터 소스**:
- CoreDNS: [CoreDNS Manual](https://coredns.io/manual/toc/)
- ndots:5 문제: [Kubernetes DNS Resolution — ndots](https://kubernetes.io/docs/concepts/services-networking/dns-pod-service/#pod-dns-config)
- NodeLocal DNSCache: [Using NodeLocal DNSCache](https://kubernetes.io/docs/tasks/administer-cluster/nodelocaldns/)
- VPC DNS 한도 (ENI당 1,024 pkt/s): [VPC DNS Quotas](https://docs.aws.amazon.com/vpc/latest/userguide/vpc-dns.html#vpc-dns-limits)

---

### Slide 37 — NetworkPolicy 디버깅

**스크립트**:
NetworkPolicy에서 가장 위험한 함정은 AND vs OR 혼동입니다. 같은 `from` 항목 안에 namespaceSelector와 podSelector를 넣으면 AND(교집합), 별도 `from` 항목으로 분리하면 OR(합집합)입니다. indent 한 레벨 차이로 보안 정책이 완전히 달라지니 주의하세요.

**데이터 소스**:
- K8s NetworkPolicy: [Network Policies](https://kubernetes.io/docs/concepts/services-networking/network-policies/)
- AND vs OR 동작: [NetworkPolicy — Behavior of `to` and `from` selectors](https://kubernetes.io/docs/concepts/services-networking/network-policies/#behavior-of-to-and-from-selectors)
- EKS NetworkPolicy (K8s 1.25+): [Amazon VPC CNI — Network Policy](https://docs.aws.amazon.com/eks/latest/userguide/cni-network-policy.html)

---

### Slide 38 — Gateway API 디버깅

**스크립트**:
Gateway API는 GatewayClass → Gateway → HTTPRoute → Service 순서로 상태를 확인합니다. 각 리소스의 조건(Accepted, Programmed, ResolvedRefs)이 True인지 확인하는 것이 핵심입니다. Gateway의 Programmed 조건이 False면 LB 프로비저닝 실패입니다.

**데이터 소스**:
- Gateway API: [Gateway API Docs](https://gateway-api.sigs.k8s.io/)
- AWS Gateway API Controller: [AWS Gateway API Controller](https://www.gateway-api-controller.eks.aws.dev/)
- Gateway Conditions: [GatewayClass Status](https://gateway-api.sigs.k8s.io/reference/spec/#gateway.networking.k8s.io/v1.GatewayClassStatus)

---

### Slide 39 — netshoot 실전 디버깅

**스크립트**:
netshoot는 네트워크 디버깅에 필요한 모든 도구(curl, dig, tcpdump, iperf3, ss)를 포함하는 컨테이너 이미지입니다. Ephemeral Container로 기존 Pod에 주입하거나 독립 Pod으로 실행할 수 있습니다. `tcpdump -i any host <pod-ip> -n`으로 패킷 캡처가 가능합니다.

**데이터 소스**:
- netshoot: [GitHub — nicolaka/netshoot](https://github.com/nicolaka/netshoot)
- Ephemeral Containers (K8s 1.25 GA): [Ephemeral Containers](https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/)

---

### Slide 40 — PVC 마운트 실패 4대 패턴

**스크립트**:
AZ 불일치가 가장 흔합니다. EBS는 단일 AZ에 존재하므로 Pod이 다른 AZ 노드에 스케줄링되면 마운트 실패입니다. `volumeBindingMode: WaitForFirstConsumer`로 해결합니다. EBS 볼륨 detach는 최대 6분 소요되며, 강제 detach는 데이터 손실 위험이 있습니다.

**데이터 소스**:
- StorageClass volumeBindingMode: [Volume Binding Mode](https://kubernetes.io/docs/concepts/storage/storage-classes/#volume-binding-mode)
- EBS 볼륨 제한: [EBS Volume Limits](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/volume_limits.html)
- EBS Detach 6분: [Detach an EBS Volume](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ebs-detaching-volume.html)

---

### Slide 41 — EBS vs EFS 비교

**스크립트**:
핵심 판단 기준: 여러 Pod이 동시에 같은 볼륨에 접근해야 하면 EFS(ReadWriteMany), 단일 Pod 고성능 I/O가 필요하면 EBS gp3를 선택합니다. Auto Mode에서는 EBS gp3가 내장 지원되지만 EFS CSI는 별도 설치가 필요합니다.

**데이터 소스**:
- EBS gp3: [EBS Volume Types](https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html) (최대 16,000 IOPS / 1,000 MB/s)
- EFS: [Amazon EFS](https://docs.aws.amazon.com/efs/latest/ug/whatisefs.html)
- EBS CSI Driver: [Amazon EBS CSI Driver](https://docs.aws.amazon.com/eks/latest/userguide/ebs-csi.html)
- EFS CSI Driver: [Amazon EFS CSI Driver](https://docs.aws.amazon.com/eks/latest/userguide/efs-csi.html)

---

### Slide 42 — 스토리지 성능 최적화

**스크립트**:
gp3 기본 3,000 IOPS에서 최대 16,000 IOPS까지 튜닝 가능합니다. PVC patch로 온라인 볼륨 확장이 가능하지만, 축소는 불가합니다. Finalizer 수동 제거 시 고아 EBS 볼륨이 남아 비용이 낭비되므로 주기적으로 available 상태 볼륨을 확인하세요.

**데이터 소스**:
- gp3 성능: [gp3 Volumes](https://docs.aws.amazon.com/ebs/latest/userguide/general-purpose.html#gp3-ebs-volume-type)
- Volume Expansion: [Expanding PVCs](https://kubernetes.io/docs/concepts/storage/persistent-volumes/#expanding-persistent-volumes-claims)

---

### Slide 43 — Auto Mode 스토리지 제약

**스크립트**:
Auto Mode는 gp3만 내장 지원합니다. gp2, io2 Block Express는 미지원이고 EFS는 별도 설치가 필요합니다. 고성능 스토리지(io2 BE)나 ReadWriteMany(EFS)가 필요하면 Standard Mode 또는 하이브리드 구성을 고려해야 합니다.

**데이터 소스**:
- EKS Auto Mode Storage: [Auto Mode — Block Storage](https://docs.aws.amazon.com/eks/latest/userguide/automode-block-storage.html)

---

### Slide 44 — GPU 진단 워크플로우

**스크립트**:
GPU 문제는 nvidia-smi → Driver → CUDA → Device Plugin → DCGM 순서로 진단합니다. nvidia-smi가 실패하면 Driver 문제, GPU가 미인식되면 ClusterPolicy 확인, CUDA 버전 불일치면 Driver/CUDA 매칭 테이블을 참조합니다.

**데이터 소스**:
- NVIDIA GPU Operator: [GPU Operator Documentation](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/overview.html)
- CUDA Compatibility: [CUDA Compatibility](https://docs.nvidia.com/deploy/cuda-compatibility/)

---

### Slide 45 — CUDA XID 에러 패턴

**스크립트**:
XID 에러 코드는 GPU 하드웨어 진단의 핵심입니다. XID 48(Double bit ECC error)과 79(GPU fallen off the bus)는 하드웨어 결함으로 즉시 노드 교체가 필요합니다. XID 31(memory page fault)은 드라이버 업데이트로 해결 가능합니다. 커널 로그의 `dmesg | grep -i xid`로 확인합니다.

**데이터 소스**:
- NVIDIA XID Errors: [XID Error Reference](https://docs.nvidia.com/deploy/xid-errors/index.html)
- XID 48 (ECC): NVIDIA 공식 문서에서 하드웨어 결함으로 분류
- XID 79 (GPU fallen off bus): PCIe 통신 단절, 즉시 교체 권장

---

### Slide 46 — NCCL Timeout 디버깅

**스크립트**:
분산 학습 시 NCCL 타임아웃은 대부분 네트워크 문제입니다. 첫째, SG에서 동일 SG 내부 모든 트래픽을 허용해야 합니다(self-referencing rule). 둘째, p4d/p5 인스턴스는 EFA Device Plugin 설치가 필수입니다. NCCL_DEBUG=INFO로 디버그 로그를 활성화하면 정확한 원인을 파악할 수 있습니다.

**데이터 소스**:
- NCCL: [NVIDIA NCCL](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/)
- EFA on EKS: [EFA with EKS](https://docs.aws.amazon.com/eks/latest/userguide/node-efa.html)
- NCCL 환경변수: [NCCL Environment Variables](https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/env.html)

---

### Slide 47 — vLLM 디버깅

**스크립트**:
vLLM의 gpu_memory_utilization 기본값은 0.9입니다. OOM 발생 시 0.85 → 0.8으로 단계적으로 낮춥니다. "No available blocks" 에러는 KV Cache 부족으로 max_model_len을 감소시킵니다. tensor-parallel-size는 반드시 Pod의 GPU 수와 일치해야 합니다.

**데이터 소스**:
- vLLM Documentation: [vLLM Docs](https://docs.vllm.ai/)
- vLLM Engine Args: [vLLM — Engine Arguments](https://docs.vllm.ai/en/latest/serving/engine_args.html)
- gpu_memory_utilization 기본 0.9: vLLM 소스 코드 기본값
- Tensor Parallel: hidden dimension의 약수 (2, 4, 8)

---

### Slide 48 — GPU Operator 컴포넌트 구조

**스크립트**:
GPU Operator는 ClusterPolicy CRD를 통해 Driver, Container Toolkit, Device Plugin, DCGM Exporter를 관리합니다. 가장 흔한 설치 실패 원인은 "Kernel headers not found"로 AMI에 kernel-devel이 필요합니다. "nouveau driver is loaded"면 nouveau 블랙리스트가 필요합니다.

**데이터 소스**:
- GPU Operator Architecture: [GPU Operator — Platform Support](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/platform-support.html)
- ClusterPolicy CRD: [ClusterPolicy API Reference](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/getting-started.html#create-the-clusterpolicy-instance)

---

### Slide 49 — Auto Mode에서의 GPU 워크로드

**스크립트**:
Auto Mode에서 GPU Operator 설치 시 반드시 devicePlugin을 false로 설정해야 합니다. Auto Mode가 GPU Driver를 자동 관리하므로 Device Plugin이 충돌합니다. 권장 패턴은 Auto Mode로 일반 워크로드, MNG로 GPU 전용 워크로드를 분리하는 하이브리드 구성입니다.

**데이터 소스**:
- EKS Auto Mode + GPU: [Auto Mode — Accelerated Compute](https://docs.aws.amazon.com/eks/latest/userguide/automode-accelerated-workloads.html)
- devicePlugin=false: Auto Mode 공식 문서 필수 설정

---

### Slide 50 — GPU 진단 체크리스트

**스크립트**:
4단계 체크리스트입니다. Step 1: GPU 인식 (Driver, ClusterPolicy). Step 2: 스케줄링 (Device Plugin, nvidia.com/gpu 리소스). Step 3: vLLM OOM (gpu_memory_utilization, max_model_len). Step 4: NCCL Timeout (SG, EFA, 환경변수). 이 순서대로 점검하면 대부분의 GPU 문제를 해결할 수 있습니다.

---

### Slide 51 — Auto Mode vs Standard Mode

**스크립트**:
Auto Mode는 편리하지만 커스터마이징에 제한이 있습니다. GPU Driver, 고성능 스토리지(io2 BE), Custom CNI 설정이 필요하면 하이브리드 구성이 필수입니다. 디버깅 관점에서 가장 큰 차이는 노드 접근성입니다. Auto Mode에서는 `kubectl debug node/`가 유일한 방법입니다.

**데이터 소스**:
- EKS Auto Mode: [Auto Mode Overview](https://docs.aws.amazon.com/eks/latest/userguide/automode.html)
- Auto Mode vs Standard: [Choosing EKS Mode](https://docs.aws.amazon.com/eks/latest/userguide/automode-get-started.html)

---

### Slide 52 — NodePool & NodeClaim

**스크립트**:
Auto Mode의 NodePool은 Karpenter NodePool과 유사합니다. requirements에서 인스턴스 타입, capacity-type, AZ 제약을 설정합니다. NodeClaim은 실제 EC2 인스턴스와 1:1 매핑되며, Phase가 Pending → Launched → Ready로 진행됩니다.

**데이터 소스**:
- Karpenter NodePool: [Karpenter — NodePools](https://karpenter.sh/docs/concepts/nodepools/)
- Karpenter NodeClaim: [Karpenter — NodeClaims](https://karpenter.sh/docs/concepts/nodeclaims/)

---

### Slide 53 — 하이브리드 구성 시 주의점

**스크립트**:
Auto Mode + MNG 혼합 시 Taint/Toleration으로 반드시 분리해야 합니다. 그렇지 않으면 Auto Mode NodePool과 MNG가 같은 Pod를 경쟁적으로 스케줄링합니다. GPU MNG에 `nvidia.com/gpu=true:NoSchedule` Taint를 추가하고, GPU Pod에만 Toleration을 설정하세요.

**데이터 소스**:
- K8s Taints and Tolerations: [Taints and Tolerations](https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/)
- EKS Managed Node Groups: [Managed Node Groups](https://docs.aws.amazon.com/eks/latest/userguide/managed-node-groups.html)

---

### Slide 54 — NodeClaim 라이프사이클

**스크립트**:
NodeClaim은 Pending → Launched → Registered → Initialized → Ready 순서로 진행됩니다. Drift가 감지되면 새 NodeClaim을 생성하고 기존 노드를 교체합니다. Consolidation은 유휴/저활용 노드를 감지해 통합합니다. `kubectl get nodeclaims -o wide`로 모니터링합니다.

**데이터 소스**:
- Karpenter Disruption: [Karpenter — Disruption](https://karpenter.sh/docs/concepts/disruption/)
- Drift Detection: [Karpenter — Drift](https://karpenter.sh/docs/concepts/disruption/#drift)

---

### Slide 55 — 스케줄링 실패 디버깅

**스크립트**:
Pod Pending 시 Karpenter 로그를 확인합니다. "incompatible requirements"는 레이블/테인트 불일치, "instance launch failed"는 Spot 용량 부족이나 IAM 권한 문제입니다. 인스턴스 타입을 다양하게 설정하면 Spot 가용성이 높아집니다.

**데이터 소스**:
- Karpenter Troubleshooting: [Karpenter — Troubleshooting](https://karpenter.sh/docs/troubleshooting/)
- EC2 InsufficientInstanceCapacity: [EC2 Troubleshooting](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/troubleshooting-launch.html#troubleshooting-launch-capacity)

---

### Slide 56 — Consolidation 동작 원리

**스크립트**:
Consolidation은 PDB, do-not-disrupt annotation, Policy 설정을 확인한 후 실행됩니다. PDB minAvailable이 과도하면 allowedDisruptions: 0이 되어 통합이 차단됩니다. WhenEmpty는 노드가 비어야 통합하고, WhenUnderutilized는 적극적으로 통합합니다.

**데이터 소스**:
- Karpenter Consolidation: [Karpenter — Consolidation](https://karpenter.sh/docs/concepts/disruption/#consolidation)
- PDB: [Pod Disruption Budgets](https://kubernetes.io/docs/concepts/workloads/pods/disruptions/)
- do-not-disrupt: `karpenter.sh/do-not-disrupt: "true"` annotation

---

### Slide 57 — Spot 중단 & Drift 처리

**스크립트**:
Spot Interruption Notice는 2분 전에 경고합니다. Karpenter가 즉시 대체 노드를 시작하고, Cordon → Graceful Shutdown → 재스케줄 순서로 처리합니다. Drift는 AMI 변경, NodePool requirements 변경 시 감지되며, budgets: nodes: "10%"로 동시 교체를 제한합니다.

**데이터 소스**:
- Spot Interruption: [Spot Instance Interruptions](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html) (2분 경고)
- Karpenter Drift: [Karpenter — Drift](https://karpenter.sh/docs/concepts/disruption/#drift)
- Disruption Budgets: [Karpenter — Disruption Budgets](https://karpenter.sh/docs/concepts/disruption/#disruption-budgets)

---

### Slide 58 — Karpenter 로그 분석

**스크립트**:
Karpenter 로그의 핵심 패턴 4가지입니다: "launched nodeclaim"(성공), "could not launch"(실패), "deprovisioning"(Consolidation), "interruption"(Spot 중단). CloudWatch Logs Insights 쿼리로 인스턴스 타입별 실패율, Consolidation 절감 노드, Spot 중단 빈도를 분석할 수 있습니다.

**데이터 소스**:
- Karpenter Logging: [Karpenter — Settings](https://karpenter.sh/docs/reference/settings/)

---

### Slide 59 — 옵저버빌리티 아키텍처

**스크립트**:
3개 데이터 소스(Applications, Kubernetes, Nodes)에서 ADOT, CloudWatch Agent, Prometheus가 수집하고, CloudWatch와 AMP에 저장한 후 Grafana로 시각화합니다. 알림은 CloudWatch Alarms와 Alertmanager를 통해 SNS/PagerDuty/Slack으로 전달됩니다.

**데이터 소스**:
- ADOT: [AWS Distro for OpenTelemetry](https://aws-otel.github.io/docs/introduction)
- AMP: [Amazon Managed Service for Prometheus](https://docs.aws.amazon.com/prometheus/latest/userguide/what-is-Amazon-Managed-Service-Prometheus.html)
- AMG: [Amazon Managed Grafana](https://docs.aws.amazon.com/grafana/latest/userguide/what-is-Amazon-Managed-Service-Grafana.html)

---

### Slide 60 — Container Insights & Application Signals

**스크립트**:
Container Insights Enhanced 모니터링으로 CPU, 메모리, 네트워크, 디스크 I/O를 자동 수집합니다. Application Signals는 ADOT 기반 분산 추적을 자동화합니다. PromQL 예시: CPU Throttling 25% 이상이면 성능 저하, OOMKilled 감지, 노드 메모리 85% 초과 경고입니다.

**데이터 소스**:
- Container Insights: [Amazon CloudWatch Container Insights](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html)
- Application Signals: [CloudWatch Application Signals](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Application-Monitoring-Sections.html)
- CPU Throttling 25% 임계값: SRE 커뮤니티 일반 권장값
- PromQL: [Prometheus Query Language](https://prometheus.io/docs/prometheus/latest/querying/basics/)

---

### Slide 61 — 인시던트 디텍팅 4가지 패턴

**스크립트**:
임계값 기반, 이상 탐지, 복합 알람, 로그 메트릭 필터 4가지 패턴입니다. 성숙도 모델 L1(수동, 30분) → L2(임계값, 10분) → L3(이상 탐지, 5분) → L4(자동화, 1분)으로 MTTD를 단축합니다. 대부분의 팀은 L2에서 시작해 L3를 목표로 합니다.

**데이터 소스**:
- CloudWatch Anomaly Detection: [Using CloudWatch Anomaly Detection](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Anomaly_Detection.html) (학습 기간 2주)
- Composite Alarms: [Creating a Composite Alarm](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create_Composite_Alarm.html)
- Metric Filters: [Filter and Pattern Syntax](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/FilterAndPatternSyntax.html)

---

### Slide 62 — 알림 최적화 & Alert Fatigue 방지

**스크립트**:
알림이 너무 많으면 운영팀이 알림을 무시하게 됩니다. P3/P4는 Slack 채널만, P1/P2만 PagerDuty로 전송하세요. Composite Alarm으로 "에러율 증가 AND 지연시간 증가"처럼 여러 시그널을 조합하면 False Positive를 크게 줄일 수 있습니다.

**데이터 소스**:
- Alert Fatigue: [PagerDuty — Alert Fatigue](https://www.pagerduty.com/resources/learn/what-is-alert-fatigue/)
- Composite Alarm: [CloudWatch Composite Alarms](https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/Create_Composite_Alarm.html)

---

### Slide 63 — Top 10 에러 빠른 참조표

**스크립트**:
가장 자주 만나는 10가지 에러와 핵심 명령어를 정리한 Quick Reference입니다. 이 테이블을 출력해서 모니터 옆에 붙여두시면 인시던트 대응 시 바로 참조할 수 있습니다.

---

### Slide 64 — 핵심 교훈 5가지

**스크립트**:
정리하겠습니다. 첫째, 체계적 디버깅 — 계층별 접근. 둘째, 선제적 옵저버빌리티 — Composite Alarm으로 False Positive 제거. 셋째, Auto Mode의 트레이드오프 이해 — 하이브리드 구성. 넷째, GPU/AI는 별도 디버깅 스킬 — XID, vLLM, NCCL. 다섯째, 운영 자동화로 MTTD를 30분에서 1분으로 단축.

---

### Slide 65 — Q&A

**스크립트**:
질문과 토론을 환영합니다. 오늘 다룬 내용은 engineering-playbook 사이트에서 확인하실 수 있습니다. GitHub에서 소스도 공개되어 있으니 참고해 주세요. 감사합니다.

---

## 종합 참고 자료 목록

### AWS 공식 문서
| 주제 | URL |
|------|-----|
| EKS User Guide | https://docs.aws.amazon.com/eks/latest/userguide/ |
| EKS Best Practices Guide | https://aws.github.io/aws-eks-best-practices/ |
| EKS Auto Mode | https://docs.aws.amazon.com/eks/latest/userguide/automode.html |
| EKS Control Plane Logging | https://docs.aws.amazon.com/eks/latest/userguide/control-plane-logs.html |
| VPC CNI Plugin | https://docs.aws.amazon.com/eks/latest/userguide/managing-vpc-cni.html |
| AWS Load Balancer Controller | https://kubernetes-sigs.github.io/aws-load-balancer-controller/ |
| Container Insights | https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/ContainerInsights.html |
| CloudWatch Application Signals | https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch-Application-Monitoring-Sections.html |
| CloudWatch Anomaly Detection | https://docs.aws.amazon.com/AmazonCloudWatch/latest/monitoring/CloudWatch_Anomaly_Detection.html |
| EBS Volume Types | https://docs.aws.amazon.com/ebs/latest/userguide/ebs-volume-types.html |
| EFS CSI Driver | https://docs.aws.amazon.com/eks/latest/userguide/efs-csi.html |
| ADOT | https://aws-otel.github.io/docs/introduction |
| AMP | https://docs.aws.amazon.com/prometheus/latest/userguide/ |
| EFA on EKS | https://docs.aws.amazon.com/eks/latest/userguide/node-efa.html |
| Spot Interruptions | https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/spot-interruptions.html |
| AWS Support Plans (Severity) | https://aws.amazon.com/premiumsupport/plans/ |

### Kubernetes 공식 문서
| 주제 | URL |
|------|-----|
| Troubleshooting Clusters | https://kubernetes.io/docs/tasks/debug/debug-cluster/ |
| Pod Lifecycle | https://kubernetes.io/docs/concepts/workloads/pods/pod-lifecycle/ |
| Probes | https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/ |
| Resource Management | https://kubernetes.io/docs/concepts/configuration/manage-resources-containers/ |
| Network Policies | https://kubernetes.io/docs/concepts/services-networking/network-policies/ |
| RBAC | https://kubernetes.io/docs/reference/access-authn-authz/rbac/ |
| NodeLocal DNSCache | https://kubernetes.io/docs/tasks/administer-cluster/nodelocaldns/ |
| Ephemeral Containers | https://kubernetes.io/docs/concepts/workloads/pods/ephemeral-containers/ |
| PDB | https://kubernetes.io/docs/concepts/workloads/pods/disruptions/ |
| Taints and Tolerations | https://kubernetes.io/docs/concepts/scheduling-eviction/taint-and-toleration/ |
| Node-pressure Eviction | https://kubernetes.io/docs/concepts/scheduling-eviction/node-pressure-eviction/ |
| Gateway API | https://gateway-api.sigs.k8s.io/ |
| HPA | https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/ |
| Native Sidecar (KEP-753) | https://github.com/kubernetes/enhancements/tree/master/keps/sig-node/753-sidecar-containers |

### NVIDIA / GPU
| 주제 | URL |
|------|-----|
| GPU Operator | https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/overview.html |
| CUDA Compatibility | https://docs.nvidia.com/deploy/cuda-compatibility/ |
| XID Error Reference | https://docs.nvidia.com/deploy/xid-errors/index.html |
| NCCL User Guide | https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/ |
| NCCL Environment Variables | https://docs.nvidia.com/deeplearning/nccl/user-guide/docs/env.html |

### 오픈소스 도구
| 도구 | URL |
|------|-----|
| Karpenter | https://karpenter.sh/docs/ |
| vLLM | https://docs.vllm.ai/ |
| netshoot | https://github.com/nicolaka/netshoot |
| eks-node-viewer | https://github.com/awslabs/eks-node-viewer |
| EKS Log Collector | https://github.com/awslabs/amazon-eks-ami/tree/master/log-collector-script |
| metrics-server | https://github.com/kubernetes-sigs/metrics-server |
| stakater/reloader | https://github.com/stakater/Reloader |
| CoreDNS | https://coredns.io/manual/toc/ |
| Prometheus | https://prometheus.io/docs/ |

### SRE / Incident Response
| 주제 | URL |
|------|-----|
| Google SRE Book — Troubleshooting | https://sre.google/sre-book/effective-troubleshooting/ |
| Google SRE Workbook — Debugging | https://sre.google/workbook/debugging/ |
| PagerDuty Incident Response | https://response.pagerduty.com/ |
| PagerDuty Alert Fatigue | https://www.pagerduty.com/resources/learn/what-is-alert-fatigue/ |
