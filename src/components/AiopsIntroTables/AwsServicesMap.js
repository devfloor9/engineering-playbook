import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const AwsServicesMap = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const services = [{
    name: 'DevOps Guru',
    category: isKo ? '탐지' : 'Detection',
    color: '#8b5cf6',
    description: isKo ? 'ML 이상 탐지, EKS 리소스 그룹 분석' : 'ML anomaly detection, EKS resource group analysis',
    features: isKo ? ['ML 이상 탐지', 'EKS 리소스 그룹', '자동 알림'] : ['ML Anomaly Detection', 'EKS Resource Groups', 'Auto Alerts']
  }, {
    name: 'CloudWatch Application Signals',
    category: isKo ? '관찰성' : 'Observability',
    color: '#3b82f6',
    description: isKo ? 'zero-code 계측, SLI/SLO 자동 설정' : 'Zero-code instrumentation, auto SLI/SLO setup',
    features: isKo ? ['Zero-code 계측', 'SLI/SLO', '자동 대시보드'] : ['Zero-code Instrumentation', 'SLI/SLO', 'Auto Dashboards']
  }, {
    name: 'CloudWatch Investigations',
    category: isKo ? '분석' : 'Analysis',
    color: '#059669',
    description: isKo ? 'AI 근본 원인 분석, 자동 인시던트 조사' : 'AI root cause analysis, auto incident investigation',
    features: isKo ? ['AI 근본 원인 분석', '자동 인시던트 조사', '상관관계 분석'] : ['AI Root Cause Analysis', 'Auto Incident Investigation', 'Correlation Analysis']
  }, {
    name: 'Amazon Q Developer',
    category: isKo ? '자동화' : 'Automation',
    color: '#d97706',
    description: isKo ? 'EKS 트러블슈팅, 코드 생성/리뷰' : 'EKS troubleshooting, code generation/review',
    features: isKo ? ['EKS 트러블슈팅', '코드 생성', '자동 리뷰'] : ['EKS Troubleshooting', 'Code Generation', 'Auto Review']
  }, {
    name: 'CloudWatch AI NL Querying',
    category: isKo ? '분석' : 'Analysis',
    color: '#059669',
    description: isKo ? '자연어 메트릭/로그 쿼리' : 'Natural language metric/log queries',
    features: isKo ? ['자연어 쿼리', '메트릭 분석', '로그 검색'] : ['Natural Language Query', 'Metric Analysis', 'Log Search']
  }, {
    name: 'AWS Hosted MCP Servers',
    category: isKo ? '자동화' : 'Automation',
    color: '#d97706',
    description: isKo ? 'EKS/Cost/Serverless MCP, AI 도구 통합' : 'EKS/Cost/Serverless MCP, AI tool integration',
    features: isKo ? ['EKS MCP', 'Cost MCP', 'Serverless MCP', 'AI 도구 통합'] : ['EKS MCP', 'Cost MCP', 'Serverless MCP', 'AI Tool Integration']
  }];
  return <div style={{
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
        <div style={{
        fontSize: '20px',
        fontWeight: '600'
      }}>
          {isKo ? '🗺️ AWS AIOps 서비스 맵' : '🗺️ AWS AIOps Services Map'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px'
    }}>
        {services.map((service, index) => <div key={index} style={{
        borderLeft: `4px solid ${service.color}`,
        padding: '20px',
        borderBottom: index < services.length - 1 ? '1px solid #f3f4f6' : 'none'
      }}>
            <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '8px'
        }}>
              <div style={{
            fontSize: '17px',
            fontWeight: '600',
            color: 'var(--ifm-font-color-base)'
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
          color: 'var(--ifm-font-color-base)',
          marginBottom: '12px'
        }}>
              {service.description}
            </div>

            <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px'
        }}>
              {service.features.map((feature, i) => <span key={i} style={{
            background: 'var(--ifm-color-emphasis-100)',
            color: 'var(--ifm-color-emphasis-600)',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '13px'
          }}>
                  {feature}
                </span>)}
            </div>
          </div>)}
      </div>
    </div>;
};
export default AwsServicesMap;