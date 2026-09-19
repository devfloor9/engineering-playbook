// Published aggregate values from scripts/benchmarks/cni-benchmark/results.
// The original per-run logs and effective cluster configuration are unavailable.
export const scenarios = [
  {id: 'A', label: 'VPC CNI', color: 'var(--ep-chart-1)', tcp: 12.41, udp: 10.00, loss: 20.39, rtt: 4894, p99: 10.92, qps: 4103.9},
  {id: 'B', label: 'Cilium + kube-proxy', color: 'var(--ep-chart-2)', tcp: 12.34, udp: 7.92, loss: 0.94, rtt: 4955, p99: 9.87, qps: 4044.7},
  {id: 'C', label: 'Cilium, no kube-proxy', color: 'var(--ep-chart-3)', tcp: 12.34, udp: 7.92, loss: 0.69, rtt: 5092, p99: 8.91, qps: 4019.3},
  {id: 'D', label: 'Cilium ENI', color: 'var(--ep-chart-4)', tcp: 12.41, udp: 10.00, loss: 20.42, rtt: 4453, p99: 8.75, qps: 4026.4},
  {id: 'E', label: 'Cilium ENI, additional options', color: 'var(--ep-chart-5)', tcp: 12.40, udp: 7.96, loss: 0.03, rtt: 3135, p99: 9.89, qps: 4181.9},
];
