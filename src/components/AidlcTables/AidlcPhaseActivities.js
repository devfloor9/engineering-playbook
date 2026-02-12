import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AidlcPhaseActivities = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const phases = [
    {
      name: isKo ? 'Inception 단계' : isZh ? 'Inception 阶段' : 'Inception Phase',
      color: '#3b82f6',
      activities: [
        { activity: isKo ? '요구사항 분석' : isZh ? '需求分析' : 'Requirements Analysis', tools: 'Kiro, Q Developer', outputs: 'requirements.md' },
        { activity: isKo ? '아키텍처 설계' : isZh ? '架构设计' : 'Architecture Design', tools: 'Kiro, Claude', outputs: 'design.md' },
        { activity: isKo ? '기술 스택 결정' : isZh ? '技术栈选择' : 'Tech Stack Selection', tools: isKo ? 'Kiro (MCP 기반 AWS 서비스 탐색)' : isZh ? 'Kiro（基于 MCP 的 AWS 服务发现）' : 'Kiro (MCP-based AWS Service Discovery)', outputs: isKo ? '기술 스택 문서' : isZh ? '技术栈文档' : 'Tech Stack Document' },
        { activity: isKo ? '비용 추정' : isZh ? '成本估算' : 'Cost Estimation', tools: 'Cost Analysis MCP', outputs: isKo ? '비용 산정서' : isZh ? '成本估算书' : 'Cost Estimate' }
      ]
    },
    {
      name: isKo ? 'Construction 단계' : isZh ? 'Construction 阶段' : 'Construction Phase',
      color: '#059669',
      activities: [
        { activity: isKo ? '태스크 분해' : isZh ? '任务分解' : 'Task Decomposition', tools: 'Kiro', outputs: 'tasks.md' },
        { activity: isKo ? '코드 생성' : isZh ? '代码生成' : 'Code Generation', tools: 'Kiro, Q Developer, Copilot', outputs: isKo ? '소스 코드' : isZh ? '源代码' : 'Source Code' },
        { activity: isKo ? '코드 리뷰' : isZh ? '代码审查' : 'Code Review', tools: 'Q Developer (Security Scan)', outputs: isKo ? '리뷰 코멘트' : isZh ? '审查意见' : 'Review Comments' },
        { activity: isKo ? '테스트 생성' : isZh ? '测试生成' : 'Test Generation', tools: 'Kiro, Q Developer', outputs: isKo ? '테스트 코드' : isZh ? '测试代码' : 'Test Code' },
        { activity: isKo ? 'IaC 생성' : isZh ? 'IaC 生成' : 'IaC Generation', tools: 'Kiro + AWS MCP', outputs: 'Terraform, Helm' }
      ]
    },
    {
      name: isKo ? 'Operations 단계' : isZh ? 'Operations 阶段' : 'Operations Phase',
      color: '#8b5cf6',
      activities: [
        { activity: isKo ? 'GitOps 배포' : isZh ? 'GitOps 部署' : 'GitOps Deployment', tools: 'Managed Argo CD', outputs: isKo ? '자동 배포' : isZh ? '自动部署' : 'Automated Deployment' },
        { activity: isKo ? '관찰성 분석' : isZh ? '可观测性分析' : 'Observability Analysis', tools: 'AMP/AMG + CloudWatch AI', outputs: isKo ? '대시보드, 알림' : isZh ? '仪表板、告警' : 'Dashboards, Alerts' },
        { activity: isKo ? '이상 탐지' : isZh ? '异常检测' : 'Anomaly Detection', tools: 'DevOps Guru, CloudWatch', outputs: isKo ? '인사이트' : isZh ? '洞察' : 'Insights' },
        { activity: isKo ? '자동 대응' : isZh ? '自动响应' : 'Automated Response', tools: 'Kagent, Strands, Q Developer', outputs: isKo ? '자동 복구' : isZh ? '自动修复' : 'Auto Remediation' },
        { activity: isKo ? '인프라 관리' : isZh ? '基础设施管理' : 'Infrastructure Management', tools: 'ACK + KRO', outputs: isKo ? 'K8s CRD 기반 관리' : isZh ? '基于 K8s CRD 的管理' : 'K8s CRD-based Management' }
      ]
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
      background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
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
    phasesContainer: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem',
      marginTop: '1.5rem'
    },
    phaseSection: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    },
    phaseHeader: {
      padding: '1rem 1.25rem',
      color: 'white',
      fontSize: '1.125rem',
      fontWeight: '600'
    },
    activitiesTable: {
      padding: '1.25rem'
    },
    tableHeader: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 2fr',
      gap: '1rem',
      padding: '0.75rem',
      background: '#f9fafb',
      borderRadius: '6px',
      fontSize: '0.75rem',
      fontWeight: '600',
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      marginBottom: '0.5rem'
    },
    activityRow: {
      display: 'grid',
      gridTemplateColumns: '2fr 2fr 2fr',
      gap: '1rem',
      padding: '0.875rem 0.75rem',
      borderBottom: '1px solid #f3f4f6',
      fontSize: '0.875rem',
      lineHeight: '1.5'
    },
    activityCell: {
      color: '#374151'
    },
    activityName: {
      fontWeight: '500',
      color: '#111827'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🔨 {isKo ? 'AIDLC 단계별 활동' : isZh ? 'AIDLC 各阶段活动' : 'AIDLC Phase Activities'}</h2>
        <p style={styles.subtitle}>{isKo ? '각 단계의 주요 활동, AI 도구, 산출물' : isZh ? '各阶段的主要活动、AI 工具和产出物' : 'Key activities, AI tools, and outputs for each phase'}</p>
      </div>
      <div style={styles.phasesContainer}>
        {phases.map((phase, idx) => (
          <div key={idx} style={styles.phaseSection}>
            <div style={{
              ...styles.phaseHeader,
              background: `linear-gradient(135deg, ${phase.color} 0%, ${phase.color}dd 100%)`
            }}>
              {phase.name}
            </div>
            <div style={styles.activitiesTable}>
              <div style={styles.tableHeader}>
                <div>{isKo ? '활동' : isZh ? '活动' : 'Activity'}</div>
                <div>{isKo ? 'AI 도구' : isZh ? 'AI 工具' : 'AI Tools'}</div>
                <div>{isKo ? '산출물' : isZh ? '产出物' : 'Outputs'}</div>
              </div>
              {phase.activities.map((activity, activityIdx) => (
                <div key={activityIdx} style={styles.activityRow}>
                  <div style={{...styles.activityCell, ...styles.activityName}}>
                    {activity.activity}
                  </div>
                  <div style={styles.activityCell}>
                    {activity.tools}
                  </div>
                  <div style={styles.activityCell}>
                    {activity.outputs}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AidlcPhaseActivities;
