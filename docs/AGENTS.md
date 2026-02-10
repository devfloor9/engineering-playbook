<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-09 | Updated: 2026-02-09 -->

# docs

## Purpose
Main documentation content for the Engineering Playbook. Contains 6 major sections covering cloud-native infrastructure, AI/ML platforms, and operational best practices. Written primarily in Korean with English translations available via i18n.

## Key Files
| File | Description |
|------|-------------|
| `intro.md` | Getting started introduction page |

## Subdirectories
| Directory | Purpose |
|-----------|---------|
| `agentic-ai-platform/` | AI agent platform architecture, GPU management, model serving, RAG (see `agentic-ai-platform/AGENTS.md`) |
| `hybrid-infrastructure/` | Hybrid cloud nodes, SR-IOV networking, storage, Harbor registry (see `hybrid-infrastructure/AGENTS.md`) |
| `infrastructure-optimization/` | Networking, DNS, autoscaling, cost management (see `infrastructure-optimization/AGENTS.md`) |
| `operations-observability/` | GitOps operations, monitoring agents (see `operations-observability/AGENTS.md`) |
| `rosa/` | Red Hat OpenShift Service on AWS guides (see `rosa/AGENTS.md`) |
| `security-governance/` | Security compliance and incident response (see `security-governance/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- Each section has an `index.md` serving as category landing page
- Documents use Korean as primary language
- Frontmatter required: `sidebar_position`, `title`, `description`, `tags`, `last_update`
- After modifying any doc, run `npm run validate-metadata` from project root
- After changing cross-references, run `npm run validate-links`
- Reading order is defined in `sidebars.js` at project root

### Testing Requirements
- `npm run validate-metadata` must pass
- `npm run validate-links` must pass
- `npm run build` must succeed

### Common Patterns
- Mermaid diagrams for architecture visualizations
- Admonitions (:::note, :::tip, :::warning) for callouts
- Code blocks with language tags (bash, yaml, json, python, hcl)
- Each article ends with related references section

## Dependencies

### Internal
- `sidebars.js` — Controls doc ordering and grouping
- `i18n/en/docusaurus-plugin-content-docs/current/` — English translations mirror this structure

### External
- MDX — Extended markdown format
- Mermaid — Diagram rendering

<!-- MANUAL: Any manually added notes below this line are preserved on regeneration -->
