import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ControlPlaneComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const tiers = [
    {
      name: 'Standard',
      color: '#6b7280',
      apiThrottling: isKo ? '공유 제한' : isZh ? '共享限制' : 'Shared limit',
      podTps: '10 TPS',
      nodeUpdate: '5 TPS',
      concurrentScale: '100 Pod/10s',
      monthlyCost: '$0',
      recommended: isKo ? '1,000 Pod 미만' : isZh ? '<1,000 Pod' : '<1,000 Pods',
      highlight: false
    },
    {
      name: 'Provisioned XL',
      color: '#3b82f6',
      apiThrottling: isKo ? '10배 증가' : isZh ? '10 倍提升' : '10x increase',
      podTps: '100 TPS',
      nodeUpdate: '50 TPS',
      concurrentScale: '1,000 Pod/10s',
      monthlyCost: '~$350',
      recommended: '1,000-5,000 Pod',
      highlight: true
    },
    {
      name: 'Provisioned 2XL',
      color: '#8b5cf6',
      apiThrottling: isKo ? '20배 증가' : isZh ? '20 倍提升' : '20x increase',
      podTps: '200 TPS',
      nodeUpdate: '100 TPS',
      concurrentScale: '2,000 Pod/10s',
      monthlyCost: '~$700',
      recommended: '5,000-15,000 Pod',
      highlight: false
    },
    {
      name: 'Provisioned 4XL',
      color: '#dc2626',
      apiThrottling: isKo ? '40배 증가' : isZh ? '40 倍提升' : '40x increase',
      podTps: '400 TPS',
      nodeUpdate: '200 TPS',
      concurrentScale: '4,000 Pod/10s',
      monthlyCost: '~$1,400',
      recommended: '15,000+ Pod',
      highlight: false
    }
  ];

  const labels = {
    apiThrottling: isKo ? 'API 스로틀링' : isZh ? 'API 限流' : 'API Throttling',
    podTps: isKo ? 'Pod 생성 속도' : isZh ? 'Pod 创建速度' : 'Pod Creation Rate',
    nodeUpdate: isKo ? '노드 업데이트' : isZh ? '节点更新' : 'Node Update',
    concurrentScale: isKo ? '동시 스케일링' : isZh ? '并发扩缩' : 'Concurrent Scaling',
    monthlyCost: isKo ? '월 비용 (추가)' : isZh ? '月费用（额外）' : 'Monthly Cost (extra)',
    recommended: isKo ? '권장 클러스터' : isZh ? '推荐集群规模' : 'Recommended Cluster'
  };

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #3b82f6 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🏗️ Standard vs Provisioned Control Plane' : isZh ? '🏗️ Standard 与 Provisioned Control Plane 对比' : '🏗️ Standard vs Provisioned Control Plane'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'API 스로틀링 제거로 대규모 스케일링 성능 극대화' : isZh ? '消除 API 限流，最大化大规模扩缩性能' : 'Maximize large-scale scaling by eliminating API throttling'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Header row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '120px repeat(4, 1fr)',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{ padding: '10px 12px', fontSize: '12px', fontWeight: '700', color: '#6b7280' }}>
            {isKo ? '항목' : isZh ? '项目' : 'Feature'}
          </div>
          {tiers.map((t, i) => (
            <div key={i} style={{
              padding: '10px 8px',
              textAlign: 'center',
              fontWeight: '700',
              fontSize: '12px',
              color: 'white',
              background: t.color,
              borderLeft: '1px solid rgba(255,255,255,0.2)'
            }}>
              {t.name}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {[
          { label: labels.apiThrottling, key: 'apiThrottling' },
          { label: labels.podTps, key: 'podTps' },
          { label: labels.nodeUpdate, key: 'nodeUpdate' },
          { label: labels.concurrentScale, key: 'concurrentScale' },
          { label: labels.monthlyCost, key: 'monthlyCost' },
          { label: labels.recommended, key: 'recommended' }
        ].map((row, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '120px repeat(4, 1fr)',
            borderBottom: idx < 5 ? '1px solid #f3f4f6' : 'none',
            background: idx % 2 === 0 ? '#fafafa' : 'white'
          }}>
            <div style={{
              padding: '8px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: '#4b5563',
              display: 'flex',
              alignItems: 'center'
            }}>
              {row.label}
            </div>
            {tiers.map((t, i) => (
              <div key={i} style={{
                padding: '8px',
                textAlign: 'center',
                fontSize: '12px',
                fontWeight: row.key === 'monthlyCost' ? '700' : '500',
                color: row.key === 'monthlyCost' ? t.color : '#1f2937',
                borderLeft: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {t[row.key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ControlPlaneComparison;
