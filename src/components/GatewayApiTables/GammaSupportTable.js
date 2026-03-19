import React, { useState } from 'react';

const implementations = {
  ko: [
    {
      name: 'AWS VPC Lattice + ACK',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'AWS 관리형 (VPC 레벨)',
      sidecar: '❌ 불필요',
      gamma: '✅ Gateway API via ACK',
      features: {
        mTLS: '✅ IAM + SigV4',
        l7Routing: '✅ HTTPRoute',
        trafficSplit: '✅ 가중치 기반',
        retryTimeout: '✅ 네이티브',
        faultInjection: '✅ AWS FIS 연동',
        observability: 'CloudWatch, X-Ray',
      },
      overhead: '없음 (관리형)',
      strength: 'AWS 네이티브, 사이드카 없음, SLA 보장, ACK로 K8s CRD 관리',
    },
    {
      name: 'Istio Ambient Mode',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'ztunnel (L4) + waypoint (L7)',
      sidecar: '❌ 불필요 (Ambient)',
      gamma: '✅ 완전 지원',
      features: {
        mTLS: '✅ 자동 (ztunnel)',
        l7Routing: '✅ HTTPRoute, GRPCRoute',
        trafficSplit: '✅ 가중치 기반',
        retryTimeout: '✅ 네이티브',
        faultInjection: '✅ 네이티브',
        observability: 'Kiali, Jaeger, Prometheus',
      },
      overhead: '낮음 (ztunnel DaemonSet)',
      strength: '가장 성숙한 GAMMA 구현, Ambient로 사이드카 제거, 풍부한 생태계',
    },
    {
      name: 'Cilium',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'eBPF + Envoy (L7)',
      sidecar: '❌ 불필요 (eBPF)',
      gamma: '✅ HTTPRoute → Service',
      features: {
        mTLS: '✅ WireGuard/IPsec',
        l7Routing: '✅ HTTPRoute',
        trafficSplit: '✅ 가중치 기반',
        retryTimeout: '✅ CiliumNetworkPolicy',
        faultInjection: '⚠️ 제한적',
        observability: 'Hubble (Service Map)',
      },
      overhead: '매우 낮음 (커널 레벨)',
      strength: 'eBPF 최고 성능, L3-L7 통합 정책, Hubble 실시간 관측성',
    },
    {
      name: 'Linkerd',
      status: '✅ Beta', statusColor: '#ff9800',
      dataPlane: 'linkerd2-proxy (Rust)',
      sidecar: '✅ 필요 (경량)',
      gamma: '✅ HTTPRoute 기반',
      features: {
        mTLS: '✅ 자동 (제로 설정)',
        l7Routing: '✅ HTTPRoute',
        trafficSplit: '✅ 가중치 기반',
        retryTimeout: '✅ 네이티브',
        faultInjection: '⚠️ 제한적',
        observability: 'Viz 대시보드',
      },
      overhead: '낮음 (Rust, ~20MB/proxy)',
      strength: '경량 Rust 프록시, 자동 mTLS, 최소 설정, 빠른 도입',
    },
    {
      name: 'kGateway (Solo.io)',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'Envoy',
      sidecar: '❌ 불필요',
      gamma: '✅ HTTPRoute/GRPCRoute',
      features: {
        mTLS: '✅ Envoy 기반',
        l7Routing: '✅ HTTPRoute, GRPCRoute',
        trafficSplit: '✅ 가중치 기반',
        retryTimeout: '✅ 네이티브',
        faultInjection: '✅ 네이티브',
        observability: 'Envoy 메트릭',
      },
      overhead: '중간',
      strength: '통합 게이트웨이 (API+메시+AI+MCP), AI/ML 라우팅 네이티브',
    },
  ],
  en: [
    {
      name: 'AWS VPC Lattice + ACK',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'AWS Managed (VPC level)',
      sidecar: '❌ Not needed',
      gamma: '✅ Gateway API via ACK',
      features: {
        mTLS: '✅ IAM + SigV4',
        l7Routing: '✅ HTTPRoute',
        trafficSplit: '✅ Weight-based',
        retryTimeout: '✅ Native',
        faultInjection: '✅ AWS FIS integration',
        observability: 'CloudWatch, X-Ray',
      },
      overhead: 'None (managed)',
      strength: 'AWS native, no sidecar, SLA guaranteed, K8s CRD management via ACK',
    },
    {
      name: 'Istio Ambient Mode',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'ztunnel (L4) + waypoint (L7)',
      sidecar: '❌ Not needed (Ambient)',
      gamma: '✅ Full support',
      features: {
        mTLS: '✅ Auto (ztunnel)',
        l7Routing: '✅ HTTPRoute, GRPCRoute',
        trafficSplit: '✅ Weight-based',
        retryTimeout: '✅ Native',
        faultInjection: '✅ Native',
        observability: 'Kiali, Jaeger, Prometheus',
      },
      overhead: 'Low (ztunnel DaemonSet)',
      strength: 'Most mature GAMMA impl, Ambient removes sidecars, rich ecosystem',
    },
    {
      name: 'Cilium',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'eBPF + Envoy (L7)',
      sidecar: '❌ Not needed (eBPF)',
      gamma: '✅ HTTPRoute → Service',
      features: {
        mTLS: '✅ WireGuard/IPsec',
        l7Routing: '✅ HTTPRoute',
        trafficSplit: '✅ Weight-based',
        retryTimeout: '✅ CiliumNetworkPolicy',
        faultInjection: '⚠️ Limited',
        observability: 'Hubble (Service Map)',
      },
      overhead: 'Very low (kernel level)',
      strength: 'eBPF best performance, L3-L7 unified policy, Hubble real-time observability',
    },
    {
      name: 'Linkerd',
      status: '✅ Beta', statusColor: '#ff9800',
      dataPlane: 'linkerd2-proxy (Rust)',
      sidecar: '✅ Required (lightweight)',
      gamma: '✅ HTTPRoute-based',
      features: {
        mTLS: '✅ Auto (zero-config)',
        l7Routing: '✅ HTTPRoute',
        trafficSplit: '✅ Weight-based',
        retryTimeout: '✅ Native',
        faultInjection: '⚠️ Limited',
        observability: 'Viz dashboard',
      },
      overhead: 'Low (Rust, ~20MB/proxy)',
      strength: 'Lightweight Rust proxy, auto mTLS, minimal config, fast adoption',
    },
    {
      name: 'kGateway (Solo.io)',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'Envoy',
      sidecar: '❌ Not needed',
      gamma: '✅ HTTPRoute/GRPCRoute',
      features: {
        mTLS: '✅ Envoy-based',
        l7Routing: '✅ HTTPRoute, GRPCRoute',
        trafficSplit: '✅ Weight-based',
        retryTimeout: '✅ Native',
        faultInjection: '✅ Native',
        observability: 'Envoy metrics',
      },
      overhead: 'Medium',
      strength: 'Unified gateway (API+mesh+AI+MCP), AI/ML routing native',
    },
  ],
  zh: [
    {
      name: 'AWS VPC Lattice + ACK',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'AWS 托管 (VPC 级别)',
      sidecar: '❌ 无需',
      gamma: '✅ Gateway API via ACK',
      features: {
        mTLS: '✅ IAM + SigV4',
        l7Routing: '✅ HTTPRoute',
        trafficSplit: '✅ 基于权重',
        retryTimeout: '✅ 原生支持',
        faultInjection: '✅ AWS FIS 集成',
        observability: 'CloudWatch, X-Ray',
      },
      overhead: '无 (托管型)',
      strength: 'AWS 原生、无 Sidecar、SLA 保障、通过 ACK 管理 K8s CRD',
    },
    {
      name: 'Istio Ambient Mode',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'ztunnel (L4) + waypoint (L7)',
      sidecar: '❌ 无需 (Ambient)',
      gamma: '✅ 完全支持',
      features: {
        mTLS: '✅ 自动 (ztunnel)',
        l7Routing: '✅ HTTPRoute, GRPCRoute',
        trafficSplit: '✅ 基于权重',
        retryTimeout: '✅ 原生支持',
        faultInjection: '✅ 原生支持',
        observability: 'Kiali, Jaeger, Prometheus',
      },
      overhead: '低 (ztunnel DaemonSet)',
      strength: '最成熟的 GAMMA 实现、Ambient 消除 Sidecar、丰富的生态系统',
    },
    {
      name: 'Cilium',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'eBPF + Envoy (L7)',
      sidecar: '❌ 无需 (eBPF)',
      gamma: '✅ HTTPRoute → Service',
      features: {
        mTLS: '✅ WireGuard/IPsec',
        l7Routing: '✅ HTTPRoute',
        trafficSplit: '✅ 基于权重',
        retryTimeout: '✅ CiliumNetworkPolicy',
        faultInjection: '⚠️ 有限',
        observability: 'Hubble (Service Map)',
      },
      overhead: '极低 (内核级别)',
      strength: 'eBPF 最佳性能、L3-L7 统一策略、Hubble 实时可观测性',
    },
    {
      name: 'Linkerd',
      status: '✅ Beta', statusColor: '#ff9800',
      dataPlane: 'linkerd2-proxy (Rust)',
      sidecar: '✅ 需要 (轻量级)',
      gamma: '✅ 基于 HTTPRoute',
      features: {
        mTLS: '✅ 自动 (零配置)',
        l7Routing: '✅ HTTPRoute',
        trafficSplit: '✅ 基于权重',
        retryTimeout: '✅ 原生支持',
        faultInjection: '⚠️ 有限',
        observability: 'Viz 仪表板',
      },
      overhead: '低 (Rust, ~20MB/proxy)',
      strength: '轻量级 Rust 代理、自动 mTLS、最少配置、快速采用',
    },
    {
      name: 'kGateway (Solo.io)',
      status: '✅ GA', statusColor: '#4caf50',
      dataPlane: 'Envoy',
      sidecar: '❌ 无需',
      gamma: '✅ HTTPRoute/GRPCRoute',
      features: {
        mTLS: '✅ 基于 Envoy',
        l7Routing: '✅ HTTPRoute, GRPCRoute',
        trafficSplit: '✅ 基于权重',
        retryTimeout: '✅ 原生支持',
        faultInjection: '✅ 原生支持',
        observability: 'Envoy 指标',
      },
      overhead: '中等',
      strength: '统一网关 (API+网格+AI+MCP)、AI/ML 路由原生支持',
    },
  ],
};

