---
created: 2026-02-16
last_update:
  date: 2026-09-17
reading_time: 2
---
# Translation Status: EKS Pod Resource Optimization

The English page is a short overview, not a complete translation of the Korean guide.

## Source and current translation

| File | Lines on 2026-09-17 | Coverage |
|---|---:|---|
| [Korean guide](docs/eks-best-practices/resource-cost/eks-resource-optimization.md) | 5,411 | Full source guide |
| [English overview](i18n/en/docusaurus-plugin-content-docs/current/eks-best-practices/resource-cost/eks-resource-optimization.md) | 73 | Resource basics, QoS, VPA, and right-sizing summaries |

Line counts describe file size; they are not a translation-completion percentage. The English page does not yet carry the source's detailed procedures, examples, tables, or full discussion of HPA and other workload patterns.

## Remaining work

Translate and review the source in bounded sections:

1. Resource requests and limits, including CPU, memory, and ephemeral storage.
2. QoS, eviction behavior, and workload-specific settings.
3. VPA and HPA behavior, prerequisites, and interactions.
4. Right-sizing procedures, quotas, and operational checks.
5. Auto Mode, architecture-specific considerations, and references.

For each section, preserve configuration values and cross-links, translate diagram labels, and check that recommendations still match their cited sources. Review the existing English summary as well; brevity does not establish technical accuracy.

## Completion checks

- [ ] Every source section has an English counterpart or an explicitly documented omission.
- [ ] Code, tables, diagrams, and links are reviewed alongside prose.
- [ ] Kubernetes and AWS terminology is consistent.
- [ ] Examples distinguish runnable configurations from excerpts.
- [ ] Reading time and update metadata match the finished page.

Tracked in #31. The creation date follows the file's first repository commit on 2026-02-16; the earlier duplicate footer date has been removed.
