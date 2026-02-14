import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AutomationComponents = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["구성요소", "역할", "자동화 범위"]
    : ["구성요소", "역할", "자동화 범위"];

  const data = isKo
    ? [
      [
            "**Argo CD**",
            "GitOps 배포 자동화",
            "애플리케이션 배포, 롤백, 동기화"
      ],
      [
            "**Argo Workflows**",
            "ML 파이프라인 오케스트레이션",
            "학습, 평가, 모델 등록 워크플로"
      ],
      [
            "**KRO**",
            "복합 리소스 추상화",
            "K8s + AWS 리소스를 단일 단위로 관리"
      ],
      [
            "**ACK**",
            "AWS 리소스 선언적 관리",
            "S3, RDS, SageMaker 등 AWS 서비스"
      ],
      [
            "**Karpenter**",
            "GPU 노드 프로비저닝",
            "Just-in-Time 인스턴스 프로비저닝"
      ]
]
    : [
      [
            "**Argo CD**",
            "GitOps 배포 자동화",
            "애플리케이션 배포, 롤백, 동기화"
      ],
      [
            "**Argo Workflows**",
            "ML 파이프라인 오케스트레이션",
            "학습, 평가, 모델 등록 워크플로"
      ],
      [
            "**KRO**",
            "복합 리소스 추상화",
            "K8s + AWS 리소스를 단일 단위로 관리"
      ],
      [
            "**ACK**",
            "AWS 리소스 선언적 관리",
            "S3, RDS, SageMaker 등 AWS 서비스"
      ],
      [
            "**Karpenter**",
            "GPU 노드 프로비저닝",
            "Just-in-Time 인스턴스 프로비저닝"
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
        background: 'linear-gradient(135deg, #4ecdc4 0%, #4ecdc4dd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '자동화 구성요소' : 'Automation Components'}
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

export default AutomationComponents;
