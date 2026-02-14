import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AckControllers = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["AWS 서비스", "ACK Controller", "Agentic AI 활용"]
    : ["AWS 서비스", "ACK Controller", "Agentic AI 활용"];

  const data = isKo
    ? [
      [
            "**S3**",
            "`s3.services.k8s.aws`",
            "모델 아티팩트 저장소, 학습 데이터 버킷"
      ],
      [
            "**RDS/Aurora**",
            "`rds.services.k8s.aws`",
            "LangFuse 백엔드, 메타데이터 저장소"
      ],
      [
            "**SageMaker**",
            "`sagemaker.services.k8s.aws`",
            "모델 학습 작업, 엔드포인트 배포"
      ],
      [
            "**Secrets Manager**",
            "`secretsmanager.services.k8s.aws`",
            "API 키, 모델 자격증명 관리"
      ],
      [
            "**ECR**",
            "`ecr.services.k8s.aws`",
            "컨테이너 이미지 레지스트리"
      ]
]
    : [
      [
            "**S3**",
            "`s3.services.k8s.aws`",
            "모델 아티팩트 저장소, 학습 데이터 버킷"
      ],
      [
            "**RDS/Aurora**",
            "`rds.services.k8s.aws`",
            "LangFuse 백엔드, 메타데이터 저장소"
      ],
      [
            "**SageMaker**",
            "`sagemaker.services.k8s.aws`",
            "모델 학습 작업, 엔드포인트 배포"
      ],
      [
            "**Secrets Manager**",
            "`secretsmanager.services.k8s.aws`",
            "API 키, 모델 자격증명 관리"
      ],
      [
            "**ECR**",
            "`ecr.services.k8s.aws`",
            "컨테이너 이미지 레지스트리"
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
        background: 'linear-gradient(135deg, #ff9900 0%, #ff9900dd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'ACK 컨트롤러 활용' : 'ACK Controllers Usage'}
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

export default AckControllers;
