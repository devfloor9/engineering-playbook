import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const RoiQuantitativeMetrics = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const metrics = [
    {
      name: 'MTTD',
      fullName: 'Mean Time to Detect',
      color: '#2563eb',
      description: isKo ? '이상 발생 → 탐지까지 시간' : 'Time from anomaly occurrence → detection',
      improvement: isKo ? '80-90% 감소' : '80-90% reduction'
    },
    {
      name: 'MTTR',
      fullName: 'Mean Time to Resolve',
      color: '#7c3aed',
      description: isKo ? '탐지 → 해결까지 시간' : 'Time from detection → resolution',
      improvement: isKo ? '70-80% 감소' : '70-80% reduction'
    },
    {
      name: isKo ? '알림 노이즈' : 'Alert Noise',
      fullName: 'Alert Noise Reduction',
      color: '#059669',
      description: isKo ? '일일 알림 건수 중 실제 조치 필요 비율' : 'Ratio of daily alerts requiring action',
      improvement: isKo ? '80-90% 감소' : '80-90% reduction'
    },
    {
      name: isKo ? '인시던트 반복률' : 'Incident Recurrence',
      fullName: 'Incident Recurrence Rate',
      color: '#d97706',
      description: isKo ? '동일 유형 인시던트 재발 비율' : 'Recurrence rate of same incident type',
      improvement: isKo ? '60-70% 감소' : '60-70% reduction'
    },
    {
      name: isKo ? '비용 효율' : 'Cost Efficiency',
      fullName: 'Cost Efficiency',
      color: '#dc2626',
      description: isKo ? '인프라 비용 대비 실제 사용률' : 'Actual utilization vs infrastructure cost',
      improvement: isKo ? '30-40% 개선' : '30-40% improvement'
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
          {isKo ? 'AIOps ROI 정량적 지표' : 'AIOps ROI Quantitative Metrics'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '측정 가능한 개선 효과' : 'Measurable improvement results'}
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
            {isKo ? '지표' : 'Metric'}
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '측정 방법' : 'Measurement Method'}
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '목표 개선율' : 'Target Improvement'}
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
          <strong>{isKo ? '측정 기준:' : 'Measurement Baseline:'}</strong> {isKo
            ? 'AIOps 도입 전 3개월 평균 vs 도입 후 3개월 평균을 비교하여 개선율을 산출합니다. 정성적 지표(운영팀 만족도, 배포 자신감 등)도 함께 추적하세요.'
            : 'Calculate improvement rate by comparing 3-month average before vs after AIOps adoption. Also track qualitative metrics (ops team satisfaction, deployment confidence, etc.).'}
        </div>
      </div>
    </div>
  );
};

export default RoiQuantitativeMetrics;
