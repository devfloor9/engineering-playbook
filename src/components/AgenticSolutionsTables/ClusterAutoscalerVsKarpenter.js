import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ClusterAutoscalerVsKarpenter = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["비교 항목", "Cluster Autoscaler", "Karpenter"]
    : ["Feature", "Benefit for Agentic AI"];

  const data = isKo
    ? [
      [
            "**프로비저닝 시간**",
            "5-10분",
            "2-3분"
      ],
      [
            "**인스턴스 선택**",
            "Node Group 내 고정 타입",
            "워크로드 기반 동적 선택"
      ],
      [
            "**GPU 지원**",
            "수동 Node Group 구성",
            "NodePool 자동 매칭"
      ],
      [
            "**비용 최적화**",
            "제한적",
            "Spot, Consolidation 자동"
      ]
]
    : [
      [
            "**Zero-touch Nodes**",
            "No manual AMI updates or node group management"
      ],
      [
            "**Automatic Scaling**",
            "Built-in autoscaling without Karpenter configuration"
      ],
      [
            "**Security Patching**",
            "Automatic OS and Kubernetes security updates"
      ],
      [
            "**Storage Automation**",
            "Dynamic PV provisioning for model caching and vector stores"
      ],
      [
            "**Network Policies**",
            "Integrated network security for multi-tenant agents"
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
        {isKo ? 'Cluster Autoscaler vs Karpenter 비교' : 'Cluster Autoscaler vs Karpenter Comparison'}
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

export default ClusterAutoscalerVsKarpenter;
