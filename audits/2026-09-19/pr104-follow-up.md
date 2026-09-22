# IP capacity and CPU sizing review

Issue [#106](https://github.com/devfloor9/engineering-playbook/issues/106) records the follow-up review of [#104](https://github.com/devfloor9/engineering-playbook/pull/104), merged at `90a153465670e8dc284d64a5878e380af4bd5d0c`. The review read all four new Korean and English articles and the changes to eight existing articles.

The four new articles were added after the frozen 628-document audit. The 13 findings below are supplemental; they do not change that inventory, its original quotations, or the 2,191-item correction count. The related networking troubleshooting warning was also corrected in both languages.

## Source corrections

| Finding | Correction |
| --- | --- |
| PR104-01 | Replace the partial VPC CNI add-on update with a reviewed complete configuration file. Save API and effective configuration, check the update result and running Pod settings, and retain a recovery procedure. `PRESERVE` alone does not establish convergence. |
| PR104-02 | Include ordinary/trunk ENI primary addresses and branch addresses in the node IPv4 budget. Separate that total from the Pod pool. Correct the balanced 2,000-Pod example to 2,122 pool addresses and the packed example to 2,133. |
| PR104-03 | Remove the unsupported inference that 16 Pods consume only one NAU. Keep address inventory and the published NAU resource accounting separate. |
| PR104-04 | Explain the disagreement between the CNI README's 234 secondary-IP example and the controller's 8 × (30 − 1) = 232 raw slots. Do not present either as an observed post-trunk Pod limit. |
| PR104-05 | Scope branch-ENI limits to affected nodes and SGP workloads; they do not stop every new Pod or node. |
| PR104-06 | Explain weighted NodePools as preferences and limits as eventually consistent, rather than strict fallback or IP-protection guarantees. |
| PR104-07 | Distinguish Auto Mode's NodeClass-level Pod security groups from per-Pod SecurityGroupPolicy. Preserve supported NodeClass fields. |
| PR104-08 | Correct cost per 1,000 requests to `H × 1000 / (3600 × R)`, where `H` is hourly cost and `R` is sustained RPS. |
| PR104-09 | Define the CPU-utilization denominator and distinguish utilization from measured performance. Qualify SMT, cache-sharing domains and kernel scheduler versions instead of asserting universal hardware relationships. |
| PR104-10 | Distinguish CPU Manager's exclusive logical CPUs from whole-core isolation. Label the NodeClass as a configuration fragment, retain nonzero CPU reservations, correct the two-field `cpu.max` notation, and explain the scope of `cpuCFSQuota`. |
| PR104-11 | Explain that equal namespace memory quotas constrain aggregate requests and limits separately; they do not enforce per-container equality or Guaranteed QoS. |
| PR104-12 | Remove the claim that raising CPU requests alone reduces a fixed replica count or Pod IP consumption. Mark sizing values as workload examples. |
| PR104-13 | Present perf and eBPF as alternative investigation paths and qualify BCC build requirements instead of requiring CO-RE/BTF for every tool. |

The scheduler, cache-domain, ancestor-quota and `cpu.max` refinements remain under PR104-09/10. They do not create additional finding identities. `spec.ipPrefixCount` was checked against the Karpenter v1.14.1 CRD and retained.

## Verification

The portable `scripts/tests/document-examples/ip-capacity-cpu-sizing.test.cjs` suite passes 45 checks against the corrected source. It reads the actual table operands, formulas, YAML and command arguments; mutation controls verify that the original arithmetic and configuration defects are rejected. Its original-source run fails as expected.

Independent review accounts for all 13 findings, their 52 original source occurrences and 60 proposed correction records. It also reviewed the final explanatory changes. Technical edits refresh the affected articles' content date and calculated reading time. Three additional reading-time corrections preserve their existing dates and article bodies.

These are source, arithmetic and configuration-contract checks. No cluster, add-on update, CPU policy, traffic load, benchmark or fault operation was executed. The review does not establish actual NAU consumption, post-trunk instance capacity, add-on convergence, CPU isolation or measured performance. Version-dependent settings still require validation against the intended environment.

## Primary references

- [Amazon EKS add-ons advanced configuration](https://aws.amazon.com/blogs/containers/amazon-eks-add-ons-advanced-configuration/) and [Update an Amazon EKS add-on](https://docs.aws.amazon.com/eks/latest/userguide/updating-an-add-on.html).
- [VPC network address usage](https://docs.aws.amazon.com/vpc/latest/userguide/network-address-usage.html).
- [Pinned VPC resource-controller limits](https://github.com/aws/amazon-vpc-resource-controller-k8s/blob/93df905c6fb7bec57d90afd490e926b1ad04a57e/pkg/aws/vpc/limits.go).
- [Karpenter v1.14.1 EC2NodeClass schema](https://github.com/aws/karpenter-provider-aws/blob/bde00654cd316fddb3dccfba3f5ac07039865429/pkg/apis/crds/karpenter.k8s.aws_ec2nodeclasses.yaml) and [weighted NodePools](https://karpenter.sh/docs/concepts/scheduling/#weighted-nodepools).
- [EKS Auto Mode NodeClass configuration](https://docs.aws.amazon.com/eks/latest/userguide/create-node-class.html).
- [Kubernetes CPU management](https://kubernetes.io/docs/tasks/administer-cluster/cpu-management-policies/) and [ResourceQuota](https://kubernetes.io/docs/concepts/policy/resource-quotas/).
- [Linux EEVDF](https://docs.kernel.org/scheduler/sched-eevdf.html), [CPU-cache ABI](https://docs.kernel.org/admin-guide/abi-testing.html), [cgroup v2](https://docs.kernel.org/admin-guide/cgroup-v2.html#cpu-interface-files), and [bandwidth hierarchy](https://docs.kernel.org/scheduler/sched-bwc.html#hierarchical-considerations).
