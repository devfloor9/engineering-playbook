---
title: 컨트롤 플레인 디버깅
description: EKS 컨트롤 플레인 문제 진단 및 해결 가이드
created: "2026-04-07"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 11
tags:
  - eks
  - kubernetes
  - control-plane
  - debugging
  - troubleshooting
  - scope:ops
sidebar_label: 컨트롤 플레인
---

import { ControlPlaneLogTable, ClusterHealthTable } from '@site/src/components/EksDebugTables';

## 컨트롤 플레인 로그 타입

EKS 컨트롤 플레인은 5가지 로그 타입을 CloudWatch Logs에 전송할 수 있습니다.

<ControlPlaneLogTable />

## 로그 활성화

```bash
# 모든 컨트롤 플레인 로그 활성화
aws eks update-cluster-config \
  --region <region> \
  --name <cluster-name> \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
```

:::tip 비용 최적화
모든 로그 타입을 활성화하면 CloudWatch Logs 비용이 증가합니다. 프로덕션에서는 `audit`과 `authenticator`를 필수로 활성화하고, 디버깅이 필요할 때 나머지를 추가 활성화하는 전략을 권장합니다.
:::

## CloudWatch Logs Insights 쿼리

### API 서버 에러 (400+) 분석

```sql
fields @timestamp, @message
| filter @logStream like /kube-apiserver-audit/
| filter responseStatus.code >= 400
| stats count() as cnt by responseStatus.code
| sort cnt desc
```

### 인증 실패 추적

```sql
fields @timestamp, @message
| filter @logStream like /authenticator/
| filter @message like /error/ or @message like /denied/
| sort @timestamp desc
```

### aws-auth ConfigMap 변경 감지

```sql
fields @timestamp, @message
| filter @logStream like /kube-apiserver-audit/
| filter objectRef.resource = "configmaps" and objectRef.name = "aws-auth"
| filter verb in ["update", "patch", "delete"]
| sort @timestamp desc
```

### API Throttling 탐지

```sql
fields @timestamp, @message
| filter @logStream like /kube-apiserver/
| filter @message like /throttle/ or @message like /rate limit/ or @message like /Too Many Requests/ or responseStatus.code = 429
| stats count() by bin(5m)
```

이 쿼리는 메시지 문자열과 HTTP 429(Too Many Requests) 응답을 함께 탐지합니다. API Priority and Fairness(APF)에 의한 거부는 로그 메시지로 드러나지 않을 수 있으므로, `apiserver_flowcontrol_rejected_requests_total` 메트릭을 보완 신호로 함께 확인합니다.

### 비인가 접근 시도 (보안 이벤트)

```sql
fields @timestamp, @message
| filter @logStream like /kube-apiserver-audit/
| filter responseStatus.code = 403
| stats count() by user.username
| sort count desc
```

## 인증/인가 디버깅

### IAM 인증 확인

```bash
# 현재 IAM 자격증명 확인
aws sts get-caller-identity

# 클러스터 인증 모드 확인
aws eks describe-cluster --name <cluster-name> \
  --query 'cluster.accessConfig.authenticationMode' --output text
```

### aws-auth ConfigMap (CONFIG_MAP 모드)

```bash
# aws-auth ConfigMap 확인
kubectl describe configmap aws-auth -n kube-system
```

### EKS Access Entries (API / API_AND_CONFIG_MAP 모드)

```bash
# Access Entry 생성
aws eks create-access-entry \
  --cluster-name <cluster-name> \
  --principal-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME \
  --type STANDARD

# Access Entry 목록 확인
aws eks list-access-entries --cluster-name <cluster-name>
```

### IRSA (IAM Roles for Service Accounts) 디버깅 체크리스트

