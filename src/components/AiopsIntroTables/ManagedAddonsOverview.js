import React from 'react';

const ManagedAddonsOverview = () => {
  const categories = [
    {
      icon: '🌐',
      name: '네트워킹',
      color: '#2563eb',
      addons: ['VPC CNI', 'CoreDNS', 'kube-proxy'],
      desc: 'Pod 네트워킹, DNS, 서비스 프록시'
    },
    {
      icon: '💾',
      name: '스토리지',
      color: '#7c3aed',
      addons: ['EBS CSI', 'EFS CSI', 'FSx CSI', 'Mountpoint for S3', 'Snapshot Controller'],
      desc: '블록/파일/객체 스토리지, 스냅샷'
    },
    {
      icon: '📊',
      name: '관찰성',
      color: '#059669',
      addons: ['ADOT', 'CloudWatch Agent', 'Node Monitoring', 'NFM Agent'],
      desc: '메트릭/로그/트레이스, Container Network Observability'
    },
    {
      icon: '🔒',
      name: '보안',
      color: '#dc2626',
      addons: ['GuardDuty Agent', 'Pod Identity Agent', 'Private CA Connector'],
      desc: '런타임 보안, IAM 인증, 인증서'
    },
    {
      icon: '🤖',
      name: 'ML',
      color: '#d97706',
      addons: ['SageMaker HyperPod (Task Governance, Observability, Training, Inference)'],
      desc: 'ML 학습·추론 워크로드 관리'
    }
  ];

  const totalAddons = categories.reduce((acc, cat) => acc + cat.addons.length, 0);

  return (
    <div style={{
      maxWidth: '760px',
      margin: '0 auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      fontSize: '15px',
      lineHeight: '1.6'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
            EKS Managed Add-ons 카테고리
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            aws eks create-addon 한 줄로 설치 · AWS가 버전 관리 · 보안 패치
          </div>
        </div>
        <div style={{
          background: 'rgba(255, 255, 255, 0.2)',
          padding: '6px 14px',
          borderRadius: '20px',
          fontSize: '13px',
          fontWeight: '600',
          whiteSpace: 'nowrap'
        }}>
          {totalAddons}+ Add-ons
        </div>
      </div>

      {/* Category Cards */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {categories.map((cat, idx) => (
          <div key={cat.name} style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr',
            borderBottom: idx < categories.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            {/* Category Label */}
            <div style={{
              padding: '14px 16px',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px',
              borderRight: `3px solid ${cat.color}`
            }}>
              <div style={{
                fontSize: '16px',
                lineHeight: '1'
              }}>
                {cat.icon}
              </div>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: cat.color
              }}>
                {cat.name}
              </div>
            </div>

            {/* Content */}
            <div style={{
              padding: '14px 16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              {/* Add-on chips */}
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px'
              }}>
                {cat.addons.map((addon) => (
                  <span key={addon} style={{
                    background: `${cat.color}10`,
                    color: cat.color,
                    border: `1px solid ${cat.color}25`,
                    padding: '3px 10px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: '600',
                    whiteSpace: 'nowrap'
                  }}>
                    {addon}
                  </span>
                ))}
              </div>

              {/* Description */}
              <div style={{
                fontSize: '12px',
                color: '#6b7280',
                lineHeight: '1.4'
              }}>
                {cat.desc}
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e',
          lineHeight: '1.6'
        }}>
          <strong>핵심:</strong> Managed Add-on은 AWS가 <strong>설치·업그레이드·보안 패치</strong>를 관리합니다.
          <code style={{
            background: '#1f2937',
            color: '#10b981',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '11px',
            margin: '0 4px'
          }}>
            aws eks create-addon --addon-name {'<name>'}
          </code>
          한 줄로 프로덕션 배포가 완료됩니다.
        </div>
      </div>
    </div>
  );
};

export default ManagedAddonsOverview;
