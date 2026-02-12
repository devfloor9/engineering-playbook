import React from 'react';

const AlertOptimization = () => {
  const strategies = [
    {
      item: 'SLO 기반 알림',
      strategy: 'Error Budget 소진율 기준 알림',
      effect: '알림 수 70% 감소'
    },
    {
      item: 'Composite Alarms',
      strategy: '복합 조건으로 노이즈 필터링',
      effect: '오탐률 50% 감소'
    },
    {
      item: 'DevOps Guru',
      strategy: 'ML이 정상/비정상 자동 판단',
      effect: '학습 후 오탐 80% 감소'
    },
    {
      item: '알림 라우팅',
      strategy: '심각도별 채널 분리 (PagerDuty, Slack)',
      effect: '대응 속도 40% 향상'
    },
    {
      item: '자동 복구',
      strategy: '알림 → EventBridge → Lambda 자동 대응',
      effect: '수동 개입 60% 감소'
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
        background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          알림 최적화 체크리스트
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Alert Fatigue 해결 전략과 효과
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
          gridTemplateColumns: '150px 1fr 150px',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            항목
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            전략
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            기대 효과
          </div>
        </div>

        {/* Data Rows */}
        {strategies.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '150px 1fr 150px',
            borderBottom: idx < strategies.length - 1 ? '1px solid #f3f4f6' : 'none'
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
              {item.strategy}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#059669',
              fontWeight: '600',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {item.effect}
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          💡 <strong>Alert Fatigue 문제:</strong> 평균적인 EKS 클러스터는 일 50-200개의 알림이 발생하지만, 실제 조치가 필요한 알림은 10-15%에 불과합니다.
          SLO 기반 알림과 ML 이상 탐지를 결합하면 노이즈를 대폭 줄일 수 있습니다.
        </div>
      </div>
    </div>
  );
};

export default AlertOptimization;