```bash
# 1. ServiceAccount에 annotation 확인
kubectl get sa <sa-name> -n <namespace> -o yaml

# 2. Pod 내 AWS 환경변수 확인 (자격증명 값이 출력되지 않도록 설정 변수만 선택)
kubectl exec -it <pod-name> -- env | grep -E 'AWS_(REGION|DEFAULT_REGION|ROLE_ARN|WEB_IDENTITY_TOKEN_FILE|CONTAINER_CREDENTIALS_FULL_URI|CONTAINER_CREDENTIALS_RELATIVE_URI|STS_REGIONAL_ENDPOINTS)'
# 주의: 전체 'env | grep AWS'는 AWS_SECRET_ACCESS_KEY/AWS_SESSION_TOKEN 같은 정적 자격증명을 노출할 수 있으므로 피합니다.

# 3. OIDC Provider 확인
aws eks describe-cluster --name <cluster-name> \
  --query 'cluster.identity.oidc.issuer' --output text

# 4. IAM Role의 Trust Policy에서 OIDC Provider ARN 및 조건 확인
aws iam get-role --role-name <role-name> \
  --query 'Role.AssumeRolePolicyDocument'
```

:::warning IRSA 일반적인 실수

- ServiceAccount annotation의 role ARN 오타
- IAM Role Trust Policy에서 namespace/sa 이름 불일치
- OIDC Provider가 클러스터와 연결되지 않음
- Pod가 ServiceAccount를 사용하도록 `spec.serviceAccountName` 미지정
:::

## 서비스 어카운트 토큰 만료 (HTTP 401 Unauthorized)

Kubernetes 1.21+에서 프로젝티드 서비스 어카운트 토큰은 **기본 1시간 유효**하며 kubelet이 자동 갱신합니다. EKS는 전환 편의를 위해 토큰 만료를 최대 90일까지 연장하므로, 토큰을 한 번만 읽고 캐싱하는 레거시 SDK는 즉시가 아니라 90일 경과 후 `401 Unauthorized` 에러가 발생할 수 있습니다.

**증상:**

- Pod이 장기간(최대 90일) 실행된 뒤 갑자기 `HTTP 401 Unauthorized` 에러를 반환
- 재시작 후 토큰을 다시 읽어 일시적으로 정상 동작하다가 다시 401 발생

**원인:**

- 프로젝티드 서비스 어카운트 토큰(Projected Service Account Token)의 기본 유효 기간은 1시간입니다.
- 다만 EKS는 신규 시간 제한 토큰으로의 전환을 위해 토큰 만료를 **최대 90일**로 연장하며, API 서버는 90일(7,776,000초)을 초과한 토큰만 거부합니다.
- 토큰이 1시간(경고 임계값)을 넘기면 API 서버는 감사 로그 이벤트에 `annotations.authentication.k8s.io/stale-token` 주석을 남깁니다. 따라서 1시간 직후 즉시 거부되는 것이 아니라, 토큰을 한 번만 읽고 캐싱하는 애플리케이션이 90일 경과 시점에 거부됩니다.
- kubelet이 토큰을 자동 갱신하지만, 애플리케이션이 파일에서 토큰을 한 번만 읽고 캐싱하면 갱신된 토큰을 반영하지 못합니다.

**표 1. 토큰 자동 갱신을 지원하는 언어별 최소 SDK 버전**

| 언어 | SDK | 최소 버전 |
|------|-----|----------|
| Go | client-go | v0.15.7+ |
| Python | kubernetes | 12.0.0+ |
| Java | kubernetes-client/java | 9.0.0+ |

:::tip 토큰 갱신 확인
SDK가 토큰 자동 갱신을 지원하는지 확인하세요. 지원하지 않는 경우 애플리케이션에서 주기적으로 `/var/run/secrets/kubernetes.io/serviceaccount/token` 파일을 다시 읽도록 구현해야 합니다.
:::

## EKS Pod Identity 디버깅

EKS Pod Identity는 IRSA의 대안으로, 보다 간단한 설정으로 Pod에 AWS IAM 권한을 부여합니다.

