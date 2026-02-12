import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const NextSteps = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const steps = [
    {
      order: isKo ? '다음' : 'Next',
      doc: isKo ? '지능형 관찰성 스택' : 'Intelligent Observability Stack',
      link: '/docs/aiops-aidlc/aiops-observability-stack',
      content: isKo ? 'ADOT, AMP, AMG, CloudWatch AI 통합 아키텍처 구축' : 'Build integrated architecture with ADOT, AMP, AMG, CloudWatch AI',
      color: '#2563eb'
    },
    {
      order: isKo ? '이후' : 'Then',
      doc: isKo ? 'AIDLC 프레임워크' : 'AIDLC Framework',
      link: '/docs/aiops-aidlc/aidlc-framework',
      content: isKo ? 'Kiro Spec-driven 개발, EKS Capabilities GitOps 통합' : 'Kiro spec-driven development, EKS Capabilities GitOps integration',
      color: '#7c3aed'
    },
    {
      order: isKo ? '최종' : 'Finally',
      doc: isKo ? '예측 운영' : 'Predictive Operations',
      link: '/docs/aiops-aidlc/aiops-predictive-operations',
      content: isKo ? 'ML 예측 스케일링, AI Agent 자동 인시던트 대응' : 'ML predictive scaling, AI Agent auto incident response',
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
          {isKo ? '다음 단계' : 'Next Steps'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'AIOps & AIDLC 시리즈 학습 경로' : 'AIOps & AIDLC series learning path'}
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
            {isKo ? '순서' : 'Order'}
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '문서' : 'Document'}
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '핵심 내용' : 'Key Content'}
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
          <strong>{isKo ? '학습 팁:' : 'Learning Tip:'}</strong> {isKo
            ? '각 문서는 이전 내용을 기반으로 구성되어 있으므로, 순서대로 학습하는 것을 권장합니다. 실제 구축 시에는 관찰성 스택 구축 → AIDLC 적용 → 예측 운영 확장 순서로 진행하세요.'
            : 'Each document builds on previous content, so sequential learning is recommended. For actual implementation, proceed in order: Build observability stack → Apply AIDLC → Expand predictive operations.'}
        </div>
      </div>
    </div>
  );
};

export default NextSteps;
