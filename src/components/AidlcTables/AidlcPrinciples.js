import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const AidlcPrinciples = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const principles = [
    {
      name: 'Reimagine Rather Than Retrofit',
      description: isKo ? '기존 SDLC/Agile에 AI를 끼워 넣지 않고, 첫 원칙(First Principles)에서 재구성. AI의 빠른 반복 주기(시간/일 단위)에 맞는 새로운 방법론' : isZh ? '从第一性原理重构，而非将 AI 硬塞入现有 SDLC/Agile。符合 AI 快速迭代周期（小时/天级）的全新方法论' : 'Reconstruct from first principles rather than retrofitting AI into existing SDLC/Agile. New methodology aligned with AI\'s rapid iteration cycle (hour/day granularity)',
      icon: '🔄'
    },
    {
      name: 'Reverse the Conversation Direction',
      description: isKo ? 'AI가 대화를 시작하고 주도하며, 사람은 검증자 역할. Google Maps 비유 — 사람이 목적지 설정, AI가 경로 제시' : isZh ? 'AI 发起并主导对话，人类担任验证者。Google Maps 类比 — 人类设定目的地，AI 建议路线' : 'AI initiates and leads conversations, with humans as validators. Google Maps analogy — humans set destination, AI suggests routes',
      icon: '🔀'
    },
    {
      name: 'Integration of Design Techniques',
      description: isKo ? 'DDD, BDD, TDD를 방법론 핵심에 통합. Scrum처럼 선택사항이 아닌 AI-DLC의 내장 요소' : isZh ? '将 DDD、BDD、TDD 集成到方法论核心。AI-DLC 的内置元素，而非像 Scrum 中的可选项' : 'Integrate DDD, BDD, TDD into methodology core. Built-in elements of AI-DLC, not optional like in Scrum',
      icon: '🏗️'
    },
    {
      name: 'Align with AI Capability',
      description: isKo ? 'AI-Driven 패러다임 채택 — AI-Assisted(보조)를 넘어 AI가 주도하되, 사람이 최종 검증·의사결정·감독 유지' : isZh ? '采用 AI 驱动范式 — 超越 AI 辅助，AI 主导而人类保留最终验证、决策和监督' : 'Adopt AI-Driven paradigm — beyond AI-Assisted, AI leads while humans retain final validation, decision-making, and oversight',
      icon: '🎯'
    },
    {
      name: 'Cater to Complex Systems',
      description: isKo ? '높은 아키텍처 복잡도, 다수의 트레이드오프, 확장성·통합 요구사항을 가진 시스템 대상. 단순 시스템은 Low-code/No-code가 적합' : isZh ? '针对具有高架构复杂度、多种权衡、可扩展性和集成需求的系统。简单系统更适合低代码/无代码' : 'Target systems with high architectural complexity, multiple trade-offs, scalability and integration requirements. Simple systems better suited for Low-code/No-code',
      icon: '🏢'
    },
    {
      name: 'Retain Human Symbiosis',
      description: isKo ? '사람 검증과 리스크 관리에 필수적인 산출물(User Story, Risk Register 등) 유지. 실시간 사용에 최적화' : isZh ? '保留对人工验证和风险管理至关重要的产出物（用户故事、风险登记册等）。针对实时使用优化' : 'Maintain artifacts essential for human validation and risk management (User Story, Risk Register, etc.). Optimized for real-time use',
      icon: '🤝'
    },
    {
      name: 'Facilitate Transition',
      description: isKo ? '기존 실무자가 하루 만에 적응할 수 있도록 친숙한 용어 관계 유지. Sprint→Bolt 등 연상 학습 활용' : isZh ? '维持熟悉的术语关系，使现有从业者一天内即可适应。利用联想学习（Sprint→Bolt 等）' : 'Maintain familiar terminology relationships for one-day practitioner adaptation. Leverage associative learning (Sprint→Bolt, etc.)',
      icon: '🚀'
    },
    {
      name: 'Streamline Responsibilities',
      description: isKo ? 'AI가 태스크 분해·의사결정을 수행하여 개발자가 전문화 사일로(프론트/백/DevOps)를 초월. 최소 역할 원칙' : isZh ? 'AI 执行任务分解和决策，使开发者超越专业化孤岛（前端/后端/DevOps）。最小化角色原则' : 'AI performs task decomposition and decision-making, enabling developers to transcend specialization silos (frontend/backend/DevOps). Minimal roles principle',
      icon: '👤'
    },
    {
      name: 'Minimize Stages, Maximize Flow',
      description: isKo ? '핸드오프와 전환을 최소화하고 연속 반복 흐름 구현. 사람 검증은 Loss Function 역할로 낭비 조기 차단' : isZh ? '最小化交接和转换，实现连续迭代流程。人工验证作为 Loss Function 早期捕获浪费' : 'Minimize handoffs and transitions, implement continuous iterative flow. Human validation as Loss Function to catch waste early',
      icon: '⚡'
    },
    {
      name: 'No Hard-Wired Workflows',
      description: isKo ? '개발 경로(신규/리팩터링/결함 수정)마다 고정된 워크플로우를 규정하지 않고, AI가 상황에 맞는 Level 1 Plan을 제안' : isZh ? '不为每个开发路径（新建/重构/缺陷修复）规定固定工作流。AI 提出符合上下文的 Level 1 计划' : 'No prescribed workflows per development path (new/refactoring/bug fix). AI proposes context-appropriate Level 1 Plan',
      icon: '🌊'
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
    principlesGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    principleCard: {
      background: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'transform 0.2s, box-shadow 0.2s'
    },
    principleIcon: {
      fontSize: '2rem',
      marginBottom: '0.75rem',
      display: 'block'
    },
    principleName: {
      margin: '0 0 0.5rem 0',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#111827'
    },
    principleDescription: {
      margin: 0,
      fontSize: '0.875rem',
      color: '#6b7280',
      lineHeight: '1.5'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>🎯 {isKo ? 'AIDLC의 핵심 원칙' : isZh ? 'AIDLC 的核心原则' : 'AIDLC Core Principles'}</h2>
        <p style={styles.subtitle}>{isKo ? 'AWS AI-DLC 방법론의 10대 핵심 원칙' : isZh ? 'AWS AI-DLC 方法论的十大核心原则' : 'Ten Core Principles of AWS AI-DLC Methodology'}</p>
      </div>
      <div style={styles.principlesGrid}>
        {principles.map((principle, idx) => (
          <div key={idx} style={styles.principleCard}>
            <span style={styles.principleIcon}>{principle.icon}</span>
            <h3 style={styles.principleName}>{principle.name}</h3>
            <p style={styles.principleDescription}>{principle.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AidlcPrinciples;
