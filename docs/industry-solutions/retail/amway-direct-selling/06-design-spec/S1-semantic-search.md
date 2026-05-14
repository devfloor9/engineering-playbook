---
title: "S1. 자연어 시맨틱 검색 (AMWAY)"
sidebar_label: "S1. Semantic Search"
description: "Nutrilite·Artistry·Home SKU + ABO + 외부 소셜 후기 통합 검색"
---

# S1. 자연어 시맨틱 검색 (AMWAY)

## 1. URL · 페르소나
- `/semantic-search` · P1 (ABO Field), P2 (Insights), P5 (Compliance)

## 2. 사용자 스토리
- P1: "비건 프로틴 + 30대 신규 ABO + 정기구독 미가입" → 즉시 추천 ABO 리스트
- P5: "Nutrilite 광고 표현 검수 + 미성년 위험 SKU" → 규제 가드 리스트

## 3. 입력 UI
- 자연어 입력창 (다국어 지원)
- 필터: 카테고리 (Nutrition/Beauty/Home), 브랜드, ABO 등급, 국가, 가격
- 페르소나 스위처

## 4. 데이터 믹스
| 데이터 | 출처 | 활용 |
|---|---|---|
| 자사 SKU | OpenSearch `idx_product` | BM25+KNN |
| ABO 프로필 | OpenSearch `idx_abo` | KNN |
| 자사 리뷰 | OpenSearch `idx_review` | BM25+KNN |
| 외부 소셜 후기 | OpenSearch `idx_social_trend` (Reddit·인스타·X) | KNN (다국어) |
| 규제 텍스트 | OpenSearch `idx_regulation` | BM25 (P5만) |
| KG 1-hop | Neptune (ABO × Product × Brand × BU) | 그래프 확장 |

## 5. 처리 파이프라인
1. 입력 → Cohere embed-multilingual-v3
2. OpenSearch 병렬: BM25 + KNN → top 100/100
3. RRF 융합 → top 50
4. Cohere rerank-multilingual-v3 → top 20
5. Neptune 1-hop 확장 (ABO/SKU 노드)
6. 결과 카드 + 그래프

## 6. 출력 UI
- 3컬럼: SKU 카드 / ABO·Customer 카드 / 외부 후기 카드
- 1-hop KG (cytoscape.js)
- Cohort 배지: 🟢 real / 🟡 synth / 🔵 external
- 결과 카운트 + 응답 시간

## 7. 부서별 변형
| 페르소나 | 추천 질의 |
|---|---|
| P1 | "Diamond 후보 ABO 추천" |
| P2 | "신규 비건 트렌드 + 자사 SKU 매칭" |
| P3 | "리뷰 임베딩 drift" |
| P4 | "정기구독 해지 위험 + 비슷 ABO" |
| P5 | "광고 표현 위험 SKU" |

## 8. 가드레일
- PII 마스킹 (ABO·Customer 이름·연락처)
- 미성년 추정 회원 → 영양제·뷰티 마케팅 차단
- 외부 후기 출처 표기

## 9. 데모 시나리오
1. "비건 프로틴 + 30대 + 인스타 +20%" → Nutrilite Plant Protein + 후기
2. "Diamond 등급 후보 ABO" → ABO + 트리 (S9-A 연계)
3. "Artistry 광고 표현 검수" → SKU + 규제 위험 표시
