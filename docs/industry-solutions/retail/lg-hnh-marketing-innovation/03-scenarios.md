---
created: 2026-05-14
title: "8 시나리오 매핑"
sidebar_label: "03. Scenarios"
description: "마케팅 혁신 핵심 8 시나리오. 모든 시나리오에 데이터 믹스 명시 (자사 + 외부 4종)"
last_update:
  date: 2026-05-14
reading_time: 10
---
# 8 시나리오 매핑

> 데이터 사일로 + 외부 시그널 결합 PoC에서 마케팅 혁신에 직결되는 핵심 8 시나리오. **모든 시나리오에 자사 데이터 + 외부 4종(소셜·기상·경제·경쟁사) 데이터 믹스 명시**.

---

## 1. 8 시나리오 개요

| # | 시나리오 | 자사 데이터 | 외부 데이터 | URL | 주 페르소나 |
|---|---|---|---|---|---|
| **S1** | 자연어 시맨틱 검색 | SKU · 회원 · 자사 리뷰 | 올리브영 · X 리뷰 (소셜) | `/semantic-search` | P1, P5 |
| **S2** | 5 부서 페르소나 챗봇 | 모든 자사 데이터 | 모든 외부 4종 (도구 자율 호출) | `/chat` | All |
| **S3** | 카테고리·BU 인사이트 카드 | OrderTransaction · ChannelSellThrough | 검색 트렌드 + 기상 + 경쟁사 | `/insights` | P3 |
| **S4** | 라이프스타일 페르소나 매칭 + 클러스터링 | 회원 RFM · 카테고리 친화도 | 소셜 페르소나 (인스타·올영) | `/personas` | P2 |
| **S5** | 옴니채널 캠페인 ROAS 시뮬 | 과거 캠페인 · 채널 sell-through | 검색 트렌드 · SNS 반응 | `/campaign-roas` | P1, P5 |
| **S6** | 외부 시그널 융합 | 자사 GMV (BU·카테고리·매장) | 4종 모두 (트렌드·기상·경제·경쟁사) | `/signals` | P2, P3 |
| **S7** | 옴니채널 회원 여정 | 자사몰 · CartEvent · SNS 광고 응답 · 채널 거래 | (없음, 자사 데이터 통합 우선) | `/journey` | P4 |
| **S8** | 마케팅 동의·PII·미성년 가드레일 | 회원 동의 · Compliance | (없음, Bedrock Guardrails) | `/compliance` | P4 |

---

## 2. 14 패턴 → 8 시나리오 압축 매핑

> 온톨로지 + Agentic AI PoC 패턴에서 자주 등장하는 14개 시나리오 풀 중 LG H&H 마케팅 혁신에 직결되는 8개를 엄선·재정의했습니다.

| 원본 패턴 | LG H&H 매핑 | 비고 |
|---|---|---|
| 하이브리드 검색 | **S1** 자연어 시맨틱 검색 | 외부 리뷰 결합으로 강화 |
| 페르소나 챗봇 | **S2** 5 부서 페르소나 챗봇 | 그대로 |
| 인사이트 카드 | **S3** 카테고리·BU 인사이트 카드 | 외부 4종 결합으로 강화 |
| 페르소나 매칭 | **S4 (병합)** | 클러스터링과 병합 |
| 클러스터링 | **S4 (병합)** | 페르소나 매칭과 병합 |
| 룩어라이크 확장 | (제외) | PoC v2로 후속 확장 |
| 캠페인 ROI | **S5** 옴니채널 캠페인 ROAS 시뮬 | 그대로 |
| 권역 경쟁 지도 | (제외) | PoC v2로 후속 확장 |
| 약관·가드레일 | **S8** 마케팅 동의·PII·미성년 가드레일 | 미성년 화장품 가드 추가 |
| 외부 시그널 융합 | **S6** 외부 시그널 융합 | 4종으로 확장 |
| 이상 행동 탐지 | (제외) | PoC v2 |
| 결제·멤버십 매트릭스 | (제외) | PoC v2 |
| 고객 통합 여정 | **S7** 옴니채널 회원 여정 | BU 가로지르는 행동 강조 |
| 날씨 × 매출 | **S6 통합** | 외부 시그널의 일부로 |

---

## 3. 시나리오별 데이터 믹스 상세

### S1 — 자연어 시맨틱 검색
| 데이터 | 출처 | 활용 |
|---|---|---|
| 자사 SKU | OpenSearch `idx_product` | BM25 + KNN |
| 회원 프로필 | OpenSearch `idx_customer` | KNN |
| 자사 리뷰 | OpenSearch `idx_review` | BM25 + KNN |
| **올리브영 리뷰** | 외부 크롤링 → `idx_review` | KNN (소셜 SOV) |
| **X / 인스타 리뷰** | 외부 → `idx_social_trend` | KNN |
| KG 1-hop | Neptune | Customer × Product × Brand × BU |

### S2 — 5 부서 페르소나 챗봇
도구 10종 자율 호출 (S2 design-spec 참조). 모든 시나리오의 도구를 이 챗봇에서 통합 호출.

