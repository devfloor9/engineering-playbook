import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ManagedAddons = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const addons = [
    {
      name: 'adot',
      displayName: 'ADOT',
      category: isKo ? '애플리케이션' : isZh ? '应用' : 'Application',
      categoryColor: '#3b82f6',
      status: 'GA',
      purpose: isKo ? 'OpenTelemetry 기반 메트릭/트레이스/로그 수집' : isZh ? '基于 OpenTelemetry 的指标/链路追踪/日志采集' : 'OpenTelemetry-based metrics/traces/logs collection',
      targets: 'Metrics, Traces, Logs',
      features: isKo ? 'OTel 표준, SigV4 인증 내장, 멀티 백엔드 지원' : isZh ? 'OTel 标准，内置 SigV4 认证，多后端支持' : 'OTel standard, built-in SigV4 auth, multi-backend support',
      install: 'aws eks create-addon --addon-name adot'
    },
    {
      name: 'amazon-cloudwatch-observability',
      displayName: 'CloudWatch Agent',
      category: isKo ? '애플리케이션' : isZh ? '应用' : 'Application',
      categoryColor: '#059669',
      status: 'GA',
      purpose: 'Container Insights Enhanced + Application Signals',
      targets: 'Metrics, Logs, Traces (App Signals)',
      features: isKo ? '자동 계측, SLI/SLO, 서비스 맵' : isZh ? '自动插桩，SLI/SLO，服务拓扑' : 'Auto-instrumentation, SLI/SLO, service map',
      install: 'aws eks create-addon --addon-name amazon-cloudwatch-observability'
    },
    {
      name: 'eks-node-monitoring-agent',
      displayName: 'Node Monitoring',
      category: isKo ? '인프라' : isZh ? '基础设施' : 'Infrastructure',
      categoryColor: '#8b5cf6',
      status: 'GA',
      purpose: isKo ? '노드 레벨 하드웨어/OS 모니터링' : isZh ? '节点级硬件/OS 监控' : 'Node-level hardware/OS monitoring',
      targets: 'NVMe, Memory, Kernel, OOM',
      features: isKo ? '하드웨어 장애 사전 감지, EDAC 이벤트' : isZh ? '主动硬件故障检测，EDAC 事件' : 'Proactive hardware failure detection, EDAC events',
      install: 'aws eks create-addon --addon-name eks-node-monitoring-agent'
    },
    {
      name: 'aws-network-flow-monitoring-agent',
      displayName: 'NFM Agent',
      category: isKo ? '네트워크' : isZh ? '网络' : 'Network',
      categoryColor: '#d97706',
      status: 'GA',
      purpose: isKo ? 'Container Network Observability — Pod 수준 네트워크 메트릭' : isZh ? 'Container Network Observability — Pod 级网络指标' : 'Container Network Observability — Pod-level network metrics',
      targets: 'Network Flows, Cross-AZ Traffic',
      features: isKo ? 'K8s 컨텍스트 매핑, Cross-AZ 비용 가시성' : isZh ? 'K8s 上下文映射，跨可用区成本可见性' : 'K8s context mapping, Cross-AZ cost visibility',
      install: 'aws eks create-addon --addon-name aws-network-flow-monitoring-agent'
    },
    {
      name: 'aws-guardduty-agent',
      displayName: 'GuardDuty Agent',
      category: isKo ? '보안' : isZh ? '安全' : 'Security',
      categoryColor: '#dc2626',
      status: 'GA',
      purpose: isKo ? '런타임 보안 위협 탐지' : isZh ? '运行时安全威胁检测' : 'Runtime security threat detection',
      targets: 'Runtime Events, Syscalls',
      features: isKo ? 'ML 기반 위협 탐지, 암호화폐 마이닝 감지' : isZh ? '基于 ML 的威胁检测，加密货币挖矿检测' : 'ML-based threat detection, crypto mining detection',
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
          {isKo ? 'EKS Managed Add-ons — 관찰성 레이어' : isZh ? 'EKS Managed Add-ons — 可观测性层' : 'EKS Managed Add-ons — Observability Layer'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'aws eks create-addon 한 줄로 프로덕션 관찰성 기초 확립' : isZh ? '通过一行命令 aws eks create-addon 建立生产级可观测性基础' : 'Establish production observability foundation with one line: aws eks create-addon'}
        </div>
      </div>

      {/* Table */}
      <div style={{
        background: 'var(--ifm-background-surface-color)',
        border: '1px solid var(--ifm-color-emphasis-200)',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        {/* Column Headers */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '180px 1fr 1.2fr 1fr',
          borderBottom: '2px solid var(--ifm-color-emphasis-200)',
          background: 'var(--ifm-background-surface-color)'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            Add-on
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '수집 대상' : isZh ? '采集目标' : 'Collection Targets'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '핵심 특징' : isZh ? '核心特性' : 'Key Features'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '설치 명령' : isZh ? '安装命令' : 'Install Command'}
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
              background: 'var(--ifm-background-surface-color)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <div style={{
                fontFamily: 'Monaco, Consolas, monospace',
                fontSize: '13px',
                fontWeight: '700',
                color: 'var(--ifm-font-color-base)'
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
                color: 'var(--ifm-color-emphasis-600)',
                lineHeight: '1.4'
              }}>
                {addon.purpose}
              </div>
            </div>

            {/* 수집 대상 Column */}
            <div style={{
              padding: '14px',
              fontSize: '12px',
              color: 'var(--ifm-font-color-base)',
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
              color: 'var(--ifm-font-color-base)',
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
                background: 'var(--ifm-color-emphasis-800)',
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
          background: 'var(--ifm-color-emphasis-100)',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: 'var(--ifm-color-emphasis-700)',
          lineHeight: '1.6'
        }}>
          💡 <strong>{isKo ? '권장:' : isZh ? '建议:' : 'Recommendation:'}</strong> {isKo ? '5개 Add-on을 모두 활성화하면 인프라·네트워크·애플리케이션·보안 전 레이어의 관찰성이 확보됩니다. 모든 Add-on은 AWS가 버전 관리와 보안 패치를 담당합니다.' : isZh ? '启用所有 5 个 Add-on 可提供覆盖所有层次的可观测性：基础设施、网络、应用和安全。AWS 负责管理所有 Add-on 的版本控制和安全补丁。' : 'Enabling all 5 Add-ons provides observability across all layers: infrastructure, network, application, and security. AWS manages version control and security patches for all Add-ons.'}
        </div>
      </div>
    </div>
  );
};

export default ManagedAddons;
