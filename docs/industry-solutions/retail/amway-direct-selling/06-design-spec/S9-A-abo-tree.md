---
title: S9-A. ABO 조직 시각화 + 성과 트래킹 (AMWAY 특화)
description: AMWAY 다단계 ABO Tree 5단 깊이 시각화 + PV/BV·등급 성과 + Sponsor 분석
created: "2026-05-14"
last_update:
  date: "2026-06-27"
  author: YoungJoon Jeong
reading_time: 2
tags:
  - industry-solution
  - retail
  - amway
  - design-spec
  - agent
  - scope:design
sidebar_label: S9-A. ABO Tree
---

> **AMWAY 차별 포인트** ⭐ — 다단계 직접판매의 핵심 자산인 ABO 조직 트리를 단일 화면에서 깊이 5단까지 탐색·성과 분석.

## 1. URL · 페르소나
- `/abo-tree` · P1 (ABO Field), P4 (CX)

## 2. 사용자 스토리
> P1 (ABO Field) — Diamond 등급 ABO 1명을 클릭하면 그 아래 5단 Downline 트리가 자동 펼쳐지고, 각 ABO의 PV/BV·등급·Sponsor 성과를 한 화면에서.

> P4 (CX) — Sponsor 트리 안에서 활성도 떨어진 ABO를 자동 색상 표시 → CRM 캠페인 트리거.

## 3. 입력 UI
- 루트 ABO 검색 (마스킹 ID 또는 자연어 "Diamond 등급 + 미국")
- 깊이 슬라이더 (1~5단)
- 등급 필터 (Founders Platinum / Diamond / Founders Diamond / EDC / EC)
- 표시 토글: PV(Personal Volume) / BV(Business Volume) / 활성도

## 4. 데이터 믹스
| 데이터 | 출처 |
|---|---|
| ABO 노드 | Neptune (~50K) |
| DownlineLink 엣지 | Neptune (~250K) |
| ABO 등급·PV/BV | ABO 노드 속성 |
| 90일 활성도 | OrderTransaction + ABODirectSale 빈도 |
| Sponsor 성과 | upline_chain × Downline GMV |

## 5. 처리 파이프라인
```
1. 루트 ABO 검색 → Neptune
2. openCypher MATCH (root)-[:HAS_DOWNLINE*1..5]->(d)
3. 각 노드에 PV/BV/활성도 enrichment
4. 노드 색상: 등급 매핑 (Diamond=노랑/Platinum=실버/EDC=연파랑)
5. 노드 크기: PV에 비례
6. 활성도 < 30일 → 빨강 외곽선
7. cytoscape.js 트리 레이아웃
```

## 6. 출력 UI
- 좌: 트리 시각화 (cytoscape.js dagre/concentric layout)
- 우: 선택 ABO 상세 카드 (PV/BV/등급/Downline 인원/Sponsor 점수)
- 하단: Sponsor 성과 매트릭스 (등급 × Downline 생산성)

## 7. 가드레일
- ABO 마스킹 ID만 노출 (실명·연락처 비공개)
- Downline 5단 초과 시 권한 검증 (P5 Compliance만)
- 미성년 ABO 0건 (S11-A 가드)

## 8. 데모 시나리오
1. **루트 = Diamond ABO 1명** → 5단 트리 자동 펼침 (~120 노드)
2. **활성도 < 30일 ABO 자동 강조** (빨강 외곽) → CRM 캠페인 후보
3. **Sponsor 성과 매트릭스** → 어떤 등급의 Sponsor가 가장 활성 Downline 보유하는지