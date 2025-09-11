# 메타데이터 스키마 정의

EKS Engineering Playbook의 모든 문서는 일관된 메타데이터 구조를 따라야 합니다.

## Frontmatter 스키마

```yaml
---
title: "문서 제목"                    # 필수: 문서의 제목
description: "문서 설명"              # 필수: 1-2문장의 간단한 설명
tags: [tag1, tag2, tag3]            # 필수: 검색 및 분류용 태그 배열
category: "domain-name"             # 필수: 기술 도메인 (아래 5개 중 하나)
date: YYYY-MM-DD                    # 필수: 작성/수정 날짜 (ISO 8601 형식)
authors: [author-name]              # 필수: 작성자 배열
sidebar_position: 1                 # 선택: 사이드바 정렬 순서
---
```

## 필수 필드 상세 설명

### title (필수)
- **타입**: String
- **설명**: 문서의 제목
- **규칙**: 
  - 명확하고 구체적으로 작성
  - 50자 이내 권장
  - EKS 관련 키워드 포함 권장

**예시**:
```yaml
title: "EKS CoreDNS 성능 최적화 완벽 가이드"
```

### description (필수)
- **타입**: String
- **설명**: 문서에 대한 간단한 요약
- **규칙**:
  - 1-2문장으로 구성
  - 100자 이내 권장
  - 문서의 핵심 내용과 목적을 명확히 표현

**예시**:
```yaml
description: "EKS 클러스터에서 CoreDNS 성능을 최적화하고 DNS 쿼리 응답 시간을 개선하는 방법을 다룹니다."
```

### tags (필수)
- **타입**: Array of Strings
- **설명**: 검색 및 분류를 위한 태그
- **규칙**:
  - 3-7개 태그 권장
  - 소문자 사용
  - 하이픈(-) 사용 가능
  - 공백 대신 하이픈 사용

**공통 태그**:
- `eks` - 모든 EKS 관련 문서
- `kubernetes` - 쿠버네티스 일반
- `performance` - 성능 관련
- `monitoring` - 모니터링 관련
- `security` - 보안 관련
- `networking` - 네트워킹 관련
- `ai-ml` - AI/ML 관련
- `hybrid` - 하이브리드 클라우드
- `compliance` - 컴플라이언스

**예시**:
```yaml
tags: [eks, coredns, dns, performance, monitoring, troubleshooting]
```

### category (필수)
- **타입**: String (Enum)
- **설명**: 5개 기술 도메인 중 하나
- **허용값**:
  - `performance-networking` - Performance & Networking
  - `observability-monitoring` - Observability & Monitoring  
  - `genai-aiml` - GenAI & AI/ML
  - `hybrid-multicloud` - Hybrid & Multi-Cloud
  - `security-compliance` - Security & Compliance

**예시**:
```yaml
category: "performance-networking"
```

### date (필수)
- **타입**: Date (ISO 8601 형식)
- **설명**: 문서 작성 또는 마지막 수정 날짜
- **형식**: `YYYY-MM-DD`

**예시**:
```yaml
date: 2025-01-15
```

### authors (필수)
- **타입**: Array of Strings
- **설명**: 문서 작성자 목록
- **규칙**:
  - GitHub 사용자명 또는 실명 사용
  - 여러 작성자 가능

**예시**:
```yaml
authors: [devfloor9, john-doe]
```

## 선택 필드

### sidebar_position (선택)
- **타입**: Number
- **설명**: 사이드바에서의 정렬 순서
- **기본값**: 자동 정렬
- **규칙**: 1부터 시작하는 정수

**예시**:
```yaml
sidebar_position: 1
```

## 검증 규칙

문서 작성 시 다음 규칙을 준수해야 합니다:

1. **필수 필드 누락 금지**: 모든 필수 필드가 포함되어야 함
2. **카테고리 유효성**: category는 정의된 5개 값 중 하나여야 함
3. **날짜 형식**: date는 YYYY-MM-DD 형식이어야 함
4. **태그 일관성**: 공통 태그를 우선 사용하고, 새로운 태그는 신중히 추가
5. **작성자 정보**: 실제 기여자만 authors에 포함

## 예시 완성본

```yaml
---
title: "EKS에서 Cilium ENI 모드로 네트워크 성능 극대화하기"
description: "Amazon EKS에서 Cilium ENI 모드를 구성하여 네트워크 성능을 최적화하는 완벽한 가이드입니다."
tags: [eks, cilium, eni, networking, performance, cni]
category: "performance-networking"
date: 2025-01-15
authors: [devfloor9]
sidebar_position: 2
---
```

## 자동 검증

CI/CD 파이프라인에서 다음 항목들이 자동으로 검증됩니다:

- [ ] 필수 필드 존재 여부
- [ ] category 값 유효성
- [ ] date 형식 정확성
- [ ] YAML 문법 오류
- [ ] 태그 중복 및 일관성

검증 실패 시 빌드가 중단되므로, 문서 작성 전에 이 스키마를 참고하여 올바른 메타데이터를 작성해주세요.

### 로컬 검증

문서 작성 후 다음 명령어로 메타데이터를 검증할 수 있습니다:

```bash
# 모든 문서 검증
npm run validate-metadata

# 특정 디렉토리만 검증  
node scripts/validate-metadata.js docs blog
```