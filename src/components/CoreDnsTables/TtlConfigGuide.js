import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const TtlConfigGuide = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const configs = [{
    scope: isKo ? 'Kubernetes 내부 도메인' : 'Kubernetes Internal Domains',
    plugin: 'kubernetes',
    setting: 'ttl 30',
    defaultVal: '5s',
    recommended: '30s',
    note: isKo ? 'cluster.local 레코드의 응답 TTL. 30s 권장으로 캐시 적중률 향상' : 'Response TTL for cluster.local records. 30s recommended for better cache hit ratio'
  }, {
    scope: isKo ? 'DNS 응답 캐시 (전체)' : 'DNS Response Cache (Global)',
    plugin: 'cache',
    setting: 'cache 30',
    defaultVal: '3600s (max)',
    recommended: '30s',
    note: isKo ? 'CoreDNS 내부 캐시 상한. EKS 기본값 30s. success/denial 분리 설정 가능' : 'CoreDNS internal cache ceiling. EKS default 30s. Separate success/denial configurable'
  }, {
    scope: isKo ? 'Negative Cache (NXDOMAIN)' : 'Negative Cache (NXDOMAIN)',
    plugin: 'cache',
    setting: 'denial 2000 10',
    defaultVal: '3600s (max)',
    recommended: '5-10s',
    note: isKo ? 'NXDOMAIN 응답 캐시. 너무 길면 신규 서비스 발견 지연' : 'NXDOMAIN response cache. Too long delays new service discovery'
  }, {
    scope: isKo ? 'Prefetch' : 'Prefetch',
    plugin: 'cache',
    setting: 'prefetch 5 60s',
    defaultVal: isKo ? '비활성' : 'Disabled',
    recommended: '5 60s',
    note: isKo ? '동일 질의 5회 이상 시 TTL 만료 전 미리 갱신. 캐시 신선도 유지' : 'Pre-refresh before TTL expiry when same query seen 5+ times. Keeps cache fresh'
  }];
  return <div style={{
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
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '⚙️ CoreDNS TTL 설정 가이드' : '⚙️ CoreDNS TTL Configuration Guide'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? 'DNS 트래픽 부하와 정보 신선도 사이의 최적 균형' : 'Optimal balance between DNS traffic load and data freshness'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      overflow: 'hidden'
    }}>
        {configs.map((cfg, idx) => <div key={idx} style={{
        padding: '16px 20px',
        borderBottom: idx < configs.length - 1 ? '1px solid #f3f4f6' : 'none'
      }}>
            <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '8px',
          flexWrap: 'wrap'
        }}>
              <span style={{
            fontWeight: '700',
            fontSize: '14px',
            color: 'var(--ifm-font-color-base)'
          }}>{cfg.scope}</span>
              <code style={{
            background: 'var(--ifm-color-emphasis-100)',
            color: '#065f46',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
                {cfg.plugin}
              </code>
            </div>
            <div style={{
          display: 'flex',
          gap: '12px',
          marginBottom: '8px',
          flexWrap: 'wrap'
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
                <span style={{
              fontSize: '12px',
              color: 'var(--ifm-color-emphasis-500)'
            }}>
                  {isKo ? '설정:' : 'Setting:'}
                </span>
                <code style={{
              fontSize: '12px',
              color: '#2563eb',
              fontWeight: '600'
            }}>{cfg.setting}</code>
              </div>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
                <span style={{
              fontSize: '12px',
              color: 'var(--ifm-color-emphasis-500)'
            }}>
                  {isKo ? '기본값:' : 'Default:'}
                </span>
                <span style={{
              fontSize: '12px',
              color: 'var(--ifm-color-emphasis-600)'
            }}>{cfg.defaultVal}</span>
              </div>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
                <span style={{
              fontSize: '12px',
              color: 'var(--ifm-color-emphasis-500)'
            }}>
                  {isKo ? '권장:' : 'Recommended:'}
                </span>
                <span style={{
              fontSize: '12px',
              color: '#059669',
              fontWeight: '700'
            }}>{cfg.recommended}</span>
              </div>
            </div>
            <div style={{
          fontSize: '13px',
          color: 'var(--ifm-font-color-base)',
          lineHeight: '1.5'
        }}>{cfg.note}</div>
          </div>)}

        {/* Footer */}
        <div style={{
        background: 'var(--ifm-color-emphasis-100)',
        borderTop: '1px solid #fde68a',
        padding: '12px 16px',
        fontSize: '12px',
        color: 'var(--ifm-color-emphasis-700)',
        lineHeight: '1.6'
      }}>
          💡 <strong>{isKo ? 'TTL 튜닝 원칙:' : 'TTL Tuning Principle:'}</strong>{' '}
          {isKo ? '짧은 TTL(5s 이하)은 변경 반영이 빠르지만 CoreDNS 부하 증가. 긴 TTL(수 분 이상)은 부하를 줄이지만 구형 정보로 연결 실패 가능. 대부분의 EKS 환경에서 30초가 최적 기준입니다.' : 'Short TTL (< 5s) reflects changes quickly but increases CoreDNS load. Long TTL (minutes+) reduces load but risks stale records. 30s is optimal for most EKS environments.'}
        </div>
      </div>
    </div>;
};
export default TtlConfigGuide;