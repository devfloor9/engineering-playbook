import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ManagedAddons = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';

  const addons = [
    {
      name: 'adot',
      displayName: 'ADOT',
      category: isKo ? '애플리케이션' : 'Application',
      categoryColor: '#3b82f6',
      status: 'GA',
      purpose: isKo ? 'OpenTelemetry 기반 메트릭/트레이스/로그 수집' : 'OpenTelemetry-based metrics/traces/logs collection',
      targets: 'Metrics, Traces, Logs',
      features: isKo ? 'OTel 표준, SigV4 인증 내장, 멀티 백엔드 지원' : 'OTel standard, built-in SigV4 auth, multi-backend support',
      install: 'aws eks create-addon --addon-name adot'
    },
    {
      name: 'amazon-cloudwatch-observability',
      displayName: 'CloudWatch Agent',
      category: isKo ? '애플리케이션' : 'Application',
      categoryColor: '#059669',
      status: 'GA',
      purpose: 'Container Insights Enhanced + Application Signals',
      targets: 'Metrics, Logs, Traces (App Signals)',
      features: isKo ? '자동 계측, SLI/SLO, 서비스 맵' : 'Auto-instrumentation, SLI/SLO, service map',
      install: 'aws eks create-addon --addon-name amazon-cloudwatch-observability'
    },
    {
      name: 'eks-node-monitoring-agent',
      displayName: 'Node Monitoring',
      category: isKo ? '인프라' : 'Infrastructure',
      categoryColor: '#8b5cf6',
      status: 'GA',
      purpose: isKo ? '노드 레벨 하드웨어/OS 모니터링' : 'Node-level hardware/OS monitoring',
      targets: 'NVMe, Memory, Kernel, OOM',
      features: isKo ? '하드웨어 장애 사전 감지, EDAC 이벤트' : 'Proactive hardware failure detection, EDAC events',
      install: 'aws eks create-addon --addon-name eks-node-monitoring-agent'
    },
    {
      name: 'aws-network-flow-monitoring-agent',
      displayName: 'NFM Agent',
      category: isKo ? '네트워크' : 'Network',
      categoryColor: '#d97706',
      status: 'GA',
      purpose: isKo ? 'Container Network Observability — Pod 수준 네트워크 메트릭' : 'Container Network Observability — Pod-level network metrics',
      targets: 'Network Flows, Cross-AZ Traffic',
      features: isKo ? 'K8s 컨텍스트 매핑, Cross-AZ 비용 가시성' : 'K8s context mapping, Cross-AZ cost visibility',
      install: 'aws eks create-addon --addon-name aws-network-flow-monitoring-agent'
    },
    {
      name: 'aws-guardduty-agent',
      displayName: 'GuardDuty Agent',
      category: isKo ? '보안' : 'Security',
      categoryColor: '#dc2626',
      status: 'GA',
      purpose: isKo ? '런타임 보안 위협 탐지' : 'Runtime security threat detection',
      targets: 'Runtime Events, Syscalls',
      features: isKo ? 'ML 기반 위협 탐지, 암호화폐 마이닝 감지' : 'ML-based threat detection, crypto mining detection',
      install: 'aws eks create-addon --addon-name aws-guardduty-agent'
    }
  ];

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
        background: 'linear-gradient(135deg, #064e3b 0%, #047857 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? 'EKS Managed Add-ons — 관찰성 레이어' : 'EKS Managed Add-ons — Observability Layer'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'aws eks create-addon 한 줄로 프로덕션 관찰성 기초 확립' : 'Establish production observability foundation with one line: aws eks create-addon'}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 1.2fr 1fr',
          borderBottom: '2px solid #e5e7eb',
          background: '#f8fafc'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            Add-on
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '수집 대상' : 'Collection Targets'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '핵심 특징' : 'Key Features'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '설치 명령' : 'Install Command'}
          </div>
        </div>

        {/* Data Rows */}
        {addons.map((addon, idx) => (
          <div key={addon.name} style={{
            display: 'grid',
            gridTemplateColumns: '180px 1fr 1.2fr 1fr',
            borderBottom: idx < addons.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            {/* Add-on Column */}
            <div style={{
              padding: '14px',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '13px',
                fontWeight: '700',
                color: '#1f2937'
              }}>
                {addon.displayName}
              </div>
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                <span style={{
                  background: '#10b981',
                  color: 'white',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {addon.status}
                </span>
                <span style={{
                  background: `${addon.categoryColor}15`,
                  color: addon.categoryColor,
                  padding: '2px 6px',
                  borderRadius: '3px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  {addon.category}
                </span>
              </div>
              <div style={{
                fontSize: '11px',
                color: '#6b7280',
                lineHeight: '1.4'
              }}>
                {addon.purpose}
              </div>
            </div>

            {/* 수집 대상 Column */}
            <div style={{
              padding: '14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {addon.targets}
            </div>

            {/* 핵심 특징 Column */}
            <div style={{
              padding: '14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {addon.features}
            </div>

            {/* 설치 명령 Column */}
            <div style={{
              padding: '14px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              <code style={{
                background: '#1f2937',
                color: '#10b981',
                padding: '6px 8px',
                borderRadius: '4px',
                fontSize: '10px',
                fontFamily: 'Monaco, Consolas, monospace',
                wordBreak: 'break-all',
                lineHeight: '1.4'
              }}>
                {addon.install}
              </code>
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
          💡 <strong>{isKo ? '권장:' : 'Recommendation:'}</strong> {isKo ? '5개 Add-on을 모두 활성화하면 인프라·네트워크·애플리케이션·보안 전 레이어의 관찰성이 확보됩니다. 모든 Add-on은 AWS가 버전 관리와 보안 패치를 담당합니다.' : 'Enabling all 5 Add-ons provides observability across all layers: infrastructure, network, application, and security. AWS manages version control and security patches for all Add-ons.'}
        </div>
      </div>
    </div>
  );
};

export default ManagedAddons;
