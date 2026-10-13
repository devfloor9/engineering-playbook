---
title: NVIDIA Dynamo 추론 벤치마크
description: EKS에서 NVIDIA Dynamo의 통합·분리 서빙을 비교하기 위한 하드웨어 조건, 네 가지 워크로드와 측정 계획
created: "2026-03-20"
last_update:
  date: 2026-09-19
  author: YoungJoon Jeong
reading_time: 12
tags:
  - benchmark
  - nvidia
  - dynamo
  - vllm
  - inference
  - gpu
  - disaggregated-serving
  - eks
  - kv-cache
  - nixl
  - scope:tech
sidebar_label: Report 5. Dynamo 추론 [신규]
sidebar_position: 5
category: benchmark
---

:::info 문서 상태
**신규** — 벤치마크 실행 계획 수립 단계입니다.
:::

## 개요

이 계획은 한 worker가 입력을 처리하는 **Prefill**과 출력 토큰을 생성하는 **Decode**를 모두 맡는 Aggregated 구성, 두 단계를 별도 worker에 배치하는 Disaggregated 구성을 비교합니다. 먼저 같은 GPU 자원으로 단계 분리의 영향을 확인하고, 이후 서로 다른 GPU를 조합했을 때의 비용과 응답 시간을 비교합니다. AIPerf로 생성할 워크로드는 네 종류이며, 아직 실행 결과는 없습니다.

:::info 배포 가이드
이 벤치마크의 EKS 배포는 [NVIDIA GPU 스택 가이드](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack)를 참조하세요.
:::

## 테스트 환경

### EKS 클러스터 사양

| 항목 | 구성 |
|------|------|
| **EKS 버전·노드 관리** | 실행 시 지원되는 버전과 Auto Mode 또는 별도 노드 그룹 중 하나를 선택해 고정 |
| **동일 GPU 기준선 후보** | p4d.24xlarge × 2: 노드당 A100 40GB × 8, 총 16 GPU |
| **이종 GPU 시험 후보** | g6e.12xlarge: 노드당 L40S 48GB × 4; 필요한 노드 수는 메모리 검증과 비용 한도에 따라 결정 |
| **스토리지** | 모델 저장소와 로컬 캐시 경로·용량을 고정; 다운로드·시작 시간은 정상 상태 추론과 별도 측정 |
| **네트워크** | CNI, AZ, MTU, GPU/NIC 배치와 실제 전송 backend를 기록; EFA 지원만으로 GPUDirect 경로가 검증된 것은 아님 |

[P4 사양][p4]에서 p4d의 GPU 메모리는 노드당 **320GB**입니다. A100 80GB × 8 구성은 p4de입니다. [G6e 사양][g6e]에서 g6e.12xlarge는 **4 GPU, 총 192GB**입니다. 위 표는 배포 후보이며 확보하거나 실행한 자원을 뜻하지 않습니다.

Auto Mode는 NVIDIA 드라이버와 device plugin을 관리하므로 같은 노드에 GPU Operator의 해당 구성요소를 중복 설치하지 않습니다. 별도 노드 그룹에 GPU Operator를 사용한다면 지원 OS, 드라이버 소유권과 배포 대상을 먼저 확인합니다.[^gpu-ownership]

### 소프트웨어 스택

| 컴포넌트 | 버전 |
|----------|------|
| **NVIDIA Dynamo** | 선택한 릴리스·차트·이미지 digest |
| **vLLM Runtime** | 해당 Dynamo 릴리스가 지원하는 runtime 이미지와 내장 vLLM·CUDA·NIXL 버전 |
| **GPU 드라이버·device plugin** | Auto Mode 제공 구성 또는 별도 노드 그룹에서 검증한 구성 |
| **AIPerf** | CLI 버전·설정 파일·요청 데이터 해시 |
| **Prometheus + Grafana** | 차트 버전, 수집 주기, 실제 사용한 메트릭과 dashboard revision |

각 프로젝트의 최신 버전을 따로 골라 조합하지 않습니다. [Dynamo 호환성 표][compatibility]로 조합을 확인하고, 선택한 이미지에서 모델 로딩과 짧은 요청을 먼저 검증한 뒤 위 항목을 실행 기록에 채웁니다.

### 테스트 모델

| 모델 | 파라미터 | 활성 파라미터 | 정밀도 | 아키텍처 |
|------|---------|-------------|--------|---------|
| **Qwen/Qwen3-30B-A3B** | 30.5B | 3.3B | BF16 기준선 | MoE |
| **Qwen/Qwen3-30B-A3B-FP8** | 30.5B | 3.3B | 별도 양자화 시험 후보 | MoE |

