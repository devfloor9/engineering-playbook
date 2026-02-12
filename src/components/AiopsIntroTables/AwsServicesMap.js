import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AwsServicesMap = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const services = [
    {
      name: 'DevOps Guru',
      category: isKo ? '탐지' : isZh ? '检测' : 'Detection',
      color: '#8b5cf6',
      description: isKo ? 'ML 이상 탐지, EKS 리소스 그룹 분석' : isZh ? 'ML 异常检测、EKS 资源组分析' : 'ML anomaly detection, EKS resource group analysis',
      features: isKo ? ['ML 이상 탐지', 'EKS 리소스 그룹', '자동 알림'] : isZh ? ['ML 异常检测', 'EKS 资源组', '自动告警'] : ['ML Anomaly Detection', 'EKS Resource Groups', 'Auto Alerts']
    },
    {
      name: 'CloudWatch Application Signals',
      category: isKo ? '관찰성' : isZh ? '可观测性' : 'Observability',
      color: '#3b82f6',
      description: isKo ? 'zero-code 계측, SLI/SLO 자동 설정' : isZh ? '零代码插桩、自动 SLI/SLO 设置' : 'Zero-code instrumentation, auto SLI/SLO setup',
      features: isKo ? ['Zero-code 계측', 'SLI/SLO', '자동 대시보드'] : isZh ? ['零代码插桩', 'SLI/SLO', '自动仪表板'] : ['Zero-code Instrumentation', 'SLI/SLO', 'Auto Dashboards']
    },
    {
      name: 'CloudWatch Investigations',
      category: isKo ? '분석' : isZh ? '分析' : 'Analysis',
      color: '#059669',
      description: isKo ? 'AI 근본 원인 분석, 자동 인시던트 조사' : isZh ? 'AI 根因分析、自动事件调查' : 'AI root cause analysis, auto incident investigation',
      features: isKo ? ['AI 근본 원인 분석', '자동 인시던트 조사', '상관관계 분석'] : isZh ? ['AI 根因分析', '自动事件调查', '关联分析'] : ['AI Root Cause Analysis', 'Auto Incident Investigation', 'Correlation Analysis']
    },
    {
      name: 'Amazon Q Developer',
      category: isKo ? '자동화' : isZh ? '自动化' : 'Automation',
      color: '#d97706',
      description: isKo ? 'EKS 트러블슈팅, 코드 생성/리뷰' : isZh ? 'EKS 故障排查、代码生成/审查' : 'EKS troubleshooting, code generation/review',
      features: isKo ? ['EKS 트러블슈팅', '코드 생성', '자동 리뷰'] : isZh ? ['EKS 故障排查', '代码生成', '自动审查'] : ['EKS Troubleshooting', 'Code Generation', 'Auto Review']
    },
    {
      name: 'CloudWatch AI NL Querying',
      category: isKo ? '분석' : isZh ? '分析' : 'Analysis',
      color: '#059669',
      description: isKo ? '자연어 메트릭/로그 쿼리' : isZh ? '自然语言指标/日志查询' : 'Natural language metric/log queries',
      features: isKo ? ['자연어 쿼리', '메트릭 분석', '로그 검색'] : isZh ? ['自然语言查询', '指标分析', '日志搜索'] : ['Natural Language Query', 'Metric Analysis', 'Log Search']
    },
    {
      name: 'AWS Hosted MCP Servers',
      category: isKo ? '자동화' : isZh ? '自动化' : 'Automation',
      color: '#d97706',
      description: isKo ? 'EKS/Cost/Serverless MCP, AI 도구 통합' : isZh ? 'EKS/Cost/Serverless MCP、AI 工具集成' : 'EKS/Cost/Serverless MCP, AI tool integration',
      features: isKo ? ['EKS MCP', 'Cost MCP', 'Serverless MCP', 'AI 도구 통합'] : isZh ? ['EKS MCP', 'Cost MCP', 'Serverless MCP', 'AI 工具集成'] : ['EKS MCP', 'Cost MCP', 'Serverless MCP', 'AI Tool Integration']
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
        background: 'linear-gradient(135deg, #92400e 0%, #b45309 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600' }}>
          {isKo ? '🗺️ AWS AIOps 서비스 맵' : isZh ? '🗺️ AWS AIOps 服务地图' : '🗺️ AWS AIOps Services Map'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {services.map((service, index) => (
          <div
            key={index}
            style={{
              borderLeft: `4px solid ${service.color}`,
              padding: '20px',
              borderBottom: index < services.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                fontSize: '17px',
                fontWeight: '600',
                color: '#111827'
              }}>
                {service.name}
              </div>
              <div style={{
                background: service.color,
                color: 'white',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600'
              }}>
                {service.category}
              </div>
            </div>

            <div style={{
              color: '#4b5563',
              marginBottom: '12px'
            }}>
              {service.description}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {service.features.map((feature, i) => (
                <span
                  key={i}
                  style={{
                    background: '#f3f4f6',
                    color: '#6b7280',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}
                >
                  {feature}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AwsServicesMap;