const featureLabels = {
  ko: { mTLS: 'mTLS', l7Routing: 'L7 라우팅', trafficSplit: '트래픽 분할', retryTimeout: '재시도/타임아웃', faultInjection: '장애 주입', observability: '관측성' },
  en: { mTLS: 'mTLS', l7Routing: 'L7 Routing', trafficSplit: 'Traffic Split', retryTimeout: 'Retry/Timeout', faultInjection: 'Fault Injection', observability: 'Observability' },
  zh: { mTLS: 'mTLS', l7Routing: 'L7 路由', trafficSplit: '流量分割', retryTimeout: '重试/超时', faultInjection: '故障注入', observability: '可观测性' },
};

const labels = {
  ko: { dataPlane: '데이터 플레인', sidecar: '사이드카', overhead: '리소스 오버헤드', strength: '핵심 강점', features: '기능 비교' },
  en: { dataPlane: 'Data Plane', sidecar: 'Sidecar', overhead: 'Resource Overhead', strength: 'Key Strength', features: 'Feature Comparison' },
  zh: { dataPlane: '数据平面', sidecar: 'Sidecar', overhead: '资源开销', strength: '核心优势', features: '功能对比' },
};

export default function GammaSupportTable({ locale = 'ko' }) {
  const items = implementations[locale] || implementations.ko;
  const fl = featureLabels[locale] || featureLabels.ko;
  const lb = labels[locale] || labels.ko;
  const [expanded, setExpanded] = useState(null);

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 760, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #4a148c 0%, #6a1b9a 100%)', borderRadius: '12px 12px 0 0', padding: '0.85rem 1.25rem', color: 'white' }}>
        <div style={{ fontSize: '0.92rem', fontWeight: 700 }}>
          🔄 {{ ko: 'GAMMA 구현체 비교', en: 'GAMMA Implementation Comparison', zh: 'GAMMA 实现对比' }[locale] || 'GAMMA Implementation Comparison'}
        </div>
        <div style={{ fontSize: '0.7rem', opacity: 0.7, marginTop: 2 }}>
          {{ ko: '기능, 데이터 플레인, 리소스 오버헤드별 상세 비교 — 클릭하여 상세 보기', en: 'Detailed comparison by features, data plane, resource overhead — click to expand', zh: '按功能、数据平面、资源开销详细对比 — 点击展开详情' }[locale] || 'Detailed comparison by features, data plane, resource overhead — click to expand'}
        </div>
      </div>
      <div style={{ background: 'var(--ifm-background-surface-color)', border: '1px solid var(--ifm-color-emphasis-200)', borderTop: 'none', borderRadius: '0 0 12px 12px', padding: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {items.map((item, idx) => {
          const isOpen = expanded === idx;
          return (
            <div
              key={idx}
              style={{
                border: `1.5px solid ${isOpen ? item.statusColor : 'var(--ifm-color-emphasis-200)'}`,
                borderLeft: `4px solid ${item.statusColor}`,
                borderRadius: 8,
                background: isOpen ? 'var(--ifm-color-emphasis-100)' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onClick={() => setExpanded(isOpen ? null : idx)}
            >
              {/* Header */}
              <div style={{ padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#212121' }}>{item.name}</span>
                <span style={{ background: item.statusColor, color: '#fff', borderRadius: 6, padding: '1px 8px', fontSize: '0.68rem', fontWeight: 700 }}>{item.status}</span>
                <span style={{ fontSize: '0.68rem', color: '#757575', background: 'var(--ifm-color-emphasis-100)', padding: '1px 6px', borderRadius: 4 }}>{item.dataPlane}</span>
                <span style={{ fontSize: '0.68rem', color: item.sidecar.startsWith('❌') ? '#4caf50' : '#ff9800', fontWeight: 600 }}>{item.sidecar}</span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9e9e9e', transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>▼</span>
              </div>

              {/* Expanded details */}
              {isOpen && (
                <div style={{ padding: '0 0.85rem 0.7rem', borderTop: '1px solid var(--ifm-color-emphasis-200)' }}>
                  {/* Feature grid */}
                  <div style={{ marginTop: '0.5rem', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.35rem' }}>
                    {Object.entries(fl).map(([key, label]) => (
                      <div key={key} style={{ background: 'var(--ifm-color-emphasis-100)', borderRadius: 6, padding: '0.35rem 0.5rem' }}>
                        <div style={{ fontSize: '0.62rem', color: '#9e9e9e', fontWeight: 600, marginBottom: 1 }}>{label}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--ifm-font-color-base)', fontWeight: 500 }}>{item.features[key]}</div>
                      </div>
                    ))}
                  </div>

                  {/* Meta info */}
                  <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <div style={{ background: 'var(--ifm-color-emphasis-100)', borderRadius: 6, padding: '0.3rem 0.6rem', flex: 1, minWidth: 150 }}>
                      <div style={{ fontSize: '0.6rem', color: '#388e3c', fontWeight: 600 }}>{lb.overhead}</div>
                      <div style={{ fontSize: '0.7rem', color: '#2e7d32', fontWeight: 500 }}>{item.overhead}</div>
                    </div>
                    <div style={{ background: 'var(--ifm-color-emphasis-100)', borderRadius: 6, padding: '0.3rem 0.6rem', flex: 2, minWidth: 200 }}>
                      <div style={{ fontSize: '0.6rem', color: '#1565c0', fontWeight: 600 }}>{lb.strength}</div>
                      <div style={{ fontSize: '0.7rem', color: '#0d47a1', fontWeight: 500 }}>{item.strength}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
