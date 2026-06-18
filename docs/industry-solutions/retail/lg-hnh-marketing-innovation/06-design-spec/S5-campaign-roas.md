---
created: 2026-05-14
title: "S5. 옴니채널 캠페인 ROAS 시뮬"
sidebar_label: "S5. Campaign ROAS"
description: "옴니채널(자사몰/마트/H&B/SNS) Bayesian 어트리뷰션 + 검색·SNS 반응 결합"
last_update:
  date: 2026-05-14
reading_time: 2
---
# S5. 옴니채널 캠페인 ROAS 시뮬

## 1. URL 경로
- `/campaign-roas`

## 2. 사용자 스토리
> P1 (브랜드 마케터) — 다음 주 숨37 신상 런칭 / 예산 1억 / VIP 5만 → 채널 믹스 시뮬.

> P5 (MD) — 채널·매대 진열 함께 고려한 옴니채널 ROI.

## 3. 입력 UI
- 캠페인 정의 (대상 세그먼트, 기간, 예산, 타겟 BU/브랜드)
- 채널 후보 (SMS·푸시·카톡·SNS광고·자사몰배너·마트 매대·H&B 진열·인플루언서)
- 가설 (예: "SMS:푸시:카톡:SNS:H&B = 20:15:15:30:20")

## 4. 데이터 믹스
| 데이터 | 출처 | 활용 |
|---|---|---|
| 과거 캠페인 | Snowflake CAMPAIGN_MART | Bayesian prior |
| 채널 sell-through | ChannelSellThrough | 채널별 응답률 |
| **SNS 반응** | SocialSignal (X·인스타 광고 클릭) | posterior 조정 |
| **검색 트렌드** | SocialSignal (네이버·구글) | 캠페인 외 영향 분리 |

## 5. 처리 파이프라인
```
1. 과거 캠페인에서 채널별 prior 추출
2. 외부 시그널 (검색·SNS) 결합 → 트렌드 효과 분리
3. MCMC 1000 샘플 (PyMC) → posterior
4. 채널 믹스 ROAS 분포
5. 추천 믹스 (ROAS expected value 최대)
6. 어트리뷰션 (Last-touch / Linear / Time-decay)
```

## 6. 출력 UI
- 추천 채널 믹스 (donut + 표)
- ROAS 분포 (violin)
- 채널별 한계 효율 (line)
- 채널·매장 단위 GMV 영향 (bar)
- 트렌드·SNS 영향 분리 표시

## 7. 가드레일
- 동의 미수신 회원 자동 제외
- 채널별 발송 한도 (스팸 가드)
- 시뮬 결과 신뢰구간 포함 (점추정 X)
- 미성년 화장품 캠페인 자동 제외

## 8. 데모 시나리오
1. 예산 1억 / 숨37 신상 / VIP 5만 → 추천 믹스 + ROAS 분포
2. 가설 변경(SNS +20%) → ROAS 변화 즉시
3. "검색 트렌드 결합 시 트렌드 효과 vs 캠페인 효과" 분리 차트