---
title: 보안 & 인증
description: EKS Hybrid Nodes의 노드 인증 방식(SSM hybrid activation vs IAM Roles Anywhere)과 자격 증명 수명주기 관리를 다룹니다.
created: "2026-08-25"
last_update:
  date: "2026-08-25"
  author: YoungJoon Jeong
reading_time: 1
tags:
  - eks
  - hybrid-node
  - security
  - scope:nav
sidebar_label: 보안 & 인증
sidebar_position: 3
category: hybrid-multicloud
---

import { DocCard, DocCardGrid } from '@site/src/components/DocCards';

하이브리드 노드는 EC2 인스턴스 프로파일이 없으므로 온프레미스용 IAM 자격 증명 공급자를 별도로 선택해야 합니다. 인증 방식 선택과 자격 증명 수명주기 관리를 다룹니다.

---

<DocCardGrid columns={2}>
  <DocCard
    to="/docs/eks-hybrid-nodes/security-authn/node-authentication"
    icon="🔐"
    title="노드 인증 방식"
    description="SSM hybrid activation vs IAM Roles Anywhere — 동작 방식 비교, 선택 기준, 자격 증명 수명주기 관리"
    color="#e63946"
  />
</DocCardGrid>
