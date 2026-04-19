# Block 3: Gateway & Routing Slides

## Overview
16 slides covering Inference Gateway and LLM Routing architecture

## Slide Contents

1. **Title Slide** - Inference Gateway & LLM Routing
2. **Why AI Gateway?** - Comparison with traditional API gateways
3. **2-Tier Architecture Overview** - kgateway + Bifrost/agentgateway separation
4. **Tier 1: kgateway** - Kubernetes Gateway API, Envoy-based infrastructure
5. **Tier 2: Bifrost** - Go/Rust LLM gateway, 50x faster than LiteLLM
6. **Cascade Routing Deep Dive** - 73% cost savings with intelligent model selection
7. **Semantic Caching** - 30% cost reduction with embedding-based caching
8. **llm-d Inference Gateway** - KV cache-aware Pod selection
9. **Bifrost vs llm-d Gateway** - Different routing levels (provider vs pod)
10. **kgateway OSS vs Enterprise** - Feature comparison after open-sourcing
11. **Bifrost vs LiteLLM** - Performance vs ecosystem trade-off
12. **OpenClaw AI Gateway** - Alternative deployment approach
13. **MCP / A2A Protocol** - Agent tool connections and stateful sessions
14. **Multimodal & TTS Routing** - Path-based routing for images, audio, video
15. **Full Architecture** - Complete flow from client to vLLM
16. **Key Takeaways** - Summary and production checklist

## Technical Stack

- **Framework**: React + TypeScript + Vite
- **Styling**: Tailwind CSS (dark theme)
- **Components**: Shared components from `@shared/components`
- **Build**: Vite 6.4.1

## Source Documentation

Content derived from:
- `/docs/agentic-ai-platform/gateway-agents/llm-gateway-architecture.md`
- `/docs/agentic-ai-platform/gateway-agents/inference-gateway-routing.md`
- `/docs/agentic-ai-platform/gateway-agents/openclaw-ai-gateway.mdx`

## Build

```bash
npm run build
```

Build output: `dist/` directory (336KB JavaScript, 37KB CSS)

## Key Features

- Dark theme optimized for presentations
- Keyboard navigation (Arrow keys, Home, End)
- Search functionality (Ctrl+F)
- Minimap for quick navigation
- All content in English
- Comprehensive coverage of 2-tier gateway architecture
- Cost optimization strategies with concrete numbers
- Protocol support (MCP/A2A)
- Production deployment guidance

## Statistics

- **Total Slides**: 16
- **Total Lines of Code**: 1,631
- **Components Used**: SlideWrapper, Card, Badge, CompareTable, FlowDiagram
- **Build Time**: ~1.2s
- **Build Success**: ✓

## File Structure

```
src/slides/
├── index.ts          # Exports slides array
├── Slide01.tsx       # Title slide
├── Slide02.tsx       # Why AI Gateway?
├── Slide03.tsx       # 2-Tier Architecture
├── Slide04.tsx       # Tier 1: kgateway
├── Slide05.tsx       # Tier 2: Bifrost
├── Slide06.tsx       # Cascade Routing
├── Slide07.tsx       # Semantic Caching
├── Slide08.tsx       # llm-d Gateway
├── Slide09.tsx       # Bifrost vs llm-d
├── Slide10.tsx       # kgateway OSS vs Enterprise
├── Slide11.tsx       # Bifrost vs LiteLLM
├── Slide12.tsx       # OpenClaw Gateway
├── Slide13.tsx       # MCP / A2A Protocol
├── Slide14.tsx       # Multimodal & TTS
├── Slide15.tsx       # Full Architecture
└── Slide16.tsx       # Key Takeaways
```

## Deployment

To serve locally:
```bash
npm run dev
```

To build for production:
```bash
npm run build
```

The built files in `dist/` can be deployed to any static hosting service.
