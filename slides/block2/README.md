# EKS Block 02 - Node Monitoring Agent

React-based slide deck for EKS Node Monitoring Agent documentation.

## Overview

This slide deck covers:
- EKS Node Monitoring Agent (NMA) architecture and components
- System monitors (Container Runtime, Storage, Network, Kernel, Accelerated Hardware)
- Node Problem Detector patterns
- Node Termination Handler (NTH) for Spot instance management
- Monitoring integration (Prometheus, CloudWatch, Grafana)
- Cost optimization and best practices

## Slide Structure

1. **01-Title.tsx** - Title slide
2. **02-Overview.tsx** - NMA overview and key features
3. **03-NPD.tsx** - Node Problem Detector concepts
4. **04-Architecture.tsx** - NMA architecture and data flow
5. **05-SystemMonitors.tsx** - System monitor types (Container, Storage, Network, Kernel)
6. **06-CustomMonitor.tsx** - Custom monitor configuration
7. **07-ConditionsVsEvents.tsx** - Node Conditions vs Events comparison
8. **08-KernelMonitor.tsx** - Kernel monitor (dmesg, OOM)
9. **09-DiskMonitor.tsx** - Disk and filesystem monitoring
10. **10-NetworkMonitor.tsx** - Network interface and DNS monitoring
11. **11-NTH.tsx** - Node Termination Handler overview
12. **12-NTH-Flow.tsx** - NTH operational flow
13. **13-SpotHandling.tsx** - Spot instance handling
14. **14-Integration.tsx** - Monitoring integration architecture
15. **15-CostOptimization.tsx** - Cost optimization strategies
16. **16-BestPractices.tsx** - Operational best practices
17. **17-KeyTakeaways.tsx** - Key takeaways and summary

## Development

```bash
# Install dependencies
npm install

# Run development server
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
- Click minimap dots to jump to specific slides

## Components Used

- `SlideWrapper`: Base slide layout with animations
- `Card`: Content cards with icons and colors
- `CodeBlock`: Syntax-highlighted code blocks
- `CompareTable`: Comparison tables
- `FlowDiagram`: SVG-based flow diagrams
- `Badge`: Colored badges for labels
- `SlideNav`: Slide navigation controls
- `Minimap`: Slide progress indicator

## Source Document

Based on: `/docs/operations-observability/node-monitoring-agent.md`

## Design

- Dark theme (bg-gray-950)
- Framer Motion animations
- Lucide React icons
- Tailwind CSS v4
- Responsive layout
