# Block 5: Operations & MLOps

Interactive presentation slides for Agentic AI Platform - Operations & MLOps module.

## Overview

This slide deck covers:

1. **Dual-Layer Observability** - Infrastructure (Bifrost) + Application (Langfuse)
2. **Infrastructure Monitoring** - DCGM GPU metrics, Kubecost, Prometheus
3. **Application Monitoring** - Langfuse traces, Agent step cost
4. **Gateway-Level Monitoring** - Without SDK dependency
5. **SDK-Level Monitoring** - Langfuse SDK in Agent Server
6. **Hybrid Monitoring Strategy** - Gateway + Agent Server
7. **RAGAS Evaluation** - Faithfulness, Relevancy, Hallucination metrics
8. **RAG Quality Pipeline** - Evaluate→Feedback→Improve cycle
9. **LLMOps Cost Governance** - 2-Tier tracking with Bifrost + Langfuse
10. **MLOps Pipeline** - Kubeflow + MLflow + KServe on EKS
11. **SageMaker-EKS Integration** - Hybrid training-serving
12. **Key Alerts & SLOs** - P99 latency, error rate, GPU util, budget
13. **Production Readiness Checklist** - Infrastructure, Serving, Gateway, Security, Observability
14. **Deployment Path** - Phase 0→1→2→3 timeline
15. **Key Takeaways**

## Technology Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS 4
- Framer Motion (animations)
- Shared components from `../shared`

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Build Output

The build creates a production-ready static site in `dist/`:
- `dist/index.html` - Entry point
- `dist/assets/` - Bundled CSS and JS

## Deployment

The slides are configured to be deployed at:
```
/engineering-playbook/agentic-block5-operations/
```

To deploy, copy the `dist/` folder contents to this path on your static hosting.

## Navigation

- **Arrow keys** (← →) - Previous/Next slide
- **Space** - Next slide
- **Home** - First slide
- **End** - Last slide
- **Click dots** - Jump to specific slide
- **Buttons** - Navigate with on-screen controls

## Features

- 16 comprehensive slides
- Dark theme optimized for presentations
- Responsive layout
- Keyboard navigation
- Slide indicator dots
- Progress tracking

## Source Documents

Content derived from:
- `/docs/agentic-ai-platform/operations-mlops/agent-monitoring.md`
- `/docs/agentic-ai-platform/operations-mlops/llmops-observability.md`
- `/docs/agentic-ai-platform/operations-mlops/ragas-evaluation.md`
- `/docs/agentic-ai-platform/operations-mlops/mlops-pipeline-eks.md`
- `/docs/agentic-ai-platform/operations-mlops/sagemaker-eks-integration.md`

---

Built with ❤️ for the Agentic AI Platform project
