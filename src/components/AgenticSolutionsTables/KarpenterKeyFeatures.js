import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const KarpenterKeyFeatures = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["기능", "설명", "Agentic AI 적용"]
    : ["Comparison", "Cluster Autoscaler", "Karpenter"];

  const data = isKo
    ? [
      [
            "**Just-in-Time 프로비저닝**",
            "워크로드 요구에 따라 즉시 노드 생성",
            "GPU 노드 대기 시간 최소화"
      ],
      [
            "**Spot 인스턴스 지원**",
            "최대 90% 비용 절감",
            "추론 워크로드 비용 최적화"
      ],
      [
            "**Consolidation**",
            "유휴 노드 자동 정리",
            "GPU 리소스 효율성 극대화"
      ],
      [
            "**다양한 인스턴스 타입**",
            "워크로드에 최적화된 인스턴스 자동 선택",
            "모델 크기별 최적 GPU 매칭"
      ],
      [
            "**Disruption Budgets**",
            "서비스 영향 최소화하며 노드 관리",
            "안정적인 스케일 다운"
      ]
]
    : [
      [
            "**Provisioning Time**",
            "5-10 min",
            "2-3 min"
      ],
      [
            "**Instance Selection**",
            "Fixed types in Node Group",
            "Dynamic based on workload"
      ],
      [
            "**GPU Support**",
            "Manual Node Group config",
            "Automatic NodePool matching"
      ],
      [
            "**Cost Optimization**",
            "Limited",
            "Auto Spot, Consolidation"
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
        {isKo ? 'Karpenter 핵심 기능' : 'Karpenter Key Features'}
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

export default KarpenterKeyFeatures;
