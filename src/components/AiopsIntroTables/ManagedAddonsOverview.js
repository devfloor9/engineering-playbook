import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ManagedAddonsOverview = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const categories = [
    {
      icon: '🌐',
      name: isKo ? '네트워킹' : isZh ? '网络' : 'Networking',
      color: '#2563eb',
      addons: ['VPC CNI', 'CoreDNS', 'kube-proxy'],
      desc: isKo ? 'Pod 네트워킹, DNS, 서비스 프록시' : isZh ? 'Pod 网络、DNS、服务代理' : 'Pod networking, DNS, service proxy'
    },
    {
      icon: '💾',
      name: isKo ? '스토리지' : isZh ? '存储' : 'Storage',
      color: '#7c3aed',
      addons: ['EBS CSI', 'EFS CSI', 'FSx CSI', 'Mountpoint for S3', 'Snapshot Controller'],
      desc: isKo ? '블록/파일/객체 스토리지, 스냅샷' : isZh ? '块/文件/对象存储、快照' : 'Block/file/object storage, snapshots'
    },
    {
      icon: '📊',
      name: isKo ? '관찰성' : isZh ? '可观测性' : 'Observability',
      color: '#059669',
      addons: ['ADOT', 'CloudWatch Agent', 'Node Monitoring', 'NFM Agent'],
      desc: isKo ? '메트릭/로그/트레이스, Container Network Observability' : isZh ? '指标/日志/跟踪、容器网络可观测性' : 'Metrics/logs/traces, Container Network Observability'
    },
    {
      icon: '🔒',
      name: isKo ? '보안' : isZh ? '安全' : 'Security',
      color: '#dc2626',
      addons: ['GuardDuty Agent', 'Pod Identity Agent', 'Private CA Connector'],
      desc: isKo ? '런타임 보안, IAM 인증, 인증서' : isZh ? '运行时安全、IAM 认证、证书' : 'Runtime security, IAM auth, certificates'
    },
    {
      icon: '🤖',
      name: 'ML',
      color: '#d97706',
      addons: ['SageMaker HyperPod (Task Governance, Observability, Training, Inference)'],
      desc: isKo ? 'ML 학습·추론 워크로드 관리' : isZh ? 'ML 训练·推理工作负载管理' : 'ML training·inference workload mgmt'
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
            {isKo ? 'EKS Managed Add-ons 카테고리' : isZh ? 'EKS 托管插件类别' : 'EKS Managed Add-ons Categories'}
          </div>
          <div style={{ fontSize: '14px', opacity: 0.9 }}>
            {isKo ? 'aws eks create-addon 한 줄로 설치 · AWS가 버전 관리 · 보안 패치' : isZh ? '一行命令安装 aws eks create-addon · AWS 管理版本 · 安全补丁' : 'Install with one-line aws eks create-addon · AWS manages versions · security patches'}
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
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
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
              background: 'var(--ifm-background-surface-color)',
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
                color: 'var(--ifm-color-emphasis-600)',
                lineHeight: '1.4'
              }}>
                {cat.desc}
              </div>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div style={{
          background: 'var(--ifm-color-emphasis-100)',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: 'var(--ifm-color-emphasis-700)',
          lineHeight: '1.6'
        }}>
          <strong>{isKo ? '핵심:' : isZh ? '核心:' : 'Key:'}</strong> {isKo
            ? 'Managed Add-on은 AWS가 설치·업그레이드·보안 패치를 관리합니다.'
            : isZh
            ? 'AWS 管理 Managed Add-on 的安装、升级和安全补丁。'
            : 'AWS manages installation, upgrades, and security patches for Managed Add-ons.'}
          <code style={{
            background: 'var(--ifm-color-emphasis-800)',
            color: '#10b981',
            padding: '2px 6px',
            borderRadius: '3px',
            fontSize: '11px',
            margin: '0 4px'
          }}>
            aws eks create-addon --addon-name {'<name>'}
          </code>
          {isKo ? '한 줄로 프로덕션 배포가 완료됩니다.' : isZh ? '一行命令即可部署到生产环境。' : 'One line deploys to production.'}
        </div>
      </div>
    </div>
  );
};

export default ManagedAddonsOverview;
