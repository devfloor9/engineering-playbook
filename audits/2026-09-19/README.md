# Full document audit — 19 September 2026

All **628 baseline documents** were read: **314 Korean and 314 English sources, totaling 192,321 lines**. The review included code blocks, tables, diagram definitions, appendices and the technical content displayed by imported components. It assessed meaning and evidence as well as wording.

The review found problems that a phrase scan could not establish: examples that disagree with their API, calculations with incorrect units, unmeasured outcomes described as results, incomplete recovery procedures and differences between the two languages. The catalogs below retain all **4,366 recorded source occurrences**, grouped into **2,191 review items**. These totals include accepted corrections, unresolved assessments and explicit withdrawals. They are neither a count of confirmed errors nor a measure of independent production failures.

**Full reading is complete. Factual verification and correction remain open where the required evidence or source change is missing.** The original records include 488 documents with verification pending, 91 with findings and no recorded pending status, and 49 with no findings recorded. “No findings” does not certify a document. These baseline statuses are preserved separately from later correction records.

## Scope and method

The frozen inventory is commit `eb93387d33bd991beef2c4885890a312a093b5c3`. [documents.json](documents.json) lists every source path, language, SHA-256, line count, consecutive reading ranges, original review status and finding IDs. It excludes unrelated untracked work and later additions. [coverage.json](coverage.json) records the totals and review boundaries.

Reviewers read separate source groups and compared Korean and English passages. They checked factual claims against the recorded primary documentation, versioned source code, schemas and available measurement artifacts. They also examined the visible technical content of imported components; component locations remain distinct from the documents that embed them. A single editor integrated source corrections and reconciled the final wording.

The records contain 3,902 section-level claim checks and 1,154 unresolved claim entries. A section check may cover several statements, and an evidence gap may overlap a finding. Neither count should be added to the finding total or used as a percentage of facts verified.

The assessment categories distinguish:

- **Confirmed mismatch:** a concrete claim, calculation or example conflicts with the inspected source, versioned contract or deterministic check.
- **Misleading or unsupported:** a passage omits material conditions, conflates different mechanisms or exceeds its available evidence. This does not establish that the underlying feature or result is impossible.
- **Verification pending:** the evidence does not permit a verdict, often because historical measurements, private implementation records, licensed normative text or runtime checks are unavailable.
- **Corrected or withdrawn:** a later source change addresses the finding, or reinspection shows that the original objection should not stand. The original occurrence remains in the record.

Package schemas retain finer distinctions and claim-specific qualifications. A classification on a compound finding does not automatically apply to every neighboring statement.
The scheduling and industry packets retain correction dispositions rather than a uniform factual classification. Their 407 items are not silently counted as confirmed errors.

## Complete findings

Each index lists every item in its package and links to the original source. The accompanying JSON retains all locale occurrences, exact passages or explicitly documented privacy redactions, proposed correction meaning, evidence references and limits.

| Review package | Documents | Grouped items | Original occurrences |
| --- | ---: | ---: | ---: |
| [Introduction and benchmarks](benchmarks/README.md) | 20 | 43 | 86 |
| [Agentic design and model serving](agentic-design-serving/README.md) | 82 | 391 | 754 |
| [Agentic operations](agentic-operations/README.md) | 58 | 214 | 403 |
| [Agentic reference implementations](agentic-reference/README.md) | 16 | 80 | 148 |
| [EKS platform and networking](eks-platform-networking/README.md) | 58 | 201 | 394 |
| [EKS operations and lifecycle](eks-operations/README.md) | 56 | 251 | 514 |
| [EKS scheduling and resiliency](eks-scheduling/README.md) | 4 | 124 | 248 |
| [Industry examples](industry/README.md) | 178 | 283 | 563 |
| [AI-DLC](aidlc/README.md) | 90 | 404 | 856 |
| [Hybrid Nodes, ROSA and EKS operations addendum](hybrid-rosa-and-operations/README.md) | 66 | 200 | 400 |
| **Total** | **628** | **2,191** | **4,366** |

The final package contains 54 Hybrid/ROSA/sales sources and 12 EKS operations sources. Each document belongs to one package. Related findings in different documents can remain separate; grouping is not a global root-cause deduplication.

## What changed during the audit

Corrections were committed separately from the frozen records. The catalogs connect 86 grouped items to accepted source corrections; neighboring claims can still require evidence. Four additional Harbor findings discovered while reviewing the correction are recorded separately from the baseline totals.

