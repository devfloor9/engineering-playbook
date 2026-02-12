import React from 'react';

const StackSelectionPatterns = () => {
  const patterns = [
    {
      pattern: 'AWS 네이티브',
      collection: 'CloudWatch Observability Agent',
      backend: 'CloudWatch Logs/Metrics, X-Ray',
      environment: 'AWS 서비스 의존도가 높고, 단일 콘솔 관리를 선호하는 팀'
    },
    {
      pattern: 'OSS 중심',
      collection: 'ADOT (OpenTelemetry)',
      backend: 'AMP (Prometheus), AMG (Grafana), X-Ray',
      environment: 'K8s 네이티브 도구 선호, 멀티클라우드 전략, 벤더 종속 최소화'
    },
    {
      pattern: '3rd Party',
      collection: 'ADOT 또는 벤더 전용 에이전트',
      backend: 'Datadog, Sumo Logic, Splunk, New Relic 등',
      environment: '기존 3rd Party 투자가 있거나, 통합 SaaS 대시보드를 선호하는 조직'
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
        background: 'linear-gradient(135deg, #0c4a6e 0%, #0369a1 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          관찰성 스택 선택 패턴
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          조직의 요구사항에 따른 세 가지 전략
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
          gridTemplateColumns: '130px 180px 200px 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            패턴
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            수집 레이어
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            백엔드
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            적합한 환경
          </div>
        </div>

        {/* Data Rows */}
        {patterns.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '130px 180px 200px 1fr',
            borderBottom: idx < patterns.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              fontWeight: '700',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.pattern}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.collection}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.backend}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.environment}
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
          💡 <strong>핵심:</strong> ADOT(OpenTelemetry)를 수집 레이어로 사용하면 백엔드 교체가 자유롭습니다.
          이것이 AWS가 자체 에이전트 대신 OpenTelemetry를 Managed Add-on으로 제공하는 이유입니다.
        </div>
      </div>
    </div>
  );
};

export default StackSelectionPatterns;
