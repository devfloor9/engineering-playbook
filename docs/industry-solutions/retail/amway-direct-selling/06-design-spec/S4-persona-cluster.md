---
title: S4. 페르소나 매칭 + 클러스터링 (AMWAY)
description: 라이프스타일 페르소나 5종 + RFM × 카테고리 친화도 KMeans + 소셜 페르소나 보강
created: "2026-05-14"
last_update:
  date: "2026-06-30"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S4. Persona & Cluster
---

## 1. URL · 페르소나
- `/personas` · P2 (Consumer Insights)

## 2. 라이프스타일 페르소나 5종

| 페르소나 | 핵심 시그널 |
|---|---|
| 헬스 인플루언서 | Nutrilite 정기구독·인스타 게시·Diamond ABO 비중 |
| 키즈맘 | Home·키즈 비타민·평일 낮 활동 |
| 1인가구 | 소량·간편·심야 |
| 시니어 | 영양제·전화 주문 |
| 트렌드세터 | Artistry 신상·SNS 캠페인 응답 |

## 3. 데이터 믹스
- RFM 피처 (Customer + ABO 통합)
- 카테고리 친화도 (Nutrition/Beauty/Home)
- 채널 비중 (자사몰/ABO 직판/카탈로그)
- **소셜 페르소나** (인스타·Reddit·X 키워드)

## 4. 처리 파이프라인 (KMeans)
1. 피처 추출 + 표준화
2. KMeans 6 (또는 elbow)
3. 클러스터별 평균 + 소셜 보강 → Sonnet 라벨
4. 라벨: "헬스 인플루언서", "비건 1인가구", "주말 가족 쇼핑객" 등

## 5. 출력 UI
- 페르소나 카드 5종 (분포 막대)
- 클러스터 카드 6종 (라벨, 회원 수, 대표 SKU 5)
- PCA 산점도

## 6. 가드레일
- 페르소나 라벨 회원 본인 비노출
- 임신·질병 추정 금지
- 표본 < 30명 별도 표시

## 7. 데모 시나리오
1. 단건 매칭 → "1순위 헬스 인플루언서 0.62"
2. 5만명 일괄 → 6 클러스터 자동 라벨
3. "이 클러스터에 캠페인" → S5 연계