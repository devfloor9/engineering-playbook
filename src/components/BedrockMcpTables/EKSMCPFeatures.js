import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EKSMCPFeatures = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const features = [
    {
      feature: isKo ? 'Pod 로그 조회' : isZh ? 'Pod 日志查询' : 'Pod Log Retrieval',
      description: isKo ? '특정 Pod의 로그를 실시간 스트리밍' : isZh ? '实时流式传输特定 Pod 的日志' : 'Real-time streaming of specific Pod logs',
      color: '#4285f4'
    },
    {
      feature: isKo ? 'K8s 이벤트 조회' : isZh ? 'K8s 事件查询' : 'K8s Event Retrieval',
      description: isKo ? '클러스터 이벤트 검색 및 분석' : isZh ? '集群事件搜索和分析' : 'Cluster event search and analysis',
      color: '#34a853'
    },
    {
      feature: isKo ? 'CloudWatch 메트릭' : isZh ? 'CloudWatch 指标' : 'CloudWatch Metrics',
      description: isKo ? '클러스터 메트릭 조회 및 분석' : isZh ? '集群指标查询和分析' : 'Cluster metrics retrieval and analysis',
      color: '#fbbc04'
    },
    {
      feature: isKo ? '리소스 상태 확인' : isZh ? '资源状态检查' : 'Resource Status Check',
      description: isKo ? 'Deployment, Service 등 리소스 상태 조회' : isZh ? '查询 Deployment、Service 等资源状态' : 'Resource status retrieval for Deployments, Services, etc.',
      color: '#ea4335'
    },
    {
      feature: isKo ? '트러블슈팅' : isZh ? '故障排除' : 'Troubleshooting',
      description: isKo ? '에이전트 기반 자동 진단' : isZh ? '基于代理的自动诊断' : 'Agent-based automated diagnostics',
      color: '#9c27b0'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '15px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ff9900 0%, #cc7a00 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'EKS MCP 서버 기능' : isZh ? 'EKS MCP 服务器功能' : 'EKS MCP Server Features'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {features.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'var(--ifm-color-emphasis-50)',
                padding: '16px',
                borderRadius: '8px',
                borderLeft: `4px solid ${item.color}`,
                display: 'grid',
                gridTemplateColumns: '200px 1fr',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: '600', color: item.color, fontSize: '15px' }}>
                {item.feature}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>
                {item.description}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EKSMCPFeatures;
