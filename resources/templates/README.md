# 문서 템플릿

EKS Engineering Playbook의 일관성 있는 문서 작성을 위한 템플릿과 가이드라인을 제공합니다.

## 📋 사용 가능한 템플릿

### 1. [문서 템플릿](./document-template.md)
새로운 EKS 기술 문서 작성을 위한 표준 마크다운 템플릿입니다.

**사용법**:
1. `document-template.md` 파일을 복사
2. 해당 기술 도메인 디렉토리에 새 파일명으로 저장
3. 메타데이터와 내용을 실제 내용으로 교체

### 2. [메타데이터 스키마](./metadata-schema.md)
모든 문서에서 사용해야 하는 frontmatter 메타데이터의 정의와 규칙입니다.

**주요 필드**:
- `title`: 문서 제목
- `description`: 문서 설명
- `tags`: 검색용 태그
- `category`: 기술 도메인 (5개 중 하나)
- `date`: 작성/수정 날짜
- `authors`: 작성자 목록

### 3. [문서 작성 가이드라인](./writing-guidelines.md)
고품질의 기술 문서 작성을 위한 상세한 가이드라인입니다.

**포함 내용**:
- 문서 구조 및 섹션 가이드
- 스타일 및 언어 사용 규칙
- 코드 블록 및 다이어그램 작성법
- 품질 체크리스트

## 🚀 빠른 시작

새 문서를 작성하려면:

1. **도메인 선택**: 5개 기술 도메인 중 적절한 카테고리 선택
   - `performance-networking`
   - `observability-monitoring`
   - `genai-aiml`
   - `hybrid-multicloud`
   - `security-compliance`

2. **템플릿 복사**: 
   ```bash
   cp resources/templates/document-template.md docs/[domain]/new-document.md
   ```

3. **메타데이터 수정**: [메타데이터 스키마](./metadata-schema.md)에 따라 frontmatter 작성

4. **내용 작성**: [작성 가이드라인](./writing-guidelines.md)을 참고하여 내용 작성

5. **품질 검증**: 가이드라인의 체크리스트로 최종 검토

## 🔍 메타데이터 검증

문서 작성 후 메타데이터가 올바른지 자동으로 검증할 수 있습니다:

```bash
# 모든 문서 검증
npm run validate-metadata

# 특정 디렉토리만 검증
node scripts/validate-metadata.js docs
node scripts/validate-metadata.js blog
```

검증 스크립트는 다음 항목들을 확인합니다:
- 필수 필드 존재 여부 (title, description, tags, category, date, authors)
- 카테고리 값 유효성 (5개 도메인 중 하나)
- 날짜 형식 정확성 (YYYY-MM-DD)
- YAML 문법 오류
- 제목/설명 길이 권장사항

## 📚 관련 자료

- [EKS Engineering Playbook 메인](../../README.md)
- [기술 도메인별 문서](../../docs/)
- [프로젝트 기여 가이드](../../CONTRIBUTING.md)

---

**💡 팁**: 문서 작성 전에 기존 문서들을 참고하여 일관성을 유지하세요!