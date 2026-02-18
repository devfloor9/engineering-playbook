import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TtlConfigGuide = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const configs = [
    {
      scope: isKo ? 'Kubernetes 내부 도메인' : isZh ? 'Kubernetes 内部域' : 'Kubernetes Internal Domains',
      plugin: 'kubernetes',
      setting: 'ttl 30',
      defaultVal: '5s',
      recommended: '30s',
      note: isKo
        ? 'cluster.local 레코드의 응답 TTL. 30s 권장으로 캐시 적중률 향상'
        : isZh
        ? 'cluster.local 记录的响应 TTL。推荐 30s 以提高缓存命中率'
        : 'Response TTL for cluster.local records. 30s recommended for better cache hit ratio'
    },
    {
      scope: isKo ? 'DNS 응답 캐시 (전체)' : isZh ? 'DNS 响应缓存（全局）' : 'DNS Response Cache (Global)',
      plugin: 'cache',
      setting: 'cache 30',
      defaultVal: '3600s (max)',
      recommended: '30s',
      note: isKo
        ? 'CoreDNS 내부 캐시 상한. EKS 기본값 30s. success/denial 분리 설정 가능'
        : isZh
        ? 'CoreDNS 内部缓存上限。EKS 默认 30s。可分别配置 success/denial'
        : 'CoreDNS internal cache ceiling. EKS default 30s. Separate success/denial configurable'
    },
    {
      scope: isKo ? 'Negative Cache (NXDOMAIN)' : isZh ? 'Negative Cache (NXDOMAIN)' : 'Negative Cache (NXDOMAIN)',
      plugin: 'cache',
      setting: 'denial 2000 10',
      defaultVal: '3600s (max)',
      recommended: '5-10s',
      note: isKo
        ? 'NXDOMAIN 응답 캐시. 너무 길면 신규 서비스 발견 지연'
        : isZh
        ? 'NXDOMAIN 响应缓存。过长会延迟新服务发现'
        : 'NXDOMAIN response cache. Too long delays new service discovery'
    },
    {
      scope: isKo ? 'Prefetch' : isZh ? '预取' : 'Prefetch',
      plugin: 'cache',
      setting: 'prefetch 5 60s',
      defaultVal: isKo ? '비활성' : isZh ? '未启用' : 'Disabled',
      recommended: '5 60s',
      note: isKo
        ? '동일 질의 5회 이상 시 TTL 만료 전 미리 갱신. 캐시 신선도 유지'
        : isZh
        ? '同一查询超过 5 次时，在 TTL 到期前预取刷新。保持缓存新鲜度'
        : 'Pre-refresh before TTL expiry when same query seen 5+ times. Keeps cache fresh'
    }
  ];

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #065f46 0%, #059669 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '⚙️ CoreDNS TTL 설정 가이드' : isZh ? '⚙️ CoreDNS TTL 配置指南' : '⚙️ CoreDNS TTL Configuration Guide'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'DNS 트래픽 부하와 정보 신선도 사이의 최적 균형' : isZh ? 'DNS 流量负载与信息新鲜度之间的最佳平衡' : 'Optimal balance between DNS traffic load and data freshness'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {configs.map((cfg, idx) => (
          <div key={idx} style={{
            padding: '16px 20px',
            borderBottom: idx < configs.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <span style={{ fontWeight: '700', fontSize: '14px', color: '#1f2937' }}>{cfg.scope}</span>
              <code style={{ background: '#ecfdf5', color: '#065f46', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                {cfg.plugin}
              </code>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {isKo ? '설정:' : isZh ? '配置:' : 'Setting:'}
                </span>
                <code style={{ fontSize: '12px', color: '#1e40af', fontWeight: '600' }}>{cfg.setting}</code>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {isKo ? '기본값:' : isZh ? '默认值:' : 'Default:'}
                </span>
                <span style={{ fontSize: '12px', color: '#6b7280' }}>{cfg.defaultVal}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {isKo ? '권장:' : isZh ? '推荐:' : 'Recommended:'}
                </span>
                <span style={{ fontSize: '12px', color: '#059669', fontWeight: '700' }}>{cfg.recommended}</span>
              </div>
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563', lineHeight: '1.5' }}>{cfg.note}</div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          💡 <strong>{isKo ? 'TTL 튜닝 원칙:' : isZh ? 'TTL 调优原则:' : 'TTL Tuning Principle:'}</strong>{' '}
          {isKo
            ? '짧은 TTL(5s 이하)은 변경 반영이 빠르지만 CoreDNS 부하 증가. 긴 TTL(수 분 이상)은 부하를 줄이지만 구형 정보로 연결 실패 가능. 대부분의 EKS 환경에서 30초가 최적 기준입니다.'
            : isZh
            ? '短 TTL（5s 以下）变更反映快但 CoreDNS 负载增加。长 TTL（数分钟以上）降低负载但可能因过期信息导致连接失败。大多数 EKS 环境中 30 秒是最佳基准。'
            : 'Short TTL (< 5s) reflects changes quickly but increases CoreDNS load. Long TTL (minutes+) reduces load but risks stale records. 30s is optimal for most EKS environments.'}
        </div>
      </div>
    </div>
  );
};

export default TtlConfigGuide;
