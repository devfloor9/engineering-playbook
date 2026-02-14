import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const EksAutoModeBenefits = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const headers = isKo
    ? ["이점", "설명"]
    : ["이점", "설명"];

  const data = isKo
    ? [
      [
            "**즉시 시작 가능**",
            "Karpenter 설치/구성 없이 클러스터 생성 즉시 GPU 워크로드 배포"
      ],
      [
            "**자동 업그레이드**",
            "Karpenter, CNI, CSI 등 핵심 컴포넌트 자동 업데이트"
      ],
      [
            "**보안 패치 자동화**",
            "보안 취약점 패치 자동 적용"
      ],
      [
            "**커스텀 확장 가능**",
            "GPU NodePool, EFA NodeClass 등 필요시 커스텀 설정 추가"
      ]
]
    : [
      [
            "**즉시 시작 가능**",
            "Karpenter 설치/구성 없이 클러스터 생성 즉시 GPU 워크로드 배포"
      ],
      [
            "**자동 업그레이드**",
            "Karpenter, CNI, CSI 등 핵심 컴포넌트 자동 업데이트"
      ],
      [
            "**보안 패치 자동화**",
            "보안 취약점 패치 자동 적용"
      ],
      [
            "**커스텀 확장 가능**",
            "GPU NodePool, EFA NodeClass 등 필요시 커스텀 설정 추가"
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
        {isKo ? 'EKS Auto Mode 이점' : 'EKS Auto Mode Benefits'}
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

export default EksAutoModeBenefits;
