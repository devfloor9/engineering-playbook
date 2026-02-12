import React from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';

const OperationPatternsComparison = () => {
  const {i18n} = useDocusaurusContext();
  const isKo = i18n.currentLocale === 'ko';
  const isZh = i18n.currentLocale === 'zh';

  const patterns = [
    {
      name: 'Prompt-Driven',
      color: '#2563eb',
      humanRole: isKo ? '매 단계 지시 (Human-in-the-Loop)' : isZh ? '每步指令（Human-in-the-Loop）' : 'Direct each step (Human-in-the-Loop)',
      responseStart: isKo ? '运营자가 알림 확인 후 AI에 지시' : isZh ? '运维人员确认告警后指示 AI' : 'Operator checks alert, then directs AI',
      dataCollection: isKo ? '프롬프트로 하나씩 요청' : isZh ? '通过提示逐个请求' : 'Request one by one via prompts',
      analysis: isKo ? '운영자가 결과를 보고 다음 지시' : isZh ? '运维人员查看结果后指示下一步' : 'Operator reviews results, directs next step',
      recovery: isKo ? '운영자 승인 후 AI가 실행' : isZh ? '运维人员批准后 AI 执行' : 'AI executes after operator approval',
      learning: isKo ? '운영자 개인 경험에 의존' : isZh ? '依赖运维人员个人经验' : 'Relies on operator personal experience',
      responseTime: isKo ? '분~시간' : isZh ? '分钟~小时' : 'Minutes~Hours',
      tools: 'Q Developer, ChatOps'
    },
    {
      name: 'Spec-Driven',
      color: '#7c3aed',
      humanRole: isKo ? 'Intent 정의 + 결과 검토' : isZh ? '定义意图 + 审查结果' : 'Define intent + Review results',
      responseStart: isKo ? '사전 정의된 파이프라인 트리거' : isZh ? '预定义流水线触发' : 'Pre-defined pipeline trigger',
      dataCollection: isKo ? 'Spec에 정의된 데이터 자동 수집' : isZh ? '自动收集 Spec 中定义的数据' : 'Auto-collect data defined in spec',
      analysis: isKo ? '사전 정의된 검증 로직 실행' : isZh ? '执行预定义验证逻辑' : 'Execute pre-defined validation logic',
      recovery: isKo ? 'GitOps로 선언적 롤백/변경' : isZh ? '通过 GitOps 声明式回滚/变更' : 'Declarative rollback/change via GitOps',
      learning: isKo ? 'Spec 버전 히스토리로 조직 지식화' : isZh ? '通过 Spec 版本历史组织知识' : 'Org knowledge via spec version history',
      responseTime: isKo ? '분' : isZh ? '分钟' : 'Minutes',
      tools: 'Kiro + GitOps + Argo CD'
    },
    {
      name: 'Agent-Driven',
      color: '#059669',
      humanRole: isKo ? '가드레일 설정 + 예외 처리 (Human-on-the-Loop)' : isZh ? '设置护栏 + 异常处理（Human-on-the-Loop）' : 'Set guardrails + Handle exceptions (Human-on-the-Loop)',
      responseStart: isKo ? 'Agent가 알림 수신 후 자동 시작' : isZh ? 'Agent 接收告警后自动启动' : 'Agent auto-starts after receiving alert',
      dataCollection: isKo ? 'MCP로 멀티소스 동시 수집' : isZh ? '通过 MCP 并发多源收集' : 'Concurrent multi-source collection via MCP',
      analysis: isKo ? 'AI가 근본 원인까지 자동 분석' : isZh ? 'AI 自动分析到根因' : 'AI auto-analyzes to root cause',
      recovery: isKo ? '가드레일 범위 내 자율 복구' : isZh ? '在护栏范围内自主恢复' : 'Autonomous recovery within guardrails',
      learning: isKo ? '결과 피드백 자동 학습' : isZh ? '从结果反馈自动学习' : 'Auto-learn from result feedback',
      responseTime: isKo ? '초~분' : isZh ? '秒~分钟' : 'Seconds~Minutes',
      tools: 'Kagent, Strands SOPs'
    }
  ];

  const rows = [
    { label: isKo ? '사람의 역할' : isZh ? '人的角色' : 'Human Role', key: 'humanRole' },
    { label: isKo ? '대응 시작' : isZh ? '响应启动' : 'Response Start', key: 'responseStart' },
    { label: isKo ? '데이터 수집' : isZh ? '数据收集' : 'Data Collection', key: 'dataCollection' },
    { label: isKo ? '분석' : isZh ? '分析' : 'Analysis', key: 'analysis' },
    { label: isKo ? '복구' : isZh ? '恢复' : 'Recovery', key: 'recovery' },
    { label: isKo ? '학습' : isZh ? '学习' : 'Learning', key: 'learning' },
    { label: isKo ? '대응 시간' : isZh ? '响应时间' : 'Response Time', key: 'responseTime' },
    { label: isKo ? '대표 도구' : isZh ? '代表工具' : 'Representative Tools', key: 'tools' }
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
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)',
        color: 'white',
        padding: '20px 24px',
        borderRadius: '8px 8px 0 0'
      }}>
        <div style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px' }}>
          {isKo ? '운영 패턴 비교: EKS 클러스터 이슈 대응 시나리오' : isZh ? '运维模式对比：EKS 集群问题响应场景' : 'Operation Pattern Comparison: EKS Cluster Issue Response'}
        </div>
        <div style={{ fontSize: '14px', opacity: 0.9 }}>
          Prompt-Driven · Spec-Driven · Agent-Driven
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
          gridTemplateColumns: '110px 1fr 1fr 1fr',
          borderBottom: '2px solid #e5e7eb'
        }}>
          <div style={{
            padding: '12px 14px',
            background: '#f8fafc',
            fontWeight: '600',
            fontSize: '12px',
            color: '#6b7280'
          }}>
            항목
          </div>
          {patterns.map((p) => (
            <div key={p.name} style={{
              padding: '12px 14px',
              background: `${p.color}08`,
              borderLeft: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '700',
                color: p.color
              }}>
                {p.name}
              </div>
            </div>
          ))}
        </div>

        {rows.map((row, idx) => (
          <div key={row.key} style={{
            display: 'grid',
            gridTemplateColumns: '110px 1fr 1fr 1fr',
            borderBottom: idx < rows.length - 1 ? '1px solid #f3f4f6' : 'none'
          }}>
            <div style={{
              padding: '10px 14px',
              background: '#f8fafc',
              fontSize: '12px',
              fontWeight: '600',
              color: '#374151',
              display: 'flex',
              alignItems: 'center'
            }}>
              {row.label}
            </div>
            {patterns.map((p) => (
              <div key={`${row.key}-${p.name}`} style={{
                padding: '10px 14px',
                fontSize: '12px',
                color: '#4b5563',
                borderLeft: '1px solid #f3f4f6',
                display: 'flex',
                alignItems: 'center'
              }}>
                {p[row.key]}
              </div>
            ))}
          </div>
        ))}

        <div style={{
          background: '#fffbeb',
          borderTop: '1px solid #fde68a',
          padding: '12px 16px',
          fontSize: '12px',
          color: '#92400e'
        }}>
          <strong>{isKo ? '실전 조합:' : isZh ? '实战组合:' : 'Real-world Combination:'}</strong> {isKo
            ? '세 패턴은 상호 보완적입니다. 새로운 장애를 Prompt-Driven으로 탐색한 뒤, 반복 패턴을 Spec-Driven으로 코드화하고, 최종적으로 Agent-Driven으로 자율화하는 점진적 성숙 과정을 거칩니다.'
            : isZh
            ? '三种模式相互补充。用 Prompt-Driven 探索新故障，用 Spec-Driven 编码重复模式，最后用 Agent-Driven 实现自动化，这是一个渐进式成熟过程。'
            : 'The three patterns are complementary. Explore new failures with Prompt-Driven, codify recurring patterns with Spec-Driven, and finally automate with Agent-Driven in a gradual maturity process.'}
        </div>
      </div>
    </div>
  );
};

export default OperationPatternsComparison;
