const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// 태그 수집 함수
function collectTags() {
  const tags = new Set();
  const docsDir = path.join(__dirname, '..', 'docs');
  
  function scanDirectory(dir) {
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (file.endsWith('.md') || file.endsWith('.mdx')) {
        const content = fs.readFileSync(filePath, 'utf8');
        const { data } = matter(content);
        
        if (data.tags && Array.isArray(data.tags)) {
          data.tags.forEach(tag => tags.add(tag));
        }
      }
    });
  }
  
  scanDirectory(docsDir);
  return Array.from(tags);
}

// 태그 페이지 생성
function generateTagPages() {
  const tags = collectTags();
  const tagsDir = path.join(__dirname, '..', 'src', 'pages', 'tags');
  
  // tags 디렉토리 생성
  if (!fs.existsSync(tagsDir)) {
    fs.mkdirSync(tagsDir, { recursive: true });
  }
  
  // 각 태그별 페이지 생성
  tags.forEach(tag => {
    const fileName = `${tag}.js`;
    const filePath = path.join(tagsDir, fileName);
    
    const content = `import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function TagPage() {
  return (
    <Layout title="#${tag} 태그 문서">
      <div className="container margin-vert--lg">
        <h1>#{tag}</h1>
        <p>${tag} 태그가 포함된 문서 목록입니다.</p>
      </div>
    </Layout>
  );
}`;
    
    fs.writeFileSync(filePath, content);
    console.log(`Generated: ${fileName}`);
  });
  
  // 태그 인덱스 페이지 생성
  const indexContent = `import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const tags = ${JSON.stringify(tags, null, 2)};

export default function TagsIndex() {
  return (
    <Layout title="모든 태그">
      <div className="container margin-vert--lg">
        <h1>태그 목록</h1>
        <div className="row">
          {tags.map(tag => (
            <div key={tag} className="col col--3 margin-bottom--lg">
              <Link to={\`/tags/\${tag}\`}>#{tag}</Link>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}`;
  
  fs.writeFileSync(path.join(tagsDir, 'index.js'), indexContent);
  console.log('Generated: tags/index.js');
  
  console.log(`✅ ${tags.length}개의 태그 페이지 생성 완료!`);
}

// 실행
generateTagPages();
