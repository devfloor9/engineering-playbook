import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ScalingLatencyBreakdown = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const stages = [
    {
      stage: isKo ? '메트릭 수집' : isZh ? '指标采集' : 'Metric Collection',
      p50: '30s', p95: '65s', p99: '90s',
      barP50: 20, barP95: 43, barP99: 60,
      color: '#3b82f6'
    },
    {
      stage: isKo ? 'HPA 결정' : isZh ? 'HPA 决策' : 'HPA Decision',
      p50: '10s', p95: '25s', p99: '45s',
      barP50: 7, barP95: 17, barP99: 30,
      color: '#8b5cf6'
    },
    {
      stage: isKo ? '노드 프로비저닝' : isZh ? '节点供应' : 'Node Provisioning',
      p50: '90s', p95: '180s', p99: '300s',
      barP50: 60, barP95: 100, barP99: 100,
      color: '#ef4444'
    },
    {
      stage: isKo ? '컨테이너 시작' : isZh ? '容器启动' : 'Container Start',
      p50: '15s', p95: '35s', p99: '60s',
      barP50: 10, barP95: 23, barP99: 40,
      color: '#f59e0b'
    },
    {
      stage: isKo ? '전체 E2E' : isZh ? '端到端总计' : 'Total E2E',
      p50: '145s', p95: '305s', p99: '495s',
      barP50: 97, barP95: 100, barP99: 100,
      color: '#dc2626',
      isTotal: true
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
        background: 'linear-gradient(135deg, #7f1d1d 0%, #dc2626 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '⚡ 프로덕션 스케일링 지연 측정값 (최적화 전)' : isZh ? '⚡ 生产环境扩缩延迟测量值（优化前）' : '⚡ Production Scaling Latency (Before Optimization)'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '28개 EKS 클러스터 환경에서 측정한 P50/P95/P99 스케일링 지연' : isZh ? '在 28 个 EKS 集群环境中测量的 P50/P95/P99 扩缩延迟' : 'P50/P95/P99 scaling latency measured across 28 EKS clusters'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
        padding: '16px 20px'
      }}>
        {/* Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr 1fr 1fr',
          gap: '8px',
          marginBottom: '12px',
          paddingBottom: '8px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' }}>
            {isKo ? '단계' : isZh ? '阶段' : 'Stage'}
          </div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#3b82f6', textAlign: 'center' }}>P50</div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#f59e0b', textAlign: 'center' }}>P95</div>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#ef4444', textAlign: 'center' }}>P99</div>
        </div>

        {stages.map((s, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr 1fr 1fr',
            gap: '8px',
            padding: '8px 0',
            borderBottom: idx < stages.length - 1 ? '1px solid #f3f4f6' : 'none',
            background: s.isTotal ? '#fef2f2' : 'transparent',
            margin: s.isTotal ? '8px -20px -16px' : '0',
            padding: s.isTotal ? '12px 20px' : '8px 0',
            borderRadius: s.isTotal ? '0 0 8px 8px' : '0'
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: s.isTotal ? '700' : '600',
              color: s.isTotal ? '#dc2626' : '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {s.stage}
            </div>
            {[
              { val: s.p50, bar: s.barP50 },
              { val: s.p95, bar: s.barP95 },
              { val: s.p99, bar: s.barP99 }
            ].map((cell, ci) => (
              <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: s.isTotal ? '#dc2626' : '#1f2937', textAlign: 'center' }}>
                  {cell.val}
                </div>
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: '#f3f4f6',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${cell.bar}%`,
                    height: '100%',
                    background: s.color,
                    borderRadius: '3px',
                    minWidth: '4px'
                  }} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScalingLatencyBreakdown;
