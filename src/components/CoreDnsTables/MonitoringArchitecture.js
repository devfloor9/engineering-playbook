import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MonitoringArchitecture = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const approaches = [
    {
      name: 'AMP + ADOT',
      badge: 'Managed OSS',
      badgeColor: '#059669',
      description: isKo
        ? 'ADOT Collector / Prometheus로 CoreDNS 메트릭 스크랩 → AMP remote write → Grafana(AMG) 시각화'
        : isZh
        ? 'ADOT Collector / Prometheus 抓取 CoreDNS 指标 → AMP remote write → Grafana(AMG) 可视化'
        : 'ADOT Collector / Prometheus scrapes CoreDNS metrics → AMP remote write → Grafana (AMG) visualization',
      pros: isKo
        ? ['PromQL 네이티브 쿼리', '장기 보관 & 대규모 클러스터 지원', 'Terraform 자동화 가속기 제공']
        : isZh
        ? ['PromQL 原生查询', '长期存储 & 大规模集群支持', 'Terraform 自动化加速器']
        : ['Native PromQL queries', 'Long-term retention & large-scale support', 'Terraform automation accelerator'],
      cons: isKo
        ? ['ADOT/Prometheus 설치 필요', '수집 메트릭 기반 요금']
        : isZh
        ? ['需要安装 ADOT/Prometheus', '基于摄入指标的费用']
        : ['Requires ADOT/Prometheus installation', 'Charges based on ingested metrics']
    },
    {
      name: 'CloudWatch Container Insights',
      badge: 'AWS Native',
      badgeColor: '#3b82f6',
      description: isKo
        ? 'CloudWatch Agent DaemonSet → kube-dns:9153 스크랩 → CloudWatch Metrics 저장 → CloudWatch 대시보드/알람'
        : isZh
        ? 'CloudWatch Agent DaemonSet → kube-dns:9153 抓取 → CloudWatch Metrics 存储 → CloudWatch 仪表盘/告警'
        : 'CloudWatch Agent DaemonSet → kube-dns:9153 scrape → CloudWatch Metrics storage → CloudWatch dashboard/alarms',
      pros: isKo
        ? ['AWS 관리형 - 추가 인프라 불필요', 'CloudWatch Alarm 네이티브 연동', 'AMG에서 데이터 소스로 활용 가능']
        : isZh
        ? ['AWS 托管 - 无需额外基础设施', 'CloudWatch Alarm 原生集成', '可在 AMG 中作为数据源']
        : ['AWS managed - no extra infra', 'Native CloudWatch Alarm integration', 'Usable as AMG data source'],
      cons: isKo
        ? ['CloudWatch 메트릭 수집/저장 요금', 'PromQL 대신 CloudWatch 쿼리 문법']
        : isZh
        ? ['CloudWatch 指标采集/存储费用', '使用 CloudWatch 查询语法而非 PromQL']
        : ['CloudWatch metrics collection/storage charges', 'CloudWatch query syntax instead of PromQL']
    }
  ];

  const layers = [
    {
      name: isKo ? '수집 (Collection)' : isZh ? '采集 (Collection)' : 'Collection',
      color: '#3b82f6',
      items: ['ADOT Collector', 'Prometheus', 'CloudWatch Agent', 'Fluent Bit']
    },
    {
      name: isKo ? '저장 (Storage)' : isZh ? '存储 (Storage)' : 'Storage',
      color: '#8b5cf6',
      items: ['AMP (Prometheus)', 'CloudWatch Metrics', 'CloudWatch Logs']
    },
    {
      name: isKo ? '시각화 (Visualization)' : isZh ? '可视化 (Visualization)' : 'Visualization',
      color: '#f59e0b',
      items: ['AMG (Grafana)', 'CloudWatch Dashboards']
    },
    {
      name: isKo ? '알림 (Alerting)' : isZh ? '告警 (Alerting)' : 'Alerting',
      color: '#ef4444',
      items: ['Alertmanager', 'CloudWatch Alarms', 'SNS / PagerDuty / Slack']
    }
  ];

  return (
    <div style={{
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #581c87 0%, #7e22ce 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '🏗️ CoreDNS 모니터링 아키텍처' : isZh ? '🏗️ CoreDNS 监控架构' : '🏗️ CoreDNS Monitoring Architecture'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'AMP + ADOT vs CloudWatch Container Insights 비교' : isZh ? 'AMP + ADOT vs CloudWatch Container Insights 对比' : 'AMP + ADOT vs CloudWatch Container Insights Comparison'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        overflow: 'hidden'
      }}>
        {/* Approach cards */}
        {approaches.map((approach, idx) => (
          <div key={idx} style={{
            padding: '16px 20px',
            borderBottom: '1px solid #f3f4f6'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontWeight: '700', fontSize: '15px', color: '#1f2937' }}>{approach.name}</span>
              <span style={{
                display: 'inline-block',
                background: approach.badgeColor,
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>{approach.badge}</span>
            </div>
            <div style={{ fontSize: '13px', color: '#4b5563', marginBottom: '10px', lineHeight: '1.5' }}>
              {approach.description}
            </div>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#059669', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {isKo ? '장점' : isZh ? '优点' : 'Pros'}
                </div>
                {approach.pros.map((p, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#374151', lineHeight: '1.6' }}>+ {p}</div>
                ))}
              </div>
              <div>
                <div style={{ fontSize: '11px', fontWeight: '600', color: '#dc2626', marginBottom: '4px', textTransform: 'uppercase' }}>
                  {isKo ? '고려사항' : isZh ? '注意事项' : 'Considerations'}
                </div>
                {approach.cons.map((c, i) => (
                  <div key={i} style={{ fontSize: '12px', color: '#6b7280', lineHeight: '1.6' }}>- {c}</div>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Architecture layers */}
        <div style={{ padding: '16px 20px' }}>
          <div style={{ fontSize: '13px', fontWeight: '600', color: '#6b7280', marginBottom: '10px', textTransform: 'uppercase' }}>
            {isKo ? '파이프라인 레이어' : isZh ? '管道层次' : 'Pipeline Layers'}
          </div>
          {layers.map((layer, idx) => (
            <React.Fragment key={idx}>
              <div style={{
                borderLeft: `3px solid ${layer.color}`,
                padding: '8px 12px',
                marginBottom: idx < layers.length - 1 ? '4px' : '0',
                background: '#f9fafb',
                borderRadius: '0 4px 4px 0'
              }}>
                <span style={{
                  display: 'inline-block',
                  background: layer.color,
                  color: 'white',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  fontSize: '11px',
                  fontWeight: '600',
                  marginRight: '8px'
                }}>{layer.name}</span>
                <span style={{ fontSize: '12px', color: '#4b5563' }}>
                  {layer.items.join(' · ')}
                </span>
              </div>
              {idx < layers.length - 1 && (
                <div style={{ textAlign: 'center', color: '#d1d5db', fontSize: '14px', lineHeight: '1.2' }}>↓</div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: '#eff6ff',
        borderTop: '1px solid #bfdbfe',
        border: '1px solid #bfdbfe',
        borderRadius: '0 0 8px 8px',
        padding: '12px 16px',
        fontSize: '12px',
        color: '#1e40af',
        lineHeight: '1.6'
      }}>
        💡 <strong>{isKo ? '권장:' : isZh ? '推荐:' : 'Recommended:'}</strong>{' '}
        {isKo
          ? 'Prometheus Operator(kube-prometheus-stack) 사용 시 ServiceMonitor로 kube-system/kube-dns(k8s-app=kube-dns) 서비스의 9153 포트를 자동 스크랩할 수 있습니다.'
          : isZh
          ? '使用 Prometheus Operator (kube-prometheus-stack) 时，可通过 ServiceMonitor 自动抓取 kube-system/kube-dns (k8s-app=kube-dns) 服务的 9153 端口。'
          : 'With Prometheus Operator (kube-prometheus-stack), ServiceMonitor can auto-scrape kube-system/kube-dns (k8s-app=kube-dns) service on port 9153.'}
      </div>
    </div>
  );
};

export default MonitoringArchitecture;
