import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import parallelization from '../../data/moe-parallelization.json';
const ParallelizationStrategies = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const locale = isKo ? 'ko' : 'en';
  const strategies = parallelization.map(row => ({
    ...row,
    description: row.description[locale],
    advantages: row.advantages[locale],
    disadvantages: row.disadvantages[locale],
  }));
  return <div style={{
    maxWidth: '1000px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '8px 8px 0 0'
    }}>
        <div style={{
        fontSize: '20px',
        fontWeight: '600'
      }}>
          {isKo ? 'MoE 모델 병렬화 전략' : 'MoE Model Parallelization Strategies'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      padding: '20px'
    }}>
        {strategies.map((strategy, index) => <div key={index} style={{
        background: `${strategy.color}08`,
        padding: '24px',
        borderRadius: '8px',
        borderLeft: `4px solid ${strategy.color}`,
        marginBottom: index < strategies.length - 1 ? '16px' : '0',
        transition: 'transform 0.2s, box-shadow 0.2s'
      }}>
            <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '16px'
        }}>
              <span style={{
            fontSize: '32px'
          }}>{strategy.icon}</span>
              <div style={{
            fontSize: '20px',
            fontWeight: '600',
            color: strategy.color
          }}>
                {strategy.strategy}
              </div>
            </div>

            <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
              <div>
                <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--ifm-color-emphasis-600)',
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
                  {isKo ? '설명' : 'Description'}
                </div>
                <div style={{
              fontSize: '14px',
              color: 'var(--ifm-font-color-base)',
              lineHeight: '1.5'
            }}>
                  {strategy.description}
                </div>
              </div>

              <div>
                <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--ifm-color-emphasis-600)',
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
                  {isKo ? '장점' : 'Advantages'}
                </div>
                <div style={{
              fontSize: '14px',
              color: '#10b981',
              lineHeight: '1.5',
              fontWeight: '500'
            }}>
                  ✓ {strategy.advantages}
                </div>
              </div>

              <div>
                <div style={{
              fontSize: '12px',
              fontWeight: '600',
              color: 'var(--ifm-color-emphasis-600)',
              marginBottom: '4px',
              textTransform: 'uppercase'
            }}>
                  {isKo ? '단점' : 'Disadvantages'}
                </div>
                <div style={{
              fontSize: '14px',
              color: '#ef4444',
              lineHeight: '1.5',
              fontWeight: '500'
            }}>
                  ✗ {strategy.disadvantages}
                </div>
              </div>
            </div>
          </div>)}
      </div>
    </div>;
};
export default ParallelizationStrategies;