```bash
# Pod Identity Association 확인
aws eks list-pod-identity-associations --cluster-name $CLUSTER
aws eks describe-pod-identity-association --cluster-name $CLUSTER \
  --association-id $ASSOC_ID

# Pod Identity Agent 상태 확인
kubectl get pods -n kube-system -l app.kubernetes.io/name=eks-pod-identity-agent
kubectl logs -n kube-system -l app.kubernetes.io/name=eks-pod-identity-agent --tail=50
```

**Pod Identity 디버깅 체크리스트:**

- eks-pod-identity-agent Add-on이 설치되어 있는지
- Pod의 ServiceAccount에 올바른 association이 연결되어 있는지
- IAM Role trust policy에 `pods.eks.amazonaws.com` 서비스 프린시펄이 있는지

:::info Pod Identity vs IRSA
Pod Identity는 IRSA보다 설정이 간단하며, cross-account 접근이 더 용이합니다. 다만 Pod Identity는 지원되는 EKS 버전과 노드 유형(Linux EC2/Managed Node Group 등, Fargate 미지원), `eks-pod-identity-agent` Add-on 설치, 그리고 Pod Identity를 인식하는 SDK 자격증명 체인 버전이 전제됩니다. 이러한 전제 조건을 충족하는 신규 워크로드에서는 Pod Identity 사용을 권장합니다.
:::

## EKS Add-on 트러블슈팅

```bash
# Add-on 목록 확인
aws eks list-addons --cluster-name <cluster-name>

# Add-on 상태 상세 확인
aws eks describe-addon --cluster-name <cluster-name> --addon-name <addon-name>

# Add-on 업데이트 (충돌 해결: PRESERVE로 기존 설정 유지)
aws eks update-addon --cluster-name <cluster-name> --addon-name <addon-name> \
  --addon-version <version> --resolve-conflicts PRESERVE
```

**표 2. 주요 Add-on별 에러 패턴과 진단·해결 방법**

| Add-on | 일반적인 에러 패턴 | 진단 방법 | 해결 방법 |
|--------|-------------------|----------|----------|
| **CoreDNS** | Pod CrashLoopBackOff, DNS 타임아웃 | `kubectl logs -n kube-system -l k8s-app=kube-dns` | ConfigMap 점검, `kubectl rollout restart deployment coredns -n kube-system` |
| **kube-proxy** | Service 통신 불가, iptables 에러 | `kubectl logs -n kube-system -l k8s-app=kube-proxy` | DaemonSet 이미지 버전 확인, `kubectl rollout restart daemonset kube-proxy -n kube-system` |
| **VPC CNI** | Pod IP 할당 실패, ENI 에러 | `kubectl logs -n kube-system -l k8s-app=aws-node` | IPAMD 로그 확인, ENI/IP 한도 점검 ([네트워킹 문서](./networking.md) 참조) |
| **EBS CSI** | PVC Pending, 볼륨 attach 실패 | `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-ebs-csi-driver` | IRSA 권한, AZ 매칭 확인 ([스토리지 문서](./storage.md) 참조) |

## 클러스터 헬스 이슈 코드

EKS 클러스터 자체의 인프라 수준 문제를 진단할 때는 클러스터 헬스 상태를 확인합니다.

```bash
# 클러스터 헬스 이슈 확인
aws eks describe-cluster --name $CLUSTER \
  --query 'cluster.health' --output json
```

<ClusterHealthTable />

:::danger 복구 불가 이슈
`VPC_NOT_FOUND`와 `KMS_KEY_NOT_FOUND`는 복구가 불가능합니다. 클러스터를 새로 생성해야 합니다.
:::

## RBAC / Pod Identity 디버깅

### ServiceAccount → IAM Role 매핑 실패

**증상:**
- Pod에서 AWS API 호출 시 `AccessDenied` 또는 `UnauthorizedOperation` 에러 발생
- IRSA 또는 Pod Identity를 사용했지만 권한이 적용되지 않음

