# Slide review — issue #64

The existing 22-slide EKS Networking draft and 39-slide English eBPF packed
export are retained. The review corrects technical claims and examples,
adds evidence links, and repairs navigation, accessibility, and rendering.
No AWS or Kubernetes resources were inspected or changed.

## EKS Networking

The source is this directory. The checked-in deployment is
`static/slides/eks-networking/`, following the repository's existing Vite
slide convention. It contains only `index.html`, the favicon, and the
generated JavaScript and CSS.

The VPC CNI diagrams describe the standard Linux IPv4 routed path.
Security Groups for Pods, IPv6, and external SNAT are identified as distinct
paths or configurations. Source-derived details are tied to these revisions:

- [VPC CNI dd78f8bb](https://github.com/aws/amazon-vpc-cni-k8s/tree/dd78f8bb498e5a581bd29565476bb1bf6f4fd96e)
- [Network Flow Monitor 3bf328bc](https://github.com/aws/network-flow-monitor-agent/tree/3bf328bc44c53ffb2a35696e58484c06fc4259f8)

Each slide exposes relevant primary sources through `src/slideDetails.ts`.
The NFM revision identifies the controller as version 1.1.8; it does not
claim that every EKS add-on release has identical defaults or permissions.

Corrections include the namespace/Pod-name veth hash, CRI runtime invocation,
warm-pool exhaustion, batched IP allocation, prefix-mode targets, subnet
capacity versus ENI slot capacity, SNAT exceptions, non-forced pool shrink,
NHI interpretation, retained capabilities, and limits on sampling/enrichment.
The malformed installation command is replaced with a complete read-only
verification example; the installation procedure remains linked.

The deck keeps the existing shared visual components unchanged. Its local
navigation adds labeled controls, a slide selector, live position
announcements, hash restoration, and guards for focused controls and
scrollable diagrams. The local diagram wrapper provides a text equivalent.
Tailwind explicitly scans the shared source directory.

## Isolated build

Node v25.6.0, npm 11.8.0, and Vite 6.4.3 were used for this review.
`package-lock.json` records the resolved dependencies. Both `npm run
typecheck` and `npm run build` passed in a temporary copy with its own
dependency tree. Shared `node_modules` and the root manifests were untouched.

From a clean repository checkout, the same isolation can be reproduced with:

```bash
review_dir="$(mktemp -d)"
mkdir -p "$review_dir/slides"
cp -R slides/eks-networking slides/shared "$review_dir/slides/"
(
  cd "$review_dir/slides/eks-networking"
  npm ci --ignore-scripts --no-audit --no-fund
  ln -s eks-networking/node_modules ../node_modules
  npm run typecheck
  npm run build
)
```

The sibling dependency symlink exists only in the temporary copy and lets
TypeScript resolve dependencies imported by the shared source files.

## eBPF export and canonical source handoff

The original packed export was byte-for-byte identical to the output of
the existing canonical four-file deck. Only the packed HTML was assigned
for editing. A temporary copy of the canonical sources was corrected and
repacked through the repository's `pack_deck.py` validator.

The **unapplied** [canonical-source patch](review/ebpf-source-corrections.patch)
records those exact edits. `git apply --check` passed. The patch is handoff
material; it has not changed the shared canonical files.

Before regenerating or publishing the canonical eBPF routes, the coordinator
must review/apply the patch to `slides/ebpf-deep-dive/{index.html,styles.css,deck.js}`,
align the corresponding Korean claims in `index-ko.html`, and synchronize
the existing `static/slides/ebpf-deep-dive/` copies. Otherwise a later pack
would restore the superseded claims and navigation behavior.

The export keeps its slide count, structure, diagrams, speaker identity,
notes, resource links, and embedded license notice. Corrections include:

- Verifier safety is not a guarantee against kernel bugs; JIT is not zero cost.
- Basic versus wide BPF instructions and load-time CO-RE relocation.
- Bounded ring capacity, configurable perf wakeups, and the ring-buffer
  notification condition.
- Valid BCC `memleak` positional interval syntax.
- Scheduler delay is not sufficient proof of quota throttling.
- Hook-specific enforcement, optional Cilium features, and NFM permissions.
- Historical benchmark values are attributed to the repository report and
  explicitly not reproduced; causal and sustained-bandwidth claims are removed.

Supporting primary references include the
[kernel verifier](https://docs.kernel.org/bpf/verifier.html),
[BPF instruction set](https://docs.kernel.org/bpf/standardization/instruction-set.html),
[ring buffer](https://docs.kernel.org/bpf/ringbuf.html),
[libbpf](https://docs.kernel.org/bpf/libbpf/libbpf_overview.html),
[perf wakeup fields](https://github.com/torvalds/linux/blob/master/include/uapi/linux/perf_event.h),
[BCC memleak](https://github.com/iovisor/bcc/blob/master/tools/memleak.py),
and [cgroup CPU statistics](https://docs.kernel.org/admin-guide/cgroup-v2.html).

## Coordinator integration

Add an EKS Networking card to the existing Kernel & Networking category in
`src/pages/slides/index.js`: title **EKS Networking Deep Dive**, count **22**,
route **`/slides/eks-networking/`**, description covering VPC CNI, IPAM,
NetworkPolicy, and Network Flow Monitor. The built artifact already uses
relative URLs suitable for the site's base path.

The eBPF card remains at **39** slides. Its existing EN/KO routes need the
canonical synchronization described above. A downloadable packed export
may be registered separately by the coordinator.

No shared navigation, canonical eBPF source, root package files, or shared
slide components were changed by this review. No push, merge, or issue
comment was performed. The integrated Docusaurus build remains the
coordinator's responsibility.

## Validation boundaries

The Python veth example ran and returned `eni0d7763386da`. Both Bash examples
passed `bash -n`; Linux host inspection commands, BPF programs, and AWS CLI
commands were not executed. The abbreviated Go fragment is explicitly
labeled as a non-standalone source excerpt.

The dosirak validator and JavaScript syntax checks passed. Font stylesheets
remain external, as disclosed by the export's existing license notice;
system font fallbacks are retained. Source paths at the pinned revisions
and the newly added AWS documentation URLs were checked.

CUA rendered all 22 EKS and 39 eBPF slides in a dedicated temporary tab,
using 1280×720 deck frames. The final EKS slide 15 had zero horizontal or
vertical overflow. EKS keyboard checks passed for ArrowRight, Space on the
Next button (one advance), Home/End, disabled boundary buttons, selection,
and restoring the selected slide after reload.

At 390×844, the inspected EKS slide 20 and eBPF slide 35 had zero horizontal
overflow and retained scrollable vertical content. The eBPF mobile check
revealed a label overlap in the ladder cards; the export now stacks those
card fields below 700px. The subsequent eBPF keyboard and mobile recheck
initially timed out, then passed after the temporary browser tab recovered.
All four inspected card labels sit above their text with an 8px gap.
eBPF checks confirmed Home/End, Space on Next (one advance), opening and
closing presenter setup with focus restored, 38 inactive slides marked
inert, and the unavailable language switch hidden in the packed export.
Print/PDF, speaker-popup behavior, touch gestures, and a complete
screen-reader audit were not tested.

An AWS specialist call was attempted first and timed out. Verification then
used public AWS documentation and official source repositories directly.
No specialist answer or cloud validation is claimed.
