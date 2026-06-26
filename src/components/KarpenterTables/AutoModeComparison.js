import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
const AutoModeComparison = () => {
  const {
    i18n
  } = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const rows = [{
    label: isKo ? '스케일링 속도' : 'Scaling Speed',
    self: isKo ? '30-45초 (최적화 시)' : '30-45s (optimized)',
    auto: isKo ? '30-45초 (동일)' : '30-45s (same)',
    icon: '⚡'
  }, {
    label: isKo ? '커스터마이징' : 'Customization',
    self: '⭐⭐⭐⭐⭐',
    selfNote: isKo ? '완전한 제어' : 'Full control',
    auto: '⭐⭐⭐',
    autoNote: isKo ? '제한적' : 'Limited',
    icon: '🔧'
  }, {
    label: 'Warm Pool',
    self: '✅',
    selfNote: isKo ? '직접 구현 가능' : 'Self-implementable',
    auto: '❌',
    autoNote: isKo ? '미지원 (2025-02)' : 'Not supported',
    icon: '🔥'
  }, {
    label: 'Setu/Kueue',
    self: '✅',
    selfNote: isKo ? '완전 지원' : 'Full support',
    auto: '⚠️',
    autoNote: isKo ? '제한적' : 'Limited',
    icon: '🤖'
  }, {
    label: isKo ? '비용' : 'Cost',
    self: isKo ? '무료 (리소스만)' : 'Free (resources only)',
    auto: isKo ? '무료 (리소스만)' : 'Free (resources only)',
    icon: '💰'
  }, {
    label: isKo ? '운영 복잡도' : 'Ops Complexity',
    self: '⭐⭐⭐⭐',
    selfNote: isKo ? '높음' : 'High',
    auto: '⭐',
    autoNote: isKo ? '낮음' : 'Low',
    icon: '📊',
    autoHighlight: true
  }, {
    label: 'OS ' + (isKo ? '패치' : 'Patching'),
    self: isKo ? '직접 AMI 관리' : 'Manual AMI mgmt',
    auto: isKo ? '자동 패치' : 'Auto patching',
    icon: '🛡️',
    autoHighlight: true
  }, {
    label: 'Drift Detection',
    self: isKo ? '수동 설정' : 'Manual setup',
    auto: isKo ? '기본 활성화' : 'Enabled by default',
    icon: '🔍',
    autoHighlight: true
  }, {
    label: isKo ? '적합한 환경' : 'Best For',
    self: isKo ? '고급 스케줄링, Gang 스케줄링' : 'Advanced scheduling, Gang scheduling',
    auto: isKo ? '운영 단순화 우선' : 'Operations simplicity',
    icon: '🎯'
  }];
  return <div style={{
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    maxWidth: '760px',
    margin: '2rem auto',
    padding: '0 1rem'
  }}>
      <div style={{
      background: 'linear-gradient(135deg, #7c2d12 0%, #ea580c 100%)',
      color: 'white',
      padding: '20px 24px',
      borderRadius: '8px 8px 0 0'
    }}>
        <div style={{
        fontSize: '20px',
        fontWeight: '600',
        marginBottom: '4px'
      }}>
          {isKo ? '🔄 EKS Auto Mode vs Self-managed Karpenter' : '🔄 EKS Auto Mode vs Self-managed Karpenter'}
        </div>
        <div style={{
        fontSize: '14px',
        opacity: 0.9
      }}>
          {isKo ? '운영 복잡도 vs 커스터마이징 자유도 트레이드오프' : 'Operations complexity vs customization freedom tradeoff'}
        </div>
      </div>

      <div style={{
      background: 'var(--ifm-background-surface-color)',
      border: '1px solid var(--ifm-color-emphasis-200)',
      borderTop: 'none',
      borderRadius: '0 0 8px 8px',
      overflow: 'hidden'
    }}>
        {/* Column headers */}
        <div style={{
        display: 'grid',
        gridTemplateColumns: '30px 1fr 1fr 1fr',
        borderBottom: '2px solid var(--ifm-color-emphasis-200)'
      }}>
          <div style={{
          padding: '10px 4px'
        }} />
          <div style={{
          padding: '10px 12px',
          fontSize: '12px',
          fontWeight: '700',
          color: 'var(--ifm-color-emphasis-600)'
        }}>
            {isKo ? '항목' : 'Feature'}
          </div>
          <div style={{
          padding: '10px 12px',
          fontSize: '12px',
          fontWeight: '700',
          color: 'white',
          background: '#3b82f6',
          textAlign: 'center'
        }}>
            Self-managed
          </div>
          <div style={{
          padding: '10px 12px',
          fontSize: '12px',
          fontWeight: '700',
          color: 'white',
          background: '#ea580c',
          textAlign: 'center'
        }}>
            Auto Mode
          </div>
        </div>

        {rows.map((row, idx) => <div key={idx} style={{
        display: 'grid',
        gridTemplateColumns: '30px 1fr 1fr 1fr',
        borderBottom: idx < rows.length - 1 ? '1px solid #f3f4f6' : 'none',
        background: idx % 2 === 0 ? 'var(--ifm-color-emphasis-100)' : 'white'
      }}>
            <div style={{
          padding: '10px 4px',
          textAlign: 'center',
          fontSize: '14px'
        }}>{row.icon}</div>
            <div style={{
          padding: '10px 12px',
          fontSize: '12px',
          fontWeight: '600',
          color: 'var(--ifm-font-color-base)'
        }}>
              {row.label}
            </div>
            <div style={{
          padding: '10px 12px',
          fontSize: '12px',
          color: 'var(--ifm-font-color-base)',
          borderLeft: '1px solid #f3f4f6'
        }}>
              <div>{row.self}</div>
              {row.selfNote && <div style={{
            fontSize: '10px',
            color: 'var(--ifm-color-emphasis-500)',
            marginTop: '2px'
          }}>{row.selfNote}</div>}
            </div>
            <div style={{
          padding: '10px 12px',
          fontSize: '12px',
          color: 'var(--ifm-font-color-base)',
          borderLeft: '1px solid #f3f4f6',
          background: row.autoHighlight ? '#fff7ed' : 'transparent'
        }}>
              <div>{row.auto}</div>
              {row.autoNote && <div style={{
            fontSize: '10px',
            color: 'var(--ifm-color-emphasis-500)',
            marginTop: '2px'
          }}>{row.autoNote}</div>}
            </div>
          </div>)}
      </div>
    </div>;
};
export default AutoModeComparison;