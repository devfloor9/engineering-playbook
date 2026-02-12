import React from 'react';

const AwsServicesMap = () => {
  const services = [
    {
      name: 'DevOps Guru',
      category: '탐지',
      color: '#8b5cf6',
      description: 'ML 이상 탐지, EKS 리소스 그룹 분석',
      features: ['ML 이상 탐지', 'EKS 리소스 그룹', '자동 알림']
    },
    {
      name: 'CloudWatch Application Signals',
      category: '관찰성',
      color: '#3b82f6',
      description: 'zero-code 계측, SLI/SLO 자동 설정',
      features: ['Zero-code 계측', 'SLI/SLO', '자동 대시보드']
    },
    {
      name: 'CloudWatch Investigations',
      category: '분석',
      color: '#059669',
      description: 'AI 근본 원인 분석, 자동 인시던트 조사',
      features: ['AI 근본 원인 분석', '자동 인시던트 조사', '상관관계 분석']
    },
    {
      name: 'Amazon Q Developer',
      category: '자동화',
      color: '#d97706',
      description: 'EKS 트러블슈팅, 코드 생성/리뷰',
      features: ['EKS 트러블슈팅', '코드 생성', '자동 리뷰']
    },
    {
      name: 'CloudWatch AI NL Querying',
      category: '분석',
      color: '#059669',
      description: '자연어 메트릭/로그 쿼리',
      features: ['자연어 쿼리', '메트릭 분석', '로그 검색']
    },
    {
      name: 'AWS Hosted MCP Servers',
      category: '자동화',
      color: '#d97706',
      description: 'EKS/Cost/Serverless MCP, AI 도구 통합',
      features: ['EKS MCP', 'Cost MCP', 'Serverless MCP', 'AI 도구 통합']
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
          🗺️ AWS AIOps 서비스 맵
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
