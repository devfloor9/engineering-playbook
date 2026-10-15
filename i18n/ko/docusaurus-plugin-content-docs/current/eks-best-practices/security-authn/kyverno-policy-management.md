---
title: Kyverno 기반 정책 관리
description: Kyverno v1.17을 기준으로 한 Kubernetes 정책 관리 및 거버넌스
created: "2026-02-09"
last_update:
  date: 2026-10-15
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - security
  - kyverno
  - policy
  - governance
  - scope:ops
sidebar_label: Kyverno 정책 관리
category: security
---

:::info 작성 예정
이 문서는 현재 작성 중입니다. 다음 내용이 포함될 예정입니다:

- Kyverno v1.17(2026년 2월 2일 릴리스) 기준 CEL 기반 정책 유형. v1.14에서 도입된 ValidatingPolicy·ImageValidatingPolicy와 v1.15에서 추가된 MutatingPolicy·GeneratingPolicy·DeletingPolicy가 v1.17에서 v1(stable)로 승격되었습니다. 프로덕션 적용 가능 여부는 사용하는 정책 유형별 성숙도에 따라 판단합니다.
- 네임스페이스 수준 정책 관리
- 정책 예외 관리
- OPA Gatekeeper 비교
:::
