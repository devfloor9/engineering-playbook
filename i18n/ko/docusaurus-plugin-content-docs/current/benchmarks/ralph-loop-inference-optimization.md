---
title: "랄프 루프 3편: 통제된 EKS 추론 최적화"
description: EKS 기준선과 비교하는 cold/warm 정확한 prefix 실험 및 별도 의미 캐시 정확성 계획
created: "2026-10-30"
last_update:
  date: 2026-10-30
  author: YoungJoon Jeong
reading_time: 2
tags:
  - benchmark
  - coding-agent
  - eks
  - caching
  - scope:tech
sidebar_label: "랄프 3편. 최적화 [계획]"
category: benchmark
---

**시리즈:** [전체 안내](./ralph-loop-series.md) · [1편: Bedrock](./ralph-loop-coding-agent-bedrock.md) · [2편: EKS 기준선](./ralph-loop-coding-agent-eks.md) · **3편: 최적화**.

:::caution 계획 — 실측 개선 없음
기준선을 아직 측정하지 않았습니다. 속도 개선, 비용 절감, 캐시 hit 비율이나 정확성 결과를 주장하지 않습니다. 변형을 비교하기 전에 2편과 같은 모델·체크포인트·정밀도·GPU·클라이언트 규칙을 고정합니다.
:::

## 통제된 변형

[등록된 행렬](./ralph-loop-series.md#등록된-최적화-행렬)을 사용합니다. B0는 기준선, P0는 재사용 상태가 비어 있는 정확한 prefix 재사용, P1은 같은 구성과 고정 워밍업, S1은 별도 읽기 전용 의미 캐시 fixture입니다. B0/P0/P1은 각각 5회를 사전 등록합니다.

P0 시도 전마다 재사용 prefix 상태를 비우되 모델 가중치는 메모리에 유지합니다. P1 전에는 warm 상태를 확인하고 워밍업 사용량·시간·비용을 따로 기록합니다. 다른 설정은 고정하고 실패 시도와 부분 사용량을 보존합니다.

S1은 상태를 바꾸거나 도구가 있는 Ralph 응답을 재사용하지 않습니다. 따로 둔 fixture는 바꿔 쓴 질문, 비슷하지만 답이 다른 질문, 오래된 버전, namespace 격리, miss와 오류를 다룹니다. hit 비율과 함께 잘못된 hit, 임베딩·조회 비용도 기록합니다. S1 fixture는 Ralph 완주가 아닙니다.

## 필요한 근거

| 변형 | 원본 시도 | 비용 대조 | 상태 |
|---|---|---|---|
| B0 | 없음 | 대기 | 계획 |
| P0 | 없음 | 대기 | 계획 |
| P1 | 없음 | 대기 | 계획 |
| S1 | 별도 시험 결과 없음 | 대기 | 계획 |

시도별 정확성·결과, 완주 run 중앙값·범위, 실패 포함 비용과 전체 운영 비용을 게시합니다. 개선율은 이름이 있는 대응 기준선과 0이 아닌 분모가 필요합니다. 정의할 수 없는 값은 그대로 둡니다.

KV dtype 변경, offload, 캐시 인식 라우팅, 다중 복제본 부하와 조합 변형은 측정된 병목과 범위를 제한한 새 계획이 필요합니다. 승인된 예산, 자원 상한, 유휴 종료와 정리 예산을 유지합니다.

[시리즈의 근거 조건](./ralph-loop-series.md#비용과-게시-조건)으로 돌아갑니다. 실제 실행, 원본 근거와 정리 확인은 [이슈 #216](https://github.com/devfloor9/engineering-playbook/issues/216)에서 추적합니다.
