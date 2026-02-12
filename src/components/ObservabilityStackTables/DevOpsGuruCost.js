import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DevOpsGuruCost = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const items = [
    {
      item: isKo ? '과금 기준' : 'Billing Criteria',
      description: isKo ? '분석된 AWS 리소스 수 기준 (시간당)' : 'Based on number of analyzed AWS resources (per hour)'
    },
    {
      item: isKo ? '예상 비용' : 'Estimated Cost',
      description: isKo ? '리소스 100개 기준 월 ~$50' : '~$50/month for 100 resources'
    },
    {
      item: isKo ? '무료 티어' : 'Free Tier',
      description: isKo ? '최초 3개월 무료 체험' : 'First 3 months free trial'
    },
    {
      item: isKo ? '활성화 권장' : 'Activation Recommendation',
      description: isKo ? '프로덕션 클러스터에만 활성화' : 'Enable only on production clusters'
    }
  ];

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #7c2d12 0%, #9a3412 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? 'DevOps Guru 비용 및 활성화' : 'DevOps Guru Cost and Activation'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'ML 이상 탐지 서비스 과금 구조' : 'ML Anomaly Detection Service Pricing Structure'}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '항목' : 'Item'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '설명' : 'Description'}
          </div>
        </div>

        {/* Data Rows */}
        {items.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '140px 1fr',
            borderBottom: idx < items.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.item}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DevOpsGuruCost;
