---
title: "컨트롤 플레인 디버깅"
sidebar_label: "컨트롤 플레인"
description: "EKS 컨트롤 플레인 문제 진단 및 해결 가이드"
tags: [eks, kubernetes, control-plane, debugging, troubleshooting]
last_update:
  date: 2026-04-07
  author: devfloor9
---

import { ControlPlaneLogTable, ClusterHealthTable } from '@site/src/components/EksDebugTables';

# 컨트롤 플레인 디버깅

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
| stats count() by responseStatus.code
| sort count desc
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
| filter @message like /throttle/ or @message like /rate limit/
| stats count() by bin(5m)
```

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

# 2. Pod 내 AWS 환경변수 확인
kubectl exec -it <pod-name> -- env | grep AWS

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

Kubernetes 1.21+에서 서비스 어카운트 토큰은 **기본 1시간 유효**하며, kubelet에 의해 자동 갱신됩니다. 그러나 레거시 SDK를 사용하는 경우 토큰 갱신 로직이 없어 장기 실행 워크로드에서 `401 Unauthorized` 에러가 발생할 수 있습니다.

**증상:**

- Pod이 일정 시간(보통 1시간) 후 갑자기 `HTTP 401 Unauthorized` 에러를 반환
- 재시작 후 일시적으로 정상 동작하다가 다시 401 발생

**원인:**

- 프로젝티드 서비스 어카운트 토큰(Projected Service Account Token)은 기본 1시간 만료
- kubelet이 토큰을 자동 갱신하지만, 애플리케이션이 파일에서 토큰을 한 번만 읽고 캐싱하면 만료된 토큰을 계속 사용

**필요한 최소 SDK 버전:**

| 언어 | SDK | 최소 버전 |
|------|-----|----------|
| Go | client-go | v0.15.7+ |
| Python | kubernetes | 12.0.0+ |
| Java | fabric8 | 5.0.0+ |

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
Pod Identity는 IRSA보다 설정이 간단하며, cross-account 접근이 더 용이합니다. 신규 워크로드에서는 Pod Identity 사용을 권장합니다.
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
  | jq '.associations[] | select(.serviceAccount=="<service-account>")'

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
- EKS 1.23+에서는 Access Entries API가 도입되어 aws-auth ConfigMap 대체 가능
- 두 방식을 혼용하면 인증 규칙이 예상과 다르게 동작할 수 있음

**인증 모드 확인:**

```bash
# 클러스터 인증 모드 확인
aws eks describe-cluster --name <cluster-name> \
  --query 'cluster.accessConfig.authenticationMode' --output text
```

**인증 모드 종류:**

| 모드 | 설명 | 권장 사용 사례 |
|------|------|--------------|
| `CONFIG_MAP` | aws-auth ConfigMap만 사용 (레거시) | EKS 1.22 이하 |
| `API` | Access Entries API만 사용 | 신규 클러스터 (EKS 1.23+) |
| `API_AND_CONFIG_MAP` | 두 방식 모두 허용 (기본값) | 마이그레이션 중 |

**마이그레이션 가이드:**

```bash
# 1. 현재 aws-auth ConfigMap 내용 확인
kubectl get configmap aws-auth -n kube-system -o yaml > aws-auth-backup.yaml

# 2. ConfigMap 내용을 Access Entry로 변환
aws eks create-access-entry \
  --cluster-name <cluster-name> \
  --principal-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME \
  --type STANDARD

# 3. Kubernetes RBAC 매핑 (필요 시)
aws eks associate-access-policy \
  --cluster-name <cluster-name> \
  --principal-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster

# 4. 검증 후 인증 모드를 API로 전환
aws eks update-cluster-config \
  --name <cluster-name> \
  --access-config authenticationMode=API
```

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

# 모든 권한 확인 (현재 사용자)
kubectl auth can-i --list

# 특정 네임스페이스에서 모든 권한 확인
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

# Pod 재시작 (Association은 Pod 생성 시점에 적용됨)
kubectl delete pod <pod-name> -n <namespace>
```

## 관련 문서

- [EKS 디버깅 가이드 (메인)](./index.md) - 전체 디버깅 가이드
- [노드 디버깅](./node.md) - 노드 레벨 문제 진단
- [워크로드 디버깅](./workload.md) - Pod 및 워크로드 문제 진단
- [네트워킹 디버깅](./networking.md) - 네트워크 문제 진단
