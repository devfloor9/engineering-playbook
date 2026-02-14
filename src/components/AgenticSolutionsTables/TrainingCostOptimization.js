import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TrainingCostOptimization = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["전략", "적용 대상", "예상 절감률", "구현 방법"]
    : ["Component", "Role", "Automation Scope"];

  const data = isKo
    ? [
      [
            "Spot 실험 클러스터",
            "하이퍼파라미터 튜닝",
            "60-80%",
            "별도 NodePool"
      ],
      [
            "자동 노드 정리",
            "학습 완료 후",
            "20-30%",
            "Consolidation"
      ],
      [
            "체크포인트 기반 재시작",
            "Spot 중단 대응",
            "10-20%",
            "NeMo 체크포인트"
      ],
      [
            "시간대별 스케줄링",
            "비업무 시간 학습",
            "15-25%",
            "CronJob + Karpenter"
      ]
]
    : [
      [
            "**Argo CD**",
            "GitOps deployment automation",
            "Application deployment, rollback, sync"
      ],
      [
            "**Argo Workflows**",
            "ML pipeline orchestration",
            "Training, evaluation, model registration workflows"
      ],
      [
            "**KRO**",
            "Composite resource abstraction",
            "Manage K8s + AWS resources as a single unit"
      ],
      [
            "**ACK**",
            "Declarative AWS resource management",
            "S3, RDS, SageMaker, and other AWS services"
      ],
      [
            "**Karpenter**",
            "GPU node provisioning",
            "Just-in-Time instance provisioning"
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
        background: 'linear-gradient(135deg, #45b7d1 0%, #45b7d1dd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '학습 워크로드 비용 최적화' : 'Training Workload Cost Optimization'}
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

export default TrainingCostOptimization;
