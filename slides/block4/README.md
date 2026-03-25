# EKS Block 4 - 고가용성 아키텍처 슬라이드

React + Vite + TailwindCSS + Framer Motion 기반 슬라이드 데크

## 📋 슬라이드 구성 (20 slides)

### 소개 및 개요 (Slides 1-2)
- **Slide 01**: 타이틀 - EKS 고가용성 아키텍처
- **Slide 02**: Overview - 레질리언시 정의 및 핵심 개념

### Failure Domain & Multi-AZ 전략 (Slides 3-10)
- **Slide 03**: Failure Domain 계층 구조 (FlowDiagram)
- **Slide 04**: EKS 컨트롤 플레인 HA
- **Slide 05**: 노드 그룹 HA 전략 (Karpenter)
- **Slide 06**: Topology Spread Constraints (CodeBlock)
- **Slide 07**: TSC 동작 원리 (FlowDiagram)
- **Slide 08**: Pod Anti-Affinity vs TSC (CompareTable)
- **Slide 09**: AZ Rebalancing
- **Slide 10**: Zonal Shift (ARC)

### Cell Architecture & 애플리케이션 패턴 (Slides 11-15)
- **Slide 11**: Cell-based Architecture (FlowDiagram)
- **Slide 12**: PodDisruptionBudget (CodeBlock)
- **Slide 13**: PDB 전략 패턴 (CompareTable)
- **Slide 14**: Circuit Breaker 패턴 (CodeBlock)
- **Slide 15**: Graceful Degradation

### Chaos Engineering & 실전 가이드 (Slides 16-20)
- **Slide 16**: Chaos Engineering 소개
- **Slide 17**: Litmus vs Chaos Mesh (CompareTable)
- **Slide 18**: 실전 HA 체크리스트
- **Slide 19**: 비용 vs 가용성 트레이드오프 (CompareTable)
- **Slide 20**: Key Takeaways

## 🎨 사용된 공유 컴포넌트

- **SlideWrapper**: 슬라이드 기본 레이아웃 및 애니메이션
- **Card**: 콘텐츠 카드 컴포넌트
- **CodeBlock**: 코드 블록 (YAML)
- **CompareTable**: 비교 테이블
- **FlowDiagram**: 플로우 다이어그램
- **Badge**: 뱃지 컴포넌트
- **SlideNav**: 슬라이드 네비게이션
- **Minimap**: 슬라이드 미니맵

## 🚀 실행 방법

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 프리뷰
npm run preview
```

## 🎯 주요 특징

- Dark 테마 기반 디자인
- Framer Motion 애니메이션
- Lucide React 아이콘
- 키보드 네비게이션 (화살표, Space, Home, End)
- 반응형 레이아웃

## 📦 소스 구조

```
block4/
├── package.json                 # 패키지 설정
├── tsconfig.json               # TypeScript 설정
├── tsconfig.app.json           # 앱 TypeScript 설정
├── vite.config.ts              # Vite 설정
├── index.html                  # HTML 엔트리
└── src/
    ├── main.tsx                # React 엔트리
    ├── App.tsx                 # 메인 앱 컴포넌트
    ├── index.css               # 글로벌 스타일
    └── slides/
        ├── index.ts            # 슬라이드 배열 export
        ├── Slide01.tsx         # 타이틀
        ├── Slide02.tsx         # Overview
        ├── ...
        └── Slide20.tsx         # Key Takeaways
```

## 📚 원본 문서

- 소스: `/docs/operations-observability/eks-resiliency-guide.md`
- Block: 4. EKS 고가용성 아키텍처

## 🔗 관련 링크

- 공유 컴포넌트: `../shared/src/components/`
- 템플릿 소스: `../template/`
