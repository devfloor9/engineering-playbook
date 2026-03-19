import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const PracticalGuide = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const scenarios = [
    {
      icon: '⏰',
      scenario: isKo ? '예측 가능한 피크 타임' : isZh ? '可预测的高峰时段' : 'Predictable peak times',
      strategy: 'Warm Pool (15%)',
      time: '0-2s',
      cost: '$1,080',
      color: '#059669'
    },
    {
      icon: '🌊',
      scenario: isKo ? '예측 불가능한 트래픽' : isZh ? '不可预测流量' : 'Unpredictable traffic',
      strategy: 'Fast Provisioning (Spot)',
      time: '5-15s',
      cost: isKo ? '사용량 기반' : isZh ? '按用量计费' : 'Usage-based',
      color: '#3b82f6'
    },
    {
      icon: '🏢',
      scenario: isKo ? '대규모 클러스터 (5,000+ Pod)' : isZh ? '大规模集群（5,000+ Pod）' : 'Large cluster (5,000+ Pods)',
      strategy: 'Provisioned XL + Fast',
      time: '5-10s',
      cost: '$350+',
      color: '#8b5cf6'
    },
    {
      icon: '🤖',
      scenario: isKo ? 'AI/ML 학습 워크로드' : isZh ? 'AI/ML 训练工作负载' : 'AI/ML training workloads',
      strategy: 'Setu + GPU NodePool',
      time: '15-30s',
      cost: isKo ? '사용량 기반' : isZh ? '按用量计费' : 'Usage-based',
      color: '#f59e0b'
    },
    {
      icon: '🔒',
      scenario: isKo ? '미션 크리티컬 SLA' : isZh ? '关键任务 SLA' : 'Mission-critical SLA',
      strategy: 'Warm Pool + Provisioned + NRC',
      time: '0-2s',
      cost: '$1,430',
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
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🎯 실무 적용 가이드' : isZh ? '🎯 实战应用指南' : '🎯 Practical Implementation Guide'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '시나리오별 권장 전략과 예상 성능, 비용' : isZh ? '各场景推荐策略、预期性能与成本' : 'Recommended strategies, expected performance, and costs by scenario'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {scenarios.map((s, idx) => (
          <div key={idx} style={{
            padding: '14px 20px',
            borderBottom: idx < scenarios.length - 1 ? '1px solid #f3f4f6' : 'none',
            borderLeft: `4px solid ${s.color}`,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap'
          }}>
            <span style={{ fontSize: '20px', flex: '0 0 30px' }}>{s.icon}</span>
            <div style={{ flex: '1', minWidth: '140px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: 'var(--ifm-font-color-base)' }}>{s.scenario}</div>
              <div style={{ fontSize: '12px', color: 'var(--ifm-color-emphasis-600)', marginTop: '2px' }}>{s.strategy}</div>
            </div>
            <div style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: s.color }}>{s.time}</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-emphasis-500)' }}>
                  {isKo ? '스케일링' : isZh ? '扩缩时间' : 'Scaling'}
                </div>
              </div>
              <div style={{
                width: '1px',
                height: '24px',
                background: 'var(--ifm-color-emphasis-200)'
              }} />
              <div style={{ textAlign: 'center', minWidth: '70px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--ifm-font-color-base)' }}>{s.cost}</div>
                <div style={{ fontSize: '10px', color: 'var(--ifm-color-emphasis-500)' }}>
                  {isKo ? '월 추가' : isZh ? '月额外' : 'Monthly extra'}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PracticalGuide;
