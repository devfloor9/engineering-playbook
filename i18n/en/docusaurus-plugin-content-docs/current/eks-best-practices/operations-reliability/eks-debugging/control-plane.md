---
title: "Control Plane Debugging"
sidebar_label: "Control Plane"
description: "Guide to diagnosing and resolving EKS control plane issues"
tags: [eks, kubernetes, control-plane, debugging, troubleshooting]
last_update:
  date: 2026-04-07
  author: devfloor9
---

import { ControlPlaneLogTable, ClusterHealthTable } from '@site/src/components/EksDebugTables';

# Control Plane Debugging

## Control Plane Log Types

The EKS control plane can send five log types to CloudWatch Logs.

<ControlPlaneLogTable />

## Enabling Logs

```bash
# Enable all control plane logs
aws eks update-cluster-config \
  --region <region> \
  --name <cluster-name> \
  --logging '{"clusterLogging":[{"types":["api","audit","authenticator","controllerManager","scheduler"],"enabled":true}]}'
```

:::tip Cost Optimization
Enabling all log types increases CloudWatch Logs cost. For production, enabling `audit` and `authenticator` as a baseline and only turning on the rest during debugging is recommended.
:::

## CloudWatch Logs Insights Queries

### API Server Error (400+) Analysis

```sql
fields @timestamp, @message
| filter @logStream like /kube-apiserver-audit/
| filter responseStatus.code >= 400
| stats count() by responseStatus.code
| sort count desc
```

### Authentication Failure Tracking

```sql
fields @timestamp, @message
| filter @logStream like /authenticator/
| filter @message like /error/ or @message like /denied/
| sort @timestamp desc
```

### Detecting Changes to aws-auth ConfigMap

```sql
fields @timestamp, @message
| filter @logStream like /kube-apiserver-audit/
| filter objectRef.resource = "configmaps" and objectRef.name = "aws-auth"
| filter verb in ["update", "patch", "delete"]
| sort @timestamp desc
```

### API Throttling Detection

```sql
fields @timestamp, @message
| filter @logStream like /kube-apiserver/
| filter @message like /throttle/ or @message like /rate limit/
| stats count() by bin(5m)
```

### Unauthorized Access Attempts (Security Events)

```sql
fields @timestamp, @message
| filter @logStream like /kube-apiserver-audit/
| filter responseStatus.code = 403
| stats count() by user.username
| sort count desc
```

## AuthN/AuthZ Debugging

### IAM Authentication Check

```bash
# Check current IAM credentials
aws sts get-caller-identity

# Check cluster authentication mode
aws eks describe-cluster --name <cluster-name> \
  --query 'cluster.accessConfig.authenticationMode' --output text
```

### aws-auth ConfigMap (CONFIG_MAP Mode)

```bash
# View aws-auth ConfigMap
kubectl describe configmap aws-auth -n kube-system
```

### EKS Access Entries (API / API_AND_CONFIG_MAP Mode)

```bash
# Create an Access Entry
aws eks create-access-entry \
  --cluster-name <cluster-name> \
  --principal-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME \
  --type STANDARD

# List Access Entries
aws eks list-access-entries --cluster-name <cluster-name>
```

### IRSA (IAM Roles for Service Accounts) Debugging Checklist

```bash
# 1. Check ServiceAccount annotations
kubectl get sa <sa-name> -n <namespace> -o yaml

# 2. Check AWS environment variables inside the Pod
kubectl exec -it <pod-name> -- env | grep AWS

# 3. Check the OIDC Provider
aws eks describe-cluster --name <cluster-name> \
  --query 'cluster.identity.oidc.issuer' --output text

# 4. Check the IAM Role Trust Policy for OIDC Provider ARN and conditions
aws iam get-role --role-name <role-name> \
  --query 'Role.AssumeRolePolicyDocument'
```

:::warning Common IRSA Mistakes

- Typo in the role ARN on the ServiceAccount annotation
- Mismatch of namespace/sa names in the IAM Role Trust Policy
- OIDC Provider not linked with the cluster
- Pod not configured to use the ServiceAccount (missing `spec.serviceAccountName`)
:::

## Service Account Token Expiration (HTTP 401 Unauthorized)

In Kubernetes 1.21+, service account tokens are **valid for 1 hour by default** and are automatically rotated by kubelet. However, applications using legacy SDKs lack token refresh logic, which can cause `401 Unauthorized` errors in long-running workloads.

**Symptoms:**

- After a certain period (typically 1 hour), Pods suddenly return `HTTP 401 Unauthorized` errors
- After restart, operations work briefly and then 401 errors recur

**Cause:**

