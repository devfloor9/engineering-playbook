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

## Subsequent source corrections

[corrections.json](corrections.json) records later decisions without changing the frozen catalogs. The first follow-up covered 62 items in 12 Korean/English documents: 58 source corrections accepted and four still partial.

| Area | Reviewed change | Source commit |
| --- | --- | --- |
| Request shutdown | Drain admitted HTTP work and database transactions; preserve failure and timeout outcomes. | `876fde94` |
| Hybrid private endpoints | Separate the Kubernetes API and service endpoints; correct the on-premises S3 interface path and DNS prerequisites. | `58fbb05c` |
| MoE serving | Correct routing, memory and hardware comparisons; retire eight faulty shared tables while preserving export checks. | `a9b9c629` |
| Gateway authentication | Use supported controller-specific APIs and route browser authentication through the proxy. | `0ffe5ec4` |
| EKS resiliency | Correct scheduling, readiness, storage and fault-action examples; replace unsafe bulk procedures and qualify recovery claims. | `48a061b8` |

The Trainium specification conflict remains open as `ADS-MOE-008`. Gateway items `EPN-CB-003`, `EPN-CB-004` and `EPN-CB-006` remain partial because related rate-limit, session-affinity and legacy API examples occur outside the corrected authentication section. No workstream issue is closed by this subset.

The second follow-up covers 68 items in 10 Korean/English documents: 65 source corrections accepted and three partial. Together with the initial 86 and first follow-up's 58, this gives 209 accepted source corrections.

| Area | Reviewed change | Source commit |
| --- | --- | --- |
| AI-DLC evaluation and governance | Match paired comparisons and approval thresholds; recover the winning durable result without repeating completed evaluation. | `64c24adf` |
| Model release and rollout | Require approved immutable artifacts, create separate release resources, and reject missing or stale canary observations. | `b8b7f617` |
| Trace datasets and reward evaluation | Validate approved snapshots and manifests; preserve per-sample results and recheck authorization on synchronous and asynchronous requests. | `156896e6` |

At that point, `AIDLC-C025`, `AIDLC-C026` and `AIDLC-C027` remained partial: four unsupported Bedrock prompt-alias operations, two recovery explanations and two legal-policy explanations occurred in other documents. The evaluation changes do not establish production model quality, deployment success or legal compliance.

The third follow-up covers 52 items in 10 Korean/English documents: 51 source corrections accepted and one partial. The three AI-DLC items above now have accepted source corrections across all 14 original locations, retaining both the earlier governance changes and the new registry/index changes. Legal applicability remains unverified.

| Area | Reviewed change | Source commit |
| --- | --- | --- |
| Fargate lifecycle | Correct patch notifications, eviction boundaries, probe timing, logging, observability and platform comparisons. | `fb04660b` |
| Node scheduling and readiness | Correct ownership, resource placement, pressure eviction, migration and external readiness-controller examples. | `6d0642e3` |
| Distributed serving | Separate prefill/decode serving from coupled TP/PP; wire LWS ranks, rendezvous, GPU allocation, checkpoint mounts and leader health routing. | `76eb06e5` |
| Prompt versions and recovery | Replace unsupported Bedrock aliases, use returned version ARNs, distinguish registry changes from traffic recovery and qualify retention policies. | `1e9bdc1c` |

At the end of the third follow-up, `EKSN-POD-020` remained partial because 13 related locations outside the scheduling pair still used obsolete Karpenter fields. The Trainium specification conflict and three Gateway cookbook corrections also remained open.

The fourth follow-up adds 26 decisions across 11 document sources and one shared component: 24 accepted source corrections and two partial corrections. It completes the four previous Gateway/Karpenter partial corrections by checking all 29 later locations and preserving their earlier fixes.

| Area | Reviewed change | Source commit |
| --- | --- | --- |
| Prompt promotion | Use the returned Langfuse prompt name/version and supported label API, with explicit approval and concurrency requirements. | `4eae31a1` |
| Init containers | Correct retry behavior, failure propagation, configuration serialization, bounded TCP checks and Fluent Bit arguments. | `d1cf978a` |
| Gateway cookbook | Correct Cilium, NGINX Gateway Fabric and kgateway rate, persistence, body-limit and maintenance examples; clarify the NetworkPolicy boundary. | `a1e450a4` |
| Langfuse installation | Pin chart 2.1.1, use the consumed configuration fields and Secret references, and document external stores and migrations. | `c63c34e7` |
| Karpenter fields | Correct the 13 remaining consolidation/expiration locations, including the English GPU table; preserve the Korean component output. | `94a25ba5` |
| AZ placement and traffic | Correct topology arithmetic, distinguish ARC traffic shifts from Pod replacement, and repair Istio and alarm examples. | `2f68ff9b` |

At the end of the fourth follow-up, `HYP-OPS-073` remained partial because eight registered selector defects occurred in four other document pairs. `EKSN-POD-077` retained four outside Istio-field occurrences. The full offline example suite passed 678 tests. Metadata was checked for all 11 changed sources, and five Korean pages passed desktop/mobile browser checks.

The fifth follow-up accepts six source corrections, including the two partial items above. Its records cover all 24 original occurrence associations across 18 distinct source files, retaining the earlier init-container and scheduling fixes. The Istio assessment also clarifies that the inspected CRDs accept the deprecated field; the correction selects the documented full-5xx policy without claiming universal schema rejection.

