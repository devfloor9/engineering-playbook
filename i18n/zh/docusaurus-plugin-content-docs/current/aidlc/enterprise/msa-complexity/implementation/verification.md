---
title: "验证方法论"
sidebar_label: "验证方法论"
sidebar_position: 3
description: "在复杂 MSA 中应用 AIDLC 时保证质量的验证方法"
tags: [verification, testing, quality, aidlc, enterprise, 'scope:enterprise']
last_update:
  date: 2026-04-18
  author: devfloor9
---

# 验证方法论

在复杂 MSA 中应用 AIDLC 时保证质量的方法。

## 验证检查清单

### 本体验证

- [ ] **完整性:** 所有实体/事件是否都在本体中定义？
- [ ] **一致性:** Bounded Context 间的本体是否一致？
- [ ] **准确性:** 不变条件是否与业务规则一致？
- [ ] **可追溯性:** 本体和代码是否同步？

### Harness 验证

- [ ] **覆盖率:** 是否实现了所有必需的 Harness？
- [ ] **自动化:** Harness 是否集成到 CI/CD？
- [ ] **失败场景:** 是否测试了所有失败场景？
- [ ] **性能:** Harness 执行时间是否合理？

### 部署验证

- [ ] **Canary 部署:** 是否有渐进式发布策略？
- [ ] **回滚计划:** 出现问题时是否可以回滚？
- [ ] **监控:** 部署后是否可以实时监控？
- [ ] **告警:** 是否设置了异常检测告警？

## 验证自动化

### CI/CD 流水线

```yaml
# .github/workflows/aidlc-validation.yml
name: AIDLC Validation

on: [push, pull_request]

jobs:
  validate-ontology:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Validate Ontology
        run: |
          aidlc-cli validate-ontology --path ontology/
  
  run-harness:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Harness Tests
        run: |
          aidlc-cli run-harness --suite saga
          aidlc-cli run-harness --suite idempotency
  
  quality-gate:
    runs-on: ubuntu-latest
    needs: [validate-ontology, run-harness]
    steps:
      - name: Check Quality Gate
        run: |
          aidlc-cli quality-gate --threshold 80
```

## 专家评审

**复杂度 L4-5 必须有专家评审**

### 评审检查清单

- [ ] Saga 设计是否合适？
- [ ] 补偿逻辑是否覆盖所有失败场景？
- [ ] 是否有事件 Schema 版本管理策略？
- [ ] 投影逻辑是否准确？
- [ ] 是否考虑了性能/可扩展性？

### 评审流程

1. **设计评审:** 检查 Saga/Event Sourcing 设计
2. **本体评审:** 确认本体完整性/准确性
3. **Harness 评审:** 验证测试覆盖率和失败场景
4. **性能评审:** 检查瓶颈和可扩展性
5. **安全评审:** 分析数据一致性和安全漏洞

## 质量门禁

### 通过标准

| 项目 | 最低要求 | 推荐目标 |
|------|---------|---------|
| **本体覆盖率** | 90% | 100% |
| **Harness 执行成功率** | 95% | 100% |
| **必需 Harness 实现** | 100% | - |
| **代码评审批准** | 必需 | - |
| **专家评审 (L4-5)** | 必需 | - |

### 失败时措施

1. **本体不完整:** 添加缺失项后重新验证
2. **Harness 失败:** 修复 bug 后重新运行
3. **性能问题:** 解决瓶颈后重新测量
4. **专家评审未通过:** 改进设计后重新评审

## 持续改进

### 跟踪指标

- 本体变更频率
- Harness 执行时间趋势
- 生产问题发生率
- 回滚频率

### 反馈循环

1. 生产问题发生时添加 Harness
2. 频繁失败的模式改进本体
3. 优化慢速 Harness
4. 文档化最佳实践

## 下一步

- [本体指南](./ontology-guide.md): 本体编写方法
- [Harness 检查清单](./harness-checklist.md): 按模式划分的必需 Harness
- [MSA 复杂度概览](../index.md): 返回整体指南
