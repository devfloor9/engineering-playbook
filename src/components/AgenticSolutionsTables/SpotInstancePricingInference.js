import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const SpotInstancePricingInference = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["인스턴스 타입", "GPU", "GPU 메모리", "On-Demand", "Spot (평균)", "절감률", "적합 모델 크기"]
    : ["Component", "Purpose", "AWS Integration"];

  const data = isKo
    ? [
      [
            "g5.xlarge",
            "1x A10G",
            "24GB",
            "$1.006",
            "$0.302",
            "70%",
            "7B 이하"
      ],
      [
            "g5.2xlarge",
            "1x A10G",
            "24GB",
            "$1.212",
            "$0.364",
            "70%",
            "7B-13B"
      ],
      [
            "g5.12xlarge",
            "4x A10G",
            "96GB",
            "$5.672",
            "$1.702",
            "70%",
            "13B-30B"
      ],
      [
            "g5.48xlarge",
            "8x A10G",
            "192GB",
            "$16.288",
            "$4.886",
            "70%",
            "30B-70B"
      ],
      [
            "p4d.24xlarge",
            "8x A100 40GB",
            "320GB",
            "$32.77",
            "$9.831",
            "70%",
            "70B+"
      ],
      [
            "p5.48xlarge",
            "8x H100 80GB",
            "640GB",
            "$98.32",
            "$29.496",
            "70%",
            "100B+ MoE"
      ]
]
    : [
      [
            "**DCGM-Exporter**",
            "Collect GPU metrics",
            "CloudWatch Container Insights"
      ],
      [
            "**Karpenter GPU NodePool**",
            "Provision GPU nodes",
            "EC2 Spot API, CloudWatch metrics"
      ],
      [
            "**CloudWatch Dashboard**",
            "Visualize GPU health",
            "Native AWS service"
      ],
      [
            "**CloudWatch Alarms**",
            "Alert on GPU issues",
            "SNS notifications"
      ],
      [
            "**IAM Roles (IRSA)**",
            "Secure S3 model access",
            "Pod-level permissions"
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
        background: 'linear-gradient(135deg, #ff6b6b 0%, #ff6b6bdd 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'Spot 인스턴스 가격 (추론용)' : 'Spot Instance Pricing (Inference)'}
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

export default SpotInstancePricingInference;
