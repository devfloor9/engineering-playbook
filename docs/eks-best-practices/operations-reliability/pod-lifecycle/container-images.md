---
title: 컨테이너 이미지와 시작 시간
description: 이미지 빌드, 프리풀, 시작 시간 비교를 확인합니다.
created: "2026-02-12"
last_update:
  date: "2026-09-17"
  author: YoungJoon Jeong
reading_time: 5
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: 컨테이너 이미지와 시작 시간
category: operations
---

[Pod 라이프사이클 개요](../eks-pod-health-lifecycle.md) · [체크리스트와 참고 자료](./checklist-references.md)

## 컨테이너 이미지 최적화와 시작 시간 {#6-컨테이너-이미지-최적화와-시작-시간}

컨테이너 이미지 크기와 구조는 Pod 시작 시간에 직접적인 영향을 미칩니다.

### 멀티스테이지 빌드 {#61-멀티스테이지-빌드}

멀티스테이지 빌드를 사용하여 최종 이미지 크기를 최소화합니다.

#### Go 애플리케이션 {#go-애플리케이션}

```dockerfile
# 빌드 스테이지
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o main .

# 실행 스테이지 (scratch: 5MB 이하)
FROM scratch

COPY --from=builder /app/main /main
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

USER 65534:65534
ENTRYPOINT ["/main"]
```

**결과:**
- 빌드 이미지: 300MB+
- 최종 이미지: 5-10MB
- 시작 시간: 1초 미만

#### Node.js 애플리케이션 {#nodejs-애플리케이션}

```dockerfile
# 빌드 스테이지
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# 실행 스테이지
FROM node:20-alpine

# 보안: non-root 사용자
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# 프로덕션 의존성만 복사
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 8080
CMD ["node", "server.js"]
```

**최적화 팁:**
- `npm ci` 사용 (npm install보다 빠르고 안정적)
- `--only=production`으로 devDependencies 제외
- 레이어 캐싱 활용 (COPY package*.json 먼저)

#### Java/Spring Boot 애플리케이션 {#javaspring-boot-애플리케이션}

```dockerfile
# 빌드 스테이지
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

# 실행 스테이지
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-Xms512m", "-Xmx1g", "-jar", "app.jar"]
```

### 이미지 프리풀 전략 {#62-이미지-프리풀-전략}

EKS에서 이미지 프리풀(pre-pull)을 활용하여 Pod 시작 시간을 단축합니다.

#### Karpenter 이미지 프리풀 {#karpenter-이미지-프리풀}

```yaml
apiVersion: karpenter.k8s.aws/v1beta1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiFamily: AL2
  userData: |
    #!/bin/bash
    # 자주 사용하는 이미지 프리풀
    docker pull myapp/backend:v2.1.0
    docker pull myapp/frontend:v1.5.3
    docker pull redis:7-alpine
    docker pull postgres:16-alpine
```

#### DaemonSet으로 이미지 프리풀 {#daemonset으로-이미지-프리풀}

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: image-prepuller
  namespace: kube-system
spec:
  selector:
    matchLabels:
      app: image-prepuller
  template:
    metadata:
      labels:
        app: image-prepuller
    spec:
      initContainers:
      # 프리풀할 이미지마다 init container 추가
      - name: prepull-backend
        image: myapp/backend:v2.1.0
        command: ["sh", "-c", "echo 'Image pulled'"]
      - name: prepull-frontend
        image: myapp/frontend:v1.5.3
        command: ["sh", "-c", "echo 'Image pulled'"]
      containers:
      - name: pause
        image: registry.k8s.io/pause:3.9
        resources:
          requests:
            cpu: 1m
            memory: 1Mi
```

### distroless와 scratch 이미지 {#63-distroless와-scratch-이미지}

Google의 distroless 이미지는 애플리케이션 실행에 필요한 최소한의 파일만 포함합니다.

#### distroless 예시 {#distroless-예시}

```dockerfile
FROM golang:1.22-alpine AS builder
WORKDIR /app
COPY . .
RUN CGO_ENABLED=0 go build -o main .

# distroless base
FROM gcr.io/distroless/static-debian12

COPY --from=builder /app/main /main
USER 65534:65534
ENTRYPOINT ["/main"]
```

**distroless 장점:**
- 최소 공격 표면 (쉘, 패키지 매니저 없음)
- 작은 이미지 크기
- CVE 취약점 감소

**scratch vs distroless:**

| 이미지 | 크기 | 포함 사항 | 적합한 경우 |
|--------|------|-----------|------------|
| **scratch** | 0MB | 빈 파일시스템 | 완전 정적 바이너리 (Go, Rust) |
| **distroless/static** | ~2MB | CA certificates, tzdata | 정적 바이너리 + TLS/타임존 필요 |
| **distroless/base** | ~20MB | glibc, libssl | 동적 링크 바이너리 |

### 시작 시간 벤치마크 {#64-시작-시간-벤치마크}

다양한 이미지 전략의 시작 시간 비교 (EKS 1.30, m6i.xlarge):

| 애플리케이션 | 베이스 이미지 | 이미지 크기 | Pull 시간 | 시작 시간 | 총 시간 |
|-------------|--------------|-----------|----------|----------|---------|
| Go API | ubuntu:22.04 | 150MB | 8초 | 0.5초 | **8.5초** |
| Go API | alpine:3.19 | 15MB | 2초 | 0.5초 | **2.5초** |
| Go API | distroless/static | 5MB | 1초 | 0.5초 | **1.5초** |
| Go API | scratch | 3MB | 0.8초 | 0.5초 | **1.3초** |
| Node.js API | node:20 | 350MB | 15초 | 2초 | **17초** |
| Node.js API | node:20-alpine | 120MB | 6초 | 2초 | **8초** |
| Spring Boot | eclipse-temurin:21 | 450MB | 20초 | 15초 | **35초** |
| Spring Boot | eclipse-temurin:21-jre-alpine | 180MB | 10초 | 15초 | **25초** |
| Python Flask | python:3.12 | 400MB | 18초 | 3초 | **21초** |
| Python Flask | python:3.12-slim | 130MB | 7초 | 3초 | **10초** |
| Python Flask | python:3.12-alpine | 50MB | 3초 | 3초 | **6초** |

**최적화 권장사항:**
1. **멀티스테이지 빌드** 사용 → 50-90% 크기 감소
2. **alpine 또는 distroless** 선택 → Pull 시간 50-80% 단축
3. **이미지 캐싱** 활성화 → 재배포 시 Pull 시간 거의 0
4. **Startup Probe** 설정 → 느린 시작 앱 보호

---
