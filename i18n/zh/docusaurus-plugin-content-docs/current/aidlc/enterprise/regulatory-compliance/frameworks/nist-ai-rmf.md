---
title: "NIST AI RMF — 美国联邦AI风险管理框架"
sidebar_label: "NIST AI RMF"
description: "NIST AI Risk Management Framework 1.1的4 Functions (GOVERN/MAP/MEASURE/MANAGE)与 AIDLC 集成指南"
tags: [nist, ai-rmf, compliance, federal, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# NIST AI RMF 1.1 (Risk Management Framework)

> 📅 **编写日期**: 2026-04-18 | ⏱️ **阅读时间**: 约5分钟

---

## 概述

**NIST AI RMF (Risk Management Framework)** 是美国国家标准与技术研究院(NIST)于2023年发布的AI风险管理框架。

**特征:**
- **自愿遵守** (Voluntary) — 无法律强制力
- **联邦采购要求**: 美国政府合同时 NIST AI RMF 遵守必需 (EO 14110)
- **国际兼容**: 可与 ISO/IEC 42001 互相映射

**版本历史:**
- v1.0 (2023.01): 首次发布
- v1.1 (2024.12): 添加 Generative AI 章节、强化透明度

---

## 4 Functions — GOVERN、MAP、MEASURE、MANAGE

```mermaid
graph LR
    GOV[GOVERN<br/>治理·政策]
    MAP[MAP<br/>上下文·风险识别]
    MEASURE[MEASURE<br/>评估·测试]
    MANAGE[MANAGE<br/>应对·监控]
    
    GOV --> MAP
    MAP --> MEASURE
    MEASURE --> MANAGE
    MANAGE -.反馈.-> GOV
    
    style GOV fill:#9c27b0,color:#fff
    style MAP fill:#2196f3,color:#fff
    style MEASURE fill:#ff9800,color:#fff
    style MANAGE fill:#4caf50,color:#fff
```

### 1. GOVERN

**目的**: 建立AI系统治理政策·文化·责任

**核心子类别:**
- **GOVERN-1.1**: AI风险管理战略制定
- **GOVERN-1.2**: 责任归属明确化 (AI系统所有者)
- **GOVERN-1.3**: 法律·监管·伦理考虑事项集成
- **GOVERN-1.4**: 组织全体AI风险文化培养

**AIDLC 映射**: [治理框架](../../governance-framework.md) — 三层治理模型

### 2. MAP

**目的**: AI系统上下文理解、风险识别

**核心子类别:**
- **MAP-1.1**: 业务上下文掌握 (用例、利益相关者)
- **MAP-1.2**: AI系统范围定义 (输入、输出、依赖性)
- **MAP-2.1**: 数据质量评估
- **MAP-3.1**: 风险识别 (偏见、隐私、安全)
- **MAP-5.1**: 影响评估

**AIDLC 映射**: Inception → Requirements Analysis、Reverse Engineering

### 3. MEASURE

**目的**: AI系统性能·可靠性·公平性测量

**核心子类别:**
- **MEASURE-1.1**: 性能指标定义 (准确度、F1、AUC)
- **MEASURE-2.1**: 可解释性评估
- **MEASURE-2.2**: 偏见测试 (demographic parity、equalized odds)
- **MEASURE-2.3**: 鲁棒性测试 (adversarial robustness)
- **MEASURE-3.1**: 隐私影响评估

**AIDLC 映射**: Construction → Build & Test、[Harness 工程](../../../methodology/harness-engineering.md) Quality Gates

### 4. MANAGE

**目的**: AI风险应对·监控·持续改进

**核心子类别:**
- **MANAGE-1.1**: 风险缓解策略执行
- **MANAGE-2.1**: 事故响应计划
- **MANAGE-3.1**: 持续监控
- **MANAGE-4.1**: 反馈循环 (风险重评估)

**AIDLC 映射**: Operations → Post-market monitoring、事故响应

---

## NIST AI RMF 1.0 → 1.1 主要变更

| 项目 | v1.0 (2023.01) | v1.1 (2024.12) |
|------|---------------|---------------|
| **Generative AI** | 简略提及 | 添加专用章节 (Appendix B) |
| **透明度** | MEASURE-2.1 | 强化 (Model Card、Data Sheet 示例) |
| **Red Teaming** | - | 添加 MEASURE-2.3 (对抗性测试) |
| **Supply Chain** | GOVERN-1.5 | 扩展 (开源模型风险) |

---

## 美国联邦采购要求 (EO 14110)

**Executive Order 14110 (2023.10.30)**: "Safe, Secure, and Trustworthy AI"

**核心内容:**
- 联邦机构引入AI时 **NIST AI RMF 遵守必需**
- 开发超过10^26 FLOP的模型时 **向政府报告** 义务
- 联邦采购合同 **包含AI风险管理条款**

**AIDLC 应对**: 美国联邦合同项目必需映射 NIST AI RMF

---

## AIDLC 集成示例

### Inception 阶段: GOVERN + MAP

```yaml
# .aidlc/compliance/nist-map.yaml
project: federal-contract-ai-tool
assessment_date: 2026-04-18

# GOVERN-1.1: AI风险管理战略
governance:
  strategy: "联邦合同遵守AI代码生成工具"
  responsible_party: "AI Governance Team"
  
# MAP-1.1: 业务上下文
business_context:
  use_case: "联邦机构后端服务代码生成"
  stakeholders:
    - "联邦采购负责人"
    - "开发团队"
    - "安全团队"

# MAP-3.1: 风险识别
identified_risks:
  - risk_id: RISK-001
    category: "安全"
    description: "生成代码的漏洞"
    mitigation: "SAST 自动扫描"
  - risk_id: RISK-002
    category: "隐私"
    description: "PII 泄露"
    mitigation: "Guardrails 过滤器"
```

### Construction 阶段: MEASURE

```yaml
# .aidlc/harness/nist-measure-gates.yaml
quality_gates:
  # MEASURE-1.1: 性能指标
  - gate: performance_metrics
    enabled: true
    metrics:
      code_coverage: ">= 80%"
      duplication: "<= 3%"
      
  # MEASURE-2.2: 偏见测试
  - gate: bias_test
    enabled: true
    tests:
      - "demographic_parity_check"
      - "equalized_odds_check"
    
  # MEASURE-2.3: 鲁棒性测试
  - gate: adversarial_robustness
    enabled: true
    tools:
      - "bandit"  # SAST
      - "semgrep"
```

### Operations 阶段: MANAGE

```yaml
# .aidlc/monitoring/nist-manage.yaml
continuous_monitoring:
  # MANAGE-3.1: 持续监控
  metrics:
    - name: "error_rate"
      target: "< 1%"
      alert_threshold: 0.95
    - name: "bias_score"
      target: "< 0.05"
      alert_threshold: 0.04
  
  # MANAGE-4.1: 反馈循环
  feedback_loop:
    frequency: "monthly"
    action: "风险重评估及缓解策略更新"
```

---

## 参考资料

**官方文档:**
- [NIST AI RMF 1.1 (2024.12)](https://www.nist.gov/itl/ai-risk-management-framework)
- [Executive Order 14110 (White House)](https://www.whitehouse.gov/briefing-room/presidential-actions/2023/10/30/executive-order-on-the-safe-secure-and-trustworthy-development-and-use-of-artificial-intelligence/)

**相关文档:**
- [监管合规概述](../index.md)
- [治理框架](../../governance-framework.md)
- [Harness 工程](../../../methodology/harness-engineering.md)