[공식 모델 카드][qwen]의 3.3B는 토큰당 활성 파라미터 수이며, GPU에 올릴 전체 가중치 크기가 아닙니다. 30.5B 파라미터의 BF16 가중치만 단순 계산해도 약 61GB이고, KV 캐시와 실행 버퍼가 추가됩니다. worker별 GPU 수·TP 설정·문맥 길이로 메모리 적합성을 확인해야 합니다.

FP8 checkpoint의 양자화 형식과 지원 kernel은 GPU·backend에 따라 다릅니다. A100과 L40S에서 같은 FP8 경로가 동작한다고 가정하지 않습니다. 양자화 시험은 지원 여부, 실제 연산 정밀도와 출력 품질을 확인한 뒤 BF16 결과와 구분해 보고합니다.

---

## 아키텍처 비교

### Aggregated Serving

```
Client → Router → [Worker (Prefill + Decode)]
                   └── GPU: A100 × 4 (TP=4)
```

단일 worker가 두 단계를 처리합니다. 입력 길이와 동시성에 따라 한 단계가 다른 단계의 자원을 점유할 수 있는지 측정합니다. KV 캐시 재사용은 이 구성에서도 가능하므로, 단계 분리의 고유한 이점으로 간주하지 않습니다.

### Disaggregated Serving

```
Client → Router → Prefill Worker (A100 × 4, TP=4)
                  ↓ KV transfer
              → Decode Worker (A100 × 4, TP=4)
```

그림은 동일 GPU 시험의 worker 배치 예입니다. 총 16 GPU 기준선에서는 Aggregated worker 4개와 Prefill 2개 + Decode 2개를 비교하는 구성을 검토할 수 있습니다. worker 수와 각 단계의 배분은 실행 전에 고정합니다. 이후 Decode를 L40S로 바꾸는 시험은 자원·TP·비용이 달라지는 별도 실험입니다.

- **KV Router**: 캐시 정보가 라우팅과 재계산량에 미치는 영향을 비교합니다.
- **NIXL Transfer**: 선택한 전송 plugin, 메모리 등록과 실제 전송 경로를 확인하고 KV 이동 시간을 측정합니다. NIXL 사용 자체가 GPU 간 직접 전송이나 최소 지연을 보장하지는 않습니다.[^nixl]
- **KV Cache Offloading**: GPU 외 메모리·스토리지의 읽기 비용과 재계산 절감량을 비교합니다. KVBM의 지원 범위는 backend에 따라 다르며, Aggregated와 Disaggregated 모두에서 별도 설정할 수 있습니다.[^kvbm]

단계 분리, 캐시 라우팅, offload를 동시에 바꾼 결과로 각각의 효과를 설명하지 않습니다. 기능을 하나씩 추가한 비교와 실제 운영 조합을 구분합니다.

---

## 벤치마크 모드

이 계획에서는 [AIPerf][aiperf]로 다음 네 종류의 워크로드를 구성합니다. 도구가 제공하는 전체 모드 목록을 뜻하지 않습니다. 아래 수치는 초기 제안값이며, 요청 생성 설정과 데이터셋을 실행 기록에 보존합니다.

### 1. Concurrency Sweep

동시 요청 수를 단계적으로 증가시키며 TTFT, TPS, Throughput을 측정합니다.

| 파라미터 | 값 |
|---------|---|
| 동시성 | 1, 2, 4, 8, 16, 32, 64 |
| ISL (Input Seq Len) | 1024 |
| OSL (Output Seq Len) | 512 |
| Duration | 120s/단계 |

**측정 지표**: TTFT p50/p99, ITL p50/p99, Throughput (tokens/s), Request Latency

### 2. Multi-turn Conversation

멀티턴 대화 시나리오에서 KV 캐시 재사용 효과를 측정합니다.

| 파라미터 | 값 |
|---------|---|
| 대화 턴 수 | 5 |
| 동시 대화 | 8 |
| ISL/OSL | 512/256 |
| Duration | 300s |

**측정 지표**: 턴별 TTFT 변화, 캐시 히트율, 전체 대화 응답 시간

### 3. Sequence Distribution

다양한 시퀀스 길이 분포에서 성능 안정성을 측정합니다. 선택한 AIPerf 버전에서 직접 지원하지 않는 분포는 고정 seed로 입력 데이터셋을 생성하고, 요청 길이와 실제 생성 길이를 함께 기록합니다.

| 파라미터 | 값 |
|---------|---|
| 분포 유형 | Uniform, Zipf, Lognormal |
| ISL 범위 | 128–4096 |
| OSL 범위 | 64–2048 |
| 동시성 | 16 |

