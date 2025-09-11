#!/usr/bin/env node

/**
 * EKS Engineering Playbook - 문서 메타데이터 검증 스크립트
 * 
 * 이 스크립트는 마크다운 문서의 frontmatter 메타데이터가 
 * 정의된 스키마를 준수하는지 검증합니다.
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

// 허용되는 카테고리 목록
const VALID_CATEGORIES = [
  'performance-networking',
  'observability-monitoring', 
  'genai-aiml',
  'hybrid-multicloud',
  'security-compliance'
];

// 필수 필드 목록
const REQUIRED_FIELDS = [
  'title',
  'description', 
  'tags',
  'category',
  'date',
  'authors'
];

/**
 * 마크다운 파일에서 frontmatter 추출
 */
function extractFrontmatter(content) {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);
  
  if (!match) {
    return null;
  }
  
  try {
    return yaml.load(match[1]);
  } catch (error) {
    throw new Error(`YAML 파싱 오류: ${error.message}`);
  }
}

/**
 * 메타데이터 검증
 */
function validateMetadata(metadata, filePath) {
  const errors = [];
  
  // 필수 필드 검사
  for (const field of REQUIRED_FIELDS) {
    if (!metadata[field]) {
      errors.push(`필수 필드 누락: ${field}`);
    }
  }
  
  // 카테고리 유효성 검사
  if (metadata.category && !VALID_CATEGORIES.includes(metadata.category)) {
    errors.push(`유효하지 않은 카테고리: ${metadata.category}. 허용값: ${VALID_CATEGORIES.join(', ')}`);
  }
  
  // 날짜 형식 검사 (YYYY-MM-DD)
  if (metadata.date) {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(metadata.date)) {
      errors.push(`잘못된 날짜 형식: ${metadata.date}. YYYY-MM-DD 형식을 사용하세요.`);
    }
  }
  
  // 태그 배열 검사
  if (metadata.tags && !Array.isArray(metadata.tags)) {
    errors.push(`tags는 배열이어야 합니다: ${typeof metadata.tags}`);
  }
  
  // 작성자 배열 검사
  if (metadata.authors && !Array.isArray(metadata.authors)) {
    errors.push(`authors는 배열이어야 합니다: ${typeof metadata.authors}`);
  }
  
  // 제목 길이 검사 (권장사항)
  if (metadata.title && metadata.title.length > 60) {
    errors.push(`제목이 너무 깁니다 (${metadata.title.length}자). 60자 이내 권장.`);
  }
  
  // 설명 길이 검사 (권장사항)
  if (metadata.description && metadata.description.length > 150) {
    errors.push(`설명이 너무 깁니다 (${metadata.description.length}자). 150자 이내 권장.`);
  }
  
  return errors;
}

/**
 * 디렉토리에서 마크다운 파일 찾기
 */
function findMarkdownFiles(dir) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('.')) {
        traverse(fullPath);
      } else if (stat.isFile() && item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

/**
 * 메인 검증 함수
 */
function validateDocuments(directories = ['docs', 'blog']) {
  let totalFiles = 0;
  let validFiles = 0;
  let errorCount = 0;
  
  console.log('🔍 EKS Engineering Playbook 문서 메타데이터 검증 시작...\n');
  
  for (const dir of directories) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  디렉토리가 존재하지 않습니다: ${dir}`);
      continue;
    }
    
    console.log(`📁 ${dir} 디렉토리 검사 중...`);
    const files = findMarkdownFiles(dir);
    
    for (const filePath of files) {
      totalFiles++;
      
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const metadata = extractFrontmatter(content);
        
        if (!metadata) {
          console.log(`❌ ${filePath}: frontmatter가 없습니다.`);
          errorCount++;
          continue;
        }
        
        const errors = validateMetadata(metadata, filePath);
        
        if (errors.length === 0) {
          console.log(`✅ ${filePath}: 검증 통과`);
          validFiles++;
        } else {
          console.log(`❌ ${filePath}:`);
          errors.forEach(error => console.log(`   - ${error}`));
          errorCount += errors.length;
        }
        
      } catch (error) {
        console.log(`❌ ${filePath}: ${error.message}`);
        errorCount++;
      }
    }
  }
  
  console.log('\n📊 검증 결과:');
  console.log(`   총 파일 수: ${totalFiles}`);
  console.log(`   유효한 파일: ${validFiles}`);
  console.log(`   오류 파일: ${totalFiles - validFiles}`);
  console.log(`   총 오류 수: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n❌ 검증 실패! 위의 오류들을 수정해주세요.');
    process.exit(1);
  } else {
    console.log('\n✅ 모든 문서가 메타데이터 스키마를 준수합니다!');
  }
}

// CLI 실행
if (require.main === module) {
  const args = process.argv.slice(2);
  const directories = args.length > 0 ? args : ['docs', 'blog'];
  
  validateDocuments(directories);
}

module.exports = { validateMetadata, extractFrontmatter };