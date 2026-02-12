import React from 'react';

const CostStructure = () => {
  const costItems = [
    {
      name: 'AMP 수집 비용',
      color: '#2563eb',
      description: '메트릭 샘플 수 기반',
      optimization: '불필요한 메트릭 필터링, 수집 주기 조정'
    },
    {
      name: 'AMG 사용자 비용',
      color: '#7c3aed',
      description: '활성 사용자 수 기반',
      optimization: 'SSO 통합, 뷰어/에디터 역할 분리'
    },
    {
      name: 'DevOps Guru',
      color: '#059669',
      description: '분석 리소스 수 기반',
      optimization: '핵심 리소스 그룹만 활성화'
    },
    {
      name: 'CloudWatch',
      color: '#d97706',
      description: '로그/메트릭 볼륨 기반',
      optimization: '로그 필터링, 메트릭 해상도 조정'
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
      <div style={{
        background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          AIOps 비용 구조 고려사항
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          주요 비용 항목과 최적화 방법
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '140px 140px 1fr',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            비용 항목
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            설명
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            최적화 방법
          </div>
        </div>

        {costItems.map((item, idx) => (
          <div key={item.name} style={{
            display: 'grid',
            gridTemplateColumns: '140px 140px 1fr',
            borderBottom: idx < costItems.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '12px 14px',
              background: `${item.color}08`,
              fontSize: '13px',
              fontWeight: '700',
              color: item.color,
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.name}
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.description}
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.optimization}
            </div>
          </div>
        ))}

        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>비용 최적화 전략:</strong> 초기에는 전체 활성화로 가치를 검증한 후,
          데이터 기반으로 불필요한 메트릭과 로그를 필터링하여 비용을 점진적으로 최적화하세요.
          AWS Cost Explorer와 CloudWatch Contributor Insights로 비용 구조를 분석할 수 있습니다.
        </div>
      </div>
    </div>
  );
};

export default CostStructure;
