---
created: 2026-02-16
last_update:
  date: 2026-09-18
reading_time: 4
---
# English translation coverage

Korean is the source language of Engineering Playbook. The English document tree now has a counterpart for each Korean source path. Path coverage is checked separately from technical accuracy and operational validation.

The review tracked in [#31](https://github.com/devfloor9/engineering-playbook/issues/31) expanded 30 English overview or incomplete pages, including scheduling, resiliency, the Pod lifecycle chapters, resource and cost management, networking, API authentication, CRD scaling, evaluation, and the ROSA index.

## Resource and cost guides

The English resource-optimization page is now a full chapter rather than the former short overview. The three related guides were reviewed together in [#69](https://github.com/devfloor9/engineering-playbook/issues/69).

| Guide | Korean source | English counterpart |
| --- | --- | --- |
| Pod resource optimization | [Korean](docs/eks-best-practices/resource-cost/eks-resource-optimization.md) | [English](i18n/en/docusaurus-plugin-content-docs/current/eks-best-practices/resource-cost/eks-resource-optimization.md) |
| Karpenter autoscaling | [Korean](docs/eks-best-practices/resource-cost/karpenter-autoscaling.md) | [English](i18n/en/docusaurus-plugin-content-docs/current/eks-best-practices/resource-cost/karpenter-autoscaling.md) |
| Cost management | [Korean](docs/eks-best-practices/resource-cost/cost-management.md) | [English](i18n/en/docusaurus-plugin-content-docs/current/eks-best-practices/resource-cost/cost-management.md) |

Both locales retain the original section anchors and cover prerequisites, examples, tables, and operational considerations. The technical review corrected API fields, resource units, allocation calculations, and unsupported timing or savings guarantees. Complete manifests, fragments, and integration contracts are identified at their points of use.

Scoped compilation, source and anchor comparisons, applicable schema checks, and offline example tests support these changes. They do not establish live controller behavior, resource availability, workload performance, or billing outcomes.

## Keeping translations current

When a Korean article changes, review its English counterpart in the same issue. Preserve document paths, heading anchors, creation dates, and author attribution. Recheck code and tables alongside prose; matching file names or section counts alone do not establish equivalent meaning.

For substantive edits, update each affected locale's revision date and reading estimate with `npm run update-doc-metadata`. Presentation-only changes preserve the existing article date. See the [contribution workflow](README.md#contribute) for commands and verification steps.
