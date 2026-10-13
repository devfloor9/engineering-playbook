import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const MonitoringMetrics = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const metrics = [{
    metric: 'training_loss (framework log)',
    description: isKo ? '학습 손실 (프레임워크 로그/텐서보드)' : 'Training loss (framework log/TensorBoard)',
    threshold: isKo ? '전반적 감소 추세' : 'Overall downward trend',
    color: '#4285f4',
    status: 'good'
  }, {
    metric: 'validation_loss (framework log)',
    description: isKo ? '검증 손실 (프레임워크 로그)' : 'Validation loss (framework log)',
    threshold: isKo ? '정체·상승 시 조기 종료 검토' : 'Watch for plateau/rise (early stopping)',
    color: '#34a853',
    status: 'good'
  }, {
    metric: 'DCGM_FI_DEV_GPU_UTIL',
    description: isKo ? 'GPU 사용률 % (dcgm-exporter, gauge)' : 'GPU utilization % (dcgm-exporter, gauge)',
    threshold: isKo ? '낮게 지속되면 입력 파이프라인 병목 의심' : 'Low & sustained → input-pipeline bottleneck',
    color: '#fbbc04',
    status: 'warning'
  }, {
    metric: 'DCGM_FI_DEV_FB_USED / FB_FREE',
    description: isKo ? '프레임버퍼 사용·여유 메모리 MiB (gauge, 비율 아님)' : 'Framebuffer used/free memory in MiB (gauge, not a ratio)',
    threshold: isKo ? 'FB_USED/(USED+FREE)가 높으면 OOM 위험' : 'High FB_USED/(USED+FREE) → OOM risk',
    color: '#ea4335',
    status: 'critical'
  }, {
    metric: 'throughput (tokens/sec)',
    description: isKo ? '처리량 (학습 로그에서 산출)' : 'Throughput (derived from training logs)',
    threshold: isKo ? '안정 상태 대비 급락 모니터링' : 'Monitor for drops vs steady state',
    color: '#9c27b0',
    status: 'good'
  }];
  const note = isKo
    ? 'GPU 지표는 dcgm-exporter 기본 카운터 이름을 사용합니다. `DCGM_FI_DEV_FB_USED`/`FB_FREE`는 백분율이 아니라 MiB 단위 절대값이므로, 메모리 포화는 `FB_USED/(FB_USED+FB_FREE)` 비율로 판단해야 합니다. 손실 지표는 프레임워크 로그 값이며, 단조 감소나 "검증=학습 손실"을 합격 기준으로 삼지 말고 전반적 추세와 과제별 평가 지표로 판단하세요.'
    : 'GPU metrics use dcgm-exporter default counter names. `DCGM_FI_DEV_FB_USED`/`FB_FREE` are absolute values in MiB, not percentages, so judge memory saturation by the ratio `FB_USED/(FB_USED+FB_FREE)`. Loss metrics are framework-log values; do not treat monotonic decrease or "validation ≈ training loss" as pass criteria—assess overall trends and task-specific evaluation metrics instead.';
  return <div style={{
    maxWidth: '900px',
    margin: '20px auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSize: '15px'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #76b900 0%, #5a8a00 100%)',
      color: 'white',
      padding: '16px 20px',
      borderRadius: '8px 8px 0 0',
      fontWeight: '600',
      fontSize: '16px'
    }}>
        {isKo ? '주요 모니터링 메트릭' : 'Key Monitoring Metrics'}
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      padding: '20px'
    }}>
        <div style={{
        display: 'grid',
        gap: '12px'
      }}>
          {metrics.map((item, index) => <div key={index} style={{
          background: 'var(--ifm-color-emphasis-50)',
          padding: '16px',
          borderRadius: '8px',
          borderLeft: `4px solid ${item.color}`,
          display: 'grid',
          gridTemplateColumns: '250px 1fr 150px',
          gap: '16px',
          alignItems: 'center'
        }}>
              <div style={{
            fontWeight: '600',
            color: item.color,
            fontFamily: 'monospace'
          }}>
                {item.metric}
              </div>
              <div style={{
            fontSize: '14px',
            color: 'var(--ifm-font-color-base)'
          }}>
                {item.description}
              </div>
              <div style={{
            fontSize: '14px',
            fontWeight: '600',
            color: item.status === 'good' ? '#059669' : item.status === 'warning' ? '#d97706' : '#dc2626',
            textAlign: 'center'
          }}>
                {item.threshold}
              </div>
            </div>)}
        </div>
      </div>
      <div style={{
      fontSize: '13px',
      color: 'var(--ifm-color-emphasis-700)',
      marginTop: '10px',
      lineHeight: '1.5'
    }}>
        {note}
      </div>
    </div>;
};
export default MonitoringMetrics;