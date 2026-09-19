---
title: Harbor 2.15와 EKS Hybrid Nodes 통합 가이드
description: Harbor와 EKS Hybrid Nodes의 DNS, TLS 신뢰, containerd 설정, 프로젝트 인증과 복구 검증을 분리해 설명하는 구성 가이드
created: "2025-08-20"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 18
tags:
  - eks
  - hybrid-node
  - harbor
  - container-registry
  - kubernetes
  - ssl-tls
  - nodeadm
  - scope:impl
sidebar_label: Harbor 레지스트리
category: hybrid-multicloud
---

## 개요

Harbor를 프라이빗 레지스트리로 사용하려면 Hybrid Node의 containerd가 레지스트리 이름을 해석하고, 서버 인증서를 신뢰하며, 필요한 이미지에 접근할 자격 증명을 받아야 합니다. 이 세 경로를 각각 확인하는 구성 가이드입니다.

Harbor 2.15.1과 Kubernetes 1.33은 기존 예제의 버전입니다. 최신 권장 조합이나 배포 완료 기록을 뜻하지 않습니다. 2026-09-19 검토에서는 공식 설정과 예제를 대조했으며 실제 설치·노드 재시작·이미지 pull·복구 시험은 하지 않았습니다. 적용 전 Harbor, nodeadm, OS, containerd, EKS와 CNI의 지원 조합을 확정합니다.

예제는 별도 Harbor 호스트와 **아직 클러스터에 등록하지 않은 Hybrid Node**를 준비하는 범위입니다. 기존 노드의 runtime 설정 변경은 별도 유지보수 작업으로 다룹니다. `harbor.yourdomain.com`, 계정·리전·네임스페이스·이미지는 환경에 맞게 바꿔야 합니다.

## Part 1: Harbor Private Repository 설치 및 구성

### Step 1: Harbor 2.15 설치 준비

#### 시스템 요구사항 확인

Harbor 2.15의 Compose 설치 문서는 Docker Engine >20.10, Docker Compose >2.3, 최소 2 CPU·4 GB 메모리·40 GB 디스크를 제시합니다. 이는 최소 설치 조건이며 이미지 보관량·동시 pull·스캔 부하에 맞는 운영 용량은 별도 산정합니다.

Harbor 호스트의 Docker/OS 지원과 Hybrid Node의 OS 지원은 별개입니다. OS 이름만으로 조합을 보장하지 말고 해당 릴리스의 지원 문서를 확인합니다. HTTPS 443, DNS, 인증 서버와 스캐너 데이터베이스 갱신 경로도 준비합니다.

#### Harbor 2.15.x 다운로드

```bash
# Pinned example release; verify its release checksum before extraction.
wget https://github.com/goharbor/harbor/releases/download/v2.15.1/harbor-offline-installer-v2.15.1.tgz

# 압축 해제
tar xvf harbor-offline-installer-v2.15.1.tgz
cd harbor
```

### Step 2: SSL/TLS 인증서 구성

#### 자체 서명 인증서 생성

이 자체 CA 예제는 격리된 시험 환경을 위한 것입니다. 다음 생성·서명 명령은 Harbor 호스트와 분리된 보호된 발급 호스트에서 실행합니다. 실제 DNS/IP와 SAN을 맞추고, CA 개인키는 레지스트리와 노드에 배포하지 않습니다. 운영 환경은 조직의 인증서 발급·갱신 절차를 따릅니다. CA 공개 인증서는 Harbor 관리 클라이언트와 이미지 pull 클라이언트에도 신뢰시켜야 합니다.

```bash
umask 077
# 1. CA 인증서 생성
openssl genrsa -out ca.key 4096
openssl req -x509 -new -nodes -sha512 -days 3650 \
  -key ca.key \
  -out ca.crt \
  -subj "/C=US/ST=Washington/L=Seattle/O=MyOrganization/CN=Harbor-CA"

# 2. 서버 인증서 생성
openssl genrsa -out harbor.key 4096
openssl req -new -sha512 \
  -key harbor.key \
  -out harbor.csr \
  -subj "/C=US/ST=Washington/L=Seattle/O=MyOrganization/CN=harbor.yourdomain.com"

# 3. v3.ext 파일 생성 (SAN 설정)
cat > v3.ext <<EOF
authorityKeyIdentifier=keyid,issuer
basicConstraints=CA:FALSE
keyUsage = digitalSignature, nonRepudiation, keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1=harbor.yourdomain.com
DNS.2=yourdomain.com
IP.1=192.168.1.100
EOF

# 4. 인증서 서명
openssl x509 -req -sha512 -days 3650 \
  -extfile v3.ext \
  -CA ca.crt -CAkey ca.key -CAcreateserial \
  -in harbor.csr \
  -out harbor.crt

```

