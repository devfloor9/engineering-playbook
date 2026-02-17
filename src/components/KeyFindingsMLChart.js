import { useColorMode } from '@docusaurus/theme-common';

const i18n = {
  en: {
    finding1: {
      headline: "58-67% lower cost per token",
      description: "AWS custom silicon (Trainium2, Inferentia2) delivers 58-67% lower cost per million tokens compared to NVIDIA H100 for Llama 4 Scout inference.",
      data: "$0.28 (inf2) vs $0.85 (H100)"
    },
    finding2: {
      headline: "H100 leads in raw speed",
      description: "p5.48xlarge (H100) achieves the lowest TTFT (120ms) and highest throughput (4,200 tokens/sec), making it ideal for latency-sensitive workloads.",
      data: "120ms TTFT, 4,200 tokens/sec"
    },
    finding3: {
      headline: "Trainium2 balances performance and cost",
      description: "trn2.48xlarge achieves 83% of H100 throughput at 41% of the cost per token, offering the best performance-to-cost ratio for general production workloads.",
      data: "3,500 tokens/sec at $0.35/1M tokens"
    },
    finding4: {
      headline: "MoE enables single-GPU deployment",
      description: "Llama 4 Scout's MoE architecture (17B active out of 109B total) allows deployment on a single H100 GPU while maintaining performance comparable to dense models of similar active parameter count.",
      data: "109B params, only 17B active per token"
    },
    finding5: {
      headline: "H100 scales 3.2× better under load",
      description: "Under 32 concurrent requests, p5/H100 achieves 42,000 tokens/sec vs g6e/L40S at 9,200 — a 4.6× throughput gap that widens under concurrent load due to HBM bandwidth advantages.",
      data: "42,000 vs 9,200 tokens/sec @32 concurrent"
    }
  },
  ko: {
    finding1: {
      headline: "토큰당 비용 58-67% 절감",
      description: "AWS 커스텀 실리콘(Trainium2, Inferentia2)은 Llama 4 Scout 추론에서 NVIDIA H100 대비 58-67% 낮은 토큰당 비용을 제공합니다.",
      data: "$0.28 (inf2) vs $0.85 (H100)"
    },
    finding2: {
      headline: "H100이 원시 속도에서 선두",
      description: "p5.48xlarge(H100)은 가장 낮은 TTFT(120ms)와 가장 높은 처리량(4,200 tokens/sec)을 달성하여 지연 민감 워크로드에 이상적입니다.",
      data: "120ms TTFT, 4,200 tokens/sec"
    },
    finding3: {
      headline: "Trainium2는 성능과 비용 균형 제공",
      description: "trn2.48xlarge은 H100 처리량의 83%를 토큰당 비용 41%로 달성하여, 일반 프로덕션 워크로드에 최적의 성능 대비 비용 비율을 제공합니다.",
      data: "3,500 tokens/sec at $0.35/1M tokens"
    },
    finding4: {
      headline: "MoE로 단일 GPU 배포 가능",
      description: "Llama 4 Scout의 MoE 아키텍처(109B 중 17B 활성)는 단일 H100 GPU에서 배포가 가능하며, 유사한 활성 파라미터 수의 Dense 모델과 비슷한 성능을 유지합니다.",
      data: "109B params, only 17B active per token"
    },
    finding5: {
      headline: "H100은 부하 시 3.2배 확장성",
      description: "32개 동시 요청에서 p5/H100은 42,000 tokens/sec를 달성하며 g6e/L40S의 9,200 대비 4.6배 격차가 나타납니다. HBM 대역폭 이점으로 동시 부하에서 격차가 더 확대됩니다.",
      data: "42,000 vs 9,200 tokens/sec @32 concurrent"
    }
  }
};

const findingColors = ['#10b981', '#64748b', '#3b82f6', '#8b5cf6', '#f59e0b'];

export default function KeyFindingsMLChart({ locale = 'en' }) {
  const t = i18n[locale] || i18n.en;
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';
  const theme = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    bgSurface: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e5e7eb'
  };

  const findings = [
    { ...t.finding1, color: findingColors[0] },
    { ...t.finding2, color: findingColors[1] },
    { ...t.finding3, color: findingColors[2] },
    { ...t.finding4, color: findingColors[3] },
    { ...t.finding5, color: findingColors[4] }
  ];

  return (
    <div style={{
      width: '100%',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '20px'
      }}>
        {findings.map((finding, idx) => (
          <div key={idx} style={{
            background: theme.bgSurface,
            border: `1px solid ${theme.border}`,
            borderLeft: `4px solid ${finding.color}`,
            borderRadius: '8px',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{
              fontSize: '16px',
              fontWeight: '700',
              color: finding.color,
              lineHeight: '1.4'
            }}>
              {finding.headline}
            </div>
            <p style={{
              margin: 0,
              fontSize: '14px',
              lineHeight: '1.6',
              color: theme.text,
              flex: 1
            }}>
              {finding.description}
            </p>
            <div style={{
              display: 'inline-block',
              alignSelf: 'flex-start',
              background: isDark ? 'rgba(255, 255, 255, 0.1)' : '#f8fafc',
              border: `1px solid ${theme.border}`,
              borderRadius: '6px',
              padding: '6px 12px',
              fontSize: '12px',
              fontWeight: '600',
              color: theme.textSecondary,
              fontFamily: 'monospace'
            }}>
              {finding.data}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
