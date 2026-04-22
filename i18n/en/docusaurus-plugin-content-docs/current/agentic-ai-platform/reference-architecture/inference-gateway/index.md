---
title: Inference Gateway
sidebar_label: Inference Gateway
description: Routing strategies, deployment, cascade tuning, and implementation examples for kgateway and Bifrost-based 2-Tier inference gateways
created: 2026-04-20
last_update:
  date: 2026-04-20
  author: devfloor9
reading_time: 1
tags:
  - reference-architecture
  - inference-gateway
  - kgateway
  - bifrost
  - cascade-routing
  - scope:nav
---

## Overview

The core data plane of Agentic AI platforms is the **inference gateway**. A 2-Tier architecture is recommended: kgateway (Tier 1) handles authentication, rate limiting, and guardrails, while Bifrost (Tier 2) performs model routing, fallback, and cost tracking. This section provides routing strategy overviews, production deployment guides, Cascade Routing tuning, and OpenClaw implementation examples.

## Document List

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
