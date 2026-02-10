<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# current

## Purpose
Complete English translation mirror of the documentation content. This directory contains translated versions of all technical documentation organized by the same category structure as the source Korean docs (agentic-ai-platform, hybrid-infrastructure, infrastructure-optimization, operations-observability, rosa, security-governance).

## Key Files
| File | Description |
|------|-------------|
| intro.md | English translation of the documentation landing page |
| agentic-ai-platform/ | 14 translated documents covering AI platform architecture, GPU management, model serving, monitoring (e.g., agentic-ai-challenges.md, gpu-resource-management.md, kagent-kubernetes-agents.md) |
| hybrid-infrastructure/ | 5 translated documents on hybrid cloud patterns and SR-IOV networking |
| infrastructure-optimization/ | 7 translated documents on performance, networking, and cost optimization |
| operations-observability/ | 3 translated documents on monitoring and observability |
| rosa/ | 3 translated documents on Red Hat OpenShift Service on AWS |
| security-governance/ | 2 translated documents on security and compliance |

## For AI Agents

### Working In This Directory
This is the **English translation content root**. When translating or updating:

1. **Match source structure**: Every file in `docs/` should have corresponding translation here
2. **Preserve frontmatter fields**: Keep tags, category, date, sidebar_position identical
3. **Translate user-facing text**: Translate title, sidebar_label, description, headings, body text
4. **Preserve technical content**: Do NOT translate code blocks, YAML, JSON, commands, API names, product names
5. **Maintain links**: Update relative links to point to English translated paths if needed
6. **Check completeness**: Run `npm run build` to detect missing translations

### Common Patterns
- **Category organization**: 6 main categories mirroring Korean structure
- **Technical terms to keep in English**: EKS, Kubernetes, GPU, vLLM, Kagent, Kgateway, Milvus, LangFuse, NeMo, Ragas, DCGM, Prometheus, Grafana
- **Frontmatter translation example**:
  ```yaml
  # Korean
  title: "GPU 클러스터 동적 리소스 관리"
  sidebar_label: "GPU 리소스 관리"

  # English
  title: "GPU Cluster Dynamic Resource Management"
  sidebar_label: "GPU Resource Management"
  ```
- **File naming**: Keep identical to source (no translation of filenames)

## Dependencies

### Internal
- Source documentation: `../../../../../docs/`
- Parent i18n plugin directory: `../` (contains current.json)
- Docusaurus i18n config: `../../../../../docusaurus.config.js`

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
