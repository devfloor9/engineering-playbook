---
title: "韩国 AI 基本法 (AI 기본법) — 高影响AI监管与生成式AI标识义务"
sidebar_label: "韩国 AI 基本法"
description: "韩国 AI 基本法 (AI 기본법)的高影响AI系统影响评估、生成式AI标识义务、PIPA/ISMS-P 交叉遵守及 AIDLC 集成指南"
tags: [korea, ai-law, pipa, isms-p, compliance, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 韩国 AI 基本法 (AI 기본법) (2026年预计实施)

> 📅 **编写日期**: 2026-04-18 | ⏱️ **阅读时间**: 约5分钟

---

## 概述

**人工智能基本法 (인공지능 기본법, AI 기본법)** 是韩国首个综合性AI监管法,**预计2026年上半年实施**。

**立法背景:**
- 科学技术信息通信部主导
- 2025年国会通过 (预定)
- 参考 EU AI Act 但根据韩国实情调整

---

## 核心条款

### 1. 高影响AI系统指定

**定义**: 对人的生命·安全·权利产生重大影响的AI

**示例:**
- 招聘·晋升决策支持系统
- 信用评估·贷款审查
- 医疗诊断辅助
- 犯罪预测·量刑支持

**义务事项:**
- 实施事前影响评估
- 向用户告知AI使用事实
- 决策过程说明义务

---

### 2. 生成式AI标识义务

**对象**: 文本·图像·视频·代码生成AI

**义务内容:**
- **明确标识**AI生成的内容
- 建议插入水印或元数据

**AIDLC 应对:**
```python
# AI-GENERATED: Claude 3.7 Sonnet (2026-04-18)
# PROMPT: "用户认证API端点实现"
# REVIEW: @senior-developer (2026-04-18)

@app.post("/auth/login")
def login(credentials: LoginRequest):
    # 生成的代码...
```

---

### 3. 影响评估

**对象**: 引入高影响AI系统之前

**评估项目:**
- 风险因素 (偏见、隐私侵犯)
- 缓解措施
- 替代手段审查
- 后续监控计划

**AIDLC 映射**: Inception → Requirements Analysis (NFR 满足与否)

```yaml
# .aidlc/compliance/korea-impact-assessment.yaml
impact_assessment:
  project: payment-service-v2
  assessment_date: 2026-04-18
  
  # 高影响AI判定
  high_impact: false
  rationale: "作为开发工具使用,最终决定由开发者作出"
  
  # 风险因素
  risk_factors:
    - factor: "生成代码安全漏洞"
      severity: medium
      mitigation: "SAST 自动扫描 + 独立审查"
    
    - factor: "PII 泄露"
      severity: high
      mitigation: "Guardrails 过滤器 + 日志掩码"
  
  # 后续监控
  post_monitoring:
    frequency: daily
    metrics:
      - "安全漏洞检测率"
      - "代码质量指标"
```

---

### 4. 后续管理

**义务内容:**
- 部署后**持续监控**
- 发现故障·偏见时**立即纠正**
- 发生重大事故时**向科技通信部报告**

**AIDLC 映射**: Operations → Post-market monitoring

```yaml
# .aidlc/monitoring/korea-post-market.yaml
post_market_monitoring:
  responsible_party: "AI Governance Team"
  
  # 持续监控
  monitoring:
    frequency: daily
    metrics:
      - name: "error_rate"
        target: "< 1%"
      - name: "security_vulnerabilities"
        target: "0 critical"
  
  # 纠正措施
  corrective_action:
    sla: 7d  # 发现故障后7日内纠正
    escalation: "重大事故时向科技通信部报告"
```

---

## 与个人信息保护法(PIPA, 개인정보보호법)的交叉

**PIPA (Personal Information Protection Act, 개인정보보호법)** 与 AI 基本法 **互补**:

| 项目 | PIPA | AI 基本法 |
|------|------|-----------|
| **适用对象** | 个人信息处理全面 | AI系统特化 |
| **画像分析** | 需要同意 (Art. 15) | 高影响AI时额外影响评估 |
| **自动化决策** | 保障拒绝权 (Art. 37-2) | 说明义务 (AI 基本法) |
| **责任** | 以信息主体权利为中心 | 以AI系统安全性为中心 |

**AIDLC 应对**: 处理个人信息时需 PIPA + AI 基本法 **同时遵守**

```yaml
# .aidlc/compliance/korea-privacy.yaml
privacy_compliance:
  # PIPA 遵守
  pipa:
    consent: "获取明示同意"
    data_minimization: "仅收集最少个人信息"
    purpose_limitation: "禁止在收集目的外使用"
    
  # AI 基本法 遵守
  ai_law:
    transparency: "告知AI使用事实"
    explainability: "说明决策过程"
    human_oversight: "重要决定需人工批准"
```

---

## 与 ISMS-P (정보보호 및 개인정보보호 관리체계)的联动

**ISMS-P (韩国信息安全管理体系 - 个人信息, 정보보호 및 개인정보보호 관리체계)** 认证持有组织:
- 可将 AI 基本法要求**集成到 ISMS-P 管理体系**
- 2026年后认证审查时预计添加AI系统管理项目

**集成运营:**
```yaml
# .aidlc/compliance/korea-isms-p-integration.yaml
isms_p_integration:
  # ISMS-P 现有控制
  existing_controls:
    - "2.5.1 个人信息收集·使用"
    - "2.6.2 个人信息存储·保管"
    - "3.1.1 信息保护政策"
    
  # AI 基本法 额外控制
  ai_controls:
    - control: "高影响AI影响评估"
      mapping: "ISMS-P 2.1.2 风险管理"
    
    - control: "生成式AI标识义务"
      mapping: "ISMS-P 2.5.6 信息主体权利"
    
    - control: "AI系统后续管理"
      mapping: "ISMS-P 3.2.1 监控"
```

---

## AIDLC 集成检查清单

### Inception 阶段
- [ ] 高影响AI系统判定
- [ ] 影响评估实施 (风险识别·缓解策略)
- [ ] PIPA 个人信息影响评估 (适用时)

### Construction 阶段
- [ ] AI生成代码透明度标识 (`# AI-GENERATED: ...`)
- [ ] 独立审查流程实现
- [ ] 安全漏洞自动扫描 (SAST)

### Operations 阶段
- [ ] 持续监控仪表板运营
- [ ] 发现故障后7日内纠正
- [ ] 发生重大事故时向科技通信部报告

---

## 参考资料

**官方文档:**
- [科学技术信息通信部 AI 政策](https://www.msit.go.kr/bbs/list.do?sCode=user&mId=113&mPid=112) (官方发布时需更新)
- [个人信息保护法 (PIPA, 개인정보보호법)](https://www.pipc.go.kr/np/default/page.do?mCode=D030010000)
- [ISMS-P 认证标准 (정보보호 및 개인정보보호 관리체계)](https://isms.kisa.or.kr/)

**相关文档:**
- [监管合规概述](../index.md)
- [治理框架](../../governance-framework.md)
- [Harness 工程](../../../methodology/harness-engineering.md)
