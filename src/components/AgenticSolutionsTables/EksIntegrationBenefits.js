import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EksIntegrationBenefits = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["솔루션", "배포 방법", "EKS 통합 이점"]
    : ["Challenge", "Kubernetes-Based", "EKS Auto Mode + Karpenter", "Expected Effect"];

  const data = isKo
    ? [
      [
            "**Karpenter**",
            "EKS Auto Mode (자동)",
            "설치/구성 불필요, 자동 업그레이드"
      ],
      [
            "**Kgateway**",
            "Helm Chart",
            "ALB Controller 연동, ACM 인증서 자동 관리"
      ],
      [
            "**LiteLLM**",
            "Helm Chart",
            "Secrets Manager 연동, IAM 기반 인증"
      ],
      [
            "**vLLM**",
            "Helm Chart",
            "GPU NodePool 자동 프로비저닝"
      ],
      [
            "**llm-d**",
            "Helm Chart",
            "Karpenter 연동 자동 스케일링"
      ],
      [
            "**LangFuse**",
            "Helm Chart",
            "RDS/Aurora 연동, S3 스토리지"
      ],
      [
            "**KAgent**",
            "Helm Chart",
            "Pod Identity 기반 AWS 서비스 접근"
      ],
      [
            "**KEDA**",
            "EKS Addon",
            "관리형 설치, CloudWatch 메트릭 연동"
      ]
]
    : [
      [
            "**GPU Monitoring**",
            "DCGM + Prometheus",
            "NodePool-based integrated management",
            "40% improved resource utilization"
      ],
      [
            "**Dynamic Scaling**",
            "HPA + KEDA",
            "Just-in-Time provisioning (auto-configured)",
            "50% reduced provisioning time"
      ],
      [
            "**Cost Control**",
            "Namespace Quota",
            "Spot + Consolidation (auto-enabled)",
            "50-70% cost reduction"
      ],
      [
            "**FM Fine-tuning**",
            "Kubeflow Operator",
            "Training NodePool + EFA",
            "30% improved training efficiency"
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
        {isKo ? 'EKS 통합 이점' : 'EKS Integration Benefits'}
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

export default EksIntegrationBenefits;
