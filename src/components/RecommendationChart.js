import React from 'react';
import { useColorMode } from '@docusaurus/theme-common';

const i18n = {
  en: {
    tableTitle: 'Workload-Based Recommendations',
    workloadCol: 'Workload Characteristics',
    recommendedCol: 'Recommended',
    rationaleCol: 'Rationale',
    evaluationTitle: 'Scenario Evaluation Summary',
    // Table rows
    row1Workload: 'Small, Simple (<100 Services)',
    row1Recommended: 'A: VPC CNI',
    row1Rationale: 'Minimal complexity',
    row2Workload: 'UDP-heavy (streaming, gaming)',
    row2Recommended: 'E: ENI+Tuning',
    row2Rationale: '0.03% UDP loss',
    row3Workload: 'Network Policies Required',
    row3Recommended: 'C or D',
    row3Rationale: 'L3/L4/L7 policies',
    row4Workload: 'Large Scale (500+ Services)',
    row4Recommended: 'D: Cilium ENI',
    row4Rationale: 'eBPF O(1) vs iptables +16%/conn @1000svc',
    row5Workload: 'Latency Sensitive (Finance, Real-time)',
    row5Recommended: 'E: ENI+Tuning',
    row5Rationale: '36% RTT improvement',
    row6Workload: 'IP Constraints',
    row6Recommended: 'C: kp-less',
    row6Rationale: 'VXLAN Overlay',
    row7Workload: 'Multi-tenant, Observability',
    row7Recommended: 'D + Hubble',
    row7Rationale: 'ENI + visibility',
    // Evaluation cards
    cardATitle: 'A: VPC CNI',
    cardAUseCase: 'Dev/Staging',
    cardAComplexity: 'Complexity: Low',
    cardAPerformance: 'Performance: Baseline',
    cardDTitle: 'D: Cilium ENI',
    cardDUseCase: 'General Production',
    cardDComplexity: 'Complexity: Medium',
    cardDPerformance: 'Performance: High',
    cardETitle: 'E: ENI+Tuning',
    cardEUseCase: 'High-Perf/Latency-Sensitive',
    cardEComplexity: 'Complexity: High',
    cardEPerformance: 'Performance: Maximum',
    cardCTitle: 'C: kp-less',
    cardCUseCase: 'Network Policies/IP Constraints',
    cardCComplexity: 'Complexity: Medium',
    cardCPerformance: 'Performance: Moderate-High'
  },
  ko: {
    tableTitle: '워크로드 기반 권장사항',
    workloadCol: '워크로드 특성',
    recommendedCol: '권장 시나리오',
    rationaleCol: '근거',
    evaluationTitle: '시나리오 평가 요약',
    // Table rows
    row1Workload: '소규모, 단순 (<100 Services)',
    row1Recommended: 'A: VPC CNI',
    row1Rationale: '운영 복잡도 최소',
    row2Workload: 'UDP 스트리밍, 비디오',
    row2Recommended: 'E: ENI+Tuning',
    row2Rationale: '0.03% UDP loss',
    row3Workload: '네트워크 정책 필요',
    row3Recommended: 'C or D',
    row3Rationale: 'L3/L4/L7 policies',
    row4Workload: '고성능, 대규모 (500+ Services)',
    row4Recommended: 'D: Cilium ENI',
    row4Rationale: 'eBPF O(1) vs iptables 연결당 +16% @1000svc',
    row5Workload: '지연 민감 (금융, 실시간)',
    row5Recommended: 'E: ENI+Tuning',
    row5Rationale: '36% RTT improvement',
    row6Workload: 'IP 주소 제약 환경',
    row6Recommended: 'C: kp-less',
    row6Rationale: 'VXLAN Overlay',
    row7Workload: '멀티테넌트, 관찰성',
    row7Recommended: 'D + Hubble',
    row7Rationale: 'ENI + visibility',
    // Evaluation cards
    cardATitle: 'A: VPC CNI',
    cardAUseCase: '개발/스테이징',
    cardAComplexity: '복잡도: 낮음',
    cardAPerformance: '성능: 기준선',
    cardDTitle: 'D: Cilium ENI',
    cardDUseCase: '일반 프로덕션',
    cardDComplexity: '복잡도: 중간',
    cardDPerformance: '성능: 높음',
    cardETitle: 'E: ENI+Tuning',
    cardEUseCase: '고성능/지연 민감',
    cardEComplexity: '복잡도: 높음',
    cardEPerformance: '성능: 최고',
    cardCTitle: 'C: kp-less',
    cardCUseCase: '네트워크 정책/IP 제약',
    cardCComplexity: '복잡도: 중간',
    cardCPerformance: '성능: 보통~높음'
  }
};

