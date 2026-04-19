# Block 1: Design & Architecture — Agentic AI Platform

Interactive slide deck covering the design and architecture of Agentic AI platforms.

## Slides Overview

1. **Title Slide** — Design & Architecture introduction
2. **Why Agentic AI?** — Agent autonomy, tool use, multi-step reasoning
3. **Single LLM Limitations** — 4 critical limitations (Cost, Performance, Accuracy, Governance)
4. **Multi-Model Ecosystem** — Tier 2 LLM + Tier 1 SLM + K8s base
5. **6-Layer Architecture** — Complete platform stack
6. **Client & Gateway Layer** — API, Auth, Rate Limiting
7. **Agent Layer** — LangGraph, MCP/A2A, Tool Registry, Memory
8. **Model Serving Layer** — vLLM, llm-d, Embedding, Reranking
9. **Data & Observability Layer** — Milvus, Redis, Langfuse
10. **5 Critical Challenges** — Core problems to solve
11. **Challenge → Solution Mapping** — Platform solutions
12. **AWS Native Approach** — Bedrock architecture, pros/cons
13. **EKS Open Architecture** — Self-hosted stack, pros/cons
14. **AWS Native vs EKS Comparison** — Decision criteria
15. **Namespace & Security** — 5 namespaces + 3-tier security
16. **Agent-Specific Security** — Tool poisoning, scope limits, HITL
17. **Deployment Decision Flowchart** — Phase 0→1→2→3
18. **Key Takeaways** — 8 essential points

## Technology Stack

- **React 18** with TypeScript
- **Vite 6** for fast development and building
- **Tailwind CSS 4** for styling
- **Framer Motion** for animations
- **Lucide React** for icons
- **Shared Components** from `../shared/src/components`

## Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Navigation

- **Arrow Right / Space**: Next slide
- **Arrow Left**: Previous slide
- **Home**: First slide
- **End**: Last slide
- **Ctrl+F**: Search across all slides

## Build Output

Build creates optimized static files in `dist/` directory ready for deployment to GitHub Pages.

## Source Documentation

Content based on:
- `/docs/agentic-ai-platform/design-architecture/agentic-platform-architecture.md`
- `/docs/agentic-ai-platform/design-architecture/agentic-ai-challenges.md`
- `/docs/agentic-ai-platform/design-architecture/agentic-ai-solutions-eks.md`

---

**Created**: 2026-03-30  
**Language**: English  
**Theme**: Dark
