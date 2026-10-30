---
created: 2026-03-11
last_update:
  date: 2026-10-30
reading_time: 4
---
# EKS Operations Training - React Slides

주요 덱은 React, Vite, TypeScript 기반 인터랙티브 교육 슬라이드입니다. 덱마다 의존성과 빌드 설정이 다르므로 각 `package.json`과 `vite.config.ts`를 확인합니다.

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
├── agentic-block*/      # Agentic AI 블록 원본
├── eks-debugging/       # 독립 EKS 디버깅 덱 원본
├── eks-networking/      # 독립 EKS 네트워킹 덱 원본
├── index.html           # 랜딩 페이지
└── build.sh             # block*/ 및 agentic-block*/ 빌드 스크립트
```

## 새 블록 추가

```bash
# 1. 템플릿 복사
cp -r template/ block7/

# 2. package.json name 수정
# 3. src/slides/ 에 슬라이드 작성
# 4. src/slides/index.ts 에서 export
# 5. slides/index.html 및 사이트 슬라이드 색인에서 링크 확인

# 6. 아래 빌드 범위와 복사 경로를 확인한 뒤 빌드
./build.sh
```

## 개발

```bash
cd block1
npm install
npm run dev -- --host 127.0.0.1    # http://127.0.0.1:5173
```

## 원본과 게시 산출물

- `slides/<덱>/src/`와 `slides/shared/src/`는 슬라이드 원본입니다. `slides/index.html`도 원본 랜딩 페이지입니다.
- 각 덱의 `dist/`는 `npm run build`가 만드는 임시 산출물이며 Git에서 제외됩니다.
- `static/`에 저장된 HTML과 JS·CSS는 사이트 빌드에 포함되는 게시 산출물입니다. 원본만 바꾸면 이 파일은 자동 갱신되지 않습니다.
- 사이트 슬라이드 색인은 `src/pages/slides/index.js`입니다. 게시 경로를 바꾸면 색인과 랜딩 링크도 함께 확인합니다.

## 블록 빌드

`slides/` 디렉터리에서 실행합니다.

```bash
# 전체 빌드
./build.sh

```

`build.sh`는 `block*/`와 `agentic-block*/` 디렉터리마다 `npm run build`를 실행합니다. 해당 덱에 `node_modules/`가 없으면 먼저 `npm install`을 실행합니다. 각 대상 디렉터리는 삭제 후 새 `dist/`로 대체되므로 기존 내용을 확인한 뒤 실행하세요.

| 원본 | 스크립트 복사 대상 |
|---|---|
| `slides/block*/` | `static/docs/operations-observability/slide/<원본 디렉터리명>/` |
| `slides/agentic-block*/` | `static/docs/agentic-ai-platform/slide/<원본 디렉터리명>/` |
| `slides/index.html` | `static/docs/operations-observability/slide/index.html` |

스크립트는 `slides/agentic-index.html`이 있을 때만 Agentic 랜딩을 복사합니다. 현재 그 원본 파일은 없습니다. 기존 사이트 색인은 `agentic-block1/`처럼 접미사가 없는 경로를 사용하지만, 스크립트는 `agentic-block1-architecture/`처럼 전체 원본 디렉터리명을 사용합니다. 이름과 주제가 다른 경로를 같은 덱으로 가정하지 말고 링크와 내용을 별도로 대조하세요.

`agentic-block5-operations`의 Vite `base`는 `/engineering-playbook/agentic-block5-operations/`입니다. 이는 스크립트의 복사 경로와 다릅니다. 게시할 위치와 자산 경로를 확인하기 전에는 해당 산출물이 그 위치에서 동작한다고 가정하지 마세요.

## 독립 덱과 배포 확인

`build.sh`는 `eks-debugging`, `eks-networking`, `eks-best-practices`, `agentic-ai-platform`, `sales-pitch` 같은 독립 덱을 빌드하거나 복사하지 않습니다. 예를 들어 `slides/eks-debugging/`에서 `npm install`과 `npm run build`를 실행하면 `dist/`가 만들어집니다. 이 덱의 기존 사이트 산출물은 `static/slides/eks-debugging/`에 있습니다. 각 덱의 실제 링크, Vite `base`, 기존 산출물과 파일 삭제 범위를 검토한 후에만 해당 산출물을 갱신하세요. 정적 HTML 덱인 `ebpf-deep-dive`도 별도입니다.

변경한 덱의 HTML과 자산 경로, 사이트 색인 링크, 원본과 산출물의 내용을 확인하세요. 저장소 루트의 `npm run build`는 사이트를 빌드하지만 슬라이드 덱을 다시 빌드하지 않습니다. GitHub Actions는 main 대상 pull request에서 사이트를 빌드하고, main 브랜치 빌드가 성공해야 Pages에 배포합니다. 사이트 빌드나 링크 검사만으로 슬라이드 내용·실행 동작까지 검증되는 것은 아닙니다.

## 키보드 단축키

| Key | Action |
|-----|--------|
| ← → | 이전 / 다음 슬라이드 |
| Space | 다음 슬라이드 |
| Home / End | 첫 / 마지막 슬라이드 |

## Tech Stack

- React + TypeScript
- Vite (빌드)
- Tailwind CSS
- framer-motion (애니메이션)
- lucide-react (아이콘)