서명 후 `harbor.crt`와 `harbor.key`만 보호된 경로로 Harbor 호스트에 전달합니다. CA 개인키는 발급 호스트에 남기고, 공개 `ca.crt`는 클라이언트 신뢰 설정용으로 별도 배포합니다. 다음은 Harbor 호스트에서 서버 인증서와 개인키를 설치하는 명령입니다.

```bash
# Install only the server certificate and key on the Harbor host
sudo install -d -m 0750 /data/cert
sudo install -m 0644 harbor.crt /data/cert/harbor.crt
sudo install -m 0600 harbor.key /data/cert/harbor.key
```

### Step 3: Harbor 구성 파일 설정

#### harbor.yml 수정

```bash
# harbor.yml 파일 복사 및 편집
cp harbor.yml.tmpl harbor.yml
vi harbor.yml
```

주요 설정 내용:

```yaml
# 호스트명 설정
hostname: harbor.yourdomain.com

# HTTPS 구성
https:
  port: 443
  certificate: /data/cert/harbor.crt
  private_key: /data/cert/harbor.key

# Set a unique generated secret before the first start.
harbor_admin_password: REPLACE_WITH_GENERATED_ADMIN_SECRET

# 데이터베이스 설정 (강력한 비밀번호로 변경 + 정기 로테이션)
database:
  password: REPLACE_WITH_GENERATED_DATABASE_SECRET
  max_idle_conns: 100
  max_open_conns: 900
  conn_max_lifetime: 5m
  conn_max_idle_time: 0

# 데이터 저장 경로
data_volume: /data

# 로그 설정
log:
  level: info
  local:
    rotate_count: 50
    rotate_size: 200M
    location: /var/log/harbor

# Trivy 취약점 스캐너 설정
trivy:
  ignore_unfixed: false
  skip_update: false
  offline_scan: false
  insecure: false

# 메트릭 설정
metric:
  enabled: true
  port: 9090
  path: /metrics
```

`REPLACE_WITH_...` 값은 설치 전에 비밀 저장소에서 가져온 서로 다른 값으로 교체합니다. `harbor.yml`은 소유자만 읽을 수 있게 보관하고 Git에 넣지 않습니다. `harbor_admin_password`는 최초 초기화에만 쓰이므로 기존 관리자 암호를 이 파일만 바꿔 회전할 수는 없습니다.

### Step 4: Harbor 설치 실행

offline installer의 `install.sh`는 번들 이미지를 로드한 뒤 준비 단계를 실행합니다. 새 호스트에서 먼저 `prepare`를 호출하지 않습니다.

```bash
# Harbor 설치 (Trivy 포함)
sudo ./install.sh --with-trivy

# 설치 확인
docker compose ps
```

### Step 5: Harbor 사용자 인증 구성

#### LDAP 인증 설정 (선택사항)

Harbor의 Administration → Configuration → Authentication에서 LDAP를 설정합니다. `ldaps://` 주소와 신뢰할 수 있는 서버 인증서를 사용하고 인증서 검증을 유지합니다. 검색 계정에는 필요한 디렉터리 조회 권한만 부여하며 관리자 계정 암호를 재사용하지 않습니다.

Base DN·UID·filter·group 범위를 정하고 Test LDAP Server로 연결을 확인한 뒤 허용/거부 계정의 로그인과 프로젝트 권한을 시험합니다. 기본 데이터베이스 인증에서 LDAP로 전환하는 것은 `admin` 외 로컬 사용자가 없을 때만 지원됩니다. 기존 사용자 환경에서는 계정 전환 계획부터 검토합니다.

