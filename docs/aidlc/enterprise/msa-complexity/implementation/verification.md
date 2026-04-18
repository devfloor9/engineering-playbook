---
title: "검증 방법론"
sidebar_label: "검증 방법론"
sidebar_position: 3
description: "복잡 MSA에서 AIDLC 적용 시 품질을 보장하는 검증 방법"
tags: [verification, testing, quality, aidlc, enterprise, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 검증 방법론

복잡 MSA에서 AIDLC 적용 시 품질을 보장하는 방법입니다.

## 검증 체크리스트

### 온톨로지 검증

- [ ] **완전성:** 모든 엔티티/이벤트가 온톨로지에 정의되어 있는가?
- [ ] **일관성:** Bounded Context 간 온톨로지가 일관된가?
- [ ] **정확성:** 불변조건이 비즈니스 규칙과 일치하는가?
- [ ] **추적성:** 온톨로지와 코드가 동기화되어 있는가?

### 하네스 검증

- [ ] **커버리지:** 모든 필수 하네스가 구현되어 있는가?
- [ ] **자동화:** 하네스가 CI/CD에 통합되어 있는가?
- [ ] **실패 시나리오:** 모든 실패 시나리오를 테스트하는가?
- [ ] **성능:** 하네스 실행 시간이 합리적인가?

### 배포 검증

- [ ] **Canary 배포:** 점진적 롤아웃 전략이 있는가?
- [ ] **롤백 계획:** 문제 발생 시 롤백 가능한가?
- [ ] **모니터링:** 배포 후 실시간 모니터링 가능한가?
- [ ] **경보:** 이상 징후 탐지 경보가 설정되어 있는가?

## 검증 자동화

### CI/CD 파이프라인

```yaml
# .github/workflows/aidlc-validation.yml
name: AIDLC Validation

on: [push, pull_request]

jobs:
  validate-ontology:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Ontology
        run: |
          aidlc-cli validate-ontology --path ontology/
  
  run-harness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Harness Tests
        run: |
          aidlc-cli run-harness --suite saga
          aidlc-cli run-harness --suite idempotency
  
  quality-gate:
    runs-on: ubuntu-latest
    needs: [validate-ontology, run-harness]
    steps:
      - name: Check Quality Gate
        run: |
          aidlc-cli quality-gate --threshold 80
```

## 전문가 리뷰

**복잡도 L4-5는 전문가 리뷰 필수**

### 리뷰 체크리스트

- [ ] Saga 설계가 적절한가?
- [ ] 보상 로직이 모든 실패 시나리오를 커버하는가?
- [ ] 이벤트 스키마 버전 관리 전략이 있는가?
- [ ] 프로젝션 로직이 정확한가?
- [ ] 성능/확장성 고려사항이 반영되어 있는가?

### 리뷰 프로세스

1. **설계 리뷰:** Saga/이벤트 소싱 설계 검토
2. **온톨로지 리뷰:** 온톨로지 완전성/정확성 확인
3. **하네스 리뷰:** 테스트 커버리지 및 실패 시나리오 검증
4. **성능 리뷰:** 병목 구간 및 확장성 검토
5. **보안 리뷰:** 데이터 일관성 및 보안 취약점 분석

## 품질 게이트

### 통과 기준

| 항목 | 최소 요구사항 | 권장 목표 |
|------|-------------|----------|
| **온톨로지 커버리지** | 90% | 100% |
| **하네스 실행 성공률** | 95% | 100% |
| **필수 하네스 구현** | 100% | - |
| **코드 리뷰 승인** | 필수 | - |
| **전문가 리뷰 (L4-5)** | 필수 | - |

### 실패 시 조치

1. **온톨로지 불완전:** 누락 항목 추가 후 재검증
2. **하네스 실패:** 버그 수정 후 재실행
3. **성능 문제:** 병목 해소 후 재측정
4. **전문가 리뷰 불통과:** 설계 개선 후 재리뷰

## 지속적 개선

### 메트릭 추적

- 온톨로지 변경 빈도
- 하네스 실행 시간 추이
- 프로덕션 이슈 발생률
- 롤백 빈도

### 피드백 루프

1. 프로덕션 이슈 발생 시 하네스 추가
2. 자주 실패하는 패턴 온톨로지 개선
3. 느린 하네스 최적화
4. 베스트 프랙티스 문서화

## 다음 단계

- [온톨로지 가이드](./ontology-guide.md): 온톨로지 작성 방법
- [하네스 체크리스트](./harness-checklist.md): 패턴별 필수 하네스
- [MSA 복잡도 개요](../index.md): 전체 가이드로 돌아가기
