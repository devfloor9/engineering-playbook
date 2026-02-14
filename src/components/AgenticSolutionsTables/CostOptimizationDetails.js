import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const CostOptimizationDetails = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["전략", "구현 방법", "예상 절감률", "적용 워크로드", "위험도"]
    : ["AWS Service", "ACK Controller", "Agentic AI Usage"];

  const data = isKo
    ? [
      [
            "Spot 인스턴스",
            "Karpenter NodePool",
            "60-90%",
            "추론, 배치 처리",
            "중간 (중단 가능)"
      ],
      [
            "Consolidation",
            "Karpenter disruption",
            "20-30%",
            "모든 워크로드",
            "낮음"
      ],
      [
            "Right-sizing",
            "Karpenter 인스턴스 자동 선택",
            "15-25%",
            "모든 워크로드",
            "낮음"
      ],
      [
            "스케줄 기반",
            "Karpenter budgets",
            "30-40%",
            "비업무 시간",
            "낮음"
      ],
      [
            "복합 적용",
            "위 전략 조합",
            "50-70%",
            "전체",
            "중간"
      ]
]
    : [
      [
            "**S3**",
            "`s3.services.k8s.aws`",
            "Model artifact storage, training data buckets"
      ],
      [
            "**RDS/Aurora**",
            "`rds.services.k8s.aws`",
            "LangFuse backend, metadata storage"
      ],
      [
            "**SageMaker**",
            "`sagemaker.services.k8s.aws`",
            "Model training jobs, endpoint deployment"
      ],
      [
            "**Secrets Manager**",
            "`secretsmanager.services.k8s.aws`",
            "API keys, model credentials management"
      ],
      [
            "**ECR**",
            "`ecr.services.k8s.aws`",
            "Container image registry"
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
        {isKo ? '비용 최적화 전략 상세' : 'Cost Optimization Strategies Details'}
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

export default CostOptimizationDetails;
