import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const DetailedMetrics = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const metrics = [
    {
      metric: isKo ? '코드 생성 속도' : isZh ? '代码生成速度' : 'Code Generation Speed',
      description: isKo ? '기능당 코드 작성 시간' : isZh ? '每个功能的代码编写时间' : 'Code writing time per feature',
      before: isKo ? '8시간' : isZh ? '8小时' : '8 hours',
      after: isKo ? '2시간' : isZh ? '2小时' : '2 hours',
      improvement: '75% ↓',
      color: '#3b82f6'
    },
    {
      metric: isKo ? 'PR 리뷰 시간' : isZh ? 'PR 审查时间' : 'PR Review Time',
      description: isKo ? 'PR 제출→승인 소요 시간' : isZh ? 'PR 提交到批准的时间' : 'Time from PR submission to approval',
      before: isKo ? '24시간' : isZh ? '24小时' : '24 hours',
      after: isKo ? '4시간' : isZh ? '4小时' : '4 hours',
      improvement: '83% ↓',
      color: '#3b82f6'
    },
    {
      metric: isKo ? '배포 빈도' : isZh ? '部署频率' : 'Deployment Frequency',
      description: isKo ? '프로덕션 배포 횟수/주' : isZh ? '每周生产部署次数' : 'Production deployments per week',
      before: isKo ? '2회' : isZh ? '2次' : '2 times',
      after: isKo ? '10회' : isZh ? '10次' : '10 times',
      improvement: '5x ↑',
      color: '#3b82f6'
    },
    {
      metric: 'MTTR',
      description: isKo ? '장애 평균 복구 시간' : isZh ? '平均恢复时间' : 'Mean time to recovery',
      before: isKo ? '45분' : isZh ? '45分钟' : '45 min',
      after: isKo ? '12분' : isZh ? '12分钟' : '12 min',
      improvement: '73% ↓',
      color: '#059669'
    },
    {
      metric: 'Change Failure Rate',
      description: isKo ? '배포 실패율' : isZh ? '部署失败率' : 'Deployment failure rate',
      before: '15%',
      after: '3%',
      improvement: '80% ↓',
      color: '#059669'
    },
    {
      metric: isKo ? '테스트 커버리지' : isZh ? '测试覆盖率' : 'Test Coverage',
      description: isKo ? '코드 테스트 범위' : isZh ? '代码测试覆盖范围' : 'Code test coverage',
      before: '45%',
      after: '85%',
      improvement: '89% ↑',
      color: '#059669'
    },
    {
      metric: isKo ? '보안 취약점' : isZh ? '安全漏洞' : 'Security Vulnerabilities',
      description: isKo ? '프로덕션 보안 이슈/분기' : isZh ? '每季度生产安全问题' : 'Production security issues per quarter',
      before: isKo ? '8건' : isZh ? '8个' : '8 issues',
      after: isKo ? '1건' : isZh ? '1个' : '1 issue',
      improvement: '87% ↓',
      color: '#dc2626'
    }
  ];

  const doraMetrics = [
    {
      metric: isKo ? '배포 빈도' : isZh ? '部署频率' : 'Deployment Frequency',
      contribution: isKo ? 'Managed Argo CD + AI 자동 승인' : isZh ? 'Managed Argo CD + AI 自动批准' : 'Managed Argo CD + AI Auto-approval',
      method: isKo ? '수동 게이트 제거' : isZh ? '移除人工关卡' : 'Remove manual gates',
      icon: '🚀'
    },
    {
      metric: isKo ? '변경 리드 타임' : isZh ? '变更前置时间' : 'Lead Time for Changes',
      contribution: isKo ? 'Kiro Spec → 코드 자동 생성' : isZh ? 'Kiro Spec → 自动代码生成' : 'Kiro Spec → Auto Code Generation',
      method: isKo ? '개발 단계 가속' : isZh ? '加速开发阶段' : 'Accelerate development phase',
      icon: '⚡'
    },
    {
      metric: isKo ? '변경 실패율' : isZh ? '变更失败率' : 'Change Failure Rate',
      contribution: 'AI Quality Gates',
      method: isKo ? '배포 전 다중 검증' : isZh ? '部署前多层验证' : 'Multi-layer validation before deploy',
      icon: '🛡️'
    },
    {
      metric: isKo ? '서비스 복구 시간' : isZh ? '服务恢复时间' : 'Time to Restore Service',
      contribution: isKo ? 'AI Agent 자동 대응' : isZh ? 'AI 智能体自动响应' : 'AI Agent Auto-response',
      method: isKo ? '수동 진단 제거' : isZh ? '移除人工诊断' : 'Remove manual diagnosis',
      icon: '🔧'
    }
  ];

  const styles = {
    container: {
      maxWidth: '760px',
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
    },
    header: {
      background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
      color: 'white',
      padding: '1.5rem',
      borderRadius: '8px 8px 0 0'
    },
    title: {
      margin: '0 0 0.5rem 0',
      fontSize: '1.5rem',
      fontWeight: '600'
    },
    subtitle: {
      margin: 0,
      fontSize: '0.875rem',
      opacity: 0.9
    },
    section: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1.5rem',
      marginTop: '1.5rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    sectionTitle: {
      margin: '0 0 1.25rem 0',
      fontSize: '1.25rem',
      fontWeight: '600',
      color: '#111827',
      borderBottom: '2px solid #e5e7eb',
      paddingBottom: '0.75rem'
    },
    metricsGrid: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem'
    },
    metricCard: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.5fr',
      gap: '1rem',
      padding: '1rem',
      background: '#f9fafb',
      borderRadius: '6px',
      borderLeft: '4px solid',
      fontSize: '0.875rem',
      alignItems: 'center'
    },
    metricName: {
      fontWeight: '600',
      color: '#111827'
    },
    metricDescription: {
      color: '#6b7280',
      fontSize: '0.8125rem'
    },
    metricValue: {
      color: '#4b5563'
    },
    beforeValue: {
      color: '#9ca3af'
    },
    afterValue: {
      color: '#059669',
      fontWeight: '500'
    },
    improvement: {
      fontWeight: '600',
      color: '#059669',
      display: 'flex',
      alignItems: 'center',
      gap: '0.375rem'
    },
    improvementBar: {
      width: '3px',
      height: '14px',
      background: '#059669',
      borderRadius: '2px'
    },
    doraGrid: {
      display: 'grid',
      gap: '1rem'
    },
    doraCard: {
      display: 'grid',
      gridTemplateColumns: '0.5fr 2fr 2fr 2fr',
      gap: '1rem',
      padding: '1rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.875rem',
      alignItems: 'center',
      border: '1px solid #e5e7eb'
    },
    doraIcon: {
      fontSize: '1.5rem',
      textAlign: 'center'
    },
    doraMetric: {
      fontWeight: '600',
      color: '#111827'
    },
    doraContribution: {
      color: '#4b5563'
    },
    doraMethod: {
      color: '#6b7280',
      fontSize: '0.8125rem'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 1.5fr 1.5fr 1.5fr',
      gap: '1rem',
      padding: '0.75rem 1rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.75rem'
    },
    doraHeader: {
      display: 'grid',
      gridTemplateColumns: '0.5fr 2fr 2fr 2fr',
      gap: '1rem',
      padding: '0.75rem 1rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.75rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>📊 {isKo ? '측정 지표' : isZh ? '指标' : 'Metrics'}</h2>
        <p style={styles.subtitle}>{isKo ? 'AIDLC 도입 효과 측정' : isZh ? '衡量 AIDLC 采用效果' : 'Measuring AIDLC Adoption Impact'}</p>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{isKo ? '주요 측정 항목' : isZh ? '关键指标' : 'Key Metrics'}</h3>
        <div style={styles.tableHeader}>
          <div>{isKo ? '지표' : isZh ? '指标' : 'Metric'}</div>
          <div>{isKo ? '설명' : isZh ? '说明' : 'Description'}</div>
          <div>{isKo ? 'AIDLC 이전' : isZh ? 'AIDLC 之前' : 'Before AIDLC'}</div>
          <div>{isKo ? 'AIDLC 이후' : isZh ? 'AIDLC 之后' : 'After AIDLC'}</div>
          <div>{isKo ? '개선율' : isZh ? '改进率' : 'Improvement'}</div>
        </div>
        <div style={styles.metricsGrid}>
          {metrics.map((item, idx) => (
            <div
              key={idx}
              style={{
                ...styles.metricCard,
                borderLeftColor: item.color
              }}
            >
              <div style={styles.metricName}>{item.metric}</div>
              <div style={styles.metricDescription}>{item.description}</div>
              <div style={styles.beforeValue}>{item.before}</div>
              <div style={styles.afterValue}>{item.after}</div>
              <div style={styles.improvement}>
                <div style={styles.improvementBar} />
                {item.improvement}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.section}>
        <h3 style={styles.sectionTitle}>{isKo ? 'DORA 메트릭 매핑' : isZh ? 'DORA 指标映射' : 'DORA Metrics Mapping'}</h3>
        <div style={styles.doraHeader}>
          <div></div>
          <div>{isKo ? 'DORA 메트릭' : isZh ? 'DORA 指标' : 'DORA Metric'}</div>
          <div>{isKo ? 'AIDLC 기여' : isZh ? 'AIDLC 贡献' : 'AIDLC Contribution'}</div>
          <div>{isKo ? '개선 방법' : isZh ? '改进方法' : 'Improvement Method'}</div>
        </div>
        <div style={styles.doraGrid}>
          {doraMetrics.map((dora, idx) => (
            <div key={idx} style={styles.doraCard}>
              <div style={styles.doraIcon}>{dora.icon}</div>
              <div style={styles.doraMetric}>{dora.metric}</div>
              <div style={styles.doraContribution}>{dora.contribution}</div>
              <div style={styles.doraMethod}>{dora.method}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DetailedMetrics;
