---
title: Inference Gateway
description: Routing strategies, deployment, cascade tuning, and implementation examples for kgateway and Bifrost-based 2-Tier inference gateways
created: "2026-04-20"
last_update:
  date: 2026-10-15
  author: devfloor9
reading_time: 3
tags:
  - reference-architecture
  - inference-gateway
  - kgateway
  - bifrost
  - cascade-routing
  - scope:nav
sidebar_label: Inference Gateway
---

## Overview

This section covers the **hands-on deployment procedure** for a kgateway·Bifrost-based 2-Tier inference gateway. It includes Helm installation, HTTPRoute configuration, OTel integration, and troubleshooting.

:::info Gateway concepts and routing strategy have moved to the Model Serving section
The gateway layer definitions, routing strategy, Cascade tuning, and OpenClaw implementation examples have moved to the **Model Serving & Inference Infrastructure** section so they can be read alongside the inference-infrastructure narrative. For the overall structure see [Inference Infrastructure Overview](../../model-serving/index.md), for the layer definitions see [Tiered Gateway Architecture](../../model-serving/inference-routing/tiered-gateway-architecture.md), and for the routing strategy see [Routing Strategy](../../model-serving/inference-routing/routing-strategy.md).
:::

## Document List

import DocCardList from '@theme/DocCardList';
import { useCurrentSidebarCategory } from '@docusaurus/theme-common';

<DocCardList items={useCurrentSidebarCategory().items} />
