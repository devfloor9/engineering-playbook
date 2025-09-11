---
title: "Algolia 검색 설정 가이드"
description: "EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다."
tags: [algolia, search, docusaurus, setup]
category: "setup"
date: "2025-01-15"
authors: [devfloor9]
difficulty: "intermediate"
estimated_time: "30분"
---

# Algolia 검색 설정 가이드

이 가이드는 EKS Engineering Playbook에서 Algolia DocSearch를 설정하고 관리하는 방법을 설명합니다.

## 개요

Algolia DocSearch는 문서 사이트를 위한 강력한 검색 솔루션입니다. 이 플레이북에서는 다음과 같은 검색 기능을 제공합니다:

- 실시간 검색 결과
- 다국어 지원 (한국어/영어)
- 카테고리별 필터링
- 태그 기반 검색
- 모바일 최적화된 검색 UI

## 사전 요구사항

- Algolia 계정 (무료 계정 가능)
- GitHub Pages 또는 다른 호스팅 환경에 배포된 사이트
- Node.js 18+ 환경

## 1단계: Algolia 계정 설정

### Algolia 계정 생성

1. [Algolia 웹사이트](https://www.algolia.com/)에서 계정을 생성합니다
2. 새 애플리케이션을 생성합니다
3. 다음 정보를 기록해둡니다:
   - Application ID
   - Search-Only API Key
   - Admin API Key

### 환경 변수 설정

로컬 개발 환경에서 `.env` 파일을 생성합니다:

```bash
# .env 파일
ALGOLIA_APP_ID=your_application_id
ALGOLIA_SEARCH_API_KEY=your_search_only_api_key
ALGOLIA_ADMIN_API_KEY=your_admin_api_key
ALGOLIA_INDEX_NAME=engineering-playbook
```

## 2단계: DocSearch 크롤러 설정

### DocSearch 신청

1. [DocSearch 신청 페이지](https://docsearch.algolia.com/apply/)에서 신청합니다
2. 다음 정보를 제공합니다:
   - 웹사이트 URL: `https://devfloor9.github.io/engineering-playbook/`
   - 이메일 주소
   - 저장소 URL: `https://github.com/devfloor9/engineering-playbook`

### 수동 크롤러 설정 (선택사항)

DocSearch 승인을 기다리는 동안 수동으로 크롤러를 설정할 수 있습니다:

```bash
# Docker를 사용한 크롤러 실행
docker run -it --env-file=.env -e "CONFIG=$(cat algolia-config.json | jq -r tostring)" algolia/docsearch-scraper
```

## 3단계: 인덱스 설정 및 관리

### 인덱스 상태 확인

```bash
# 인덱스 상태 확인
node scripts/algolia-index.js status
```

### 인덱스 초기 설정

```bash
# 인덱스 설정 적용
node scripts/algolia-index.js setup
```

### 설정 확인

```bash
# 현재 설정 확인
node scripts/algolia-index.js config
```

## 4단계: 프로덕션 환경 설정

### GitHub Actions 환경 변수

GitHub 저장소의 Settings > Secrets and variables > Actions에서 다음 변수를 설정합니다:

```
ALGOLIA_APP_ID=your_application_id
ALGOLIA_SEARCH_API_KEY=your_search_only_api_key
ALGOLIA_INDEX_NAME=engineering-playbook
```

### 자동 인덱싱 워크플로우

`.github/workflows/algolia-index.yml` 파일을 생성합니다:

```yaml
name: Update Algolia Index

on:
  push:
    branches: [main]
    paths: ['docs/**', 'blog/**']
  schedule:
    # 매일 자정에 실행
    - cron: '0 0 * * *'

jobs:
  algolia-index:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build site
        run: npm run build
        
      - name: Update Algolia index
        env:
          ALGOLIA_APP_ID: ${{ secrets.ALGOLIA_APP_ID }}
          ALGOLIA_ADMIN_API_KEY: ${{ secrets.ALGOLIA_ADMIN_API_KEY }}
          ALGOLIA_INDEX_NAME: ${{ secrets.ALGOLIA_INDEX_NAME }}
        run: |
          docker run \
            --env-file=<(env | grep ALGOLIA) \
            -e "CONFIG=$(cat algolia-config.json | jq -r tostring)" \
            algolia/docsearch-scraper
```

## 5단계: 검색 기능 커스터마이징

### 검색 UI 커스터마이징

`src/css/custom.css`에서 검색 스타일을 커스터마이징할 수 있습니다:

```css
/* 검색 입력창 스타일 */
.DocSearch-Button {
  border-radius: 1rem;
  background: var(--ifm-color-emphasis-100);
}

/* 검색 결과 하이라이트 */
.algolia-docsearch-suggestion--highlight {
  background: var(--ifm-color-primary);
  color: white;
}
```

### 검색 필터 추가

`docusaurus.config.js`에서 검색 매개변수를 조정합니다:

```javascript
algolia: {
  // ... 기본 설정
  searchParameters: {
    facetFilters: ['language:ko', 'language:en'],
    hitsPerPage: 10,
    // 카테고리별 필터링 추가
    filters: 'type:content OR type:lvl1 OR type:lvl2'
  },
}
```

## 6단계: 검색 성능 최적화

### 인덱스 최적화

1. **검색 가능한 속성 우선순위 설정**:
   ```json
   {
     "searchableAttributes": [
       "unordered(hierarchy.lvl0)",
       "unordered(hierarchy.lvl1)",
       "unordered(hierarchy.lvl2)",
       "content"
     ]
   }
   ```

2. **패싯 설정**:
   ```json
   {
     "attributesForFaceting": [
       "type",
       "lang",
       "docusaurus_tag"
     ]
   }
   ```

3. **커스텀 랭킹 설정**:
   ```json
   {
     "customRanking": [
       "desc(weight.pageRank)",
       "desc(weight.level)",
       "asc(weight.position)"
     ]
   }
   ```

## 문제 해결

### 일반적인 문제들

#### 문제 1: 검색 결과가 나타나지 않음

**증상:**
- 검색창에 입력해도 결과가 없음
- "No results" 메시지 표시

**원인:**
- 인덱스가 비어있음
- API 키 설정 오류
- 크롤러가 실행되지 않음

**해결 방법:**
```bash
# 인덱스 상태 확인
node scripts/algolia-index.js status

# 환경 변수 확인
node scripts/algolia-index.js config

# 크롤러 수동 실행
docker run -it --env-file=.env -e "CONFIG=$(cat algolia-config.json | jq -r tostring)" algolia/docsearch-scraper
```

#### 문제 2: 한국어 검색이 작동하지 않음

**증상:**
- 영어 검색은 되지만 한국어 검색이 안됨
- 한국어 콘텐츠가 인덱싱되지 않음

**원인:**
- 언어 설정 오류
- 크롤러 설정에서 한국어 페이지 제외

**해결 방법:**
```json
// algolia-config.json에서 확인
{
  "start_urls": [
    {
      "url": "https://devfloor9.github.io/engineering-playbook/docs/",
      "tags": ["docs", "ko"]
    },
    {
      "url": "https://devfloor9.github.io/engineering-playbook/en/docs/",
      "tags": ["docs", "en"]
    }
  ]
}
```

#### 문제 3: 검색 속도가 느림

**증상:**
- 검색 결과 로딩이 오래 걸림
- 타이핑할 때마다 지연 발생

**원인:**
- 인덱스 크기가 너무 큼
- 검색 매개변수 최적화 필요

**해결 방법:**
```javascript
// docusaurus.config.js에서 최적화
searchParameters: {
  hitsPerPage: 8, // 결과 수 제한
  attributesToRetrieve: [
    'hierarchy.lvl0',
    'hierarchy.lvl1',
    'hierarchy.lvl2',
    'content'
  ], // 필요한 속성만 가져오기
}
```

## 모니터링 및 분석

### 검색 분석 확인

1. Algolia 대시보드에서 검색 분석을 확인합니다
2. 인기 검색어와 검색 패턴을 분석합니다
3. 검색 성능 메트릭을 모니터링합니다

### 정기 유지보수

```bash
# 주간 인덱스 상태 확인
node scripts/algolia-index.js status

# 월간 인덱스 최적화
node scripts/algolia-index.js setup
```

## 참고 자료

- [Algolia DocSearch 공식 문서](https://docsearch.algolia.com/)
- [Docusaurus 검색 설정 가이드](https://docusaurus.io/docs/search)
- [Algolia JavaScript API 참조](https://www.algolia.com/doc/api-reference/api-methods/)
- [DocSearch 크롤러 설정](https://docsearch.algolia.com/docs/config-file)

---

**마지막 업데이트:** 2025-01-15  
**검토자:** devfloor9  
**버전:** 1.0