#### Robot Account 생성 (Kubernetes 연동용)

Harbor에서 애플리케이션 프로젝트를 만들고 해당 프로젝트에 한정된 robot account에 repository pull 권한을 부여합니다. push·삭제·전체 프로젝트 권한은 이미지 pull에 필요하지 않습니다. 만료와 갱신 담당자를 정합니다.

생성 시 반환되는 **전체 계정 이름과 secret**을 비밀 저장소에 보관합니다. prefix가 설정에 따라 달라질 수 있으므로 `robot$k8s-robot`을 임의로 조합하지 않습니다. 새 secret은 생성 직후 보관하고, 중단 없이 교체하려면 새 robot account를 만든 뒤 Kubernetes Secret을 갱신하고, 새 Pod의 pull을 확인한 후 이전 계정을 폐기합니다. 같은 계정의 secret refresh가 이전 secret과 겹쳐 유효하다고 가정하지 않습니다.

## Part 2: EKS Hybrid Nodes 구성

### Step 6: nodeadm 설치 및 준비

선택한 EKS 버전을 지원하는 nodeadm·OS·containerd를 설치한 뒤 `containerd --version`과 설치 로그를 확인합니다. Kubernetes 버전만으로 containerd의 설정 형식을 결정하지 않습니다. SSM 또는 IAM Roles Anywhere의 노드 인증, 클러스터 접근 권한, CNI와 네트워크 준비는 Harbor 인증과 별개입니다.

[nodeadm 공식 참조](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-nodeadm.html)와 [노드 인증 방식](../security-authn/node-authentication.md)을 기준으로 새 노드의 준비를 완료합니다.

### Step 7: NodeConfig 파일 생성

#### Harbor 통합을 위한 NodeConfig 작성

