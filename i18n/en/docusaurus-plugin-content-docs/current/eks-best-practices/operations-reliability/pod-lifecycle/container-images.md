---
title: Container images and startup time
description: Review image builds, pre-pulling, and startup time comparisons.
created: "2026-02-12"
last_update:
  date: 2026-09-18
  author: devfloor9
reading_time: 5
tags:
  - eks
  - kubernetes
  - probes
  - lifecycle
  - scope:ops
sidebar_label: Container images and startup time
category: operations
---

[Pod lifecycle overview](../eks-pod-health-lifecycle.md) · [Deployment checklist and references](./checklist-references.md)

## Container Image Optimization and Startup Time {#6-컨테이너-이미지-최적화와-시작-시간}

Container image size and structure directly affect Pod startup time.

### Multi-Stage Builds {#61-멀티스테이지-빌드}

Use multi-stage builds to minimize the final image size.

#### Go Application {#go-애플리케이션}

```dockerfile
# Build stage
FROM golang:1.22-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags="-s -w" -o main .

# Runtime stage (scratch: 5MB or less)
FROM scratch

COPY --from=builder /app/main /main
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/

USER 65534:65534
ENTRYPOINT ["/main"]
```

**Results:**
- Build image: 300MB+
- Final image: 5-10MB
- Startup time: Less than 1 second

#### Node.js Application {#nodejs-애플리케이션}

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

# Runtime stage
FROM node:20-alpine

# Security: non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app

# Copy only production dependencies
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 8080
CMD ["node", "server.js"]
```

**Optimization tips:**
- Use `npm ci` (faster and more reliable than npm install)
- Exclude devDependencies with `--only=production`
- Use layer caching (COPY package*.json first)

#### Java/Spring Boot Application {#javaspring-boot-애플리케이션}

```dockerfile
# Build stage
FROM maven:3.9-eclipse-temurin-21 AS builder

WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline

COPY src ./src
RUN mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine

RUN addgroup -S spring && adduser -S spring -G spring
USER spring:spring

WORKDIR /app
COPY --from=builder /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-Xms512m", "-Xmx1g", "-jar", "app.jar"]
```

### Image Pre-Pulling Strategies {#62-이미지-프리풀-전략}

Use image pre-pulling in EKS to reduce Pod startup time.

#### Image Pre-Pulling with Karpenter {#karpenter-이미지-프리풀}

```yaml
apiVersion: karpenter.k8s.aws/v1beta1
kind: EC2NodeClass
metadata:
  name: default
spec:
  amiFamily: AL2
  userData: |
    #!/bin/bash
    # Pre-pull frequently used images
    docker pull myapp/backend:v2.1.0
    docker pull myapp/frontend:v1.5.3
    docker pull redis:7-alpine
    docker pull postgres:16-alpine
```

#### Image Pre-Pulling with a DaemonSet {#daemonset으로-이미지-프리풀}

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
      # Add an init container for each image to pre-pull
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

### distroless and scratch Images {#63-distroless와-scratch-이미지}

Google's distroless images contain only the minimum files required to run an application.

#### distroless Example {#distroless-예시}

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

**Advantages of distroless:**
- Minimal attack surface (no shell or package manager)
- Small image size
- Fewer CVE vulnerabilities

**scratch vs distroless:**

| Image | Size | Contents | Suitable for |
|--------|------|-----------|------------|
| **scratch** | 0MB | Empty filesystem | Fully static binaries (Go, Rust) |
| **distroless/static** | ~2MB | CA certificates, tzdata | Static binaries that require TLS/time zone support |
| **distroless/base** | ~20MB | glibc, libssl | Dynamically linked binaries |

### Startup Time Benchmarks {#64-시작-시간-벤치마크}

Startup time comparison across image strategies (EKS 1.30, m6i.xlarge):

| Application | Base Image | Image Size | Pull Time | Startup Time | Total Time |
|-------------|--------------|-----------|----------|----------|---------|
| Go API | ubuntu:22.04 | 150MB | 8s | 0.5s | **8.5s** |
| Go API | alpine:3.19 | 15MB | 2s | 0.5s | **2.5s** |
| Go API | distroless/static | 5MB | 1s | 0.5s | **1.5s** |
| Go API | scratch | 3MB | 0.8s | 0.5s | **1.3s** |
| Node.js API | node:20 | 350MB | 15s | 2s | **17s** |
| Node.js API | node:20-alpine | 120MB | 6s | 2s | **8s** |
| Spring Boot | eclipse-temurin:21 | 450MB | 20s | 15s | **35s** |
| Spring Boot | eclipse-temurin:21-jre-alpine | 180MB | 10s | 15s | **25s** |
| Python Flask | python:3.12 | 400MB | 18s | 3s | **21s** |
| Python Flask | python:3.12-slim | 130MB | 7s | 3s | **10s** |
| Python Flask | python:3.12-alpine | 50MB | 3s | 3s | **6s** |

**Optimization recommendations:**
1. Use **multi-stage builds** → 50-90% size reduction
2. Choose **alpine or distroless** → 50-80% reduction in pull time
3. Enable **image caching** → Pull time close to 0 on redeployment
4. Configure a **startup probe** → Protect applications with slow startup

---
