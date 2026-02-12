import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MonitoringComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const comparisons = [
    {
      aspect: isKo ? '데이터 분석' : isZh ? '数据分析' : 'Data Analysis',
      traditional: isKo ? '규칙 기반 임계값' : isZh ? '基于规则的阈值' : 'Rule-based thresholds',
      aiops: isKo ? 'ML 기반 패턴 인식' : isZh ? '基于 ML 的模式识别' : 'ML-based pattern recognition'
    },
    {
      aspect: isKo ? '이상 탐지' : isZh ? '异常检测' : 'Anomaly Detection',
      traditional: isKo ? '정적 임계값 알림' : isZh ? '静态阈值告警' : 'Static threshold alerts',
      aiops: isKo ? '동적 베이스라인 이상 탐지' : isZh ? '动态基线异常检测' : 'Dynamic baseline anomaly detection'
    },
    {
      aspect: isKo ? '근본 원인 분석' : isZh ? '根因分析' : 'Root Cause Analysis',
      traditional: isKo ? '수동 로그 분석' : isZh ? '手动日志分析' : 'Manual log analysis',
      aiops: isKo ? 'AI 자동 상관관계 분석' : isZh ? 'AI 自动关联分析' : 'AI auto correlation analysis'
    },
    {
      aspect: isKo ? '알림' : isZh ? '告警' : 'Alerting',
      traditional: isKo ? '알림 폭주 (Alert Fatigue)' : isZh ? '告警风暴（告警疲劳）' : 'Alert storm (Alert Fatigue)',
      aiops: isKo ? '지능형 알림 그룹핑/억제' : isZh ? '智能告警分组/抑制' : 'Intelligent alert grouping/suppression'
    },
    {
      aspect: isKo ? '자동화' : isZh ? '自动化' : 'Automation',
      traditional: isKo ? '제한적 스크립트 기반' : isZh ? '有限的脚本式' : 'Limited script-based',
      aiops: isKo ? 'AI Agent 자율 대응' : isZh ? 'AI Agent 自主响应' : 'AI Agent autonomous response'
    },
    {
      aspect: isKo ? '확장성' : isZh ? '扩展性' : 'Scalability',
      traditional: isKo ? '수동 구성 관리' : isZh ? '手动配置管理' : 'Manual configuration mgmt',
      aiops: isKo ? '자동 적응형 스케일링' : isZh ? '自动自适应扩展' : 'Auto adaptive scaling'
    },
    {
      aspect: isKo ? '비용 효율' : isZh ? '成本效率' : 'Cost Efficiency',
      traditional: isKo ? '오버 프로비저닝' : isZh ? '过度配置' : 'Over-provisioning',
      aiops: isKo ? 'AI 기반 Right-Sizing' : isZh ? '基于 AI 的容量优化' : 'AI-powered right-sizing'
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
      <div style={{
        background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '⚖️ 전통적 모니터링 vs AIOps' : isZh ? '⚖️ 传统监控 vs AIOps' : '⚖️ Traditional Monitoring vs AIOps'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '패러다임 전환 비교' : isZh ? '范式转变对比' : 'Paradigm shift comparison'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px'
      }}>
        {comparisons.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              padding: '16px',
              borderBottom: index < comparisons.length - 1 ? '1px solid #f3f4f6' : 'none'
            }}
          >
            <div style={{
              background: '#fef2f2',
              padding: '16px',
              borderRadius: '6px',
              borderLeft: '3px solid #dc2626'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>❌</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#991b1b' }}>
                  {item.aspect}
                </span>
              </div>
              <div style={{ color: '#dc2626', fontSize: '14px' }}>
                {item.traditional}
              </div>
            </div>

            <div style={{
              background: '#ecfdf5',
              padding: '16px',
              borderRadius: '6px',
              borderLeft: '3px solid #059669'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <span style={{ fontSize: '16px' }}>✅</span>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#065f46' }}>
                  {item.aspect}
                </span>
              </div>
              <div style={{ color: '#059669', fontSize: '14px' }}>
                {item.aiops}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MonitoringComparison;