| Area | Source correction | Commit |
| --- | --- | --- |
| CNI measurements | Reconciled mean sender RTT, HTTP p99, chart values and runner settings; distinguished requested configuration from verified activation. | `3e18dbd3`, `21ee05f6` |
| Llama 4 comparison | Corrected model and hardware specifications; replaced unsupported rankings and projected results with explicit experiment conditions. | `e9445c68` |
| Dynamo plan | Corrected hardware, model-memory and resource-comparison assumptions. | `7e2efdab` |
| AgentCore comparison | Separated runtime hosting, model serving and gateway experiments, including distinct caching and billing assumptions. | `03b1a24d` |
| Gateway evidence | Preserved frozen raw artifacts, documented probe-image provenance and exposed malformed conformance metadata through the analyzer. | `b5c27324` |
| Hybrid benchmark outline | Distinguished sites from AWS Regions and described an unexecuted measurement plan with explicit fabric requirements. | `5f7e6b68` |
| Harbor | Repaired runtime configuration, credential handling, certificate setup and backup/recovery guidance. | `7e7cb57a` |
| ROSA | Separated HCP/Classic responsibility and access boundaries, and labeled historical installation output and untested assumptions. | `2761da9b` |
| EKS scheduling | Removed unsafe bulk rollback, corrected PDB rounding, GPU resource requests, affinity conditions and toleration defaults. | `8a5f693c`, `12166b9f` |

The compact navbar and Mermaid geometry and title-layout changes concern presentation. They preserve article revision dates. LLM export tests now check the reviewed replacements for removed benchmark components in both Markdown and actual rendered HTML, while retaining checks for active components.

One scheduling finding, `EKSN-RES-022`, was withdrawn after rechecking the alias. The CNI review also withdrew its initial suggestion to exclude DSR/XDP after inspecting the runner; the accepted correction distinguishes requested settings from observed activation. [editorial-qualifications.json](editorial-qualifications.json) records final assessment wording changes without altering source quotations.

## Remaining correction work

[tracking.json](tracking.json) assigns every grouped item to a registered GitHub issue. Each workstream requires a disposition for the complete assigned inventory, not only the examples in an issue description.

The new correction workstreams are:

- [#95 — Agentic architecture and serving](https://github.com/devfloor9/engineering-playbook/issues/95): 391 items covering model sizing, runtime contracts, examples, security boundaries and bilingual presentation.
- [#96 — Agentic operations and reference implementations](https://github.com/devfloor9/engineering-playbook/issues/96): 294 items covering request lifetimes, deployment artifacts, telemetry, evaluation and integrations.
- [#97 — EKS platform and networking](https://github.com/devfloor9/engineering-playbook/issues/97): 201 items covering access, Gateway API, networking, mesh, DRA and resource optimization.
- [#98 — EKS operations](https://github.com/devfloor9/engineering-playbook/issues/98): 316 items covering lifecycle, readiness, identity, diagnostics, node management and recovery.
- [#99 — AI-DLC](https://github.com/devfloor9/engineering-playbook/issues/99): 404 items covering methodology, executable examples, approvals, evaluation, quantities and legal scope.
- [#100 — Industry and sales examples](https://github.com/devfloor9/engineering-playbook/issues/100): 283 industry items and 14 sales/event items covering evidence, implementation status and assumptions.

The remaining Hybrid Nodes and scheduling/resiliency corrections continue in [#88](https://github.com/devfloor9/engineering-playbook/issues/88) and [#92](https://github.com/devfloor9/engineering-playbook/issues/92). The tracking file records 86 accepted source corrections, 2,104 open review items and one withdrawn finding. “Open” includes unresolved evidence and misleading qualifications; it does not mean 2,104 confirmed errors.

Follow-up edits must preserve useful detail, routes, anchors, creation dates and author attribution. Content changes update the revision date and reading estimate together; presentation-only changes preserve them.

## Evidence and verification limits

Source integrity checks verify coverage, hashes, consecutive reading ranges and finding associations. They do not prove that every statement is true. Static schema, syntax and fixture checks establish only their stated scope. Builds and browser checks establish rendering and export behavior.

No cloud deployment, Kubernetes mutation, container benchmark, model workload, recovery exercise or fault injection was executed for this audit. Historical run provenance, performance rankings, customer participation, private integrations, prices and compliance applicability remain unresolved unless the individual record supplies adequate evidence. An absent public source is not proof that a private result or integration never existed.

Operator acceptance in [#4](https://github.com/devfloor9/engineering-playbook/issues/4), [#5](https://github.com/devfloor9/engineering-playbook/issues/5) and [#7](https://github.com/devfloor9/engineering-playbook/issues/7), and live Gateway performance work in [#80](https://github.com/devfloor9/engineering-playbook/issues/80), remain distinct from this documentary review.

The public payload contains repository-relative source references and public evidence provenance, not cached third-party pages, credentials or private workspace paths. Privacy redactions are explicit. Three design/serving evidence transfers have text-level provenance but no retained original-byte hash; their package records preserve that limitation.

The [legal reconfirmation record](aidlc/legal-reconfirmation.json) distinguishes current provisions from changes adopted after a document's revision date. It does not establish compliance for a particular organization or system.

See [verification.json](verification.json) for recorded checks and verification limits, and [manifest.json](manifest.json) for the complete data file inventory. Package preparation notes describe their original review stage; the central tracking file records subsequent issue ownership.
