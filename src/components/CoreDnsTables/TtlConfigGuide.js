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
    example: '30s',
    note: isKo ? '응답 TTL 자체를 변경합니다. 30초 동안 이전 주소를 사용할 수 있는 워크로드에서만 시험하세요.' : 'Changes the response TTL itself. Trial only where using an old address for 30 seconds is acceptable.'
  }, {
    scope: isKo ? '성공 응답 캐시 (success)' : 'Successful Response Cache',
    plugin: 'cache',
    setting: 'success 9984 30 5',
    defaultVal: '3600s max / 5s min',
    example: '30s max / 5s min',
    note: isKo ? 'cache 30은 상한입니다. 5초 레코드는 최소 TTL 5초에서 5초 캐싱됩니다. success 9984 30 10처럼 최소 TTL을 올리면 10초가 됩니다.' : 'cache 30 is a ceiling. A 5s record stays cached for 5s with a 5s minimum. Raising the minimum with success 9984 30 10 makes it 10s.'
  }, {
    scope: 'Negative Cache (NXDOMAIN / NODATA)',
    plugin: 'cache',
    setting: 'denial 2048 10 5',
    defaultVal: '1800s max / 5s min',
    example: '10s max / 5s min',
    note: isKo ? '부정 응답의 상한과 최소 TTL을 별도로 설정합니다. 긴 TTL은 새 이름·레코드 발견을 지연시킬 수 있습니다. 첫 숫자는 용량입니다.' : 'Set negative-response ceilings and minima separately. Long TTLs can delay discovery of new names or records. The first number is capacity.'
  }, {
    scope: isKo ? 'Prefetch' : 'Prefetch',
    plugin: 'cache',
    setting: 'prefetch 5 60s 10%',
    defaultVal: isKo ? '비활성' : 'Disabled',
    example: '5 / 60s / 10%',
    note: isKo ? '5회 기준, 질의 간격 <60s로 인기를 판단합니다. hit 시 남은 TTL 10% 경계에서 갱신을 시도합니다. 60s는 만료 전 시간이 아닙니다. 생략 인수: 1m / 10%; 허용 비율: 10–90%.' : 'Popularity threshold: 5 queries with gaps <60s. A hit at the remaining-TTL 10% boundary triggers refresh. 60s is not time before expiry. Omitted arguments: 1m / 10%; allowed percentage: 10–90%.'
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
          {isKo ? 'upstream CoreDNS v1.11.3 기본값과 워크로드별 시험값' : 'Upstream CoreDNS v1.11.3 defaults and workload trial values'}
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
                  {isKo ? '설정 예시:' : 'Example setting:'}
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
                  {isKo ? 'v1.11.3 기본값:' : 'v1.11.3 default:'}
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
                  {isKo ? '시험값:' : 'Trial value:'}
                </span>
                <span style={{
              fontSize: '12px',
              color: '#059669',
              fontWeight: '700'
            }}>{cfg.example}</span>
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
          {isKo ? '30초는 보편적인 최적값이 아닙니다. 변경 반영 목표, 질의 재사용률과 장애 조치 시간을 측정하세요. EKS에서는 설치된 애드온 버전과 Corefile을 확인합니다. 출처: ' : '30s is not a universal optimum. Measure freshness needs, query reuse, and failover time. For EKS, inspect the installed add-on version and Corefile. Sources: '}
          <a href="https://github.com/coredns/coredns/blob/v1.11.3/plugin/cache/README.md">cache v1.11.3</a>
          {' · '}
          <a href="https://github.com/coredns/coredns/blob/v1.11.3/plugin/kubernetes/README.md">kubernetes v1.11.3</a>
        </div>
      </div>
    </div>;
};
export default TtlConfigGuide;
