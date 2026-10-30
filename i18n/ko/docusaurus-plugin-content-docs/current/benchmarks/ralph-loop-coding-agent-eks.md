---
title: "랄프 루프 2편: EKS 자체 호스팅 기준선"
description: 캐시 설정, 재현 정보와 전체 비용 조건을 밝힌 공통 모델 EKS 기준선 계획
created: "2026-10-30"
last_update:
  date: 2026-10-30
  author: YoungJoon Jeong
reading_time: 2
tags:
  - benchmark
  - coding-agent
  - eks
  - scope:tech
sidebar_label: "랄프 2편. EKS 기준선 [계획]"
category: benchmark
---

**시리즈:** [전체 안내](./ralph-loop-series.md) · [1편: Bedrock](./ralph-loop-coding-agent-bedrock.md) · **2편: EKS 기준선** · [3편: 최적화](./ralph-loop-inference-optimization.md).

:::caution 계획 — 실측 결과 없음
공통 모델 체크포인트, 실행 환경, GPU 구성, 리전·용량과 총예산을 고정하지 않았습니다. 이 문서가 배포나 성능 실측을 증명하지 않습니다. Kimi K3는 후보이며, 앞선 Qwen 중형 파일럿은 별도 범위입니다.
:::

## 기준선 규칙

[시리즈의 공통 규칙과 게시 조건](./ralph-loop-series.md#공통-실행-규칙)을 사용합니다. 실행 전에 공통 모델 매핑, 정확한 체크포인트, 정밀도, 하드웨어, 실행 이미지, 도구 파서, 컨텍스트와 클라이언트 구성을 고정합니다. AI on EKS 참조와의 차이와 Auto Mode 설정을 확인합니다. 다른 자원과 전역 설정은 보존합니다.

B0는 선택적 요청 간 prefix 재사용, 외부 KV 재사용, 정확한 응답 캐시와 의미 응답 캐시를 끕니다. 한 요청 안의 정상적인 KV 상태는 사용합니다. 실제 서버 설정과 캐시 상태 검사를 기록합니다. 옵션을 생략한 것만으로 캐시가 꺼졌다고 볼 수 없습니다.

사전 등록한 새 시도 5회는 원래 과제·프롬프트·실행기·독립 채점을 사용합니다. 실패, 제한 시간·멈춤 종료, 채점 시간과 제한 이후 작업까지 모든 결과와 사용량을 보존합니다.

## 필요한 근거

| 근거 | 상태 |
|---|---|
| 모델·실행·자원 manifest | 대기 |
| 비공개 endpoint와 API·도구·채점 사전 확인 | 실행 안 함 |
| B0 5회 배치 | 실행 안 함 |
| 전체 자원·비용 시간표 | 없음 |
| 정리 확인 | 없음 |

운영 비용에는 준비, 다운로드, 모델 로딩, 워밍업, 유휴, CPU/GPU 노드, EKS 제어면, 저장소, 네트워크, 실패와 정리를 포함합니다. GPU 사용률은 청구 할인이 아닙니다. 배포 전에 자원 상한, 유휴 종료, 정리 예산과 승인된 총예산을 정해야 합니다.

완주 run 중앙값·범위와 실패를 포함한 완주당 비용을 보고합니다. Bedrock과 자체 호스팅의 revision 차이를 모르면 그대로 표시합니다. 다른 모델 행은 구성 선택의 비교이며 플랫폼 자체의 속도 개선이 아닙니다. 원본 기록, 독립 채점과 전체 비용이 맞아야 차트에 넣습니다.

B0를 확인한 뒤 [3편의 통제된 캐시 변형](./ralph-loop-inference-optimization.md)으로 이어집니다. 실행과 근거는 [이슈 #216](https://github.com/devfloor9/engineering-playbook/issues/216)에서 추적합니다.