| Area | Reviewed change | Source commit |
| --- | --- | --- |
| Deployment selectors | Complete selectors and matching Pod labels in the eight remaining registered occurrences; preserve the earlier init-container fixes. | `3054fb46` |
| Karpenter budgets | Distinguish node age from consolidation delay; correct schedule durations, defaults, active limits and unavailable-node counting. | `254ba2ef` |
| Istio outliers and routing | Correct the remaining outlier examples, external-service visibility and failover routing prerequisites. | `7667b702` |
| IP capacity and CPU sizing | Correct address arithmetic, configuration updates, instance limits, CPU accounting and sizing guidance in the separate PR #104 review. | `d2da2924` |

The [PR #104 follow-up report](pr104-follow-up.md) records 13 supplemental findings separately from the frozen 2,191-item inventory. Across this follow-up, 20 document sources received content corrections and three received reading-time-only corrections with their content dates preserved. All 23 sources passed MDX and metadata checks; 631 heading identities and seven explicit anchors were preserved. The full offline example suite passed 852 checks, and the metadata suite passed 10 tests. Changed Korean article views passed desktop/mobile checks; the changed Karpenter and CPU diagrams were rendered in both languages.

The Trainium specification conflict, neighboring findings and operational evidence remain separate work. These checks do not establish controller admission, live routing, cloud execution, recovery, CPU performance or address usage in an operating cluster.

Each ledger entry identifies the source commit, reviewed files, checks and remaining limits. Offline examples use fakes or parsers; browser checks establish rendering. Neither establishes successful cloud execution, fault recovery or measured performance. Later entries, if present, are authoritative for subsequent decisions; the original occurrence and classification totals remain unchanged.

## Remaining correction work

[tracking.json](tracking.json) assigns every grouped item to a registered GitHub issue. Each workstream requires a disposition for the complete assigned inventory, not only the examples in an issue description.

The new correction workstreams are:

- [#95 — Agentic architecture and serving](https://github.com/devfloor9/engineering-playbook/issues/95): 391 items covering model sizing, runtime contracts, examples, security boundaries and bilingual presentation.
- [#96 — Agentic operations and reference implementations](https://github.com/devfloor9/engineering-playbook/issues/96): 294 items covering request lifetimes, deployment artifacts, telemetry, evaluation and integrations.
- [#97 — EKS platform and networking](https://github.com/devfloor9/engineering-playbook/issues/97): 201 items covering access, Gateway API, networking, mesh, DRA and resource optimization.
- [#98 — EKS operations](https://github.com/devfloor9/engineering-playbook/issues/98): 316 items covering lifecycle, readiness, identity, diagnostics, node management and recovery.
- [#99 — AI-DLC](https://github.com/devfloor9/engineering-playbook/issues/99): 404 items covering methodology, executable examples, approvals, evaluation, quantities and legal scope.
- [#100 — Industry and sales examples](https://github.com/devfloor9/engineering-playbook/issues/100): 283 industry items and 14 sales/event items covering evidence, implementation status and assumptions.

The remaining Hybrid Nodes and scheduling/resiliency corrections continue in [#88](https://github.com/devfloor9/engineering-playbook/issues/88) and [#92](https://github.com/devfloor9/engineering-playbook/issues/92). The tracking file now records 290 accepted source corrections, 1,900 open review items and one withdrawn finding. “Open” includes unresolved evidence and misleading qualifications; it does not mean 1,900 confirmed errors.

Follow-up edits must preserve useful detail, routes, anchors, creation dates and author attribution. Content changes update the revision date and reading estimate together; presentation-only changes preserve them.

## Evidence and verification limits

Source integrity checks verify coverage, hashes, consecutive reading ranges and finding associations. They do not prove that every statement is true. Static schema, syntax and fixture checks establish only their stated scope. Builds and browser checks establish rendering and export behavior.

No cloud deployment, Kubernetes mutation, container benchmark, model workload, recovery exercise or fault injection was executed for this audit. Historical run provenance, performance rankings, customer participation, private integrations, prices and compliance applicability remain unresolved unless the individual record supplies adequate evidence. An absent public source is not proof that a private result or integration never existed.

Operator acceptance in [#4](https://github.com/devfloor9/engineering-playbook/issues/4), [#5](https://github.com/devfloor9/engineering-playbook/issues/5) and [#7](https://github.com/devfloor9/engineering-playbook/issues/7), and live Gateway performance work in [#80](https://github.com/devfloor9/engineering-playbook/issues/80), remain distinct from this documentary review.

The public payload contains repository-relative source references and public evidence provenance, not cached third-party pages, credentials or private workspace paths. Privacy redactions are explicit. Three design/serving evidence transfers have text-level provenance but no retained original-byte hash; their package records preserve that limitation.

The [legal reconfirmation record](aidlc/legal-reconfirmation.json) distinguishes current provisions from changes adopted after a document's revision date. It does not establish compliance for a particular organization or system.

See [verification.json](verification.json) for recorded checks and verification limits, and [manifest.json](manifest.json) for the complete data file inventory. Package preparation notes describe their original review stage; the central tracking file records subsequent issue ownership.