**측정 지표**: 분포별 TTFT/TPS 편차, 긴 시퀀스 처리 안정성

### 4. Prefix Cache

같은 prefix를 포함하는 요청의 비율을 바꾸어 TTFT와 실제 캐시 재사용량을 측정합니다. 입력의 prefix 중복률은 서버의 캐시 히트율과 다릅니다. 캐시 용량·eviction·라우팅에 따라 중복 요청도 miss가 될 수 있습니다.

| 파라미터 | 값 |
|---------|---|
| 입력 prefix 중복률 | 0%, 25%, 50%, 75%, 100% |
| ISL/OSL | 2048/512 |
| 동시성 | 16 |

**측정 지표**: 히트 비율별 TTFT 감소, 캐시 메모리 사용량, Eviction Rate

TTFT는 요청 시작부터 첫 출력 토큰까지, ITL은 연속 출력 토큰 사이의 시간으로 정의합니다. 전체 출력 tokens/s와 요청별 생성 속도를 분리하고 오류·timeout·취소도 보존합니다. 서버의 캐시 hit/miss·eviction·전송량은 backend 메트릭에서 수집하며 AIPerf 결과만으로 추정하지 않습니다. 동일 프롬프트, thinking 설정, sampling 설정과 출력 품질 기준을 적용하고, 반복별 분포와 표본 수를 함께 보고합니다.

---

## 벤치마크 결과

:::note 데이터 수집 예정
벤치마크 실행 후 결과 데이터를 업데이트할 예정입니다.
:::

### 예상 결과 구조

#### Concurrency Sweep 결과

| 동시성 | Aggregated TTFT p50 | Disagg TTFT p50 | Aggregated TPS | Disagg TPS |
|--------|--------------------:|----------------:|---------------:|-----------:|
| 1 | - | - | - | - |
| 4 | - | - | - | - |
| 16 | - | - | - | - |
| 32 | - | - | - | - |
| 64 | - | - | - | - |

#### Prefix Cache 효과

| 히트 비율 | Aggregated TTFT | Disagg TTFT | 개선율 |
|-----------|----------------:|------------:|-------:|
| 0% | - | - | - |
| 50% | - | - | - |
| 100% | - | - | - |

#### 비용 효율성

| 구성 | GPU 비용 ($/hr) | Throughput (tok/s) | $/1M tokens |
|------|---------------:|------------------:|-----------:|
| Aggregated, 동일 GPU 기준선 | - | - | - |
| Disaggregated, 동일 GPU 총량 | - | - | - |
| Disaggregated, 이종 GPU·별도 비용 시험 | - | - | - |

기간 비용을 같은 기간의 **성공한 출력 토큰 수**로 나누고 1,000,000을 곱해 비용을 계산합니다. 비용에는 실제로 할당한 노드, EKS·노드 관리 요금, 스토리지와 네트워크 등 포함 범위를 명시합니다. 이종 GPU 시험은 같은 비용 한도와 품질·지연 SLO에서 비교하며, 추가 GPU를 배치한 처리량 증가를 분리 서빙만의 효과로 해석하지 않습니다.

### Grafana 대시보드

다음 관측 항목을 수집할 계획입니다. dashboard 이름만으로 지표가 자동 수집되는 것은 아니므로, 선택한 릴리스의 실제 메트릭과 단위를 확인합니다.

- **Pareto Dashboard**: TTFT vs Throughput Pareto 분석
- **DCGM Metrics**: GPU 활용률, 메모리, 온도, 전력
- **Dynamo Platform**: 워커 상태, 요청률, KV 캐시 히트율
- **KV Block Manager**: 블록 할당, Eviction, Offload 현황

대시보드 구성은 [Agent 모니터링 가이드](/docs/agentic-ai-platform/operations-mlops/observability/agent-monitoring)를 참조하세요.

---

## 배포 가이드

### 사전 요구사항

- 전용 AWS 계정·프로필·리전·클러스터·namespace와 비용·중단 한도
- 지원되는 EKS 버전, 노드 관리 방식, GPU quota와 AZ별 용량
- 모델 접근 권한, 가중치·이미지 digest, 스토리지·네트워크 구성
- 선택한 배포 방식에 필요한 CSI driver·진입 경로·Helm 버전; 모든 구성에 같은 add-on이 필수인 것은 아님

### 설치 순서

