import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CostSimulation = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const scenarios = [
    {
      name: 'InternalTrafficPolicy Local',
      cost: '$0',
      description: isKo ? '노드 로컬 통신, cross-AZ 완전 제거' : isZh ? '节点本地通信，完全消除 cross-AZ' : 'Node-local traffic, zero cross-AZ',
      barWidth: '2%',
      color: '#059669'
    },
    {
      name: 'ClusterIP + Topology Hints',
      cost: '~$30',
      description: isKo ? 'cross-AZ ~30%로 감소' : isZh ? 'cross-AZ 降至约 30%' : 'cross-AZ reduced to ~30%',
      barWidth: '15%',
      color: '#3b82f6'
    },
    {
      name: isKo ? 'ClusterIP (기본, AZ 인식 없음)' : isZh ? 'ClusterIP（默认，无 AZ 感知）' : 'ClusterIP (default, no AZ awareness)',
      cost: '~$68',
      description: isKo ? 'cross-AZ ~66% (3-AZ 균등분산)' : isZh ? 'cross-AZ 约 66%（3-AZ 均匀分布）' : 'cross-AZ ~66% (3-AZ even distribution)',
      barWidth: '35%',
      color: '#f59e0b'
    },
    {
      name: isKo ? 'Internal ALB 경유' : isZh ? '经 Internal ALB' : 'Via Internal ALB',
      cost: '~$98',
      description: isKo ? 'ALB 시간당 + LCU + cross-AZ' : isZh ? 'ALB 每小时 + LCU + cross-AZ' : 'ALB hourly + LCU + cross-AZ',
      barWidth: '50%',
      color: '#ef4444'
    },
    {
      name: 'VPC Lattice',
      cost: '$400+',
      description: isKo ? '서비스당 시간과금 + GB당 + 요청당' : isZh ? '每服务每小时 + 每 GB + 每请求' : 'Per service hourly + per GB + per request',
      barWidth: '100%',
      color: '#dc2626'
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
          {isKo ? '💰 10 TB/월 East-West 트래픽 비용 시뮬레이션' : isZh ? '💰 10 TB/月 East-West 流量成本模拟' : '💰 10 TB/Month East-West Traffic Cost Simulation'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '동일 리전 3-AZ EKS 클러스터, 총 10 TB (10,240 GB) 서비스 간 트래픽 기준' : isZh ? '同一区域 3-AZ EKS 集群，总计 10 TB（10,240 GB）服务间流量基准' : 'Same-region 3-AZ EKS cluster, 10 TB (10,240 GB) inter-service traffic'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden',
        padding: '16px 20px'
      }}>
        {scenarios.map((s, idx) => (
          <div key={idx} style={{ marginBottom: idx < scenarios.length - 1 ? '14px' : '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--ifm-font-color-base)' }}>{s.name}</span>
              <span style={{ fontSize: '15px', fontWeight: '700', color: s.color }}>{s.cost}</span>
            </div>
            <div style={{
              width: '100%',
              height: '20px',
              background: 'var(--ifm-color-emphasis-100)',
              borderRadius: '4px',
              overflow: 'hidden',
              marginBottom: '2px'
            }}>
              <div style={{
                width: s.barWidth,
                height: '100%',
                background: s.color,
                borderRadius: '4px',
                minWidth: '4px',
                transition: 'width 0.3s'
              }} />
            </div>
            <div style={{ fontSize: '11px', color: 'var(--ifm-color-emphasis-500)' }}>{s.description}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CostSimulation;