### S3 — 카테고리·BU 인사이트 카드
| 데이터 | 출처 | 활용 |
|---|---|---|
| GMV (BU × 카테고리 × 월) | Snowflake / Neptune | line/bar chart |
| **검색 트렌드** | 네이버·구글 트렌드 → `SocialSignal` | 듀얼 축 |
| **기상** | KMA → `WeatherSignal` | 듀얼 축 |
| **경쟁사 신제품** | 공개 등장 정보 → `CompetitorSignal` | annotation |

### S4 — 페르소나 매칭 + 클러스터링
| 데이터 | 출처 | 활용 |
|---|---|---|
| RFM 피처 | Neptune | KMeans 입력 |
| 카테고리 친화도 | Neptune (Customer × Category 빈도) | KMeans 입력 |
| **소셜 페르소나** | 인스타·올영 리뷰 키워드 → `SocialSignal` | LLM 라벨링 보강 |

### S5 — 옴니채널 캠페인 ROAS
| 데이터 | 출처 | 활용 |
|---|---|---|
| 과거 캠페인 | Snowflake CAMPAIGN_MART | Bayesian prior |
| 채널 sell-through | ChannelSellThrough | 채널별 응답률 |
| **SNS 반응** | X·인스타 광고 클릭·반응 → `SocialSignal` | posterior 조정 |
| **검색 트렌드** | 네이버·구글 → `SocialSignal` | 캠페인 외 영향 분리 |

### S6 — 외부 시그널 융합
| 데이터 | 출처 | 활용 |
|---|---|---|
| 자사 GMV | Snowflake / Neptune | y축 |
| **소셜 트렌드** | `SocialSignal` | x축 / 시차 분석 |
| **기상** | `WeatherSignal` | x축 (기온·강수) |
| **경제** | `EconomicSignal` (환율·물가) | x축 |
| **경쟁사** | `CompetitorSignal` | annotation / 비교 |

### S7 — 옴니채널 회원 여정
| 데이터 | 출처 | 활용 |
|---|---|---|
| 자사몰 SearchEvent / CartEvent / OrderTransaction | Neptune | 타임라인 |
| Touchpoint (SMS/카톡/SNS광고) | Neptune | 타임라인 |
| ChannelSellThrough (마트/H&B/편의점) | Neptune | 타임라인 |
| Coupon / ReviewRating | Neptune | 타임라인 |

### S8 — 가드레일
| 데이터 | 출처 | 활용 |
|---|---|---|
| Bedrock Guardrails | AWS | 입력·출력 가드 |
| 회원 동의 | Compliance · Membership.opted_in_marketing | 발송 도구 차단 |
| 미성년 추정 | Customer.age_band | 화장품 캠페인 차단 |

---

## 4. 페르소나 × 시나리오 매트릭스

| 부서 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 |
|---|---|---|---|---|---|---|---|---|
| **P1 브랜드 마케터** | ⭐ | ⭐ |  |  | ⭐ |  |  |  |
| **P2 인사이트** |  | ⭐ |  | ⭐ |  | ⭐ |  |  |
| **P3 D&A·MarTech** |  | ⭐ | ⭐ |  |  | ⭐ |  |  |
| **P4 CRM·LG 멤버스** |  | ⭐ |  |  |  |  | ⭐ | ⭐ |
| **P5 MD·채널 영업** | ⭐ | ⭐ |  |  | ⭐ |  |  |  |

---

## 5. Top-5 시연 패스 (30분)

```
[S1] 자연어 시맨틱 검색 4분
   "30대 여성 민감성 두피 + 오가닉 샴푸 2만원대 + 올영 별점 4.5↑"
   → SKU(엘라스틴) + 회원 + 자사·올영 리뷰 동시 카드

[S2] 페르소나 챗봇 5분 (스위처 시연)
   "이번 달 페리오 매출 떨어진 채널 TOP5와 원인은?"
   → P5(MD)로 답변 → P1(브랜드 마케터)로 스위치 → 답변 톤 변화

[S3] 인사이트 카드 4분
   "Beauty BU 월별 GMV + 검색 트렌드 + 기상 결합 카드"
   → matplotlib PNG + LLM 코멘트 (페르소나 별)

[S5] 캠페인 ROAS 시뮬 4분
   "다음 주 숨37 신상 런칭 / VIP 5만명 / 1억"
   → Bayesian 채널 믹스 + ROAS 분포

[S7] 옴니채널 회원 여정 3분
   "회원 cust_001234 90일 여정"
   → 자사몰→SNS→올영→마트→재구매 단일 타임라인
```

---

## 6. PoC 일정 (8주)

| 주차 | 작업 | 시나리오 |
|---|---|---|
| 1-2 | 데이터 적재 (자사 N=500~5K + 합성 49.5K + 외부 4종) | 인프라 |
| 3-4 | S1 + S2 + S3 구현 | S1, S2, S3 |
| 5-6 | S5 + S7 + 페르소나 스위처 | S5, S7, P1~P5 |
| 7 | S4 + S6 + S8 | S4, S6, S8 |
| 8 | 시연 리허설 | All |