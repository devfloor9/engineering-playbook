import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ScalingBenchmark = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const configs = [
    {
      name: isKo ? '기본 HPA + Karpenter' : isZh ? '基本 HPA + Karpenter' : 'Basic HPA + Karpenter',
      detect: '30-60s', provision: '45-60s', podStart: '10-15s',
      total: '90-120s',
      env: isKo ? '기본 환경' : isZh ? '基础环境' : 'Basic setup',
      color: '#ef4444',
      barWidth: 100
    },
    {
      name: isKo ? '최적화 메트릭 + Karpenter' : isZh ? '优化指标 + Karpenter' : 'Optimized Metrics + Karpenter',
      detect: '5-10s', provision: '30-45s', podStart: '10-15s',
      total: '50-70s',
      env: isKo ? '중규모' : isZh ? '中等规模' : 'Mid-scale',
      color: '#f59e0b',
      barWidth: 58
    },
    {
      name: 'EKS Auto Mode',
      detect: '5-10s', provision: '30-45s', podStart: '10-15s',
      total: '45-70s',
      env: isKo ? '운영 단순화' : isZh ? '运维简化' : 'Simplified Ops',
      color: '#ea580c',
      barWidth: 54
    },
    {
      name: 'KEDA + Karpenter',
      detect: '2-5s', provision: '30-45s', podStart: '10-15s',
      total: '42-65s',
      env: 'Event-driven',
      color: '#8b5cf6',
      barWidth: 50
    },
    {
      name: 'Setu + Kueue (Gang)',
      detect: '2-5s', provision: '30-45s', podStart: '5-10s',
      total: '37-60s',
      env: 'ML/Batch',
      color: '#3b82f6',
      barWidth: 45
    },
    {
      name: isKo ? 'Warm Pool (기존 노드)' : isZh ? 'Warm Pool（现有节点）' : 'Warm Pool (existing nodes)',
      detect: '2-5s', provision: '0s', podStart: '3-5s',
      total: '5-10s',
      env: isKo ? '예측 가능 트래픽' : isZh ? '可预测流量' : 'Predictable traffic',
      color: '#059669',
      barWidth: 8
    }
  ];

  const guide = [
    {
      req: isKo ? '10초 미만 스케일링 필수' : isZh ? '必须 <10秒 扩缩' : 'Sub-10s scaling required',
      rec: 'Warm Pool + Provisioned CP',
      icon: '🚀'
    },
    {
      req: isKo ? '예측 불가능한 트래픽' : isZh ? '不可预测流量' : 'Unpredictable traffic',
      rec: 'KEDA + Karpenter',
      icon: '🌊'
    },
    {
      req: isKo ? '운영 단순화 우선' : isZh ? '运维简化优先' : 'Operational simplicity',
      rec: 'EKS Auto Mode',
      icon: '🎯'
    },
    {
      req: isKo ? 'ML/Batch 작업' : isZh ? 'ML/Batch 作业' : 'ML/Batch jobs',
      rec: 'Setu + Kueue',
      icon: '🤖'
    },
    {
      req: isKo ? '비용 최적화 우선' : isZh ? '成本优化优先' : 'Cost optimization first',
      rec: isKo ? '최적화 메트릭 + Karpenter' : isZh ? '优化指标 + Karpenter' : 'Optimized Metrics + Karpenter',
      icon: '💰'
    }
  ];

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      {/* Benchmark Table */}
      <div style={{
        background: 'linear-gradient(135deg, #312e81 0%, #6366f1 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '📊 종합 스케일링 벤치마크' : isZh ? '📊 综合扩缩基准测试' : '📊 Comprehensive Scaling Benchmark'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '실제 프로덕션 환경(28개 클러스터, 15,000+ Pod)에서 측정한 P95 스케일링 시간' : isZh ? '在生产环境（28 个集群，15,000+ Pod）中测量的 P95 扩缩时间' : 'P95 scaling times measured in production (28 clusters, 15,000+ Pods)'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        padding: '16px 20px'
      }}>
        {configs.map((c, idx) => (
          <div key={idx} style={{ marginBottom: idx < configs.length - 1 ? '14px' : '0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1f2937' }}>{c.name}</span>
                <span style={{
                  background: '#f3f4f6',
                  color: '#6b7280',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '600',
                  marginLeft: '8px'
                }}>{c.env}</span>
              </div>
              <span style={{ fontSize: '15px', fontWeight: '700', color: c.color }}>{c.total}</span>
            </div>
            <div style={{
              width: '100%',
              height: '22px',
              background: '#f3f4f6',
              borderRadius: '4px',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                width: `${c.barWidth}%`,
                height: '100%',
                background: c.color,
                borderRadius: '4px',
                minWidth: '4px',
                display: 'flex',
                alignItems: 'center',
                paddingLeft: '6px'
              }}>
                {c.barWidth > 30 && (
                  <span style={{ fontSize: '9px', color: 'white', fontWeight: '600', whiteSpace: 'nowrap' }}>
                    {isKo ? '감지' : isZh ? '检测' : 'Detect'} {c.detect} → {isKo ? '프로비저닝' : isZh ? '供应' : 'Provision'} {c.provision} → Pod {c.podStart}
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Selection Guide */}
      <div style={{
        background: '#f8fafc',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '16px 20px'
      }}>
        <div style={{ fontSize: '14px', fontWeight: '700', color: '#1f2937', marginBottom: '10px' }}>
          {isKo ? '🎯 선택 가이드' : isZh ? '🎯 选择指南' : '🎯 Selection Guide'}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
          {guide.map((g, idx) => (
            <div key={idx} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              background: 'white',
              borderRadius: '6px',
              border: '1px solid #e5e7eb'
            }}>
              <span style={{ fontSize: '16px' }}>{g.icon}</span>
              <div>
                <div style={{ fontSize: '11px', color: '#6b7280' }}>{g.req}</div>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1f2937' }}>{g.rec}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScalingBenchmark;
