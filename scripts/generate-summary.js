// scripts/generate-summary.js
const fs = require('fs');
const path = require('path');

function generateSummary(dir, level = 0, basePath = '') {
  let summary = '';
  const items = fs.readdirSync(dir).sort();
  
  // 디렉토리와 파일 분리
  const dirs = [];
  const files = [];
  
  items.forEach(item => {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'scripts') {
      dirs.push(item);
    } else if (item.endsWith('.md') && item !== 'README.md' && item !== 'SUMMARY.md') {
      files.push(item);
    }
  });
  
  // README.md가 있으면 섹션 헤더로 사용
  const readmePath = path.join(dir, 'README.md');
  if (fs.existsSync(readmePath) && level > 0) {
    const indent = '  '.repeat(level - 1);
    const dirName = path.basename(dir);
    const prettyName = dirName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const relativePath = path.join(basePath, 'README.md').replace(/\\/g, '/');
    summary += `${indent}* [${prettyName}](${relativePath})\n`;
  }
  
  // 파일들 추가
  files.forEach(file => {
    const indent = '  '.repeat(level);
    const fileName = file.replace('.md', '');
    const prettyName = fileName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    const relativePath = path.join(basePath, file).replace(/\\/g, '/');
    summary += `${indent}* [${prettyName}](${relativePath})\n`;
  });
  
  // 하위 디렉토리 재귀 처리
  dirs.forEach(subDir => {
    const subPath = path.join(dir, subDir);
    const newBasePath = path.join(basePath, subDir);
    summary += generateSummary(subPath, level + 1, newBasePath);
  });
  
  return summary;
}

// 메인 SUMMARY.md 생성
function createGitBookSummary() {
  let summary = '# Summary\n\n';
  
  // 홈
  summary += '## 🏠 Home\n';
  summary += '* [Welcome](README.md)\n\n';
  
  // 섹션별 이모지 매핑
  const sectionEmojis = {
    'blog': '📝 Blog',
    'docs': '📚 Documentation',
    'standards': '🛠️ Engineering Standards',
    'resources': '🤖 Resources',
    'projects': '🚀 Projects'
  };
  
  // 루트 디렉토리 스캔
  const rootDirs = fs.readdirSync('.')
    .filter(item => {
      const stat = fs.statSync(item);
      return stat.isDirectory() && 
             !item.startsWith('.') && 
             item !== 'scripts' &&
             item !== 'node_modules';
    });
  
  rootDirs.forEach(dir => {
    const sectionTitle = sectionEmojis[dir] || dir;
    summary += `## ${sectionTitle}\n`;
    summary += generateSummary(dir, 1, dir);
    summary += '\n';
  });
  
  // SUMMARY.md 파일 쓰기
  fs.writeFileSync('SUMMARY.md', summary);
  console.log('✅ SUMMARY.md generated successfully!');
}

// 실행
createGitBookSummary();