**진단:**

```bash
# 1. ServiceAccount annotation 확인 (IRSA)
kubectl get sa <service-account> -n <namespace> -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'

# 2. Pod Identity Association 확인
aws eks list-pod-identity-associations --cluster-name $CLUSTER \
  | jq '.associations[] | select(.namespace=="<namespace>" and .serviceAccount=="<service-account>")'

# 3. Pod에 환경변수가 주입되었는지 확인
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.spec.serviceAccountName}'
kubectl exec <pod-name> -n <namespace> -- env | grep AWS

# 4. IAM Role Trust Policy 확인
aws iam get-role --role-name <role-name> \
  --query 'Role.AssumeRolePolicyDocument' --output json
```

**해결 방법:**

IRSA의 경우:
```bash
# ServiceAccount에 annotation 추가
kubectl annotate serviceaccount <sa-name> -n <namespace> \
  eks.amazonaws.com/role-arn=arn:aws:iam::ACCOUNT:role/ROLE-NAME

# Pod 재시작 필요 (annotation은 Pod 생성 시점에 적용됨)
kubectl rollout restart deployment/<deployment-name> -n <namespace>
```

Pod Identity의 경우:
```bash
# Pod Identity Association 생성
aws eks create-pod-identity-association \
  --cluster-name $CLUSTER \
  --namespace <namespace> \
  --service-account <service-account> \
  --role-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME
```

### aws-auth ConfigMap vs EKS Access Entries 혼용 이슈

**문제:**
- EKS Access Entries API가 도입되어 aws-auth ConfigMap 대체 가능
- 두 방식을 혼용하면 인증 규칙이 예상과 다르게 동작할 수 있음

**인증 모드 확인:**

```bash
# 클러스터 인증 모드 확인
aws eks describe-cluster --name <cluster-name> \
  --query 'cluster.accessConfig.authenticationMode' --output text
```

**표 3. EKS 인증 모드별 설명과 권장 사용 사례**

| 모드 | 설명 | 권장 사용 사례 |
|------|------|--------------|
| `CONFIG_MAP` | aws-auth ConfigMap만 사용 (레거시) | 레거시 클러스터 |
| `API` | Access Entries API만 사용 | 신규 클러스터 권장 |
| `API_AND_CONFIG_MAP` | 두 방식 모두 허용 | 마이그레이션 중 |

기본 `authenticationMode`는 클러스터를 어떻게 생성·구성했는지에 따라 다릅니다. 콘솔에서 생성한 신규 클러스터는 `API`가 기본일 수 있고, 다른 경로로 생성한 클러스터는 `API_AND_CONFIG_MAP`일 수 있으므로, 실제 모드는 `aws eks describe-cluster`로 확인하세요. 지원되는 인증 모드는 Kubernetes 마이너 버전만이 아니라 클러스터의 플랫폼 버전과 `accessConfig` 설정에 따라 결정됩니다.

**마이그레이션 가이드:**

```bash
# 1. 현재 aws-auth ConfigMap 내용 확인
kubectl get configmap aws-auth -n kube-system -o yaml > aws-auth-backup.yaml

# 2. 인증 모드를 먼저 API_AND_CONFIG_MAP로 전환 (Access Entry API 활성화)
#    create-access-entry는 API 또는 API_AND_CONFIG_MAP 모드에서만 동작합니다.
aws eks update-cluster-config \
  --name <cluster-name> \
  --access-config authenticationMode=API_AND_CONFIG_MAP

# 3. ConfigMap 내용을 Access Entry로 변환
aws eks create-access-entry \
  --cluster-name <cluster-name> \
  --principal-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME \
  --type STANDARD

# 4. 권한 부여 (아래는 클러스터 전체 관리자 권한 예시)
aws eks associate-access-policy \
  --cluster-name <cluster-name> \
  --principal-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster

# 5. 모든 Principal 검증 후 인증 모드를 API로 전환
aws eks update-cluster-config \
  --name <cluster-name> \
  --access-config authenticationMode=API
```

