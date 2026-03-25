# Block 5: Pod Health & Graceful Shutdown

EKS Pod 헬스체크 & 라이프사이클 관리 슬라이드

## 📋 Slide Overview

18개 슬라이드로 구성된 Pod Health & Graceful Shutdown 프레젠테이션

### Slide List

1. **Slide01** - Title: Block 5 소개
2. **Slide02** - Overview: 헬스체크와 라이프사이클 관리의 중요성
3. **Slide03** - Probe 3종 개요 (Startup, Liveness, Readiness)
4. **Slide04** - Probe 비교 테이블
5. **Slide05** - Probe 설정 패턴 (YAML 예시)
6. **Slide06** - Probe 타이밍 다이어그램
7. **Slide07** - 워크로드별 Probe 패턴
8. **Slide08** - Pod Lifecycle 개요
9. **Slide09** - SIGTERM 처리
10. **Slide10** - Graceful Shutdown 패턴 (Node.js 예시)
11. **Slide11** - preStop Hook 활용
12. **Slide12** - terminationGracePeriodSeconds
13. **Slide13** - Native Sidecar 컨테이너
14. **Slide14** - Init Container vs Sidecar 비교
15. **Slide15** - ALB 연동 시 주의사항
16. **Slide16** - 헬스체크 디버깅 팁
17. **Slide17** - 운영 베스트 프랙티스
18. **Slide18** - Key Takeaways

## 🚀 Setup

### Install Dependencies

```bash
cd slides/block5
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173 in your browser.

### Build

```bash
npm run build
```

### Preview Build

```bash
npm run preview
```

## 🎨 Components Used

- **SlideWrapper**: Main slide container with animations
- **Card**: Content cards with icons and colored borders
- **CodeBlock**: Syntax-highlighted code blocks
- **CompareTable**: Comparison tables
- **FlowDiagram**: Flow diagrams with nodes and edges
- **Badge**: Status badges
- **SlideNav**: Navigation controls
- **Minimap**: Slide minimap overview

## 📦 Key Features

- ✅ Dark theme optimized for presentations
- ✅ Keyboard navigation (Arrow keys, Space, Home, End)
- ✅ Framer Motion animations
- ✅ Lucide React icons
- ✅ Shared component library integration
- ✅ TypeScript support
- ✅ Vite for fast development

## 📚 Content Coverage

### Kubernetes Probes
- Startup Probe: 애플리케이션 초기화 완료 확인
- Liveness Probe: 데드락/교착 상태 감지
- Readiness Probe: 트래픽 수신 준비 상태 확인

### Graceful Shutdown
- SIGTERM 처리 패턴
- preStop Hook 활용
- terminationGracePeriodSeconds 설정
- 언어별 구현 예시 (Node.js, Spring Boot)

### Advanced Topics
- Native Sidecar 컨테이너 (K8s 1.28+)
- ALB 헬스체크와 Readiness Probe 통합
- Pod Readiness Gates
- 헬스체크 디버깅 및 모니터링

## 🎯 Target Audience

- Kubernetes/EKS 운영자
- DevOps 엔지니어
- Platform 엔지니어
- SRE (Site Reliability Engineers)

## 📖 Source Document

Based on: `/docs/operations-observability/eks-pod-health-lifecycle.md`

## 🔧 Technical Stack

- React 18.3+
- TypeScript 5.6+
- Vite 6.0+
- Tailwind CSS 4.0+
- Framer Motion 11.0+
- Lucide React 0.460+

## 📝 Notes

- DO NOT run `npm install` - dependencies are already listed in package.json
- Shared components are imported from `@shared/components` (alias to `../shared/src/components`)
- All slides use dark theme with emerald accent color for consistency
- Code blocks use proper syntax highlighting for YAML, JavaScript, and other languages
