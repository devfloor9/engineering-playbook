import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const TroubleshootingGuide = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["문제 유형", "확인 사항", "해결 도구"]
    : ["Configuration", "Cost per Job", "Time to Complete"];

  const data = isKo
    ? [
      [
            "**스케줄링 실패**",
            "Device Plugin, Toleration, GPU 가용성",
            "`kubectl describe pod`, `kubectl get nodes`"
      ],
      [
            "**메모리 부족**",
            "GPU 메모리 크기, 배치 크기, MIG 설정",
            "`nvidia-smi`, vLLM 설정"
      ],
      [
            "**노드 프로비저닝 실패**",
            "NodePool 설정, IAM 권한, 인스턴스 가용성",
            "`kubectl logs -n karpenter`, AWS Console"
      ],
      [
            "**드라이버 문제**",
            "드라이버 버전, CUDA 호환성",
            "`nvidia-smi`, GPU Operator 로그"
      ],
      [
            "**네트워크 성능**",
            "EFA 활성화, Security Group, 인스턴스 타입",
            "`fi_info -p efa`, NCCL 로그"
      ],
      [
            "**Spot 중단**",
            "인스턴스 다양성, PDB, Graceful shutdown",
            "CloudWatch Events, Karpenter 로그"
      ]
]
    : [
      [
            "**On-Demand p4d.24xlarge (2 nodes)**",
            "$524",
            "8 hours"
      ],
      [
            "**Spot p4d.24xlarge (2 nodes, 70% discount)**",
            "$157",
            "8.5 hours (with 1 interruption)"
      ],
      [
            "**Spot p5.48xlarge (1 node, newer gen)**",
            "$196",
            "5 hours (faster GPU)"
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
        {isKo ? 'GPU 워크로드 트러블슈팅' : 'GPU Workload Troubleshooting'}
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

export default TroubleshootingGuide;
