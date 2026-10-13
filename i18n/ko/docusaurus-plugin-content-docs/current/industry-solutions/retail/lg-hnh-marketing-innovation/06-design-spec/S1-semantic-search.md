---
title: S1. 자연어 시맨틱 검색
description: 자사 SKU·회원·리뷰 + 외부 소셜 리뷰(올영·X) 통합 시맨틱 검색
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 3
tags:
  - industry-solution
  - retail
  - lg-hnh
  - design-spec
  - agent
  - scope:design
sidebar_label: S1. Semantic Search
---

## 1. URL 경로
- `/semantic-search`
- 페르소나 스위처 헤더 자동 적용

## 2. 사용자 스토리
> P1 (브랜드 마케터) — "30대 여성 민감성 두피, 오가닉 선호, 최근 90일 미구매 + 올영 별점 4.5↑" 입력 시 즉시 회원 + SKU + 자사·외부 리뷰가 한 화면에.

> P5 (MD) — "겨울 핸드크림 5천원대 인기 SKU + 인스타 언급 폭증" 입력 시 SKU·회전·소셜 SOV 동시.

## 3. 입력 UI
- 메인 검색창 (자연어, 한국어)
- 필터: BU(Beauty/HDB/Refreshment) · 브랜드 · 가격 · 기간 · 세그먼트
- 페르소나 스위처

## 4. 데이터 믹스
| 데이터 | 출처 | 활용 |
|---|---|---|
| 자사 SKU | OpenSearch `idx_product` | BM25+KNN |
| 회원 프로필 | OpenSearch `idx_customer` | KNN |
| 자사 리뷰 | OpenSearch `idx_review` (자사몰) | BM25+KNN |
| **외부 리뷰 (올리브영·네이버·X)** | OpenSearch `idx_review`/`idx_social_trend` | KNN |
| KG 1-hop | Neptune (Customer × Product × Brand × BU) | 그래프 확장 |

## 5. 처리 파이프라인
```
1. 입력 → Cohere embed-v4 (1024d)
2. OpenSearch 병렬
   - BM25 (Nori) → top 100 (자사 + 외부 리뷰)
   - KNN (cosine) → top 100
3. RRF 융합 → top 50
4. Cohere rerank-v3.5 → top 20
5. Neptune 1-hop 확장 (선택 SKU/Customer)
6. 결과 카드 + 그래프
```

## 6. 출력 UI
- 결과 카드 (3 컬럼): SKU 카드 / 회원 카드 / **리뷰 카드 (자사·외부 분리)**
- 1-hop 그래프 패널 (cytoscape.js)
- Cohort 배지: 🟢 real / 🟡 synth / 🔵 external
- 결과 카운트: "37건 (BM25 12, KNN 18, 공통 7)"

## 7. 부서별 변형
| 페르소나 | 추천 질의 | 결과 정렬 |
|---|---|---|
| P1 브랜드 마케터 | "최근 90일 미구매 골드 회원" | 회원 카드 우선, 캠페인 추천 부착 |
| P2 인사이트 | "올영 부정 리뷰 폭증 SKU" | 리뷰 카드 우선, SOV 표시 |
| P3 D&A | "리뷰 임베딩 drift" | 리뷰 카드 + drift 점수 |
| P4 CRM·LG 멤버스 | "VIP 진입 후 활성도 낮은 회원" | 회원 + 등급 변동 |
| P5 MD·채널 영업 | "겨울 인기 핸드크림 + 인스타 언급↑" | SKU 우선, 회전·SOV |

## 8. 가드레일
- PII 마스킹 (이름·연락처·주소)
- 마케팅 동의 미수신 회원 카드: 별도 배지 + 외부 발송 차단
- 미성년 추정 회원에게 화장품 마케팅 차단
- 외부 리뷰 출처 표기 (올영·네이버·X 라벨)

## 9. 데모 시나리오
1. "30대 민감성 두피 오가닉 샴푸 2만원대 + 올영 별점 4.5↑" → SKU(엘라스틴) + 자사·올영 리뷰 통합
2. "1인가구 + Beauty 충성층 + 인스타 언급↑" → 회원 + 그들이 자주 사는 SKU + SNS 키워드
3. "지난주 우천에 매출 빠진 음료 SKU" → SKU + 채널 + 외부 신호 (S6 연계)