- Projected Service Account Tokens expire after 1 hour by default
- kubelet rotates tokens automatically, but applications that read the token file once and cache it will keep using the expired token

**Minimum Required SDK Versions:**

| Language | SDK | Minimum Version |
|------|-----|----------|
| Go | client-go | v0.15.7+ |
| Python | kubernetes | 12.0.0+ |
| Java | fabric8 | 5.0.0+ |

:::tip Token Refresh Verification
Verify that the SDK supports automatic token refresh. If not, the application must periodically re-read `/var/run/secrets/kubernetes.io/serviceaccount/token`.
:::

## EKS Pod Identity Debugging

EKS Pod Identity is an alternative to IRSA that grants AWS IAM permissions to Pods with simpler configuration.

```bash
# Check Pod Identity Associations
aws eks list-pod-identity-associations --cluster-name $CLUSTER
aws eks describe-pod-identity-association --cluster-name $CLUSTER \
  --association-id $ASSOC_ID

# Check Pod Identity Agent status
kubectl get pods -n kube-system -l app.kubernetes.io/name=eks-pod-identity-agent
kubectl logs -n kube-system -l app.kubernetes.io/name=eks-pod-identity-agent --tail=50
```

**Pod Identity debugging checklist:**

- Is the eks-pod-identity-agent Add-on installed?
- Is the Pod's ServiceAccount linked to the correct association?
- Does the IAM Role trust policy include the `pods.eks.amazonaws.com` service principal?

:::info Pod Identity vs IRSA
Pod Identity is simpler to configure than IRSA and makes cross-account access easier. For new workloads, Pod Identity is recommended.
:::

## EKS Add-on Troubleshooting

```bash
# List Add-ons
aws eks list-addons --cluster-name <cluster-name>

# Detailed Add-on status
aws eks describe-addon --cluster-name <cluster-name> --addon-name <addon-name>

# Update Add-on (resolve conflicts: PRESERVE keeps existing configuration)
aws eks update-addon --cluster-name <cluster-name> --addon-name <addon-name> \
  --addon-version <version> --resolve-conflicts PRESERVE
```

| Add-on | Common Error Patterns | Diagnosis | Resolution |
|--------|-------------------|----------|----------|
| **CoreDNS** | Pod CrashLoopBackOff, DNS timeout | `kubectl logs -n kube-system -l k8s-app=kube-dns` | Inspect ConfigMap; `kubectl rollout restart deployment coredns -n kube-system` |
| **kube-proxy** | Service unreachable, iptables errors | `kubectl logs -n kube-system -l k8s-app=kube-proxy` | Check DaemonSet image version; `kubectl rollout restart daemonset kube-proxy -n kube-system` |
| **VPC CNI** | Pod IP allocation failures, ENI errors | `kubectl logs -n kube-system -l k8s-app=aws-node` | Check IPAMD logs, ENI/IP limits (see [Networking doc](./networking.md)) |
| **EBS CSI** | PVC Pending, volume attach failures | `kubectl logs -n kube-system -l app.kubernetes.io/name=aws-ebs-csi-driver` | Check IRSA permissions, AZ alignment (see [Storage doc](./storage.md)) |

## Cluster Health Issue Codes

When diagnosing infrastructure-level problems with the EKS cluster itself, check cluster health.

```bash
# Check cluster health issues
aws eks describe-cluster --name $CLUSTER \
  --query 'cluster.health' --output json
```

<ClusterHealthTable />

:::danger Unrecoverable Issues
`VPC_NOT_FOUND` and `KMS_KEY_NOT_FOUND` are unrecoverable. The cluster must be recreated.
:::

## RBAC / Pod Identity Debugging

### ServiceAccount → IAM Role Mapping Failure

**Symptoms:**
- Pods receive `AccessDenied` or `UnauthorizedOperation` errors when calling AWS APIs
- IRSA or Pod Identity is used but permissions are not applied

**Diagnosis:**

```bash
# 1. Check ServiceAccount annotation (IRSA)
kubectl get sa <service-account> -n <namespace> -o jsonpath='{.metadata.annotations.eks\.amazonaws\.com/role-arn}'

# 2. Check Pod Identity Association
aws eks list-pod-identity-associations --cluster-name $CLUSTER \
  | jq '.associations[] | select(.serviceAccount=="<service-account>")'

# 3. Check whether environment variables are injected into the Pod
kubectl get pod <pod-name> -n <namespace> -o jsonpath='{.spec.serviceAccountName}'
kubectl exec <pod-name> -n <namespace> -- env | grep AWS

# 4. Check IAM Role Trust Policy
aws iam get-role --role-name <role-name> \
  --query 'Role.AssumeRolePolicyDocument' --output json
```

