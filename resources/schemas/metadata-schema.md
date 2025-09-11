# 문서 메타데이터 스키마

이 문서는 EKS Engineering Playbook의 모든 문서에서 사용되는 frontmatter 메타데이터 스키마를 정의합니다.

## 공통 필드

모든 문서 타입에서 사용되는 공통 필드입니다.

### 필수 필드

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `title` | string | 문서 제목 | "EKS DNS 성능 최적화 가이드" |
| `description` | string | 문서 설명 (150자 이내) | "EKS 클러스터의 DNS 성능을 최적화하는 방법" |
| `tags` | array | 태그 목록 | ["eks", "dns", "performance"] |
| `date` | string | 작성/수정 날짜 (YYYY-MM-DD) | "2025-01-15" |
| `authors` | array | 작성자 목록 | ["devfloor9"] |

### 선택적 필드

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `image` | string | 대표 이미지 경로 | "/img/docs/eks-dns-architecture.png" |
| `keywords` | array | SEO 키워드 | ["EKS", "DNS", "CoreDNS", "성능"] |
| `last_update` | object | 마지막 업데이트 정보 | `{date: "2025-01-15", author: "devfloor9"}` |

## 문서별 특화 필드

### 기술 문서 (docs/)

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `category` | string | 기술 도메인 카테고리 | "performance-networking" |
| `difficulty` | string | 난이도 | "beginner", "intermediate", "advanced" |
| `estimated_time` | string | 예상 읽기 시간 | "15분" |
| `prerequisites` | array | 사전 요구사항 | ["Kubernetes 기본 지식", "kubectl 사용법"] |
| `related_docs` | array | 관련 문서 경로 | ["../observability/monitoring.md"] |
| `version` | string | 문서 버전 | "1.0", "2.1" |
| `reviewed_by` | string | 검토자 | "devfloor9" |
| `review_date` | string | 검토 날짜 | "2025-01-15" |

### 블로그 포스트 (blog/)

| 필드 | 타입 | 설명 | 예시 |
|------|------|------|------|
| `slug` | string | URL 슬러그 | "eks-dns-optimization" |
| `hide_table_of_contents` | boolean | 목차 숨김 여부 | false |
| `toc_min_heading_level` | number | 최소 목차 레벨 | 2 |
| `toc_max_heading_level` | number | 최대 목차 레벨 | 3 |

## 카테고리 정의

### 기술 도메인 카테고리

- `performance-networking`: 성능 및 네트워킹
- `observability-monitoring`: 관찰 가능성 및 모니터링  
- `genai-aiml`: GenAI 및 AI/ML
- `hybrid-multicloud`: 하이브리드 및 멀티클라우드
- `security-compliance`: 보안 및 컴플라이언스

### 난이도 레벨

- `beginner`: 초급 - Kubernetes 기본 지식 필요
- `intermediate`: 중급 - EKS 운영 경험 필요
- `advanced`: 고급 - 심화 아키텍처 지식 필요

### 태그 가이드라인

#### 필수 태그
- `eks`: 모든 EKS 관련 문서
- `kubernetes`: 모든 Kubernetes 관련 문서

#### 기술별 태그
- **네트워킹**: `networking`, `dns`, `cni`, `cilium`, `calico`
- **모니터링**: `monitoring`, `observability`, `prometheus`, `grafana`
- **AI/ML**: `ai`, `ml`, `gpu`, `genai`, `llm`
- **보안**: `security`, `rbac`, `iam`, `compliance`
- **스토리지**: `storage`, `ebs`, `efs`, `fsx`

#### 도구별 태그
- **AWS 서비스**: `cloudwatch`, `alb`, `nlb`, `route53`
- **CNCF 도구**: `helm`, `istio`, `envoy`, `fluentd`
- **모니터링 도구**: `datadog`, `newrelic`, `splunk`

## 검증 규칙

### 필수 검증
1. `title`은 비어있으면 안됨
2. `description`은 150자 이내
3. `tags`는 최소 2개 이상
4. `date`는 YYYY-MM-DD 형식
5. `category`는 정의된 카테고리 중 하나

### 권장사항
1. `tags`는 5개 이하 권장
2. `title`은 60자 이내 권장 (SEO)
3. `description`은 120-150자 권장
4. 이미지는 WebP 형식 권장

## 예시

### 기술 문서 예시

```yaml
---
title: "EKS DNS 성능 최적화 완벽 가이드"
description: "Amazon EKS 클러스터에서 CoreDNS 성능을 최적화하고 DNS 쿼리 지연시간을 줄이는 방법을 단계별로 설명합니다."
tags: [eks, dns, coredns, performance, networking]
category: "performance-networking"
date: "2025-01-15"
authors: [devfloor9]
difficulty: "intermediate"
estimated_time: "20분"
prerequisites: 
  - "Kubernetes 기본 개념"
  - "EKS 클러스터 운영 경험"
related_docs:
  - "../observability-monitoring/coredns-monitoring.md"
  - "../security-compliance/dns-security.md"
version: "1.0"
reviewed_by: "devfloor9"
review_date: "2025-01-15"
---
```

### 블로그 포스트 예시

```yaml
---
slug: "eks-dns-performance-optimization"
title: "EKS DNS 성능 10배 향상시키기"
authors: [devfloor9]
tags: [eks, dns, performance, coredns]
description: "실제 프로덕션 환경에서 EKS DNS 성능을 10배 향상시킨 경험을 공유합니다."
image: "/img/blog/eks-dns-performance.png"
date: "2025-01-15"
---
```