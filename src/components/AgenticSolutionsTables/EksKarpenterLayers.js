import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EksKarpenterLayers = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["계층", "역할", "제공 가치"]
    : ["Aspect", "Traditional Cluster Autoscaler", "Karpenter on EKS"];

  const data = isKo
    ? [
      [
            "**Amazon EKS**",
            "관리형 Kubernetes Control Plane",
            "운영 부담 제거, 고가용성, 보안"
      ],
      [
            "**Karpenter**",
            "지능형 노드 프로비저닝",
            "Just-in-Time GPU 프로비저닝, 비용 최적화"
      ],
      [
            "**AWS 인프라**",
            "GPU 인스턴스, 스토리지, 네트워크",
            "다양한 GPU 옵션, EFA 고속 네트워크, Spot 인스턴스"
      ]
]
    : [
      [
            "**Scaling Speed**",
            "60-90 seconds (ASG-based)",
            "10-30 seconds (direct EC2 API)"
      ],
      [
            "**Instance Selection**",
            "Limited by ASG pre-configuration",
            "Dynamic selection from 600+ EC2 types"
      ],
      [
            "**GPU Workloads**",
            "Requires separate ASGs per GPU type",
            "Single NodePool handles all GPU types"
      ],
      [
            "**Spot Optimization**",
            "Manual fallback configuration",
            "Automatic spot-to-on-demand fallback"
      ],
      [
            "**Cost Efficiency**",
            "Limited consolidation",
            "Aggressive bin-packing and consolidation"
      ],
      [
            "**AWS Integration**",
            "Indirect via ASG",
            "Direct EC2/Spot API calls"
      ],
      [
            "**Configuration**",
            "ASG + IAM + Launch Templates",
            "Simple NodePool CRD"
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
        {isKo ? 'EKS + Karpenter + AWS 인프라 계층' : 'EKS + Karpenter + AWS Infrastructure Layers'}
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

export default EksKarpenterLayers;
