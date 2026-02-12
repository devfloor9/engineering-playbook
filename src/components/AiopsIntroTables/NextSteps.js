import React from 'react';

const NextSteps = () => {
  const steps = [
    {
      order: '다음',
      doc: '지능형 관찰성 스택',
      link: '/docs/aiops-aidlc/aiops-observability-stack',
      content: 'ADOT, AMP, AMG, CloudWatch AI 통합 아키텍처 구축',
      color: '#2563eb'
    },
    {
      order: '이후',
      doc: 'AIDLC 프레임워크',
      link: '/docs/aiops-aidlc/aidlc-framework',
      content: 'Kiro Spec-driven 개발, EKS Capabilities GitOps 통합',
      color: '#7c3aed'
    },
    {
      order: '최종',
      doc: '예측 운영',
      link: '/docs/aiops-aidlc/aiops-predictive-operations',
      content: 'ML 예측 스케일링, AI Agent 자동 인시던트 대응',
      color: '#059669'
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
        background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          다음 단계
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          AIOps & AIDLC 시리즈 학습 경로
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '80px 200px 1fr',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            순서
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            문서
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            핵심 내용
          </div>
        </div>

        {steps.map((step, idx) => (
          <div key={step.order} style={{
            display: 'grid',
            gridTemplateColumns: '80px 200px 1fr',
            borderBottom: idx < steps.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '12px 14px',
              background: `${step.color}08`,
              fontSize: '13px',
              fontWeight: '700',
              color: step.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {step.order}
            </div>
            <div style={{
              padding: '12px 14px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              <a href={step.link} style={{
                fontSize: '13px',
                fontWeight: '600',
                color: step.color,
                textDecoration: 'none'
              }}>
                {step.doc}
              </a>
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {step.content}
            </div>
          </div>
        ))}

        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>학습 팁:</strong> 각 문서는 이전 내용을 기반으로 구성되어 있으므로, 순서대로 학습하는 것을 권장합니다.
          실제 구축 시에는 관찰성 스택 구축 → AIDLC 적용 → 예측 운영 확장 순서로 진행하세요.
        </div>
      </div>
    </div>
  );
};

export default NextSteps;