다음 예시는 nodeadm의 containerd 기본 설정을 유지합니다. 확인한 [nodeadm 템플릿](https://github.com/aws/eks-hybrid/blob/20aace438668970fee38a1b053836c59fd5cfd72/internal/containerd/config.template.toml)은 이미 `/etc/containerd/certs.d`를 읽으므로 Harbor용 runtime override가 필요하지 않습니다. 설치한 nodeadm 버전과 생성 설정에서도 이 경로를 확인하세요. SSM 값은 해당 노드 등록용 값으로 교체하고 파일 권한을 제한합니다. robot secret은 NodeConfig 대신 네임스페이스의 imagePullSecret으로 전달합니다.

```yaml
apiVersion: node.eks.aws/v1alpha1
kind: NodeConfig
spec:
  cluster:
    name: my-hybrid-cluster
    region: us-west-2
  hybrid:
    ssm:
      activationCode: "REPLACE_WITH_ACTIVATION_CODE"
      activationId: "REPLACE_WITH_ACTIVATION_ID"
  kubelet:
    flags:
      - --node-labels=node-type=hybrid,registry=harbor
```

containerd 실행 파일의 major 버전만 보고 TOML 형식을 바꾸지 않습니다. 확인한 nodeadm은 아래와 같은 **version 2 기본 파일**을 생성하며, 사용자 TOML을 별도 import 파일에 넣습니다.

```toml
# Excerpt from the reviewed nodeadm-generated configuration, not a replacement file.
version = 2
[plugins."io.containerd.grpc.v1.cri".registry]
  config_path = "/etc/containerd/certs.d:/etc/docker/certs.d"
```

containerd 2.x도 이 v2 기본 설정을 migration하여 읽을 수 있습니다. v2 기본 파일에 v3 조각을 import하면 기본 runtime·CNI 설정의 migration을 보존한다고 볼 수 없습니다. [containerd import 규칙](https://github.com/containerd/containerd/blob/v2.1.4/docs/man/containerd-config.toml.5.md)은 import 버전이 기본 파일보다 높지 않아야 한다고 명시합니다. 다른 기본 설정을 사용한다면 전체 파일과 import의 버전·plugin 경로·인증서 디렉터리를 함께 검증하고, 기본 파일을 짧은 조각으로 덮어쓰지 않습니다.

### Step 8: 인증서 설치

#### Harbor CA 인증서를 노드에 설치

새 노드에 `/etc/containerd/certs.d/harbor.yourdomain.com/ca.crt`로 CA 공개 인증서를 설치하고 같은 디렉터리에 다음 `hosts.toml`을 둡니다. 이 경로에는 CA 개인키나 robot token을 넣지 않습니다.

```toml
# /etc/containerd/certs.d/harbor.yourdomain.com/hosts.toml
server = "https://harbor.yourdomain.com"
[host."https://harbor.yourdomain.com"]
  capabilities = ["pull", "resolve"]
  ca = "/etc/containerd/certs.d/harbor.yourdomain.com/ca.crt"
```

containerd 외 클라이언트의 신뢰 저장소도 따로 구성합니다. Ubuntu 계열은 `/usr/local/share/ca-certificates/`와 `update-ca-certificates`, RHEL 계열은 `/etc/pki/ca-trust/source/anchors/`와 `update-ca-trust`를 사용하는 등 OS에 맞는 절차를 따릅니다. Docker 클라이언트/daemon의 registry trust는 containerd 설정과 별개입니다.

containerd 공식 문서는 hosts 디렉터리 안의 변경에 daemon 재시작이 필요하지 않다고 설명합니다. 반면 `config_path` 같은 기본 runtime 설정 변경은 별도로 적용해야 합니다. 기존 노드에서 재시작이 필요하면 대상 노드 하나의 drain·여유 용량·복구 절차를 먼저 정하고 원래 설정을 보관합니다.

### Step 9: 노드 초기화

등록 전 새 노드에서 설정을 확인합니다. `config check` 통과는 구성 검증이며 클러스터 연결이나 이미지 pull의 성공을 증명하지 않습니다.

```bash
sudo nodeadm config check --config-source file://nodeconfig.yaml
sudo nodeadm init --config-source file://nodeconfig.yaml
```

등록 후 해당 노드의 Ready 상태, CNI, `node-type=hybrid`·`registry=harbor` label과 실제 containerd 설정을 확인합니다. 실패하면 validation을 건너뛰지 말고 nodeadm·kubelet·containerd 로그에서 원인을 찾습니다.

## Part 3: Harbor와 EKS 통합

### Step 10: 네트워크 구성

#### 보안 그룹 설정

Harbor의 호스팅 위치를 먼저 정합니다. EC2에 있다면 Hybrid Node에서 관측되는 실제 출발지 CIDR을 해당 security group에서 TCP 443으로 허용하고, VPC·온프레미스의 라우팅·방화벽·반환 경로를 함께 확인합니다. NAT를 거치면 출발지 주소가 달라집니다.

EC2 노드 security group을 source-group으로 참조하는 규칙은 그 그룹과 연결된 인터페이스에 적용됩니다. 해당 그룹에 속하지 않는 온프레미스 노드까지 자동으로 허용하지 않습니다. Harbor가 온프레미스에 있다면 그 방화벽과 호스트 방화벽에서 접근 범위를 정합니다.

#### DNS 구성

이미지 pull은 노드의 containerd가 수행하므로 **노드 OS가 Harbor 이름을 해석하는지** 먼저 확인합니다. 기업 DNS에 레코드와 필요한 forwarding을 구성합니다. Pod 안의 DNS 조회가 성공해도 호스트 resolver가 같은 경로를 사용한다고 가정하지 않습니다.

다음 검사는 CA를 설치한 Hybrid Node에서 실행합니다.

```bash
getent hosts harbor.yourdomain.com
curl --fail --show-error --cacert /etc/containerd/certs.d/harbor.yourdomain.com/ca.crt \
  https://harbor.yourdomain.com/api/v2.0/health
```

CoreDNS 설정은 Pod의 별도 이름 해석 요구가 있을 때 다룹니다. 이 통합을 위해 Corefile 전체를 교체하지 않으며 EKS가 요구하는 `ready` 등 기존 plugin을 보존합니다.

### Step 11: Kubernetes Secret 생성

#### Harbor 인증 정보 Secret 생성

이미 생성한 `app` 네임스페이스에 최초 Secret을 만드는 예제입니다. 관리자 클라이언트의 Python 3, 클러스터 context와 해당 네임스페이스의 Secret 생성 권한을 먼저 확인합니다. **별도 Bash 스크립트**에서 robot 이름·토큰을 입력받아 소유자만 읽을 수 있는 임시 Docker 형식 파일을 만듭니다. 암호를 명령행 인수나 로그에 넣지 않으며 종료 시 임시 파일을 삭제합니다.

Docker login은 credential helper를 자동 선택해 인증값을 외부 keychain에 저장할 수 있습니다. 그런 `config.json`을 복사하는 대신, 이 예제는 Kubernetes가 읽을 `auths` 항목을 직접 생성합니다. 입력의 빈 값과 잘못된 사용자 이름을 검사하지만 자격증명의 유효성은 다음 단계의 실제 이미지 pull로 확인해야 합니다.

```bash
#!/usr/bin/env bash
set +x
set -euo pipefail
umask 077
registry_auth_dir="$(mktemp -d)"
trap 'rm -rf -- "$registry_auth_dir"' EXIT
read -r -p "Harbor robot account name: " harbor_robot
read -r -s -p "Harbor robot token: " harbor_token
printf '\n'
printf '%s\0%s' "$harbor_robot" "$harbor_token" | python3 -c '
import base64, json, sys
username, token = sys.stdin.buffer.read().split(b"\0", 1)
if not username or not token or b":" in username:
    raise SystemExit("A nonempty robot name without a colon and a token are required")
auth = base64.b64encode(username + b":" + token).decode("ascii")
json.dump({"auths": {"harbor.yourdomain.com": {"auth": auth}}}, sys.stdout)
' > "$registry_auth_dir/config.json"
unset harbor_token
kubectl -n app create secret generic harbor-registry \
  --type=kubernetes.io/dockerconfigjson \
  --from-file=.dockerconfigjson="$registry_auth_dir/config.json"
```

이미 Secret이 있으면 이 생성 명령을 반복하지 말고 조직의 Secret 관리 경로로 해당 네임스페이스만 갱신합니다. Secret을 전체 네임스페이스로 복사하지 않습니다. Kubernetes Secret의 base64는 암호화가 아니므로 RBAC와 저장 시 암호화도 별도로 관리합니다.

#### ServiceAccount에 ImagePullSecret 추가

동일한 `app` 네임스페이스의 전용 ServiceAccount에 Secret을 연결합니다. 이 설정은 image pull 자격 증명을 선택하는 것이며 애플리케이션의 AWS IAM 권한을 부여하지 않습니다.

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: app-sa
  namespace: app
imagePullSecrets:
  - name: harbor-registry
```

### Step 12: 테스트 및 검증

#### 연결 테스트

먼저 검증할 이미지를 `app` 프로젝트에 push 또는 import하고 실제 경로·tag·digest와 실행 명령을 기록합니다. 아래 `smoke:verified`는 존재해야 하는 예시 이미지입니다. 운영 배포에는 확인한 digest를 고정합니다. 앞서 만든 ServiceAccount와 label이 있는 Hybrid Node를 사용합니다.

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: harbor-test
  namespace: app
spec:
  serviceAccountName: app-sa
  nodeSelector:
    node-type: hybrid
    registry: harbor
  restartPolicy: Never
  containers:
    - name: smoke
      image: harbor.yourdomain.com/app/smoke:verified
      imagePullPolicy: Always
```

Pod의 nodeName이 의도한 Hybrid Node인지, imageID가 예상 digest인지, 새 이미지가 인증된 경로로 pull되었는지 확인합니다. 성공한 pull과 애플리케이션 Ready는 별개이므로 컨테이너의 종료·로그도 확인합니다. 캐시되지 않은 승인된 이미지로 검사하고, 만료 token·다른 프로젝트·신뢰하지 않는 CA의 실패 사례도 시험합니다.

`curl -k`는 CA 검증을 우회하므로 신뢰 검증의 근거로 쓰지 않습니다. `crictl pull`은 Pod의 imagePullSecret을 자동으로 받지 않으므로 이 Pod 시험과 같은 인증 경로가 아닙니다. 시험 후 만든 Pod 등 임시 리소스의 정리 담당자를 정합니다.

### Step 13: 문제 해결

#### 일반적인 문제와 해결 방법

| 증상 | 먼저 확인할 항목 |
| --- | --- |
| ImagePullBackOff | 이벤트의 DNS·TLS·401/403·이미지 없음 구분; 같은 namespace의 Secret과 ServiceAccount, 실제 이미지 경로 |
| x509 오류 | 노드 시간, 서버 SAN·chain, containerd의 실제 config_path·CA 경로 |
| 이름 해석 실패 | 노드 OS resolver부터 확인; Pod DNS 문제는 별도로 진단 |
| 일부 노드만 실패 | OS·containerd 버전·CA·설정·라우팅 차이와 실제 배치 |

Secret은 type·이름·네임스페이스·존재 여부로 먼저 점검하고 `.dockerconfigjson`을 로그에 디코딩하지 않습니다. CA 배포는 노드 관리 도구로 대상과 완료 상태를 추적합니다. 호스트 루트를 마운트한 privileged DaemonSet으로 모든 노드의 containerd를 반복 재시작하는 방식은 사용하지 않습니다.

기존 노드의 기본 runtime 설정을 바꿔야 한다면 파일을 백업하고 한 노드의 여유 용량·drain·점검·복구를 순서대로 수행하는 변경 계획을 둡니다. 문제의 원인을 확인하기 전에 CoreDNS나 runtime을 일괄 재시작하지 않습니다.

## Part 4: 운영 및 유지보수

### Step 14: 보안 강화

#### Harbor 보안 정책 설정

대상 프로젝트의 scan-on-push와 허용 취약점 기준을 설정하고 실제 스캐너 DB 갱신·실패 동작을 확인합니다. 프로젝트 ID를 임의로 `1`로 가정하지 않습니다. 스캔 결과가 없거나 오래된 경우의 정책도 정합니다.

Harbor 2.9 이후 Notary v1은 이 구성의 서명 경로로 사용할 수 없습니다. 선택한 릴리스의 Cosign·Notation 지원과 content trust 정책을 확인합니다. 서명 저장, registry의 pull 정책, Kubernetes admission의 검증은 서로 다른 단계입니다. 서명자·artifact digest·신뢰 정책을 맞추고 변조·미서명 이미지를 거부하는지 별도로 시험합니다.

### Step 15: 백업 및 복구

#### Harbor 백업 스크립트

범용 `cp`·`pg_dump`·`tar` 조합만으로 복구 가능한 백업을 보장할 수 없습니다. 이 문서의 Compose 배포와 Harbor 공식 Velero 예제의 Kubernetes 배포는 저장 위치와 절차가 다르므로 같은 스크립트를 사용하지 않습니다.

백업 절차에는 실제 설치 디렉터리의 설정·인증서·비밀, database, registry blob storage와 backend 설정, jobservice 등 필요한 상태를 포함합니다. 이미지 데이터는 전체 복구에서 선택 항목이 아닙니다. 외부 database/object storage를 쓰면 해당 시스템의 일관성과 복구 지점을 함께 맞춥니다.

1. 백업 중 쓰기·garbage collection·replication·진행 중 작업을 어떻게 처리할지 정합니다. Read Only만으로 모든 application-consistent 상태가 보장되지는 않습니다.
2. 실제 볼륨·database 위치와 도구 버전을 기록하고, 각 단계 실패 시 즉시 중단합니다. 빈 dump나 부분 archive를 성공으로 표시하지 않습니다.
3. 백업 hash·완료 시각·보관·암호화·접근 권한을 기록합니다.
4. 격리 환경에 복원한 뒤 프로젝트·권한·서명·digest와 실제 pull을 검증하고 RPO/RTO를 측정합니다.

공식 Velero 안내도 crash consistency, Redis 미보존과 복구 후 task 상태 같은 한계를 설명합니다. 이 가이드에서는 백업이나 복원을 실행하지 않았으며, 환경별 스크립트는 복구 시험 전까지 검증 대기 상태입니다.

### Step 16: 모니터링

#### Prometheus 메트릭 수집

다음은 실행 중인 Prometheus 설정에 병합할 `scrape_configs` 조각입니다. ConfigMap을 생성하기만 해서는 Prometheus에 연결되지 않습니다. 배포 방식에 맞게 mount/reload 또는 Operator 리소스를 설정하고 target 상태를 확인합니다. 예제의 9090 HTTP endpoint는 사설 모니터링 경로로 제한하며 외부에 공개하지 않습니다.

```yaml
scrape_configs:
  - job_name: harbor-exporter
    metrics_path: /metrics
    static_configs:
      - targets: ["harbor.yourdomain.com:9090"]
  - job_name: harbor-core
    metrics_path: /metrics
    params:
      comp: [core]
    static_configs:
      - targets: ["harbor.yourdomain.com:9090"]
  - job_name: harbor-registry
    metrics_path: /metrics
    params:
      comp: [registry]
    static_configs:
      - targets: ["harbor.yourdomain.com:9090"]
```

기본 `/metrics`의 exporter 자료와 `comp=core`, `comp=registry` 자료는 다릅니다. 필요한 경우 `comp=jobservice`도 별도 수집합니다. 활성화된 버전의 응답과 metric type·label을 확인한 뒤 alert를 만듭니다.

#### 주요 모니터링 지표

| 확인하려는 동작 | 자료 |
| --- | --- |
| 구성 요소 상태 | `harbor_up`, `harbor_health`와 target scrape 상태 |
| 프로젝트 공간 | `harbor_project_quota_usage_byte`, 실제 storage 여유 |
| Core 요청 | `harbor_core_http_request_total`, 요청 duration summary |
| Registry 요청·지연 | `registry_http_requests_total`, duration histogram |
| 인증 실패·DB 연결 | 해당 버전의 audit/log 및 database 관측; 존재가 확인되지 않은 metric 이름을 가정하지 않음 |

Counter·gauge·summary·histogram은 집계 방법이 다릅니다. 인증 실패와 서비스 가용성, 애플리케이션 pull 성공을 한 숫자로 대체하지 않습니다.

## 결론

통합 완료의 기준은 문서의 명령을 모두 입력했는지가 아니라, 의도한 Hybrid Node가 올바른 인증과 TLS 검증으로 지정한 이미지를 가져오고 잘못된 접근을 거부하는지입니다. 노드별 DNS·CA·runtime 설정과 프로젝트별 자격 증명, 백업 복구 결과를 함께 기록해야 합니다. 이 문서의 예제는 그 검증을 준비하기 위한 것이며 운영 성공을 입증하는 실행 기록은 아닙니다.

## 참고 자료

### 공식 문서

- [Harbor 2.15 prerequisites](https://goharbor.io/docs/2.15.0/install-config/installation-prereqs/)
- [Containerd 2.1 registry host configuration](https://github.com/containerd/containerd/blob/v2.1.4/docs/hosts.md)
- [Harbor LDAP authentication](https://goharbor.io/docs/2.15.0/administration/configure-authentication/ldap-auth/)
- [Harbor backup limitations](https://goharbor.io/docs/2.15.0/administration/backup-restore/)
- [Harbor component metrics](https://goharbor.io/docs/2.15.0/administration/metrics/)
- [Harbor Documentation](https://goharbor.io/docs/) — Harbor 프라이빗 레지스트리 공식 문서
- [Harbor GitHub Repository](https://github.com/goharbor/harbor) — Harbor 오픈소스 프로젝트 저장소
- [Amazon EKS Hybrid Nodes](https://docs.aws.amazon.com/eks/latest/userguide/hybrid-nodes-overview.html) — EKS Hybrid Nodes 공식 사용자 가이드
- [Trivy Vulnerability Scanner](https://github.com/aquasecurity/trivy) — Harbor 통합 취약점 스캐너

### 관련 문서 (내부)
- [EKS Hybrid Nodes 개념과 동작 원리](../overview-architecture/hybrid-nodes-fundamentals.md) — Hybrid Nodes 아키텍처 및 nodeadm 구성 요소
- [노드 인증 방식](../security-authn/node-authentication.md) — SSM 및 IAM Roles Anywhere 자격 증명 공급자 선택 기준
- [방화벽과 네트워크 연결성](../networking/firewall-connectivity.md) — FQDN 제한 환경에서 프라이빗 레지스트리 사전 등록 전략
- [파일 스토리지](./file-storage.md) — EKS Hybrid Nodes 스토리지 옵션
