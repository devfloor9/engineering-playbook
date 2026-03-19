import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const ApplicationSignalsLanguages = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const languages = [
    {
      language: 'Java',
      instrumentation: isKo ? 'ADOT Java Agent 자동 주입' : isZh ? 'ADOT Java Agent 自动注入' : 'ADOT Java Agent auto-injection',
      status: 'GA',
      statusColor: '#10b981'
    },
    {
      language: 'Python',
      instrumentation: 'ADOT Python Auto-instrumentation',
      status: 'GA',
      statusColor: '#10b981'
    },
    {
      language: '.NET',
      instrumentation: 'ADOT .NET Auto-instrumentation',
      status: 'GA',
      statusColor: '#10b981'
    },
    {
      language: 'Node.js',
      instrumentation: 'ADOT Node.js Auto-instrumentation',
      status: 'GA',
      statusColor: '#10b981'
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
        background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? 'Application Signals 지원 언어' : isZh ? 'Application Signals 支持的语言' : 'Application Signals Supported Languages'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? 'Zero-code 계측 지원 현황' : isZh ? '零代码插桩支持状态' : 'Zero-code instrumentation support status'}
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
          gridTemplateColumns: '120px 1fr 100px',
          borderBottom: '2px solid var(--ifm-color-emphasis-200)',
          background: 'var(--ifm-background-surface-color)'
        }}>
          <div style={{
            padding: '12px 14px',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '언어' : isZh ? '语言' : 'Language'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)'
          }}>
            {isKo ? '계측 방식' : isZh ? '插桩方式' : 'Instrumentation Method'}
          </div>
          <div style={{
            padding: '12px 14px',
            borderLeft: '1px solid var(--ifm-color-emphasis-200)',
            fontWeight: '600',
            fontSize: '12px',
            color: 'var(--ifm-color-emphasis-600)',
            textAlign: 'center'
          }}>
            {isKo ? '상태' : isZh ? '状态' : 'Status'}
          </div>
        </div>

        {/* Data Rows */}
        {languages.map((item, idx) => (
          <div key={idx} style={{
            display: 'grid',
            gridTemplateColumns: '120px 1fr 100px',
            borderBottom: idx < languages.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '14px',
              background: 'var(--ifm-background-surface-color)',
              fontWeight: '700',
              color: 'var(--ifm-font-color-base)',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.language}
            </div>
            <div style={{
              padding: '14px',
              fontSize: '13px',
              color: 'var(--ifm-font-color-base)',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {item.instrumentation}
            </div>
            <div style={{
              padding: '14px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                background: item.statusColor,
                color: 'white',
                padding: '4px 10px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600'
              }}>
                {item.status}
              </span>
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
          💡 <strong>{isKo ? 'Zero-code 계측:' : isZh ? '零代码插桩:' : 'Zero-code Instrumentation:'}</strong> {isKo ? 'Instrumentation CRD로 Pod에 annotation만 추가하면 자동으로 계측 에이전트가 주입됩니다. 코드 변경 없이 서비스 맵, SLI/SLO가 생성됩니다.' : isZh ? '通过 Instrumentation CRD 仅需为 Pod 添加注解，插桩代理即可自动注入。无需修改代码即可生成服务拓扑、SLI/SLO。' : 'Simply add annotations to Pods via Instrumentation CRD and instrumentation agents are automatically injected. Service maps and SLI/SLO are generated without code changes.'}
        </div>
      </div>
    </div>
  );
};

export default ApplicationSignalsLanguages;
