import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EksAutoModeVsStandard = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["구성 요소", "수동 구성 (EKS Standard)", "EKS Auto Mode"]
    : ["Your Situation", "Recommendation"];

  const data = isKo
    ? [
      [
            "**Karpenter 설치**",
            "Helm 차트 수동 설치, IAM 역할 구성",
            "✅ 자동 설치 및 구성"
      ],
      [
            "**NodePool 관리**",
            "직접 정의 필요",
            "기본 제공 + 커스텀 가능"
      ],
      [
            "**VPC CNI**",
            "수동 설치 및 업그레이드",
            "✅ 자동 관리"
      ],
      [
            "**EBS CSI Driver**",
            "수동 설치, IRSA 구성",
            "✅ 자동 관리"
      ],
      [
            "**CoreDNS**",
            "수동 스케일링",
            "✅ 자동 스케일링"
      ],
      [
            "**보안 패치**",
            "수동 적용",
            "✅ 자동 적용"
      ],
      [
            "**버전 업그레이드**",
            "수동 계획 및 실행",
            "✅ 자동 업그레이드"
      ]
]
    : [
      [
            "New EKS cluster for Agentic AI",
            "**Karpenter** (native AWS integration)"
      ],
      [
            "Existing cluster with CA",
            "**Migrate to Karpenter** (worth the effort)"
      ],
      [
            "Need GPU autoscaling",
            "**Karpenter** (required for GPU efficiency)"
      ],
      [
            "Simple CPU-only workloads",
            "**EKS Auto Mode** (easiest option)"
      ],
      [
            "Multi-tenant platform",
            "**Karpenter** (better isolation and cost attribution)"
      ],
      [
            "Regulated industries",
            "**EKS Auto Mode** (compliance-friendly)"
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
        {isKo ? 'EKS Auto Mode vs 수동 구성' : 'EKS Auto Mode vs Manual Configuration'}
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

export default EksAutoModeVsStandard;
