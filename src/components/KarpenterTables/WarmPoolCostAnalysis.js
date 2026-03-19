import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const WarmPoolCostAnalysis = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const scenarios = [
    {
      title: isKo ? '시나리오 1: 중규모 클러스터 (피크 200 Pod)' : isZh ? '场景 1：中等规模集群（峰值 200 Pod）' : 'Scenario 1: Mid-size Cluster (Peak 200 Pods)',
      rows: [
        {
          config: isKo ? '공격적 (10%)' : isZh ? '激进（10%）' : 'Aggressive (10%)',
          poolSize: '20 Pod',
          cost: '$720',
          scalingTime: isKo ? '0-2초 (90%)' : isZh ? '0-2秒（90%）' : '0-2s (90%)',
          fit: isKo ? '높은 버스트 빈도' : isZh ? '高突发频率' : 'High burst frequency',
          color: '#f59e0b',
          recommended: false
        },
        {
          config: isKo ? '균형 (15%)' : isZh ? '均衡（15%）' : 'Balanced (15%)',
          poolSize: '30 Pod',
          cost: '$1,080',
          scalingTime: isKo ? '0-2초 (95%)' : isZh ? '0-2秒（95%）' : '0-2s (95%)',
          fit: isKo ? '권장' : isZh ? '推荐' : 'Recommended',
          color: '#059669',
          recommended: true
        },
        {
          config: isKo ? '보수적 (20%)' : isZh ? '保守（20%）' : 'Conservative (20%)',
          poolSize: '40 Pod',
          cost: '$1,440',
          scalingTime: isKo ? '0-2초 (99%)' : isZh ? '0-2秒（99%）' : '0-2s (99%)',
          fit: isKo ? '미션 크리티컬' : isZh ? '关键任务' : 'Mission Critical',
          color: '#3b82f6',
          recommended: false
        }
      ]
    },
    {
      title: isKo ? '시나리오 2: 대규모 클러스터 (피크 1,000 Pod)' : isZh ? '场景 2：大规模集群（峰值 1,000 Pod）' : 'Scenario 2: Large Cluster (Peak 1,000 Pods)',
      rows: [
        {
          config: isKo ? '공격적 (5%)' : isZh ? '激进（5%）' : 'Aggressive (5%)',
          poolSize: '50 Pod',
          cost: '$1,800',
          scalingTime: isKo ? '0-2초 (80%)' : isZh ? '0-2秒（80%）' : '0-2s (80%)',
          fit: isKo ? '예측 가능한 트래픽' : isZh ? '可预测流量' : 'Predictable traffic',
          color: '#f59e0b',
          recommended: false
        },
        {
          config: isKo ? '균형 (10%)' : isZh ? '均衡（10%）' : 'Balanced (10%)',
          poolSize: '100 Pod',
          cost: '$3,600',
          scalingTime: isKo ? '0-2초 (90%)' : isZh ? '0-2秒（90%）' : '0-2s (90%)',
          fit: isKo ? '권장' : isZh ? '推荐' : 'Recommended',
          color: '#059669',
          recommended: true
        },
        {
          config: isKo ? '보수적 (15%)' : isZh ? '保守（15%）' : 'Conservative (15%)',
          poolSize: '150 Pod',
          cost: '$5,400',
          scalingTime: isKo ? '0-2초 (98%)' : isZh ? '0-2秒（98%）' : '0-2s (98%)',
          fit: isKo ? '고가용성 요구' : isZh ? '高可用性要求' : 'High Availability',
          color: '#3b82f6',
          recommended: false
        }
      ]
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
          {isKo ? '💰 Warm Pool 비용 분석' : isZh ? '💰 Warm Pool 成本分析' : '💰 Warm Pool Cost Analysis'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'Pause Pod Overprovisioning 구성별 비용 대비 스케일링 속도' : isZh ? '按 Pause Pod Overprovisioning 配置的成本与扩缩速度对比' : 'Cost vs scaling speed by Pause Pod Overprovisioning configuration'}
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
        {scenarios.map((scenario, sIdx) => (
          <div key={sIdx} style={{ marginBottom: sIdx < scenarios.length - 1 ? '20px' : '0' }}>
            <div style={{
              fontSize: '14px',
              fontWeight: '700',
              color: 'var(--ifm-font-color-base)',
              marginBottom: '10px',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--ifm-color-emphasis-200)'
            }}>
              {scenario.title}
            </div>

            {scenario.rows.map((row, rIdx) => (
              <div key={rIdx} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 12px',
                marginBottom: '6px',
                borderRadius: '6px',
                border: row.recommended ? `2px solid ${row.color}` : '1px solid #f3f4f6',
                background: row.recommended ? '#f0fdf4' : 'white',
                position: 'relative'
              }}>
                {row.recommended && (
                  <span style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '12px',
                    background: row.color,
                    color: 'white',
                    padding: '1px 8px',
                    borderRadius: '3px',
                    fontSize: '10px',
                    fontWeight: '700'
                  }}>
                    {isKo ? '권장' : isZh ? '推荐' : 'RECOMMENDED'}
                  </span>
                )}
                <div style={{ flex: '0 0 100px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: row.color }}>{row.config}</div>
                  <div style={{ fontSize: '11px', color: 'var(--ifm-color-emphasis-500)' }}>{row.poolSize}</div>
                </div>
                <div style={{
                  flex: '0 0 70px',
                  fontSize: '15px',
                  fontWeight: '700',
                  color: 'var(--ifm-font-color-base)',
                  textAlign: 'center'
                }}>
                  {row.cost}
                  <div style={{ fontSize: '10px', color: 'var(--ifm-color-emphasis-500)', fontWeight: '400' }}>
                    {isKo ? '/월' : isZh ? '/月' : '/mo'}
                  </div>
                </div>
                <div style={{ flex: '1' }}>
                  <div style={{
                    width: '100%',
                    height: '20px',
                    background: 'var(--ifm-color-emphasis-100)',
                    borderRadius: '4px',
                    overflow: 'hidden',
                    position: 'relative'
                  }}>
                    <div style={{
                      width: row.scalingTime.includes('99') ? '99%' : row.scalingTime.includes('98') ? '98%' : row.scalingTime.includes('95') ? '95%' : row.scalingTime.includes('90') ? '90%' : '80%',
                      height: '100%',
                      background: row.color,
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <span style={{ fontSize: '10px', fontWeight: '700', color: 'white' }}>
                        {row.scalingTime}
                      </span>
                    </div>
                  </div>
                </div>
                <div style={{ flex: '0 0 100px', fontSize: '11px', color: 'var(--ifm-color-emphasis-600)', textAlign: 'right' }}>
                  {row.fit}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default WarmPoolCostAnalysis;
