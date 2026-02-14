import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MCPServerEcosystem = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const servers = [
    {
      server: 'EKS MCP Server',
      purpose: isKo ? 'Kubernetes 클러스터 관리' : isZh ? 'Kubernetes 集群管理' : 'Kubernetes cluster management',
      color: '#4285f4'
    },
    {
      server: 'CloudWatch MCP Server',
      purpose: isKo ? '메트릭 및 로그 조회' : isZh ? '指标和日志查询' : 'Metrics and logs retrieval',
      color: '#34a853'
    },
    {
      server: 'IAM Policy Autopilot',
      purpose: isKo ? '최소 권한 정책 생성' : isZh ? '最小权限策略生成' : 'Least privilege policy generation',
      color: '#fbbc04'
    },
    {
      server: 'S3 MCP Server',
      purpose: isKo ? '오브젝트 스토리지 접근' : isZh ? '对象存储访问' : 'Object storage access',
      color: '#ea4335'
    },
    {
      server: 'RDS MCP Server',
      purpose: isKo ? '데이터베이스 관리' : isZh ? '数据库管理' : 'Database management',
      color: '#9c27b0'
    }
  ];

  return (
    <div style={{
      maxWidth: '900px',
      margin: '20px auto',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: '15px'
    }}>
      <div style={{
        background: 'linear-gradient(135deg, #ff9900 0%, #cc7a00 100%)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '8px 8px 0 0',
        fontWeight: '600',
        fontSize: '16px'
      }}>
        {isKo ? 'AWS MCP 서버 에코시스템' : isZh ? 'AWS MCP 服务器生态系统' : 'AWS MCP Server Ecosystem'}
      </div>

      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        padding: '20px'
      }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {servers.map((item, index) => (
            <div
              key={index}
              style={{
                background: 'var(--ifm-color-emphasis-50)',
                padding: '16px',
                borderRadius: '8px',
                borderLeft: `4px solid ${item.color}`,
                display: 'grid',
                gridTemplateColumns: '250px 1fr',
                gap: '16px',
                alignItems: 'center'
              }}
            >
              <div style={{ fontWeight: '600', color: item.color, fontSize: '15px' }}>
                {item.server}
              </div>
              <div style={{ fontSize: '14px', color: 'var(--ifm-font-color-base)' }}>
                {item.purpose}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MCPServerEcosystem;
