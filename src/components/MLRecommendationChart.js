import { useColorMode } from '@docusaurus/theme-common';

const i18n = {
  en: {
    workloadCol: "Workload Characteristics",
    recommendedCol: "Recommended",
    rationaleCol: "Rationale",
    evaluationTitle: "Scenario Evaluation Summary",
    // Table rows
    row1Workload: "Dev/Staging, Small Scale",
    row1Recommended: "E: inf2",
    row1Rationale: "Lowest cost $0.28/1M tokens",
    row2Workload: "Latency-Sensitive (Finance, Real-time)",
    row2Recommended: "A: p5/H100",
    row2Rationale: "120ms TTFT, 8ms ITL",
    row3Workload: "General Production",
    row3Recommended: "D: trn2",
    row3Rationale: "Best perf/cost ratio, 83% H100 speed",
    row4Workload: "Large-Scale Batch Processing",
    row4Recommended: "D: trn2",
    row4Rationale: "High throughput at 41% cost",
    row5Workload: "Budget-Constrained Production",
    row5Recommended: "E: inf2",
    row5Rationale: "67% cost savings vs H100",
    row6Workload: "Maverick (400B) Serving",
    row6Recommended: "A: p5/H100 or D: trn2",
    row6Rationale: "Sufficient memory for 400B MoE",
    row7Workload: "Multi-Model Serving",
    row7Recommended: "C: g6e/L40S",
    row7Rationale: "48GB/GPU, good for multiple small models",
    // Evaluation cards
    cardATitle: "A: p5/H100",
    cardAUseCase: "Latency-Sensitive/Max Performance",
    cardAComplexity: "Complexity: Low",
    cardAPerformance: "Performance: Maximum",
    cardACost: "Cost: Very High",
    cardDTitle: "D: trn2",
    cardDUseCase: "General Production",
    cardDComplexity: "Complexity: Medium (Neuron SDK)",
    cardDPerformance: "Performance: High",
    cardDCost: "Cost: Low",
    cardETitle: "E: inf2",
    cardEUseCase: "Cost-Optimized/Dev/Staging",
    cardEComplexity: "Complexity: Medium (Neuron SDK)",
    cardEPerformance: "Performance: Moderate-High",
    cardECost: "Cost: Lowest",
    cardCTitle: "C: g6e/L40S",
    cardCUseCase: "Multi-Model/Budget GPU",
    cardCComplexity: "Complexity: Low",
    cardCPerformance: "Performance: Moderate",
    cardCCost: "Cost: Medium"
  },
  ko: {
    workloadCol: "워크로드 특성",
    recommendedCol: "권장 시나리오",
    rationaleCol: "근거",
    evaluationTitle: "시나리오 평가 요약",
    // Table rows
    row1Workload: "개발/스테이징, 소규모",
    row1Recommended: "E: inf2",
    row1Rationale: "최저 비용 $0.28/1M 토큰",
    row2Workload: "지연 민감 (금융, 실시간)",
    row2Recommended: "A: p5/H100",
    row2Rationale: "120ms TTFT, 8ms ITL",
    row3Workload: "일반 프로덕션",
    row3Recommended: "D: trn2",
    row3Rationale: "최고 성능/비용 비율, H100 대비 83% 속도",
    row4Workload: "대규모 배치 처리",
    row4Recommended: "D: trn2",
    row4Rationale: "41% 비용으로 높은 처리량",
    row5Workload: "예산 제약 프로덕션",
    row5Recommended: "E: inf2",
    row5Rationale: "H100 대비 67% 비용 절감",
    row6Workload: "Maverick (400B) 서빙",
    row6Recommended: "A: p5/H100 or D: trn2",
    row6Rationale: "400B MoE를 위한 충분한 메모리",
    row7Workload: "멀티 모델 서빙",
    row7Recommended: "C: g6e/L40S",
    row7Rationale: "48GB/GPU, 여러 소형 모델에 적합",
    // Evaluation cards
    cardATitle: "A: p5/H100",
    cardAUseCase: "지연 민감/최대 성능",
    cardAComplexity: "복잡도: 낮음",
    cardAPerformance: "성능: 최대",
    cardACost: "비용: 매우 높음",
    cardDTitle: "D: trn2",
    cardDUseCase: "일반 프로덕션",
    cardDComplexity: "복잡도: 중간 (Neuron SDK)",
    cardDPerformance: "성능: 높음",
    cardDCost: "비용: 낮음",
    cardETitle: "E: inf2",
    cardEUseCase: "비용 최적화/개발/스테이징",
    cardEComplexity: "복잡도: 중간 (Neuron SDK)",
    cardEPerformance: "성능: 중상",
    cardECost: "비용: 최저",
    cardCTitle: "C: g6e/L40S",
    cardCUseCase: "멀티 모델/예산 GPU",
    cardCComplexity: "복잡도: 낮음",
    cardCPerformance: "성능: 보통",
    cardCCost: "비용: 중간"
  }
};

export default function MLRecommendationChart({ locale = 'en' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const theme = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    bgSurface: isDark ? '#1e293b' : '#ffffff',
    bgHeader: isDark ? '#0f172a' : '#f9fafb',
    border: isDark ? '#334155' : '#e5e7eb'
  };
  const t = i18n[locale] || i18n.en;

  const tableData = [
    {
      workload: t.row1Workload,
      recommended: t.row1Recommended,
      rationale: t.row1Rationale,
      badgeColor: '#d1fae5',
      badgeTextColor: '#065f46'
    },
    {
      workload: t.row2Workload,
      recommended: t.row2Recommended,
      rationale: t.row2Rationale,
      badgeColor: '#e2e8f0',
      badgeTextColor: '#1e293b'
    },
    {
      workload: t.row3Workload,
      recommended: t.row3Recommended,
      rationale: t.row3Rationale,
      badgeColor: '#dbeafe',
      badgeTextColor: '#1e3a8a'
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
      badgeColor: '#fef3c7',
      badgeTextColor: '#92400e'
    }
  ];

  const evaluationCards = [
    {
      title: t.cardATitle,
      useCase: t.cardAUseCase,
      complexity: t.cardAComplexity,
      performance: t.cardAPerformance,
      cost: t.cardACost,
      borderColor: '#64748b',
      gradient: null
    },
    {
      title: t.cardDTitle,
      useCase: t.cardDUseCase,
      complexity: t.cardDComplexity,
      performance: t.cardDPerformance,
      cost: t.cardDCost,
      borderColor: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
    },
    {
      title: t.cardETitle,
      useCase: t.cardEUseCase,
      complexity: t.cardEComplexity,
      performance: t.cardEPerformance,
      cost: t.cardECost,
      borderColor: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
    },
    {
      title: t.cardCTitle,
      useCase: t.cardCUseCase,
      complexity: t.cardCComplexity,
      performance: t.cardCPerformance,
      cost: t.cardCCost,
      borderColor: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
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
                  color: theme.textSecondary,
                  marginBottom: '4px'
                }}>
                  {card.performance}
                </div>
                <div style={{
                  fontSize: '12px',
                  color: theme.textSecondary
                }}>
                  {card.cost}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
