---
created: 2025-09-09
last_update:
  date: 2026-09-19
reading_time: 20
---
# Engineering Playbook

Practical engineering references for AWS, Kubernetes, and AI platforms: design decisions, implementation examples, and operating procedures in one manual.

[![Deploy](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml/badge.svg)](https://github.com/devfloor9/engineering-playbook/actions/workflows/deploy.yml)
[![GitHub Pages](https://img.shields.io/badge/docs-GitHub%20Pages-blue)](https://devfloor9.github.io/engineering-playbook/)

**[Open the manual](https://devfloor9.github.io/engineering-playbook/)** · [Start here](docs/intro.md) · [Issues](https://github.com/devfloor9/engineering-playbook/issues)

## Find a topic

| Topic | What it covers |
| --- | --- |
| [EKS Best Practices](docs/eks-best-practices/index.md) | Networking, control-plane scaling, resources and cost, reliability, and security |
| [Agentic AI Platform](docs/agentic-ai-platform/index.md) | Platform architecture, model serving, operations, and reference implementations |
| [EKS Hybrid Nodes](docs/eks-hybrid-nodes/index.md) | On-premises nodes, GPU networking, storage, and registry integration |
| [ROSA](docs/rosa/index.md) | Red Hat OpenShift on AWS installation, security, and operations |
| [AIDLC](docs/aidlc/index.md) | AI Development Lifecycle methods, tooling, enterprise adoption, and AgenticOps |
| [Benchmarks](docs/benchmarks/index.md) | Infrastructure and inference comparisons, measurement conditions, and evaluation methods |
| [Industry Solutions](docs/industry-solutions/index.md) | Retail scenarios and demonstration patterns |

Examples have different levels of validation. Read each guide's prerequisites, release scope, measurement conditions, and verification status before applying it. Calculated examples and proposed architectures are distinct from measured deployment results. Operator acceptance remains open for the cascade-routing, GPU-migration, and hybrid/KFS work tracked in [#5](https://github.com/devfloor9/engineering-playbook/issues/5), [#7](https://github.com/devfloor9/engineering-playbook/issues/7), and [#4](https://github.com/devfloor9/engineering-playbook/issues/4).

The [19 September 2026 document audit](audits/2026-09-19/README.md) covers all 628 Korean and English sources in its frozen inventory, including examples and visible technical components. It records every finding, primary-source reference, accepted correction and unresolved evidence gap. Full reading is complete; the report and linked issues distinguish that coverage from factual verification and remaining corrections. The [correction ledger](audits/2026-09-19/corrections.json) records subsequent reviewed changes and partial fixes without rewriting the original findings. Recent corrections cover request draining, private networking, model releases and evaluation workflows, with offline regression checks for the documented examples.

## Read the manual

The homepage introduces the topics and offers search, direct entry points, and reading paths. Articles share its typography, colors, navigation, and icon system while keeping technical content in readable tables, code blocks, and figures.

- Document titles are followed by creation and content-revision dates, reading estimates, and document tools.
- Tools provide **Copy link** and the **AI documentation guide** in muted blue-gray buttons. The guide explains the Markdown exports and discovery endpoints.
- Tables keep captions, column associations, and horizontal scrolling on narrow screens. Supported figures include source captions and data equivalents; Mermaid diagrams provide a keyboard-accessible zoom dialog.
- Korean is the source language. English counterparts live under `i18n/en/` and are available through the language selector. Translation coverage does not certify every example's operational behavior.

### Agentic AI Platform

The platform manual follows four sections:

1. **Design & Architecture** — foundations, platform selection, and advanced patterns.
2. **Model Serving** — GPU infrastructure, inference frameworks, optimization, and routing.
3. **Operations & MLOps** — observability, governance, evaluation, and data infrastructure.
4. **Reference Architecture** — gateway setup, model lifecycle, and integrations.

The architecture's six runtime layers and three shared planes describe platform responsibilities. The L0–L5 inference-tuning layers describe a separate performance-analysis view.

Recent observability guides connect serving changes with evidence:

- [LLM serving optimization and monitoring](docs/agentic-ai-platform/operations-mlops/observability/llm-serving-optimization-monitoring.md)
- [Prefix-cache tuning and accuracy correlation](docs/agentic-ai-platform/operations-mlops/observability/prefix-cache-tuning-accuracy-correlation.md)

For implementation code, see [AI on EKS](https://github.com/devfloor9/ai-on-eks) and [GenAI on EKS Starter Kit](https://github.com/devfloor9/sample-genai-on-eks-starter-kit).

## Use the documentation with AI tools

| Endpoint | Contents |
| --- | --- |
| [llms.txt](https://devfloor9.github.io/engineering-playbook/llms.txt) | Discovery index with page links and descriptions |
| [llms-full.txt](https://devfloor9.github.io/engineering-playbook/llms-full.txt) | Combined source text; it can contain MDX imports and JSX |
| [llm-wiki/manifest.json](https://devfloor9.github.io/engineering-playbook/llm-wiki/manifest.json) | Per-page metadata, Markdown URLs, source provenance, and content-coverage information |
| [llm-wiki/index.md](https://devfloor9.github.io/engineering-playbook/llm-wiki/index.md) | Links to component-aware Markdown pages grouped by domain |

The LLM Wiki exports Korean pages from six technical domains plus the root introduction. English pages, Industry Solutions, and sales material are excluded. Articles in either language provide link copying and access to the AI guide.

Supported static components export their text, table rows, navigation targets, and diagram equivalents from repository sources. Unknown runtime content is identified by an export note and a link to the web page. Inspect `content_coverage`, `rendered_sources`, and `omission_details` in the manifest; a clean snapshot does not imply support for arbitrary MDX. Interactive controls and animations are not reproduced.

See the [AI documentation guide](https://devfloor9.github.io/engineering-playbook/ai-docs) for endpoint selection and use. These are static HTTP resources that agents or MCP integrations can read; this repository does not deploy an MCP server.

## Repository layout

```text
docs/                                  # Korean source documents
├── intro.md                           # Reading paths and entry points
├── agentic-ai-platform/
│   ├── design-architecture/
│   ├── model-serving/
│   ├── operations-mlops/
│   └── reference-architecture/
├── eks-best-practices/
├── eks-hybrid-nodes/
├── rosa/
├── aidlc/
├── benchmarks/
├── industry-solutions/
└── sales/                             # Separate from the technical LLM exports
i18n/en/docusaurus-plugin-content-docs/current/
                                       # English document counterparts
src/components/                        # Shared icons, tables, figures, and tools
src/theme/                             # Document layout and metadata wrappers
slides/                                # Presentation source projects
static/                                # Published images, drawings, and slide bundles
scripts/                               # Export, metadata, and validation tools
audits/                                # Review coverage, evidence and correction records
sidebars.js                            # Documentation navigation
```

## Slides

Browse the [slide catalog](https://devfloor9.github.io/engineering-playbook/slides) for Agentic AI Platform's four blocks, GPU operations, EKS operations training, and other presentations.

The networking materials include:

- [eBPF Deep Dive](https://devfloor9.github.io/engineering-playbook/slides/ebpf-deep-dive/) — 39 slides, English with a Korean language switch.
- [EKS Networking Deep Dive](https://devfloor9.github.io/engineering-playbook/slides/eks-networking/) — 22 slides covering VPC CNI, IPAM, NetworkPolicy, and Network Flow Monitor.

Presentation source and published bundles must be updated together. The site catalog lives in `src/pages/slides/index.js`.

## Develop locally

Use Node.js 20 or newer. The lockfile pins the site's Docusaurus and React dependencies.

```sh
npm ci
npm start
```

The site is served under `/engineering-playbook/`. For the English development site:

```sh
npm start -- --locale en
```

Generate and inspect the deployable site, including the Markdown exports:

```sh
npm run generate-tags
npm run build
npm run generate-llms
npm run generate-llm-wiki
node scripts/validate-links.js --build-dir build
npm run serve
```

The development server alone does not generate the LLM artifacts. Use the production output to verify discovery and Markdown export endpoints. Generated files under `build/` are deployment artifacts and are not committed.

### Verification

```sh
npm run test:llm-wiki
npm run test:links
npm run test:tags
npm run test:tools
npm run test:ssr
npm run test:metadata
npm run test:examples
npm run test:mermaid
npm run test:gateway-benchmark
npm run validate-metadata
```

The GitHub Actions workflow checks the exporter, internal links, generated tag routes, document tools, Unicode rendering, revision metadata, documented examples with offline fixtures, and Gateway benchmark source/validator regressions. It builds Korean and English pages, generates the LLM artifacts, compares component exports with rendered HTML, and validates internal routes and fragments. Broken internal links fail the build. Pull requests build the site; successful builds on `main` deploy to GitHub Pages.

The document-example tests extract code and configuration from both language variants. Fake HTTP, database and controller clients exercise failure paths without running the examples against infrastructure. Python 3 is required alongside Node.js.

The Mermaid regression uses the installed renderer, authored Korean/English diagrams and production CSS in an isolated Chrome or Chromium process. It checks labels and geometry in both themes and motion preferences. Chrome/Chromium must be available on `PATH`, in the standard macOS location, or through `CHROME_BIN`; the test does not install a browser.

The [Gateway benchmark kit](scripts/benchmarks/gateway-api-benchmark/README.md) retains pinned upstream conformance reports and local fixture evidence. CI uses source checks and short loopback tests; it does not run Docker load tests or contact an AWS cluster. Implementation performance remains separate from fixture validation.

For changes to component output, run the rendered-HTML parity check locally after building:

```sh
LLM_WIKI_BASELINE_HTML="$PWD/build" npm run test:llm-wiki
```

## Contribute

Open an issue with the affected page, expected behavior, and supporting evidence. Keep changes focused, preserve public routes and heading anchors, and update the English counterpart when changing Korean technical content. Use English for issue proposals, pull request descriptions, and commit messages.

Use shared components and design tokens for interface changes. Preserve the meaning of table cells, status labels, and diagrams in both the web page and the LLM export. Review technical facts independently from presentation changes.

Write for a reader who understands basic programming but may be new to the service:

- Begin with the problem the reader needs to solve. Name the component doing the work and explain what happens to a request or its data.
- Define a specialized term when it first matters. For example, explain that a KV cache stores earlier tokens' key and value tensors to avoid recalculating them.
- State the conditions behind a recommendation. Label proposed designs, estimates, reported measurements, and completed tests accurately; a design goal is not a guaranteed outcome.
- Keep procedures, tables, and diagrams that help the reader act. Remove repeated conclusions, promotional claims, and analogies that require more explanation than the underlying mechanism.
- Review Korean and English together for meaning, prerequisites, and limitations. Use natural phrasing in each language while preserving commands, citations, routes, and heading anchors.

`last_update.date` records a content revision, not a deployment or the last Git
commit. Update it when changing explanations, examples, data, recommendations,
or references. Preserve it for layout, typography, icons, Markdown formatting,
navigation styling, and equivalent table or diagram rendering. Keep `created`
and author attribution unchanged.

After reviewing a content edit, update its date and reading estimate together:

```sh
npm run update-doc-metadata -- --kind content --date YYYY-MM-DD --apply docs/path/to/article.md
```

Apply the same process to an edited English counterpart. The estimate uses
visible prose and table text, including supported static components; code blocks,
markup, link destinations, and decorative icons do not add reading time. The existing rate is
424 characters per minute, rounded up, so a small edit can leave the displayed
minutes unchanged. An unsupported component stops the update for review.

For presentation changes, leave both fields intact. The command supports
`--kind presentation` as a no-change check. It does not infer whether a change
is substantive; that distinction belongs in the document review. Builds and
metadata normalization must not assign the current date to an unchanged article.

## License

Content in this project is available under the [MIT License](LICENSE).
