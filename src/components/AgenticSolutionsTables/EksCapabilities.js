import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EksCapabilities = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["EKS Capability", "역할", "Agentic AI 활용", "지원 방식"]
    : ["EKS Capability", "역할", "Agentic AI 활용", "지원 방식"];

  const data = isKo
    ? [
      [
            "**ACK (AWS Controllers for Kubernetes)**",
            "AWS 서비스의 Kubernetes 네이티브 관리",
            "S3 모델 저장소, RDS 메타데이터, SageMaker 학습 작업",
            "EKS Add-on"
      ],
      [
            "**KRO (Kubernetes Resource Orchestrator)**",
            "복합 리소스 추상화 및 템플릿화",
            "AI 추론 스택, 학습 파이프라인 원클릭 배포",
            "EKS Add-on"
      ],
      [
            "**Argo CD**",
            "GitOps 기반 지속적 배포",
            "모델 서빙 배포 자동화, 롤백, 환경 동기화",
            "EKS Add-on"
      ]
]
    : [
      [
            "**ACK (AWS Controllers for Kubernetes)**",
            "AWS 서비스의 Kubernetes 네이티브 관리",
            "S3 모델 저장소, RDS 메타데이터, SageMaker 학습 작업",
            "EKS Add-on"
      ],
      [
            "**KRO (Kubernetes Resource Orchestrator)**",
            "복합 리소스 추상화 및 템플릿화",
            "AI 추론 스택, 학습 파이프라인 원클릭 배포",
            "EKS Add-on"
      ],
      [
            "**Argo CD**",
            "GitOps 기반 지속적 배포",
            "모델 서빙 배포 자동화, 롤백, 환경 동기화",
            "EKS Add-on"
      ]
];

  return (
    <div style={{
      maxWidth: '1200px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '14px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff6b6bdd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'EKS 고급 기능' : 'EKS Advanced Capabilities'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflowX: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px'
        }}>
          <thead>
            <tr style={{
              background: 'var(--ifm-color-emphasis-100)',
              borderBottom: '2px solid var(--ifm-color-emphasis-300)'
            }}>
              {headers.map((header, idx) => (
                <th key={idx} style={{
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontWeight: '600',
                  color: 'var(--ifm-font-color-base)',
                  whiteSpace: 'nowrap'
                }}>
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} style={{
                borderBottom: '1px solid var(--ifm-color-emphasis-200)',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--ifm-color-emphasis-100)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}>
                {row.map((cell, cellIdx) => (
                  <td key={cellIdx} style={{
                    padding: '12px 16px',
                    color: 'var(--ifm-font-color-base)',
                    verticalAlign: 'top'
                  }}>
                    {cell.startsWith('**') && cell.endsWith('**')
                      ? <strong>{cell.slice(2, -2)}</strong>
                      : cell.includes('✅')
                        ? <span>{cell}</span>
                        : cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EksCapabilities;
