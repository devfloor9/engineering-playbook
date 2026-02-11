import { useColorMode } from '@docusaurus/theme-common';

export default function ModelSpecChart({ locale = 'en' }) {
  const { colorMode } = useColorMode();
  const isDark = colorMode === 'dark';

  const theme = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSecondary: isDark ? '#cbd5e1' : '#475569',
    bgSurface: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e2e8f0'
  };

  const i18n = {
    en: {
      title: 'Llama 4 Model Specifications',
      scoutTitle: 'Llama 4 Scout',
      maverickTitle: 'Llama 4 Maverick',
      totalParams: 'Total Parameters',
      activeParams: 'Active Parameters',
      architecture: 'Architecture',
      activeExperts: 'Active Experts',
      context: 'Context Window',
      hiddenDim: 'Hidden Dimension',
      layers: 'Layers',
      attentionHeads: 'Attention Heads',
      kvHeads: 'KV Heads',
      position: 'Position Encoding',
      minHardware: 'Min Hardware',
      vllmContext: 'vLLM Context (8×H100)',
      fp8Note: 'FP8 Quantization'
    },
    ko: {
      title: 'Llama 4 모델 사양',
      scoutTitle: 'Llama 4 Scout',
      maverickTitle: 'Llama 4 Maverick',
      totalParams: '총 파라미터',
      activeParams: '활성 파라미터',
      architecture: '아키텍처',
      activeExperts: '활성 Expert',
      context: '컨텍스트 윈도우',
      hiddenDim: '히든 차원',
      layers: '레이어',
      attentionHeads: 'Attention 헤드',
      kvHeads: 'KV 헤드',
      position: '위치 인코딩',
      minHardware: '최소 하드웨어',
      vllmContext: 'vLLM 컨텍스트 (8×H100)',
      fp8Note: 'FP8 양자화'
    }
  };

  const t = i18n[locale] || i18n.en;

  const scoutSpecs = [
    { label: t.totalParams, value: '109B' },
    { label: t.activeParams, value: '17B per token' },
    { label: t.architecture, value: 'MoE (16 routed experts + 1 shared)' },
    { label: t.activeExperts, value: '2 per token' },
    { label: t.context, value: '10M tokens' },
    { label: t.hiddenDim, value: '8,192' },
    { label: t.layers, value: '80' },
    { label: t.attentionHeads, value: '64' },
    { label: t.kvHeads, value: '8' },
    { label: t.position, value: 'iRoPE' },
    { label: t.minHardware, value: 'Single H100 80GB (BF16)' },
    { label: t.vllmContext, value: '1M tokens' }
  ];

  const maverickSpecs = [
    { label: t.totalParams, value: '400B' },
    { label: t.activeParams, value: '17B per token' },
    { label: t.architecture, value: 'MoE (128 routed experts + 1 shared)' },
    { label: t.activeExperts, value: '2 per token' },
    { label: t.context, value: '10M tokens' },
    { label: t.minHardware, value: '8× H100 80GB (BF16)' },
    { label: t.fp8Note, value: 'Available' },
    { label: t.vllmContext, value: '~430K tokens' }
  ];

  const renderCard = (title, specs, gradient) => (
    <div style={{
      border: `2px solid ${theme.border}`,
      borderRadius: '12px',
      overflow: 'hidden',
      backgroundColor: theme.bgSurface
    }}>
      <div style={{
        background: gradient,
        height: '6px'
      }} />
      <div style={{
        padding: '20px'
      }}>
        <div style={{
          fontSize: '18px',
          fontWeight: '700',
          color: isDark ? '#f1f5f9' : '#1e293b',
          marginBottom: '16px'
        }}>
          {title}
        </div>
        {specs.map((spec, idx) => (
          <div key={idx} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            padding: '8px 0',
            borderBottom: idx < specs.length - 1 ? `1px solid ${theme.border}` : 'none',
            fontSize: '13px'
          }}>
            <div style={{
              color: theme.textSecondary,
              fontWeight: '500',
              flex: '0 0 45%'
            }}>
              {spec.label}
            </div>
            <div style={{
              color: theme.text,
              fontFamily: 'monospace',
              textAlign: 'right',
              flex: '0 0 55%',
              fontWeight: '600'
            }}>
              {spec.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div style={{
      width: '100%',
      padding: '16px 0',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '24px'
      }}>
        {renderCard(
          t.scoutTitle,
          scoutSpecs,
          'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
        )}
        {renderCard(
          t.maverickTitle,
          maverickSpecs,
          'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
        )}
      </div>
    </div>
  );
}
