import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const SecurityLayers = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["보안 계층", "구현 방법", "보호 대상"]
    : ["EKS Capability", "Role", "Agentic AI Usage", "Support Method"];

  const data = isKo
    ? [
      [
            "**Pod Security**",
            "Pod Security Standards, ResourceQuota",
            "권한 상승, 리소스 남용 방지"
      ],
      [
            "**Network Security**",
            "NetworkPolicy, Security Groups for Pods",
            "측면 이동, 무단 접근 차단"
      ],
      [
            "**Data Security**",
            "S3 Bucket Policy, KMS 암호화",
            "모델 아티팩트 보호"
      ],
      [
            "**Identity Security**",
            "Pod Identity, IAM 최소 권한",
            "AWS 리소스 무단 접근 방지"
      ],
      [
            "**Isolation**",
            "MIG, Namespace 격리",
            "멀티 테넌트 워크로드 격리"
      ]
]
    : [
      [
            "**ACK (AWS Controllers for Kubernetes)**",
            "Kubernetes-native management of AWS services",
            "S3 model storage, RDS metadata, SageMaker training jobs",
            "EKS Add-on"
      ],
      [
            "**KRO (Kubernetes Resource Orchestrator)**",
            "Composite resource abstraction and templating",
            "One-click deployment of AI inference stacks, training pipelines",
            "EKS Add-on"
      ],
      [
            "**Argo CD**",
            "GitOps-based continuous deployment",
            "Model serving deployment automation, rollback, environment sync",
            "EKS Add-on"
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
        {isKo ? '보안 계층별 구현' : 'Security Implementation by Layer'}
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

export default SecurityLayers;