export default function RecommendationChart({ locale = 'en' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const theme = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#94a3b8' : '#6b7280',
    bgSurface: isDark ? '#1e293b' : '#ffffff',
    bgHeader: isDark ? '#0f172a' : '#f9fafb',
    border: isDark ? '#334155' : '#e2e8f0'
  };
  const t = i18n[locale] || i18n.en;

  const tableData = [
    {
      workload: t.row1Workload,
      recommended: t.row1Recommended,
      rationale: t.row1Rationale,
      badgeColor: '#e2e8f0',
      badgeTextColor: '#1e293b'
    },
    {
      workload: t.row2Workload,
      recommended: t.row2Recommended,
      rationale: t.row2Rationale,
      badgeColor: '#d1fae5',
      badgeTextColor: '#065f46'
    },
    {
      workload: t.row3Workload,
      recommended: t.row3Recommended,
      rationale: t.row3Rationale,
      badgeColor: '#ede9fe',
      badgeTextColor: '#5b21b6'
    },
    {
      workload: t.row4Workload,
      recommended: t.row4Recommended,
      rationale: t.row4Rationale,
      badgeColor: '#dbeafe',
      badgeTextColor: '#1e3a8a'
    },
    {
      workload: t.row5Workload,
      recommended: t.row5Recommended,
      rationale: t.row5Rationale,
      badgeColor: '#d1fae5',
      badgeTextColor: '#065f46'
    },
    {
      workload: t.row6Workload,
      recommended: t.row6Recommended,
      rationale: t.row6Rationale,
      badgeColor: '#e0f2fe',
      badgeTextColor: '#075985'
    },
    {
      workload: t.row7Workload,
      recommended: t.row7Recommended,
      rationale: t.row7Rationale,
      badgeColor: '#dbeafe',
      badgeTextColor: '#1e3a8a'
    }
  ];

  const evaluationCards = [
    {
      title: t.cardATitle,
      useCase: t.cardAUseCase,
      complexity: t.cardAComplexity,
      performance: t.cardAPerformance,
      borderColor: '#e2e8f0',
      gradient: null
    },
    {
      title: t.cardDTitle,
      useCase: t.cardDUseCase,
      complexity: t.cardDComplexity,
      performance: t.cardDPerformance,
      borderColor: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
    },
    {
      title: t.cardETitle,
      useCase: t.cardEUseCase,
      complexity: t.cardEComplexity,
      performance: t.cardEPerformance,
      borderColor: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
    },
    {
      title: t.cardCTitle,
      useCase: t.cardCUseCase,
      complexity: t.cardCComplexity,
      performance: t.cardCPerformance,
      borderColor: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
    }
  ];

  return (
    <div style={{
      width: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Section A: Recommendations Table */}
      <div style={{ marginBottom: '32px' }}>
        <div style={{
          border: '1px solid ' + theme.border,
          borderRadius: '8px',
          overflowX: 'auto',
          overflowY: 'hidden'
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'collapse'
          }}>
            <thead>
              <tr style={{
                background: isDark ? '#0f172a' : 'linear-gradient(135deg, #1e293b, #334155)'
              }}>
                <th style={{
                  color: 'white',
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderBottom: '1px solid ' + theme.border
                }}>
                  {t.workloadCol}
                </th>
                <th style={{
                  color: 'white',
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderBottom: '1px solid ' + theme.border
                }}>
                  {t.recommendedCol}
                </th>
                <th style={{
                  color: 'white',
                  padding: '12px 16px',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderBottom: '1px solid ' + theme.border
                }}>
                  {t.rationaleCol}
                </th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, idx) => (
                <tr key={idx} style={{
                  borderBottom: idx < tableData.length - 1 ? '1px solid ' + theme.border : 'none'
                }}>
                  <td style={{
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: isDark ? '#e2e8f0' : '#334155'
                  }}>
                    {row.workload}
                  </td>
                  <td style={{
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}>
                    <span style={{
                      backgroundColor: row.badgeColor === '#e2e8f0' ? (isDark ? '#334155' : '#e2e8f0') : row.badgeColor,
                      color: row.badgeColor === '#e2e8f0' ? (isDark ? '#e2e8f0' : '#1e293b') : row.badgeTextColor,
                      padding: '4px 10px',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '600',
                      display: 'inline-block'
                    }}>
                      {row.recommended}
                    </span>
                  </td>
                  <td style={{
                    padding: '12px 16px',
                    fontSize: '14px',
                    color: theme.textSecondary
                  }}>
                    {row.rationale}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Section B: Evaluation Cards */}
      <div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '16px'
        }}>
          {evaluationCards.map((card, idx) => (
            <div key={idx} style={{
              border: `2px solid ${card.borderColor}`,
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: isDark ? '#1e293b' : 'white'
            }}>
              {card.gradient && (
                <div style={{
                  background: card.gradient,
                  height: '6px'
                }} />
              )}
              <div style={{
                padding: '16px'
              }}>
                <div style={{
                  fontSize: '16px',
                  fontWeight: '700',
                  color: isDark ? '#f1f5f9' : '#1e293b',
                  marginBottom: '8px'
                }}>
                  {card.title}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: isDark ? '#94a3b8' : '#475569',
                  marginBottom: '12px',
                  fontWeight: '500'
                }}>
                  {card.useCase}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.textSecondary,
                  marginBottom: '4px'
                }}>
                  {card.complexity}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.textSecondary
                }}>
                  {card.performance}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
