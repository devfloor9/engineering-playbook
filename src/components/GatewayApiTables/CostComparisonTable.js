import React from 'react';

const data = {
  ko: {
    title: 'AWS Native vs 오픈소스 비용 및 성능 영향 비교',
    subtitle: '기능별 추가 비용, 지연 오버헤드, 홉 증가 여부 종합 비교',
    headers: { feature: '기능', awsCost: 'AWS Native 비용', ossCost: '오픈소스 비용', perfImpact: '성능 영향' },
    items: [
      {
        feature: 'Basic Auth (JWT)',
        awsCost: 'Lambda 실행 비용\n~$2-10/월 (100만 요청 기준)',
        ossCost: '없음 (자체 구현)',
        perfImpact: 'AWS: Lambda 호출로 +5-50ms (콜드스타트 시 +200ms)\n오픈소스: Gateway 내장 처리, <1ms',
        hopIcon: 'aws',
        hopNote: 'AWS: +1 홉 (ALB → Lambda Authorizer)\n오픈소스: 추가 홉 없음',
      },
      {
        feature: 'IP Allowlist',
        awsCost: 'WAF IP Set + 규칙\n$5 (Web ACL) + $1 (규칙) = $6/월',
        ossCost: '없음 (NetworkPolicy)',
        perfImpact: 'AWS: WAF 규칙 평가 +0.5-1ms\n오픈소스: 커널/eBPF 레벨 처리, <0.1ms',
        hopIcon: 'none',
        hopNote: '양쪽 모두 추가 홉 없음\nAWS: ALB에서 인라인 처리\n오픈소스: 네트워크 레이어에서 처리',
      },
      {
        feature: 'Rate Limiting',
        awsCost: 'WAF Rate-Based Rule\n$5 (Web ACL) + $1 (규칙) + $0.60/백만 요청',
        ossCost: '없음 (L7 Policy)',
        perfImpact: 'AWS: WAF 규칙 평가 +0.5-1ms\n오픈소스: Envoy/NGINX 프록시 처리, +1-2ms',
        hopIcon: 'oss',
        hopNote: 'AWS: 추가 홉 없음 (ALB 인라인)\n오픈소스: L7 프록시 미사용 시 프록시 홉 추가 가능',
      },
      {
        feature: 'Body Size 제한',
        awsCost: 'WAF Body Size Rule\nWAF 비용에 포함',
        ossCost: '없음 (Proxy Config)',
        perfImpact: 'AWS: WAF 본문 검사 +1-3ms (본문 크기에 비례)\n오픈소스: Proxy buffer 설정, <1ms',
        hopIcon: 'none',
        hopNote: '양쪽 모두 추가 홉 없음\n기존 경로에서 인라인 처리',
      },
      {
        feature: '전체 합산',
        awsCost: 'WAF 전체: ~$20-100/월\n(트래픽에 따라 변동)',
        ossCost: '없음\n(컴퓨팅 리소스만 추가)',
        perfImpact: 'AWS: WAF 규칙 수에 비례하여 +1-5ms 누적\n오픈소스: 프록시 경유 시 +2-5ms',
        hopIcon: 'both',
        hopNote: 'AWS: Lambda Auth 사용 시 최대 +1 홉\n오픈소스: L7 프록시 구성 시 최대 +1 홉',
      },
    ],
  },
  en: {
    title: 'AWS Native vs Open Source: Cost & Performance Impact',
    subtitle: 'Comprehensive comparison of additional costs, latency overhead, and hop increases per feature',
    headers: { feature: 'Feature', awsCost: 'AWS Native Cost', ossCost: 'Open Source Cost', perfImpact: 'Performance Impact' },
    items: [
      {
        feature: 'Basic Auth (JWT)',
        awsCost: 'Lambda execution cost\n~$2-10/mo (per 1M requests)',
        ossCost: 'None (self-implemented)',
        perfImpact: 'AWS: +5-50ms from Lambda call (cold start +200ms)\nOSS: Built-in gateway processing, <1ms',
        hopIcon: 'aws',
        hopNote: 'AWS: +1 hop (ALB → Lambda Authorizer)\nOSS: No additional hops',
      },
      {
        feature: 'IP Allowlist',
        awsCost: 'WAF IP Set + rules\n$5 (Web ACL) + $1 (rule) = $6/mo',
        ossCost: 'None (NetworkPolicy)',
        perfImpact: 'AWS: WAF rule evaluation +0.5-1ms\nOSS: Kernel/eBPF level processing, <0.1ms',
        hopIcon: 'none',
        hopNote: 'No additional hops for either\nAWS: Inline at ALB\nOSS: Network layer processing',
      },
      {
        feature: 'Rate Limiting',
        awsCost: 'WAF Rate-Based Rule\n$5 (Web ACL) + $1 (rule) + $0.60/1M requests',
        ossCost: 'None (L7 Policy)',
        perfImpact: 'AWS: WAF rule evaluation +0.5-1ms\nOSS: Envoy/NGINX proxy processing, +1-2ms',
        hopIcon: 'oss',
        hopNote: 'AWS: No additional hops (ALB inline)\nOSS: May add proxy hop if L7 proxy not already in path',
      },
      {
        feature: 'Body Size Limit',
        awsCost: 'WAF Body Size Rule\nIncluded in WAF cost',
        ossCost: 'None (Proxy Config)',
        perfImpact: 'AWS: WAF body inspection +1-3ms (proportional to body size)\nOSS: Proxy buffer config, <1ms',
        hopIcon: 'none',
        hopNote: 'No additional hops for either\nInline processing in existing path',
      },
      {
        feature: 'Total',
        awsCost: 'WAF total: ~$20-100/mo\n(varies by traffic)',
        ossCost: 'None\n(compute resources only)',
        perfImpact: 'AWS: +1-5ms cumulative, proportional to rule count\nOSS: +2-5ms when routed through proxy',
        hopIcon: 'both',
        hopNote: 'AWS: Up to +1 hop with Lambda Auth\nOSS: Up to +1 hop with L7 proxy',
      },
    ],
  },
  zh: {
    title: 'AWS Native vs 开源：成本与性能影响对比',
    subtitle: '按功能综合比较额外成本、延迟开销和跳数增加',
    headers: { feature: '功能', awsCost: 'AWS Native 成本', ossCost: '开源成本', perfImpact: '性能影响' },
    items: [
      {
        feature: 'Basic Auth (JWT)',
        awsCost: 'Lambda 执行成本\n~$2-10/月（每 100 万请求）',
        ossCost: '无（自行实现）',
        perfImpact: 'AWS: Lambda 调用 +5-50ms（冷启动 +200ms）\n开源: 网关内置处理, <1ms',
        hopIcon: 'aws',
        hopNote: 'AWS: +1 跳（ALB → Lambda Authorizer）\n开源: 无额外跳数',
      },
      {
        feature: 'IP Allowlist',
        awsCost: 'WAF IP Set + 规则\n$5 (Web ACL) + $1 (规则) = $6/月',
        ossCost: '无（NetworkPolicy）',
        perfImpact: 'AWS: WAF 规则评估 +0.5-1ms\n开源: 内核/eBPF 层处理, <0.1ms',
        hopIcon: 'none',
        hopNote: '双方均无额外跳数\nAWS: ALB 内联处理\n开源: 网络层处理',
      },
      {
        feature: 'Rate Limiting',
        awsCost: 'WAF Rate-Based Rule\n$5 (Web ACL) + $1 (规则) + $0.60/百万请求',
        ossCost: '无（L7 Policy）',
        perfImpact: 'AWS: WAF 规则评估 +0.5-1ms\n开源: Envoy/NGINX 代理处理, +1-2ms',
        hopIcon: 'oss',
        hopNote: 'AWS: 无额外跳数（ALB 内联）\n开源: 未使用 L7 代理时可能增加代理跳数',
      },
      {
        feature: 'Body Size 限制',
        awsCost: 'WAF Body Size Rule\n包含在 WAF 成本中',
        ossCost: '无（Proxy Config）',
        perfImpact: 'AWS: WAF 请求体检查 +1-3ms（与请求体大小成正比）\n开源: Proxy buffer 设置, <1ms',
        hopIcon: 'none',
        hopNote: '双方均无额外跳数\n在现有路径内联处理',
      },
      {
        feature: '总计',
        awsCost: 'WAF 总计: ~$20-100/月\n（随流量变动）',
        ossCost: '无\n（仅计算资源）',
        perfImpact: 'AWS: 随规则数累计 +1-5ms\n开源: 经由代理时 +2-5ms',
        hopIcon: 'both',
        hopNote: 'AWS: 使用 Lambda Auth 时最多 +1 跳\n开源: 使用 L7 代理时最多 +1 跳',
      },
    ],
  },
};