1. 기본 리소스: 네임스페이스, StorageClass, HF Token Secret
2. GPU 장치 확인: 선택한 노드 관리 방식에 따라 드라이버·device plugin·메모리 확인
3. 모니터링: Prometheus + Grafana와 해당 backend의 exporter·scrape 설정
4. Dynamo: 선택한 릴리스의 CRD·Operator·discovery·메시징 요구사항 적용; etcd·NATS를 버전과 기능에 관계없이 필수로 가정하지 않음
5. 모델 다운로드: EFS에 모델 가중치 저장
6. 서빙 배포: Aggregated 또는 Disaggregated 모드 선택
7. 짧은 요청으로 모델·전송·계측 검증 후 warm-up과 네 종류의 워크로드 실행

상세 배포 가이드는 [NVIDIA GPU 스택 가이드](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack)를 참조하세요.

시험 중단 시 부하 생성을 먼저 멈추고 해당 시험의 worker·설정만 복원합니다. 생성한 자원 목록과 비용 종료 여부를 확인하며, 다른 작업의 리소스를 일괄 삭제하지 않습니다. 이 문서는 배포 완료나 복구 시험 성공을 보고하지 않습니다.

---

## 핵심 검증 포인트

이 벤치마크를 통해 검증하려는 핵심 질문:

1. **같은 GPU 총량에서 단계 분리가 TTFT·ITL·성공 처리량을 어떻게 바꾸는가?**
   - 짧은 입력부터 긴 입력까지, 낮은 부하부터 SLO를 넘는 부하까지 비교

2. **KV Cache Offloading(GPU→CPU→SSD)이 실질적 비용 절감을 제공하는가?**
   - L40S (48GB)로 Decode 워커를 운영할 때의 비용 대비 성능

3. **입력 prefix 중복률과 실제 캐시 히트율은 어떻게 연결되는가?**
   - Aggregated에도 같은 캐시 조건을 적용해 비교

4. **NIXL Transfer 오버헤드가 Disaggregation 이점을 상쇄하지 않는가?**
   - 짧은 시퀀스에서도 Disaggregated가 유리한지

---

## 권장사항

:::note 벤치마크 완료 후 업데이트 예정
실제 측정 결과를 기반으로 권장사항을 작성할 예정입니다.
:::

### 검증할 가설 {#예상-권장-시나리오}

| 시나리오 | 비교할 가설 | 확인할 근거 |
|---------|----------|------|
| 낮은 부하·짧은 입력 | 단계 분리가 전송·스케줄링 비용을 늘릴 수 있음 | TTFT·ITL·KV 전송 시간 |
| 멀티턴 대화 | 라우팅·offload가 재계산을 줄일 수 있음 | 두 서빙 모드의 실제 hit/miss와 eviction |
| 높은 부하·긴 입력 | Prefill 간섭을 줄이는 대신 Decode 용량이 병목이 될 수 있음 | 단계별 대기열·GPU 사용량·SLO 충족률 |
| 비용 최적화 | 이종 GPU 조합이 유리한 부하 범위가 있을 수 있음 | 같은 품질·SLO에서 기간 비용과 성공 출력 토큰 수 |

## 참고 자료

- [NVIDIA Dynamo Documentation](https://docs.nvidia.com/dynamo/)
- [vLLM Project](https://docs.vllm.ai/)
- [AIPerf Benchmark Tool](https://github.com/ai-dynamo/aiperf) — Dynamo 추론 벤치마크 도구
- [NVIDIA GPU 스택 가이드](/docs/agentic-ai-platform/model-serving/gpu-infrastructure/nvidia-gpu-stack)
- [Dynamo 호환성 표][compatibility]
- [Qwen3 모델 카드][qwen]

[p4]: https://aws.amazon.com/ec2/instance-types/p4/
[g6e]: https://aws.amazon.com/ec2/instance-types/g6e/
[qwen]: https://huggingface.co/Qwen/Qwen3-30B-A3B-FP8
[compatibility]: https://docs.nvidia.com/dynamo/dev/reference/compatibility
[aiperf]: https://github.com/ai-dynamo/aiperf
[^gpu-ownership]: [EKS Auto Mode GPU 관리](https://docs.aws.amazon.com/eks/latest/userguide/auto-accelerated.html), [GPU Operator의 EKS 설치 조건](https://docs.nvidia.com/datacenter/cloud-native/gpu-operator/latest/amazon-eks.html).
[^nixl]: [NIXL 전송 backend와 메모리 등록](https://github.com/ai-dynamo/nixl/blob/main/docs/nixl.md).
[^kvbm]: [Dynamo v1.2.1 KVBM 범위와 제약](https://github.com/ai-dynamo/dynamo/blob/v1.2.1/docs/components/kvbm/README.md). 실제 설치 릴리스의 지원 표를 별도로 확인합니다.
