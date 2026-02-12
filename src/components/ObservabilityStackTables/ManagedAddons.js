import React from 'react';

const ManagedAddons = () => {
  const addons = [
    {
      name: 'adot',
      status: 'GA',
      color: '#3b82f6',
      purpose: 'OpenTelemetry 기반 메트릭/트레이스/로그 수집',
      command: 'aws eks create-addon --addon-name adot'
    },
    {
      name: 'amazon-cloudwatch-observability',
      status: 'GA',
      color: '#059669',
      purpose: 'Container Insights Enhanced + Application Signals',
      command: 'aws eks create-addon --addon-name amazon-cloudwatch-observability'
    },
    {
      name: 'eks-node-monitoring-agent',
      status: 'GA',
      color: '#8b5cf6',
      purpose: '노드 레벨 하드웨어/OS 모니터링',
      command: 'aws eks create-addon --addon-name eks-node-monitoring-agent'
    },
    {
      name: 'aws-network-flow-monitoring-agent',
      status: 'GA',
      color: '#d97706',
      purpose: 'Container Network Observability — Pod 수준 네트워크 메트릭, Cross-AZ 트래픽 가시성',
      command: 'aws eks create-addon --addon-name aws-network-flow-monitoring-agent'
    },
    {
      name: 'aws-guardduty-agent',
      status: 'GA',
      color: '#dc2626',
      purpose: '런타임 보안 위협 탐지',
      command: 'aws eks create-addon --addon-name aws-guardduty-agent'
    }
  ];

  const containerStyle = {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
    color: 'white',
    padding: '1.5rem',
    borderRadius: '8px 8px 0 0',
    marginBottom: '1rem'
  };

  const titleStyle = {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    margin: '0 0 0.5rem 0'
  };

  const subtitleStyle = {
    fontSize: '0.875rem',
    opacity: 0.9,
    margin: 0
  };

  const addonsContainerStyle = {
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '0 0 8px 8px',
    padding: '1rem',
    display: 'grid',
    gap: '1rem'
  };

  const addonCardStyle = (color) => ({
    border: `2px solid ${color}`,
    borderRadius: '8px',
    padding: '1rem',
    background: '#f9fafb'
  });

  const cardHeaderStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem'
  };

  const addonNameStyle = {
    fontFamily: 'Monaco, Consolas, monospace',
    fontSize: '0.875rem',
    fontWeight: 'bold',
    color: '#1f2937'
  };

  const statusBadgeStyle = (status) => ({
    display: 'inline-block',
    background: status === 'GA' ? '#10b981' : '#f59e0b',
    color: 'white',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontWeight: 'bold'
  });

  const purposeStyle = {
    fontSize: '0.875rem',
    color: '#4b5563',
    marginBottom: '0.75rem'
  };

  const commandStyle = {
    background: '#1f2937',
    color: '#10b981',
    padding: '0.5rem',
    borderRadius: '4px',
    fontSize: '0.75rem',
    fontFamily: 'Monaco, Consolas, monospace',
    overflowX: 'auto',
    whiteSpace: 'nowrap'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle}>🔌 EKS Managed Add-ons (관찰성)</h3>
        <p style={subtitleStyle}>원클릭 배포로 관찰성 기초 확립</p>
      </div>
      <div style={addonsContainerStyle}>
        {addons.map((addon, index) => (
          <div key={index} style={addonCardStyle(addon.color)}>
            <div style={cardHeaderStyle}>
              <span style={addonNameStyle}>{addon.name}</span>
              <span style={statusBadgeStyle(addon.status)}>{addon.status}</span>
            </div>
            <div style={purposeStyle}>{addon.purpose}</div>
            <div style={commandStyle}>{addon.command}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagedAddons;
