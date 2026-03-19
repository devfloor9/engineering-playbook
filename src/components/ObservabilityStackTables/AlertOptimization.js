import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AlertOptimization = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const strategies = [
    {
      item: isKo ? 'SLO 기반 알림' : isZh ? '基于 SLO 的告警' : 'SLO-based Alerts',
      strategy: isKo ? 'Error Budget 소진율 기준 알림' : isZh ? '基于 Error Budget 消耗率的告警' : 'Alert based on Error Budget burn rate',
      effect: isKo ? '알림 수 70% 감소' : isZh ? '告警数量减少 70%' : '70% reduction in alert volume'
    },
    {
      item: 'Composite Alarms',
      strategy: isKo ? '복합 조건으로 노이즈 필터링' : isZh ? '通过复合条件过滤噪声' : 'Filter noise with composite conditions',
      effect: isKo ? '오탐률 50% 감소' : isZh ? '误报率减少 50%' : '50% reduction in false positives'
    },
    {
      item: 'DevOps Guru',
      strategy: isKo ? 'ML이 정상/비정상 자동 판단' : isZh ? 'ML 自动检测正常/异常模式' : 'ML auto-detects normal/anomalous patterns',
      effect: isKo ? '학습 후 오탐 80% 감소' : isZh ? '学习后误报减少 80%' : '80% reduction in false positives after learning'
    },
    {
      item: isKo ? '알림 라우팅' : isZh ? '告警路由' : 'Alert Routing',
      strategy: isKo ? '심각도별 채널 분리 (PagerDuty, Slack)' : isZh ? '按严重程度分离通道 (PagerDuty, Slack)' : 'Separate channels by severity (PagerDuty, Slack)',
      effect: isKo ? '대응 속도 40% 향상' : isZh ? '响应速度提升 40%' : '40% faster response time'
    },
    {
      item: isKo ? '자동 복구' : isZh ? '自动修复' : 'Auto-Remediation',
      strategy: isKo ? '알림 → EventBridge → Lambda 자동 대응' : isZh ? '告警 → EventBridge → Lambda 自动响应' : 'Alert → EventBridge → Lambda auto-response',
      effect: isKo ? '수동 개입 60% 감소' : isZh ? '人工干预减少 60%' : '60% reduction in manual intervention'
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
          {isKo ? '알림 최적화 체크리스트' : isZh ? '告警优化清单' : 'Alert Optimization Checklist'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'Alert Fatigue 해결 전략과 효과' : isZh ? '解决告警疲劳的策略和效果' : 'Strategies and Effects for Solving Alert Fatigue'}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '150px 1fr 150px',
          borderBottom: '2px solid var(--ifm-color-emphasis-200)',
          background: 'var(--ifm-background-surface-color)'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '항목' : isZh ? '项目' : 'Item'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '전략' : isZh ? '策略' : 'Strategy'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '기대 효과' : isZh ? '预期效果' : 'Expected Effect'}
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
              background: 'var(--ifm-background-surface-color)',
              fontWeight: '700',
              color: 'var(--ifm-font-color-base)',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.item}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: 'var(--ifm-font-color-base)',
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
          background: 'var(--ifm-color-emphasis-100)',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: 'var(--ifm-color-emphasis-700)',
          lineHeight: '1.6'
        }}>
          💡 <strong>{isKo ? 'Alert Fatigue 문제:' : isZh ? '告警疲劳问题:' : 'Alert Fatigue Problem:'}</strong> {isKo ? '평균적인 EKS 클러스터는 일 50-200개의 알림이 발생하지만, 실제 조치가 필요한 알림은 10-15%에 불과합니다. SLO 기반 알림과 ML 이상 탐지를 결합하면 노이즈를 대폭 줄일 수 있습니다.' : isZh ? '典型的 EKS 集群每天会产生 50-200 个告警，但实际需要处理的告警只有 10-15%。结合基于 SLO 的告警和 ML 异常检测可以显著减少噪声。' : 'A typical EKS cluster generates 50-200 alerts per day, but only 10-15% require actual action. Combining SLO-based alerts with ML anomaly detection can significantly reduce noise.'}
        </div>
      </div>
    </div>
  );
};

export default AlertOptimization;
