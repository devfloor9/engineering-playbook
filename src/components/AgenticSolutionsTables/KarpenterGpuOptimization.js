import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const KarpenterGpuOptimization = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["기능", "설명", "효과"]
    : ["Feature", "Benefit", "Configuration"];

  const data = isKo
    ? [
      [
            "인스턴스 타입 자동 선택",
            "워크로드 요구사항에 맞는 GPU 인스턴스 자동 선택",
            "리소스 낭비 방지"
      ],
      [
            "Spot 인스턴스 폴백",
            "Spot 불가 시 On-Demand로 자동 전환",
            "가용성 보장"
      ],
      [
            "Consolidation",
            "유휴 GPU 노드 자동 정리",
            "비용 30% 절감"
      ],
      [
            "빠른 프로비저닝",
            "Node Group 없이 직접 EC2 API 호출",
            "프로비저닝 시간 50% 단축"
      ]
]
    : [
      [
            "**Spot + On-Demand Mix**",
            "70% cost savings with automatic fallback",
            "`capacity-type: [spot, on-demand]`"
      ],
      [
            "**Multi-Instance Support**",
            "Select optimal GPU type per workload",
            "`instance-family: [g5, g6, p4d, p5]`"
      ],
      [
            "**Consolidation**",
            "Bin-pack pods to minimize GPU waste",
            "`consolidationPolicy: WhenUnderutilized`"
      ],
      [
            "**Graceful Disruption**",
            "Respect PDBs during node replacement",
            "`budgets: nodes: 10%`"
      ],
      [
            "**Fast Scaling**",
            "Provision GPU nodes in under 60 seconds",
            "Direct EC2 API calls"
      ],
      [
            "**Custom AMIs**",
            "Pre-loaded models and drivers",
            "`amiSelectorTerms`"
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
        background: 'linear-gradient(135deg, #ffd93d 0%, #ffd93ddd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'Karpenter GPU 워크로드 최적화' : 'Karpenter GPU Workload Optimization'}
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

export default KarpenterGpuOptimization;
