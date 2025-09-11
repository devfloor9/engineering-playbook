#!/usr/bin/env node

/**
 * Tag Pages Generator Script
 * 
 * This script automatically generates tag-based listing pages for the EKS Engineering Playbook.
 * It scans all markdown files, extracts tags from frontmatter, and creates tag pages.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Configuration
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const TAGS_OUTPUT_DIR = path.join(__dirname, '..', 'src', 'pages', 'tags');

// Ensure tags directory exists
if (!fs.existsSync(TAGS_OUTPUT_DIR)) {
  fs.mkdirSync(TAGS_OUTPUT_DIR, { recursive: true });
}

// Scan directory for markdown files
function scanMarkdownFiles(dir, basePath = '') {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...scanMarkdownFiles(fullPath, path.join(basePath, item)));
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      files.push({
        fullPath,
        relativePath: path.join(basePath, item),
        name: item
      });
    }
  }
  
  return files;
}

// Extract metadata from markdown file
function extractMetadata(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data, content: body } = matter(content);
    
    return {
      ...data,
      wordCount: body.split(/\s+/).length,
      excerpt: body.substring(0, 200).replace(/[#*`]/g, '').trim() + '...'
    };
  } catch (error) {
    console.warn(`Warning: Could not parse ${filePath}:`, error.message);
    return {};
  }
}

// Generate tag statistics
function generateTagStats(documents) {
  const tagStats = {};
  
  documents.forEach(doc => {
    if (doc.metadata.tags) {
      doc.metadata.tags.forEach(tag => {
        if (!tagStats[tag]) {
          tagStats[tag] = {
            count: 0,
            documents: [],
            categories: new Set(),
            totalWords: 0
          };
        }
        
        tagStats[tag].count++;
        tagStats[tag].documents.push(doc);
        tagStats[tag].totalWords += doc.metadata.wordCount || 0;
        
        if (doc.metadata.category) {
          tagStats[tag].categories.add(doc.metadata.category);
        }
      });
    }
  });
  
  // Convert categories Set to Array
  Object.keys(tagStats).forEach(tag => {
    tagStats[tag].categories = Array.from(tagStats[tag].categories);
  });
  
  return tagStats;
}

// Generate tag page content
function generateTagPageContent(tag, stats) {
  const { count, documents, categories, totalWords } = stats;
  
  // Sort documents by date (newest first)
  const sortedDocs = documents.sort((a, b) => {
    const dateA = new Date(a.metadata.date || '1970-01-01');
    const dateB = new Date(b.metadata.date || '1970-01-01');
    return dateB - dateA;
  });
  
  const categoryList = categories.length > 0 
    ? categories.map(cat => `"${cat}"`).join(', ')
    : '없음';
  
  return `import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import TagList from '@site/src/components/TagList';

export default function Tag${tag.charAt(0).toUpperCase() + tag.slice(1)}Page() {
  const documents = ${JSON.stringify(sortedDocs.map(doc => ({
    title: doc.metadata.title || doc.name,
    path: doc.path,
    description: doc.metadata.description || doc.metadata.excerpt || '',
    date: doc.metadata.date,
    category: doc.metadata.category,
    tags: doc.metadata.tags || [],
    authors: doc.metadata.authors || [],
    difficulty: doc.metadata.difficulty,
    estimatedTime: doc.metadata.estimated_time
  })), null, 2)};

  return (
    <Layout
      title={\`#${tag} 태그 문서 목록\`}
      description={\`${tag} 태그가 포함된 EKS Engineering Playbook 문서들을 확인하세요.\`}
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <header className="margin-bottom--xl">
              <h1>
                <span style={{
                  backgroundColor: 'var(--ifm-color-primary)',
                  color: 'white',
                  padding: '0.5rem 1rem',
                  borderRadius: '2rem',
                  fontSize: '1.5rem'
                }}>
                  #{tag}
                </span>
              </h1>
              <div className="margin-top--md">
                <div className="row">
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          ${count}
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>문서</p>
                      </div>
                    </div>
                  </div>
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          ${categories.length}
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>카테고리</p>
                      </div>
                    </div>
                  </div>
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          ${Math.round(totalWords / 1000)}k
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>단어</p>
                      </div>
                    </div>
                  </div>
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          ${Math.round(totalWords / 200)}
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>분 읽기</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="margin-top--md" style={{fontSize: '1.1rem'}}>
                <strong>관련 카테고리:</strong> ${categoryList}
              </p>
            </header>

            <section>
              <h2>문서 목록</h2>
              <div className="row">
                {documents.map((doc, index) => (
                  <div key={index} className="col col--12 margin-bottom--lg">
                    <div className="card">
                      <div className="card__body">
                        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem'}}>
                          <h3 style={{margin: 0, flex: 1}}>
                            <Link to={doc.path} style={{textDecoration: 'none'}}>
                              {doc.title}
                            </Link>
                          </h3>
                          {doc.category && (
                            <span style={{
                              backgroundColor: getCategoryColor(doc.category),
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.5rem',
                              fontSize: '0.8rem',
                              marginLeft: '1rem'
                            }}>
                              {getCategoryName(doc.category)}
                            </span>
                          )}
                        </div>
                        
                        {doc.description && (
                          <p style={{
                            color: 'var(--ifm-color-emphasis-700)',
                            marginBottom: '0.5rem'
                          }}>
                            {doc.description}
                          </p>
                        )}
                        
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          fontSize: '0.9rem',
                          color: 'var(--ifm-color-emphasis-600)'
                        }}>
                          <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                            {doc.date && (
                              <span>📅 {new Date(doc.date).toLocaleDateString('ko-KR')}</span>
                            )}
                            {doc.difficulty && (
                              <span>📊 {getDifficultyName(doc.difficulty)}</span>
                            )}
                            {doc.estimatedTime && (
                              <span>⏱️ {doc.estimatedTime}</span>
                            )}
                          </div>
                          <TagList tags={doc.tags.filter(t => t !== '${tag}')} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper functions
function getCategoryColor(category) {
  const colors = {
    'performance-networking': '#FF6B6B',
    'observability-monitoring': '#4ECDC4',
    'genai-aiml': '#45B7D1',
    'hybrid-multicloud': '#96CEB4',
    'security-compliance': '#FFEAA7'
  };
  return colors[category] || '#DDD';
}

function getCategoryName(category) {
  const names = {
    'performance-networking': '성능 & 네트워킹',
    'observability-monitoring': '관찰가능성',
    'genai-aiml': 'GenAI & AI/ML',
    'hybrid-multicloud': '하이브리드 클라우드',
    'security-compliance': '보안 & 컴플라이언스'
  };
  return names[category] || category;
}

function getDifficultyName(difficulty) {
  const names = {
    'beginner': '초급',
    'intermediate': '중급',
    'advanced': '고급'
  };
  return names[difficulty] || difficulty;
}`;
}

// Generate tags index page
function generateTagsIndexPage(tagStats) {
  const sortedTags = Object.entries(tagStats)
    .sort(([,a], [,b]) => b.count - a.count);
  
  return `import React, {useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function TagsIndexPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  const tagStats = ${JSON.stringify(tagStats, null, 2)};
  
  const filteredTags = Object.entries(tagStats).filter(([tag, stats]) => {
    const matchesSearch = tag.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
      stats.categories.includes(selectedCategory);
    return matchesSearch && matchesCategory;
  }).sort(([,a], [,b]) => b.count - a.count);
  
  const categories = [
    { value: 'all', label: '전체' },
    { value: 'performance-networking', label: '성능 & 네트워킹' },
    { value: 'observability-monitoring', label: '관찰가능성' },
    { value: 'genai-aiml', label: 'GenAI & AI/ML' },
    { value: 'hybrid-multicloud', label: '하이브리드 클라우드' },
    { value: 'security-compliance', label: '보안 & 컴플라이언스' }
  ];

  return (
    <Layout
      title="태그 목록"
      description="EKS Engineering Playbook의 모든 태그를 확인하고 관련 문서를 찾아보세요."
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <header className="margin-bottom--xl text--center">
              <h1>📋 태그 목록</h1>
              <p style={{fontSize: '1.1rem', color: 'var(--ifm-color-emphasis-700)'}}>
                총 <strong>{Object.keys(tagStats).length}개</strong>의 태그로 분류된 문서들을 확인하세요
              </p>
            </header>

            <div className="margin-bottom--lg">
              <div className="row">
                <div className="col col--8">
                  <input
                    type="text"
                    placeholder="태그 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--ifm-color-emphasis-300)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  />
                </div>
                <div className="col col--4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid var(--ifm-color-emphasis-300)',
                      borderRadius: '0.5rem',
                      fontSize: '1rem'
                    }}
                  >
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="row">
              {filteredTags.map(([tag, stats]) => (
                <div key={tag} className="col col--6 col--lg-4 margin-bottom--md">
                  <Link
                    to={\`/tags/\${tag}\`}
                    className="card"
                    style={{
                      textDecoration: 'none',
                      height: '100%',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div className="card__body">
                      <h3 style={{
                        margin: '0 0 0.5rem 0',
                        color: 'var(--ifm-color-primary)',
                        fontSize: '1.1rem'
                      }}>
                        #{tag}
                      </h3>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem'
                      }}>
                        <span style={{
                          backgroundColor: 'var(--ifm-color-primary)',
                          color: 'white',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '1rem',
                          fontSize: '0.8rem'
                        }}>
                          {stats.count}개 문서
                        </span>
                        <span style={{
                          color: 'var(--ifm-color-emphasis-600)',
                          fontSize: '0.8rem'
                        }}>
                          {Math.round(stats.totalWords / 200)}분 읽기
                        </span>
                      </div>
                      {stats.categories.length > 0 && (
                        <div style={{fontSize: '0.8rem', color: 'var(--ifm-color-emphasis-600)'}}>
                          카테고리: {stats.categories.join(', ')}
                        </div>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
            
            {filteredTags.length === 0 && (
              <div className="text--center margin-vert--xl">
                <h3>검색 결과가 없습니다</h3>
                <p>다른 검색어나 카테고리를 시도해보세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}`;
}

// Main function
function main() {
  console.log('🏷️  Generating tag pages...');
  
  // Scan all markdown files
  const docsFiles = scanMarkdownFiles(DOCS_DIR);
  const blogFiles = scanMarkdownFiles(BLOG_DIR);
  const allFiles = [...docsFiles, ...blogFiles];
  
  console.log(`Found ${allFiles.length} markdown files`);
  
  // Extract metadata from all files
  const documents = allFiles.map(file => {
    const metadata = extractMetadata(file.fullPath);
    const isDoc = file.fullPath.includes('/docs/');
    const isBlog = file.fullPath.includes('/blog/');
    
    let urlPath;
    if (isDoc) {
      urlPath = '/docs/' + file.relativePath.replace(/\.mdx?$/, '').replace(/\/README$/, '');
    } else if (isBlog) {
      urlPath = '/blog/' + file.relativePath.replace(/\.mdx?$/, '');
    } else {
      urlPath = '/' + file.relativePath.replace(/\.mdx?$/, '');
    }
    
    return {
      ...file,
      metadata,
      path: urlPath,
      type: isDoc ? 'doc' : isBlog ? 'blog' : 'page'
    };
  }).filter(doc => doc.metadata.tags && doc.metadata.tags.length > 0);
  
  console.log(`Found ${documents.length} documents with tags`);
  
  // Generate tag statistics
  const tagStats = generateTagStats(documents);
  const tagCount = Object.keys(tagStats).length;
  
  console.log(`Generated statistics for ${tagCount} tags`);
  
  // Generate individual tag pages
  let generatedPages = 0;
  Object.entries(tagStats).forEach(([tag, stats]) => {
    const pageContent = generateTagPageContent(tag, stats);
    const fileName = \`\${tag}.js\`;
    const filePath = path.join(TAGS_OUTPUT_DIR, fileName);
    
    fs.writeFileSync(filePath, pageContent);
    generatedPages++;
  });
  
  // Generate tags index page
  const indexContent = generateTagsIndexPage(tagStats);
  const indexPath = path.join(TAGS_OUTPUT_DIR, 'index.js');
  fs.writeFileSync(indexPath, indexContent);
  
  console.log(\`✅ Generated \${generatedPages} tag pages and 1 index page\`);
  console.log(\`📁 Output directory: \${TAGS_OUTPUT_DIR}\`);
  
  // Generate summary
  const topTags = Object.entries(tagStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10);
  
  console.log('\\n📊 Top 10 tags:');
  topTags.forEach(([tag, stats]) => {
    console.log(\`   \${tag}: \${stats.count} documents\`);
  });
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  scanMarkdownFiles,
  extractMetadata,
  generateTagStats,
  generateTagPageContent,
  generateTagsIndexPage
};