import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const TroubleshootingTable = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const bestPractices = [{
    icon: '📈',
    title: isKo ? 'Cluster Proportional Autoscaler' : 'Cluster Proportional Autoscaler',
    description: isKo ? '현재 Deployment 복제수와 애드온의 자동 확장 지원을 확인합니다. 노드·CPU 코어 수와 실제 DNS 부하를 기준으로 확장을 평가합니다.' : 'Inspect current Deployment replicas and add-on autoscaling support. Evaluate scaling using node/core counts and measured DNS load.',
    impact: isKo ? 'DNS 처리 용량 확장' : 'Increase DNS capacity',
    impactColor: '#059669'
  }, {
    icon: '🗄️',
    title: 'NodeLocal DNSCache',
    description: isKo ? '지원되는 노드에 DNS 캐시 에이전트를 배치하여 반복 조회의 네트워크 비용을 줄입니다. cache miss의 업스트림 질의와 ENI 한도는 남습니다.' : 'Place DNS cache agents on supported nodes to reduce network overhead for repeated queries. Upstream queries on misses and ENI limits still apply.',
    impact: isKo ? '반복 질의 RTT 감소' : 'Reduce repeated-query RTT',
    impactColor: '#3b82f6'
  }, {
    icon: '🔒',
    title: isKo ? 'DNS 패킷 한계 & 트래픽 분산' : 'DNS Packet Limit & Traffic Distribution',
    description: isKo ? 'Amazon DNS·IMDS·Time Sync 링크 로컬 트래픽은 1024 PPS/ENI 한도를 공유합니다. CoreDNS Pod를 노드에 분산하고 linklocal_allowance_exceeded를 확인합니다.' : 'Amazon DNS, IMDS, and Time Sync link-local traffic share 1024 PPS/ENI. Spread CoreDNS Pods across nodes and inspect linklocal_allowance_exceeded.',
    impact: isKo ? 'ENI PPS 병목 회피' : 'Avoid ENI PPS bottleneck',
    impactColor: '#f59e0b'
  }, {
    icon: '🔄',
    title: isKo ? 'Graceful Termination (Lameduck)' : 'Graceful Termination (Lameduck)',
    description: isKo ? 'lameduck은 종료 지연입니다. 5s는 시험값이며 30s도 보편적 권장값이 아닙니다. /ready 설정과 Pod 종료 유예 시간의 여유를 함께 확인합니다.' : 'lameduck delays shutdown. 5s is a trial value; 30s is not universally recommended either. Check /ready configuration and Pod shutdown headroom together.',
    impact: isKo ? '종료 중 실패 위험 완화' : 'Reduce shutdown failure risk',
    impactColor: '#8b5cf6'
  }];
  const cases = [{
    title: isKo ? '사례 1: ENI PPS 한도로 인한 DNS 지연' : 'Case 1: DNS Latency from ENI PPS Limit',
    symptom: isKo ? '외부 DNS 조회 지연 또는 타임아웃 증가' : 'Increased external DNS lookup latency or timeouts',
    cause: isKo ? '링크 로컬 PPS 한도로 패킷이 드롭되는지 ENA 카운터로 확인' : 'Check ENA counters for packet drops at the link-local PPS allowance',
    solution: isKo ? 'NodeLocal DNSCache 도입 + CoreDNS Pod 노드 분산(Anti-Affinity)' : 'Deploy NodeLocal DNSCache + CoreDNS Pod node distribution (Anti-Affinity)',
    color: '#ef4444'
  }, {
    title: isKo ? '사례 2: Aurora DNS TTL 캐싱으로 인한 리더 편중' : 'Case 2: Aurora Reader Skew from DNS TTL Caching',
    symptom: isKo ? 'Aurora 리더 노드에 세션 편중 → 일부 리더만 과부하' : 'Aurora reader node session skew → Some readers overloaded',
    cause: isKo ? '관측한 TTL이 1s이고 상한이 30s라면 v1.11.3 기본 최소 TTL 5s가 캐싱을 연장할 수 있음. 실제 TTL과 연결 풀도 확인' : 'If the observed TTL is 1s and the ceiling is 30s, the v1.11.3 default 5s minimum can extend caching. Verify actual TTLs and connection pooling',
    solution: isKo ? '확인된 DNS 영역에서 success 9984 30 0 / denial 2048 10 0을 시험. 첫 숫자는 용량이며 amazonaws.com 전체에 적용하지 않음' : 'Trial success 9984 30 0 / denial 2048 10 0 for the verified DNS zone. First number is capacity; do not apply to all amazonaws.com',
    color: '#f59e0b'
  }];
  return <div style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem'
  }}>
      {/* Header */}
      <div style={{
      background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '8px 8px 0 0'
    }}>
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '🛡️ EKS 운영 점검과 진단 예시' : '🛡️ EKS Operational Checks & Diagnostic Examples'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? '설치된 애드온 구성을 확인하고 워크로드에서 검증할 항목' : 'Inspect the installed add-on configuration and validate against the workload'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      overflow: 'hidden'
    }}>
        {/* Best Practices */}
        {bestPractices.map((bp, idx) => <div key={idx} style={{
        display: 'flex',
        gap: '14px',
        padding: '14px 20px',
        borderBottom: '1px solid #f3f4f6',
        alignItems: 'flex-start'
      }}>
            <div style={{
          fontSize: '20px',
          flexShrink: 0,
          marginTop: '2px'
        }}>{bp.icon}</div>
            <div style={{
          flex: 1,
          minWidth: 0
        }}>
              <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginBottom: '4px',
            flexWrap: 'wrap'
          }}>
                <span style={{
              fontWeight: '700',
              fontSize: '14px',
              color: 'var(--ifm-font-color-base)'
            }}>{bp.title}</span>
                <span style={{
              background: bp.impactColor,
              color: 'white',
              padding: '1px 6px',
              borderRadius: '3px',
              fontSize: '10px',
              fontWeight: '600'
            }}>{bp.impact}</span>
              </div>
              <div style={{
            fontSize: '13px',
            color: 'var(--ifm-font-color-base)',
            lineHeight: '1.5'
          }}>{bp.description}</div>
            </div>
          </div>)}

        {/* Divider */}
        <div style={{
        padding: '10px 20px',
        background: 'var(--ifm-background-surface-color)',
        borderTop: '1px solid var(--ifm-color-emphasis-200)',
        borderBottom: '1px solid var(--ifm-color-emphasis-200)',
        fontSize: '12px',
        fontWeight: '600',
        color: 'var(--ifm-color-emphasis-600)',
        textTransform: 'uppercase'
      }}>
          {isKo ? '진단 시나리오 예시 — 측정된 고객 사례가 아님' : 'Illustrative diagnostic scenarios — not measured customer cases'}
        </div>

        {/* Cases */}
        {cases.map((c, idx) => <div key={idx} style={{
        padding: '14px 20px',
        borderBottom: idx < cases.length - 1 ? '1px solid #f3f4f6' : 'none',
        borderLeft: `3px solid ${c.color}`
      }}>
            <div style={{
          fontWeight: '700',
          fontSize: '14px',
          color: 'var(--ifm-font-color-base)',
          marginBottom: '8px'
        }}>{c.title}</div>
            <div style={{
          display: 'grid',
          gap: '4px'
        }}>
              <div style={{
            fontSize: '12px',
            lineHeight: '1.5'
          }}>
                <span style={{
              color: '#dc2626',
              fontWeight: '600'
            }}>
                  {isKo ? '증상: ' : 'Symptom: '}
                </span>
                <span style={{
              color: 'var(--ifm-font-color-base)'
            }}>{c.symptom}</span>
              </div>
              <div style={{
            fontSize: '12px',
            lineHeight: '1.5'
          }}>
                <span style={{
              color: '#f59e0b',
              fontWeight: '600'
            }}>
                  {isKo ? '원인: ' : 'Cause: '}
                </span>
                <span style={{
              color: 'var(--ifm-font-color-base)'
            }}>{c.cause}</span>
              </div>
              <div style={{
            fontSize: '12px',
            lineHeight: '1.5'
          }}>
                <span style={{
              color: '#059669',
              fontWeight: '600'
            }}>
                  {isKo ? '해결: ' : 'Solution: '}
                </span>
                <span style={{
              color: 'var(--ifm-font-color-base)'
            }}>{c.solution}</span>
              </div>
            </div>
          </div>)}
      </div>

      {/* Footer */}
      <div style={{
      background: 'var(--ifm-color-emphasis-100)',
      border: '1px solid #fecaca',
      borderRadius: '0 0 8px 8px',
      padding: '12px 16px',
      fontSize: '12px',
      color: '#991b1b',
      lineHeight: '1.6'
    }}>
        ⚠️ <strong>{isKo ? 'ENI DNS 패킷 제한:' : 'ENI DNS Packet Limit:'}</strong>{' '}
        {isKo ? '링크 로컬 서비스의 한도이며 모든 DNS 트래픽의 한도가 아닙니다. 출처: ' : 'This allowance applies to link-local services, not all DNS traffic. Sources: '}
        <a href="https://docs.aws.amazon.com/vpc/latest/userguide/AmazonDNS-concepts.html">AWS PPS</a>
        {' · '}
        <a href="https://docs.aws.amazon.com/eks/latest/userguide/managing-coredns.html">EKS CoreDNS</a>
        {' · '}
        <a href="https://github.com/coredns/coredns/blob/v1.11.3/plugin/cache/README.md">cache v1.11.3</a>
      </div>
    </div>;
};
export default TroubleshootingTable;