:::note 권한 매핑 주의
4단계의 `AmazonEKSClusterAdminPolicy`(`--access-scope type=cluster`)는 Kubernetes RBAC를 그대로 옮긴 것이 아니라 **클러스터 전체 관리자 권한**을 부여합니다. 기존 aws-auth의 그룹별 권한을 보존하려면, 네임스페이스 범위(`type=namespace`)나 최소 권한에 맞는 EKS access policy를 선택하거나, Access Entry의 Kubernetes 그룹(`--kubernetes-groups`)으로 원래 RBAC 그룹에 매핑하세요.
:::

:::warning 인증 모드 변경 시 주의사항
`CONFIG_MAP` → `API`로 전환하면 aws-auth ConfigMap이 무시됩니다. 반드시 모든 IAM Principal을 Access Entry로 마이그레이션한 후 전환하세요.
:::

### kubectl auth can-i를 활용한 권한 검증

```bash
# 현재 사용자가 특정 리소스에 대한 권한이 있는지 확인
kubectl auth can-i create deployments --namespace=production
kubectl auth can-i delete pods --namespace=kube-system

# 특정 ServiceAccount의 권한 확인
kubectl auth can-i list secrets --as=system:serviceaccount:default:my-sa

# RBAC로부터 파생된 권한 목록 (현재 사용자)
# 주의: can-i --list는 RBAC(Role/ClusterRole) 기반 권한만 열거하며, EKS access policy로 부여된 권한은 포함하지 않습니다.
kubectl auth can-i --list

# 특정 네임스페이스에서 RBAC 기반 권한 목록
kubectl auth can-i --list --namespace=production
```

### Pod Identity Association 미설정 진단

**증상:**
- Pod Identity Agent가 정상 실행 중이지만 Pod에서 AWS 권한이 없음
- Pod 환경변수에 `AWS_CONTAINER_CREDENTIALS_FULL_URI`가 없음

**진단:**

```bash
# 1. Pod Identity Agent 상태 확인
kubectl get daemonset eks-pod-identity-agent -n kube-system
kubectl get pods -n kube-system -l app.kubernetes.io/name=eks-pod-identity-agent

# 2. Association 확인
aws eks list-pod-identity-associations --cluster-name $CLUSTER

# 3. 특정 ServiceAccount에 대한 Association 확인
aws eks list-pod-identity-associations --cluster-name $CLUSTER \
  | jq --arg ns "default" --arg sa "my-service-account" \
    '.associations[] | select(.namespace==$ns and .serviceAccount==$sa)'

# 4. Association 세부 정보 확인
aws eks describe-pod-identity-association \
  --cluster-name $CLUSTER \
  --association-id <assoc-id>
```

**해결 방법:**

```bash
# Pod Identity Association 생성
aws eks create-pod-identity-association \
  --cluster-name $CLUSTER \
  --namespace <namespace> \
  --service-account <service-account> \
  --role-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME

# Pod 재생성으로 Association 적용 (Association은 Pod 생성 시점에 적용됨)
# 컨트롤러(Deployment 등)가 관리하는 Pod은 rollout restart를 권장합니다.
kubectl rollout restart deployment/<deployment-name> -n <namespace>
# 단일 Pod을 직접 삭제하면 재생성되는 것은 컨트롤러가 관리할 때뿐이며,
# 직접 삭제는 PodDisruptionBudget의 축출 검사를 우회합니다.
kubectl delete pod <pod-name> -n <namespace>
```

## 관련 문서

- [EKS 디버깅 가이드 (메인)](./index.md) - 전체 디버깅 가이드
- [노드 디버깅](./node.md) - 노드 레벨 문제 진단
- [워크로드 디버깅](./workload.md) - Pod 및 워크로드 문제 진단
- [네트워킹 디버깅](./networking.md) - 네트워크 문제 진단
