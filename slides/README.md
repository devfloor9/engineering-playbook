# EKS Operations Training - React Slides

React + Vite + TypeScript + Tailwind CSS v4 기반 인터랙티브 교육 슬라이드.

## 구조

```
slides/
├── shared/              # 공유 컴포넌트 라이브러리
│   └── src/components/  # SlideWrapper, Card, CodeBlock, FlowDiagram 등
├── template/            # 새 블록 생성용 템플릿
├── block1/              # Block 1: GitOps 기반 EKS 운영
├── block2/              # Block 2: Node Monitoring Agent
├── block3/              # Block 3: 장애 진단 6-Layer
├── block4/              # Block 4: 고가용성 아키텍처
├── block5/              # Block 5: Pod Health & Shutdown
├── block6/              # Block 6: Pod Scheduling
├── index.html           # 랜딩 페이지
└── build.sh             # 전체 빌드 스크립트
```

## 새 블록 추가

```bash
# 1. 템플릿 복사
cp -r template/ block7/

# 2. package.json name 수정
# 3. src/slides/ 에 슬라이드 작성
# 4. src/slides/index.ts 에서 export

# 5. 빌드 & 배포
./build.sh
```

## 개발

```bash
cd block1
npm install
npm run dev    # http://localhost:5173
```

## 빌드 & 배포

```bash
# 전체 빌드
./build.sh

# 결과물은 static/docs/operations-observability/slide/ 에 복사됨
# main 브랜치에 push하면 GitHub Actions가 자동 배포
```

## 키보드 단축키

| Key | Action |
|-----|--------|
| ← → | 이전 / 다음 슬라이드 |
| Space | 다음 슬라이드 |
| Home / End | 첫 / 마지막 슬라이드 |

## Tech Stack

- React 18 + TypeScript
- Vite 6 (빌드)
- Tailwind CSS v4
- framer-motion (애니메이션)
- lucide-react (아이콘)
