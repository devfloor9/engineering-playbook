import React from 'react';

const RoiQuantitativeMetrics = () => {
  const metrics = [
    {
      name: 'MTTD',
      fullName: 'Mean Time to Detect',
      color: '#2563eb',
      description: '이상 발생 → 탐지까지 시간',
      improvement: '80-90% 감소'
    },
    {
      name: 'MTTR',
      fullName: 'Mean Time to Resolve',
      color: '#7c3aed',
      description: '탐지 → 해결까지 시간',
      improvement: '70-80% 감소'
    },
    {
      name: '알림 노이즈',
      fullName: 'Alert Noise Reduction',
      color: '#059669',
      description: '일일 알림 건수 중 실제 조치 필요 비율',
      improvement: '80-90% 감소'
    },
    {
      name: '인시던트 반복률',
      fullName: 'Incident Recurrence Rate',
      color: '#d97706',
      description: '동일 유형 인시던트 재발 비율',
      improvement: '60-70% 감소'
    },
    {
      name: '비용 효율',
      fullName: 'Cost Efficiency',
      color: '#dc2626',
      description: '인프라 비용 대비 실제 사용률',
      improvement: '30-40% 개선'
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
        background: 'linear-gradient(135deg, #166534 0%, #059669 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          AIOps ROI 정량적 지표
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          측정 가능한 개선 효과
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
          gridTemplateColumns: '120px 1fr 100px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            지표
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            측정 방법
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            목표 개선율
          </div>
        </div>

        {metrics.map((metric, idx) => (
          <div key={metric.name} style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 100px',
            borderBottom: idx < metrics.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '12px 14px',
              background: `${metric.color}08`,
              display: 'flex',
              flexDirection: 'column',
              gap: '2px'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: metric.color
              }}>
                {metric.name}
              </div>
              <div style={{
                fontSize: '10px',
                color: '#6b7280'
              }}>
                {metric.fullName}
              </div>
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {metric.description}
            </div>
            <div style={{
              padding: '12px 14px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                background: `${metric.color}15`,
                color: metric.color,
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                whiteSpace: 'nowrap'
              }}>
                {metric.improvement}
              </span>
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
          <strong>측정 기준:</strong> AIOps 도입 전 3개월 평균 vs 도입 후 3개월 평균을 비교하여 개선율을 산출합니다.
          정성적 지표(운영팀 만족도, 배포 자신감 등)도 함께 추적하세요.
        </div>
      </div>
    </div>
  );
};

export default RoiQuantitativeMetrics;