**Resolution:**

For IRSA:
```bash
# Add annotation to ServiceAccount
kubectl annotate serviceaccount <sa-name> -n <namespace> \
  eks.amazonaws.com/role-arn=arn:aws:iam::ACCOUNT:role/ROLE-NAME

# Pod restart required (annotations apply at Pod creation time)
kubectl rollout restart deployment/<deployment-name> -n <namespace>
```

For Pod Identity:
```bash
# Create Pod Identity Association
aws eks create-pod-identity-association \
  --cluster-name $CLUSTER \
  --namespace <namespace> \
  --service-account <service-account> \
  --role-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME
```

### Mixing aws-auth ConfigMap with EKS Access Entries

**Problem:**
- EKS 1.23+ introduces the Access Entries API which can replace aws-auth ConfigMap
- Using both mechanisms together can produce unexpected authentication behavior

**Check authentication mode:**

```bash
# Check cluster authentication mode
aws eks describe-cluster --name <cluster-name> \
  --query 'cluster.accessConfig.authenticationMode' --output text
```

**Authentication mode options:**

| Mode | Description | Recommended Use |
|------|------|--------------|
| `CONFIG_MAP` | Uses only aws-auth ConfigMap (legacy) | EKS 1.22 and earlier |
| `API` | Uses only Access Entries API | New clusters (EKS 1.23+) |
| `API_AND_CONFIG_MAP` | Both mechanisms allowed (default) | During migration |

**Migration guide:**

```bash
# 1. Back up current aws-auth ConfigMap contents
kubectl get configmap aws-auth -n kube-system -o yaml > aws-auth-backup.yaml

# 2. Convert ConfigMap entries to Access Entries
aws eks create-access-entry \
  --cluster-name <cluster-name> \
  --principal-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME \
  --type STANDARD

# 3. Kubernetes RBAC mapping (as needed)
aws eks associate-access-policy \
  --cluster-name <cluster-name> \
  --principal-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME \
  --policy-arn arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy \
  --access-scope type=cluster

# 4. After validation, switch authentication mode to API
aws eks update-cluster-config \
  --name <cluster-name> \
  --access-config authenticationMode=API
```

:::warning Caveats When Changing Authentication Mode
Switching from `CONFIG_MAP` to `API` causes aws-auth ConfigMap to be ignored. Migrate every IAM Principal to Access Entries before switching.
:::

### Permission Validation via kubectl auth can-i

```bash
# Check whether the current user has permission on a specific resource
kubectl auth can-i create deployments --namespace=production
kubectl auth can-i delete pods --namespace=kube-system

# Check permissions for a specific ServiceAccount
kubectl auth can-i list secrets --as=system:serviceaccount:default:my-sa

# List all permissions (current user)
kubectl auth can-i --list

# List all permissions in a specific namespace
kubectl auth can-i --list --namespace=production
```

### Diagnosing Missing Pod Identity Association

**Symptoms:**
- Pod Identity Agent is running normally but Pods lack AWS permissions
- Pod environment variables do not include `AWS_CONTAINER_CREDENTIALS_FULL_URI`

**Diagnosis:**

```bash
# 1. Check Pod Identity Agent status
kubectl get daemonset eks-pod-identity-agent -n kube-system
kubectl get pods -n kube-system -l app.kubernetes.io/name=eks-pod-identity-agent

# 2. Check Associations
aws eks list-pod-identity-associations --cluster-name $CLUSTER

# 3. Check Association for a specific ServiceAccount
aws eks list-pod-identity-associations --cluster-name $CLUSTER \
  | jq --arg ns "default" --arg sa "my-service-account" \
    '.associations[] | select(.namespace==$ns and .serviceAccount==$sa)'

# 4. Check Association details
aws eks describe-pod-identity-association \
  --cluster-name $CLUSTER \
  --association-id <assoc-id>
```

**Resolution:**

```bash
# Create Pod Identity Association
aws eks create-pod-identity-association \
  --cluster-name $CLUSTER \
  --namespace <namespace> \
  --service-account <service-account> \
  --role-arn arn:aws:iam::ACCOUNT:role/ROLE-NAME

# Restart Pod (Association applies at Pod creation time)
kubectl delete pod <pod-name> -n <namespace>
```

## Related Documents

- [EKS Debugging Guide (Main)](./index.md) - Full debugging guide
- [Node Debugging](./node.md) - Node-level issue diagnosis
- [Workload Debugging](./workload.md) - Pod and workload issue diagnosis
- [Networking Debugging](./networking.md) - Network issue diagnosis