const hopIcons = {
  none: { icon: '\u2705', color: '#2e7d32' },
  aws:  { icon: '\u26a0\ufe0f', color: '#e65100' },
  oss:  { icon: '\u26a0\ufe0f', color: '#e65100' },
  both: { icon: '\u26a0\ufe0f', color: '#bf360c' },
};

export default function CostComparisonTable({ locale = 'ko' }) {
  const { title, subtitle, headers, items } = data[locale] || data.ko;

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif', maxWidth: 900, margin: '0 0 1.5rem 0' }}>
      <div style={{ background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)', borderRadius: '12px 12px 0 0', padding: '1rem 1.5rem', color: 'white' }}>
        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>{title}</div>
        <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{subtitle}</div>
      </div>
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderTop: 'none', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 1fr', background: '#e8eaf6', padding: '0.6rem 1rem', gap: '0.5rem', fontWeight: 700, fontSize: '0.78rem', color: '#1a237e' }}>
          <div>{headers.feature}</div>
          <div>{headers.awsCost}</div>
          <div>{headers.ossCost}</div>
          <div>{headers.perfImpact}</div>
        </div>
        {/* Rows */}
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const hop = hopIcons[item.hopIcon] || hopIcons.none;
          return (
            <div
              key={idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '130px 1fr 1fr 1fr',
                padding: '0.7rem 1rem',
                gap: '0.5rem',
                borderTop: '1px solid #e2e8f0',
                background: isLast ? '#e8eaf6' : idx % 2 === 0 ? '#fafafa' : '#fff',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1a237e', display: 'flex', alignItems: 'flex-start' }}>
                {item.feature}
              </div>
              <div>
                <div style={{ fontSize: '0.76rem', color: '#e65100', fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {item.awsCost}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.76rem', color: '#2e7d32', fontWeight: 600, whiteSpace: 'pre-line', lineHeight: 1.5 }}>
                  {item.ossCost}
                </div>
              </div>
              <div>
                <div style={{ fontSize: '0.73rem', color: '#424242', whiteSpace: 'pre-line', lineHeight: 1.5, marginBottom: '0.3rem' }}>
                  {item.perfImpact}
                </div>
                <div style={{ fontSize: '0.72rem', color: hop.color, background: '#f5f5f5', padding: '0.25rem 0.5rem', borderRadius: 4, whiteSpace: 'pre-line', lineHeight: 1.4, borderLeft: `3px solid ${hop.color}` }}>
                  {hop.icon} {item.hopNote}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
