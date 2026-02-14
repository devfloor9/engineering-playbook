import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ChallengeSolutionsSummary = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["도전과제", "Kubernetes 기반", "EKS Auto Mode + Karpenter", "기대 효과"]
    : ["도전과제", "Kubernetes 기반", "EKS Auto Mode + Karpenter", "기대 효과"];

  const data = isKo
    ? [
      [
            "**GPU 모니터링**",
            "DCGM + Prometheus",
            "NodePool 기반 통합 관리",
            "리소스 활용률 40% 향상"
      ],
      [
            "**동적 스케일링**",
            "HPA + KEDA",
            "Just-in-Time 프로비저닝 (자동 구성)",
            "프로비저닝 시간 50% 단축"
      ],
      [
            "**비용 컨트롤**",
            "네임스페이스 Quota",
            "Spot + Consolidation (자동 활성화)",
            "비용 50-70% 절감"
      ],
      [
            "**FM 파인튜닝**",
            "Kubeflow Operator",
            "Training NodePool + EFA",
            "학습 효율성 30% 향상"
      ]
]
    : [
      [
            "**GPU 모니터링**",
            "DCGM + Prometheus",
            "NodePool 기반 통합 관리",
            "리소스 활용률 40% 향상"
      ],
      [
            "**동적 스케일링**",
            "HPA + KEDA",
            "Just-in-Time 프로비저닝 (자동 구성)",
            "프로비저닝 시간 50% 단축"
      ],
      [
            "**비용 컨트롤**",
            "네임스페이스 Quota",
            "Spot + Consolidation (자동 활성화)",
            "비용 50-70% 절감"
      ],
      [
            "**FM 파인튜닝**",
            "Kubeflow Operator",
            "Training NodePool + EFA",
            "학습 효율성 30% 향상"
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
        background: 'linear-gradient(135deg, #96ceb4 0%, #96ceb4dd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? '도전과제별 솔루션 요약' : 'Challenge Solutions Summary'}
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

export default ChallengeSolutionsSummary;
