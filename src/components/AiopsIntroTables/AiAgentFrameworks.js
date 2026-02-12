import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AiAgentFrameworks = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const frameworks = [
    {
      name: 'Amazon Q Developer',
      color: '#2563eb',
      nature: isKo ? 'AI 어시스턴트 — CloudWatch Investigations, 코드 리뷰, 보안 스캔' : isZh ? 'AI 助手 — CloudWatch Investigations、代码审查、安全扫描' : 'AI Assistant — CloudWatch Investigations, code review, security scan',
      maturity: 'GA',
      maturityColor: '#059669',
      status: isKo ? '프로덕션 레디' : isZh ? '生产就绪' : 'Production Ready'
    },
    {
      name: 'Strands Agents SDK',
      color: '#7c3aed',
      nature: isKo ? 'AWS 오픈소스 Agent 프레임워크 — Agent SOPs로 자연어 워크플로우 정의' : isZh ? 'AWS 开源 Agent 框架 — 通过 Agent SOPs 定义自然语言工作流' : 'AWS OSS Agent framework — Define natural language workflows via Agent SOPs',
      maturity: isKo ? '오픈소스' : isZh ? '开源' : 'Open Source',
      maturityColor: '#d97706',
      status: isKo ? 'AWS 내부 활용' : isZh ? 'AWS 内部使用' : 'AWS Internal Use'
    },
    {
      name: 'Kagent',
      color: '#059669',
      nature: isKo ? 'CNCF 커뮤니티 K8s 네이티브 AI Agent — CRD 기반, kmcp로 MCP 통합' : isZh ? 'CNCF 社区 K8s 原生 AI Agent — 基于 CRD，通过 kmcp 集成 MCP' : 'CNCF community K8s-native AI Agent — CRD-based, MCP integration via kmcp',
      maturity: isKo ? '초기 단계' : isZh ? '早期阶段' : 'Early Stage',
      maturityColor: '#6b7280',
      status: isKo ? '실험적' : isZh ? '实验性' : 'Experimental'
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
        background: 'linear-gradient(135deg, #1e1b4b 0%, #4c1d95 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? 'AI Agent 프레임워크 비교' : isZh ? 'AI Agent 框架对比' : 'AI Agent Framework Comparison'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          {isKo ? '자율 운영을 위한 세 가지 프레임워크' : isZh ? '自主运维的三种框架' : 'Three frameworks for autonomous operations'}
        </div>
      </div>

      <div style={{
        background: 'white',
        border: '1px solid #e5e7eb',
        borderTop: 'none',
        borderRadius: '0 0 8px 8px',
        overflow: 'hidden'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '160px 1fr 120px',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '도구' : isZh ? '工具' : 'Tool'}
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '성격' : isZh ? '性质' : 'Nature'}
          </div>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            borderLeft: '1px solid #e5e7eb',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            {isKo ? '성숙도' : isZh ? '成熟度' : 'Maturity'}
          </div>
        </div>

        {frameworks.map((fw, idx) => (
          <div key={fw.name} style={{
            display: 'grid',
            gridTemplateColumns: '160px 1fr 120px',
            borderBottom: idx < frameworks.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '12px 14px',
              background: `${fw.color}08`,
              fontSize: '13px',
              fontWeight: '700',
              color: fw.color,
              display: 'flex',
              alignItems: 'center'
            }}>
              {fw.name}
            </div>
            <div style={{
              padding: '12px 14px',
              fontSize: '12px',
              color: '#4b5563',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center'
            }}>
              {fw.nature}
            </div>
            <div style={{
              padding: '12px 14px',
              borderLeft: '1px solid #f3f4f6',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              gap: '4px'
            }}>
              <span style={{
                background: `${fw.maturityColor}15`,
                color: fw.maturityColor,
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '600',
                textAlign: 'center'
              }}>
                {fw.maturity}
              </span>
              <span style={{
                fontSize: '10px',
                color: '#6b7280',
                textAlign: 'center'
              }}>
                {fw.status}
              </span>
            </div>
          </div>
        ))}

        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>{isKo ? '권장 접근:' : isZh ? '推荐方法：' : 'Recommended Approach:'}</strong> {isKo
            ? 'Q Developer(GA)로 시작 → Strands(OSS)로 워크플로우 자동화 → Kagent(초기)로 K8s 네이티브 자율 운영 탐색'
            : isZh ? '从 Q Developer (GA) 开始 → 使用 Strands (OSS) 自动化工作流 → 使用 Kagent (早期) 探索 K8s 原生自主运维'
            : 'Start with Q Developer (GA) → Automate workflows with Strands (OSS) → Explore K8s-native autonomous ops with Kagent (early)'}
        </div>
      </div>
    </div>
  );
};

export default AiAgentFrameworks;
