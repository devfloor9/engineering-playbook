import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const MaturityTable = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const levels = [
    {
      name: isKo ? '반응형' : isZh ? '被动型' : 'Reactive',
      nameEn: 'Reactive',
      color: '#dc2626',
      characteristics: isKo ? [
        '장애 후 대응',
        '수동 분석',
        '정적 임계값 알림'
      ] : isZh ? [
        '事件后响应',
        '手动分析',
        '静态阈值告警'
      ] : [
        'Post-incident response',
        'Manual analysis',
        'Static threshold alerts'
      ],
      tools: [
        'CloudWatch Alarms',
        'EventBridge',
        isKo ? 'Lambda 런북' : isZh ? 'Lambda 运维手册' : 'Lambda runbooks'
      ],
      kpis: isKo ? [
        'MTTR 4시간',
        'MTTD 30분',
        '알림 500건/일'
      ] : isZh ? [
        'MTTR 4 小时',
        'MTTD 30 分钟',
        '告警 500 条/天'
      ] : [
        'MTTR 4 hours',
        'MTTD 30 min',
        '500 alerts/day'
      ]
    },
    {
      name: isKo ? '예측형' : isZh ? '预测型' : 'Predictive',
      nameEn: 'Predictive',
      color: '#3b82f6',
      characteristics: isKo ? [
        'ML 이상 탐지',
        '선제적 스케일링',
        '패턴 기반 분석'
      ] : isZh ? [
        'ML 异常检测',
        '主动扩缩容',
        '基于模式分析'
      ] : [
        'ML anomaly detection',
        'Proactive scaling',
        'Pattern-based analysis'
      ],
      tools: [
        'DevOps Guru',
        'CloudWatch AI',
        'Prophet',
        'Karpenter'
      ],
      kpis: isKo ? [
        'MTTR 1시간',
        'MTTD 5분',
        '알림 100건/일'
      ] : isZh ? [
        'MTTR 1 小时',
        'MTTD 5 分钟',
        '告警 100 条/天'
      ] : [
        'MTTR 1 hour',
        'MTTD 5 min',
        '100 alerts/day'
      ]
    },
    {
      name: isKo ? '자율형' : isZh ? '自主型' : 'Autonomous',
      nameEn: 'Autonomous',
      color: '#059669',
      characteristics: isKo ? [
        'AI 자율 대응',
        '자가 치유',
        '지속 학습'
      ] : isZh ? [
        'AI 自主响应',
        '自愈',
        '持续学习'
      ] : [
        'AI autonomous response',
        'Self-healing',
        'Continuous learning'
      ],
      tools: [
        'Kiro+MCP',
        'Kagent',
        'Strands',
        'Q Developer'
      ],
      kpis: isKo ? [
        'MTTR 15분',
        'MTTD 1분',
        '알림 20건/일'
      ] : isZh ? [
        'MTTR 15 分钟',
        'MTTD 1 分钟',
        '告警 20 条/天'
      ] : [
        'MTTR 15 min',
        'MTTD 1 min',
        '20 alerts/day'
      ]
    }
  ];

  const containerStyle = {
    maxWidth: '760px',
    margin: '2rem auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #581c87 0%, #7e22ce 100%)',
    color: '#ffffff',
    padding: '1.5rem',
    textAlign: 'center'
  };

  const titleStyle = {
    margin: '0 0 0.5rem 0',
    fontSize: '1.5rem',
    fontWeight: '700'
  };

  const subtitleStyle = {
    margin: 0,
    fontSize: '0.95rem',
    opacity: 0.95,
    fontWeight: '400'
  };

  const contentStyle = {
    padding: '1.5rem'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '1.5rem'
  };

  const cardStyle = (color) => ({
    borderLeft: `4px solid ${color}`,
    backgroundColor: '#f9fafb',
    borderRadius: '8px',
    padding: '1.25rem',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
  });

  const badgeStyle = (color) => ({
    display: 'inline-block',
    backgroundColor: color,
    color: '#ffffff',
    padding: '0.375rem 0.875rem',
    borderRadius: '6px',
    fontSize: '0.875rem',
    fontWeight: '600',
    marginBottom: '1rem'
  });

  const sectionStyle = {
    marginBottom: '1.25rem'
  };

  const sectionTitleStyle = {
    fontSize: '0.8125rem',
    fontWeight: '700',
    color: '#111827',
    marginBottom: '0.625rem',
    textTransform: 'uppercase',
    letterSpacing: '0.025em'
  };

  const listStyle = {
    listStyle: 'none',
    padding: 0,
    margin: 0
  };

  const listItemStyle = {
    fontSize: '0.875rem',
    color: '#374151',
    lineHeight: '1.6',
    marginBottom: '0.5rem',
    paddingLeft: '1rem',
    position: 'relative'
  };

  const bulletStyle = {
    position: 'absolute',
    left: 0,
    top: '0.5em',
    width: '4px',
    height: '4px',
    borderRadius: '50%',
    backgroundColor: '#9ca3af'
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <h2 style={titleStyle}>🎯 {isKo ? '운영 성숙도 모델' : isZh ? '运维成熟度模型' : 'Operations Maturity Model'}</h2>
        <p style={subtitleStyle}>{isKo ? '반응형 → 예측형 → 자율형 진화' : isZh ? '被动型 → 预测型 → 自主型演进' : 'Reactive → Predictive → Autonomous Evolution'}</p>
      </div>
      <div style={contentStyle}>
        <div style={gridStyle}>
          {levels.map((level, index) => (
            <div key={index} style={cardStyle(level.color)}>
              <div style={badgeStyle(level.color)}>
                {level.name} ({level.nameEn})
              </div>

              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>{isKo ? '특성' : isZh ? '特征' : 'Characteristics'}</div>
                <ul style={listStyle}>
                  {level.characteristics.map((item, idx) => (
                    <li key={idx} style={listItemStyle}>
                      <span style={bulletStyle}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>{isKo ? '도구' : isZh ? '工具' : 'Tools'}</div>
                <ul style={listStyle}>
                  {level.tools.map((item, idx) => (
                    <li key={idx} style={listItemStyle}>
                      <span style={bulletStyle}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div style={sectionStyle}>
                <div style={sectionTitleStyle}>KPI</div>
                <ul style={listStyle}>
                  {level.kpis.map((item, idx) => (
                    <li key={idx} style={listItemStyle}>
                      <span style={bulletStyle}></span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MaturityTable;
