# Block 2: Model Serving & GPU Infrastructure

Interactive presentation covering enterprise GPU management for LLM workloads on Amazon EKS.

## Overview

20 slides covering:
- GPU instance selection (p5/p5e/g6e/g5)
- EKS node management strategies (Auto Mode, Karpenter, MNG)
- GPU resource allocation (Device Plugin, DRA, MIG)
- vLLM and llm-d distributed inference
- NVIDIA GPU stack (Operator, DCGM, Dynamo)
- Cost optimization and scaling strategies

## Slide Topics

1. **Title Slide** - Model Serving & GPU Infrastructure
2. **GPU Instance Landscape** - p5/p5e/p4d/g6e/g5 comparison
3. **EKS Auto Mode** - Fully managed GPU nodes
4. **Karpenter GPU NodePool** - Self-managed provisioning
5. **EKS GPU Node Strategy 2026** - Prefill/Decode/Inference pools
6. **GPU Operator on Auto Mode** - Device Plugin disable pattern
7. **DRA Timeline** - K8s 1.26 Alpha → 1.34 GA
8. **DRA Compatibility** - MNG required, Karpenter/Auto Mode not supported
9. **DRA Chicken-and-Egg Problem** - Technical explanation
10. **IGNORE_DRA_REQUESTS Workaround** - PoC only, production risks
11. **Optimal GPU Config 2026** - Recommended strategies
12. **vLLM Deep Dive** - PagedAttention, continuous batching, speculative decoding
13. **llm-d Architecture** - K8s-native distributed inference
14. **KV Cache-aware Routing** - Prefix matching flow
15. **Disaggregated Serving** - Prefill/Decode split with NIXL
16. **NVIDIA GPU Stack** - GPU Operator, DCGM, Dynamo, KAI Scheduler
17. **llm-d vs Dynamo** - Feature comparison and selection guide
18. **GPU Scale-out Strategy** - 2-stage KEDA + Karpenter/CA
19. **Cost Optimization** - Spot, Consolidation, MIG, right-sizing
20. **Key Takeaways** - Best practices summary

## Build

```bash
npm install
npm run build
```

Build output: `dist/` (328KB total)

## Development

```bash
npm run dev
```

Opens dev server at http://localhost:5173

## Navigation

- **Arrow Keys / Space**: Navigate slides
- **Home / End**: Jump to first/last slide
- **Ctrl+F**: Search slides

## Technical Details

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS v4
- **Build Tool**: Vite 6
- **Shared Components**: `@shared/components` from `../shared/`
  - SlideWrapper
  - Card
  - CodeBlock
  - CompareTable
  - FlowDiagram
  - Badge
  - SlideNav
  - Minimap
  - SlideSearch

## Source Documentation

Content extracted from:
- `/docs/agentic-ai-platform/model-serving/eks-gpu-node-strategy.md`
- `/docs/agentic-ai-platform/model-serving/gpu-resource-management.md`
- `/docs/agentic-ai-platform/model-serving/llm-d-eks-automode.md`
- `/docs/agentic-ai-platform/model-serving/nvidia-gpu-stack.md`

## Key Features

- Dark theme optimized for presentations
- Interactive navigation with minimap
- Full-text search across all slides
- Responsive FlowDiagram and CompareTable components
- Code syntax highlighting
- All content in English

## Deployment

The built slides are automatically included in the Docusaurus site when placed in the `static/` directory.

Access URL: `https://devfloor9.github.io/engineering-playbook/slides/agentic-block2-model-serving/`
