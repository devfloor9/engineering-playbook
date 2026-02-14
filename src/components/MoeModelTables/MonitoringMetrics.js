import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MonitoringMetrics = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      metric: 'vllm:num_requests_running',
      description: isKo ? '현재 처리 중인 요청 수' : isZh ? '当前处理中的请求数' : 'Current requests being processed',
      threshold: '-',
      color: '#3b82f6',
      severity: 'info'
    },
    {
      metric: 'vllm:num_requests_waiting',
      description: isKo ? '대기 중인 요청 수' : isZh ? '等待中的请求数' : 'Requests waiting in queue',
      threshold: '> 100 ' + (isKo ? '경고' : isZh ? '警告' : 'warning'),
      color: '#f59e0b',
      severity: 'warning'
    },
    {
      metric: 'vllm:gpu_cache_usage_perc',
      description: isKo ? 'KV Cache 사용률' : isZh ? 'KV Cache 使用率' : 'KV Cache utilization',
      threshold: '> 95% ' + (isKo ? '경고' : isZh ? '警告' : 'warning'),
      color: '#ef4444',
      severity: 'critical'
    },
    {
      metric: 'vllm:avg_prompt_throughput_toks_per_s',
      description: isKo ? '프롬프트 처리량' : isZh ? '提示吞吐量' : 'Prompt processing throughput',
      threshold: '-',
      color: '#10b981',
      severity: 'info'
    },
    {
      metric: 'vllm:avg_generation_throughput_toks_per_s',
      description: isKo ? '생성 처리량' : isZh ? '生成吞吐量' : 'Generation throughput',
      threshold: '-',
      color: '#8b5cf6',
      severity: 'info'
    },
    {
      metric: 'DCGM_FI_DEV_GPU_UTIL',
      description: isKo ? 'GPU 사용률' : isZh ? 'GPU 使用率' : 'GPU utilization',
      threshold: '> 90% ' + (isKo ? '경고' : isZh ? '警告' : 'warning'),
      color: '#f59e0b',
      severity: 'warning'
    },
    {
      metric: 'DCGM_FI_DEV_FB_USED',
      description: isKo ? 'GPU 메모리 사용량' : isZh ? 'GPU 内存使用量' : 'GPU memory usage',
      threshold: '> 95% ' + (isKo ? '위험' : isZh ? '危险' : 'critical'),
      color: '#ef4444',
      severity: 'critical'
    }
  ];

  const getSeverityBadge = (severity) => {
    const badges = {
      info: { bg: '#eff6ff', color: '#3b82f6', label: isKo ? '정보' : isZh ? '信息' : 'Info' },
      warning: { bg: '#fffbeb', color: '#f59e0b', label: isKo ? '경고' : isZh ? '警告' : 'Warning' },
      critical: { bg: '#fef2f2', color: '#ef4444', label: isKo ? '위험' : isZh ? '危险' : 'Critical' }
    };
    const badge = badges[severity];
    return (
      <span style={{
        background: badge.bg,
        color: badge.color,
        padding: '4px 10px',
        borderRadius: '12px',
        fontSize: '11px',
        fontWeight: '600',
        textTransform: 'uppercase'
      }}>
        {badge.label}
      </span>
    );
  };

  return (
    <div style={{
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
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? 'MoE 모델 주요 모니터링 메트릭' : isZh ? 'MoE 模型主要监控指标' : 'MoE Model Key Monitoring Metrics'}
        </div>
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {metrics.map((metric, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '320px 1fr 160px 100px',
              padding: '16px 20px',
              borderBottom: index < metrics.length - 1 ? '1px solid var(--ifm-color-emphasis-200)' : 'none',
              alignItems: 'center',
              transition: 'background-color 0.2s'
            }}
          >
            <div style={{
              fontSize: '14px',
              fontWeight: '600',
              color: metric.color,
              fontFamily: 'monospace',
              display: 'flex',
              alignItems: 'center'
            }}>
              <div style={{
                width: '4px',
                height: '30px',
                background: metric.color,
                borderRadius: '2px',
                marginRight: '12px'
              }} />
              {metric.metric}
            </div>
            <div style={{
              fontSize: '14px',
              color: 'var(--ifm-color-emphasis-800)',
              lineHeight: '1.5'
            }}>
              {metric.description}
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--ifm-color-emphasis-700)',
              fontFamily: 'monospace',
              fontWeight: '500'
            }}>
              {metric.threshold}
            </div>
            <div style={{ textAlign: 'right' }}>
              {getSeverityBadge(metric.severity)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonitoringMetrics;
