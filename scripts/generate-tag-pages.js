#!/usr/bin/env node

/**
 * Tag Pages Generator Script
 *
 * This script automatically generates tag-based listing pages for the Engineering Playbook.
 * It scans all markdown files, extracts tags from frontmatter, and creates tag pages.
 */

const fs = require('fs');
const path = require('path');
const {createHash} = require('node:crypto');
const matter = require('gray-matter');
const {Globby, getPluginI18nPath, loadFreshModule} = require('@docusaurus/utils');
const {applyTrailingSlash} = require('@docusaurus/utils-common');
const {documentRoute, blogRoute, contentOptions} = require('./tag-routes');
const {tagPageRoute} = require('../src/components/TagList/routes');

// Configuration
const SITE_DIR = path.join(__dirname, '..');

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

async function collectDocuments({siteDir = SITE_DIR, siteConfig}) {
  const i18n = siteConfig.i18n || {};
  const locales = i18n.locales || ['en'];
  const defaultLocale = i18n.defaultLocale || locales[0];
  const documents = [];
  for (const type of ['docs', 'blog']) {
    const options = contentOptions(siteConfig, type);
    if (!options) continue;
    const contentDir = path.resolve(siteDir, options.path);
    if (!fs.existsSync(contentDir)) continue;
    const sources = await Globby(options.include, {cwd: contentDir, ignore: options.exclude});
    for (const relativePath of sources.sort()) {
      const fullPath = path.join(contentDir, relativePath);
      const metadata = extractMetadata(fullPath);
      const pathsByLocale = {};
      const metadataByLocale = {};
      for (const locale of locales) {
        const localeConfig = i18n.localeConfigs?.[locale] || {};
        const localizedDir = getPluginI18nPath({
          localizationDir: path.resolve(siteDir, i18n.path || 'i18n', localeConfig.path || locale),
          pluginName: `docusaurus-plugin-content-${type}`,
          pluginId: options.id || 'default',
        });
        const localizedFile = path.join(localizedDir, type === 'docs' ? 'current' : '', relativePath);
        const localized = localeConfig.translate !== false && fs.existsSync(localizedFile)
          ? extractMetadata(localizedFile) : metadata;
        metadataByLocale[locale] = localized;
        pathsByLocale[locale] = localized.draft || localized.unlisted ? null
          : (type === 'docs' ? documentRoute : blogRoute)(relativePath, localized, options);
      }
      if (!locales.some(locale => pathsByLocale[locale] && metadataByLocale[locale].tags?.length)) continue;
      documents.push({
        fullPath, relativePath, name: path.basename(relativePath), metadata,
        path: pathsByLocale[defaultLocale], pathsByLocale, metadataByLocale,
        type: type === 'docs' ? 'doc' : 'blog',
      });
    }
  }
  return documents;
}

// Generate tag statistics
function generateTagStats(documents) {
  const tagStats = Object.create(null);
  const emptyStats = () => ({count: 0, categories: new Set(), totalWords: 0});
  const addMetadata = (stats, metadata) => {
    stats.count++;
    stats.totalWords += metadata.wordCount || 0;
    if (metadata.category) stats.categories.add(metadata.category);
  };

  for (const doc of documents) {
    const variants = Object.entries(doc.metadataByLocale || {default: doc.metadata})
      .filter(([locale]) => !doc.pathsByLocale || doc.pathsByLocale[locale]);
    const tags = new Set(variants.flatMap(([, metadata]) => metadata.tags || []));
    for (const tag of tags) {
      const stats = tagStats[tag] ||= {...emptyStats(), documents: [], byLocale: {}};
      const matching = variants.filter(([, metadata]) => metadata.tags?.includes(tag));
      stats.documents.push(doc);
      addMetadata(stats, matching[0][1]);
      for (const [locale, metadata] of matching) {
        addMetadata(stats.byLocale[locale] ||= emptyStats(), metadata);
      }
    }
  }
  for (const stats of Object.values(tagStats)) {
    for (const summary of [stats, ...Object.values(stats.byLocale)]) {
      summary.categories = [...summary.categories];
    }
  }
  return tagStats;
}

function documentListing(metadata, name) {
  return {
    title: metadata.title || name,
    description: metadata.description || metadata.excerpt || '',
    date: metadata.date,
    category: metadata.category,
    tags: metadata.tags || [],
    authors: metadata.authors || [],
    difficulty: metadata.difficulty,
    estimatedTime: metadata.estimated_time,
    wordCount: metadata.wordCount || 0,
  };
}

// Generate tag page content
function generateTagPageContent(tag, stats) {
  const {documents} = stats;
  
  // Sort documents by date (newest first)
  const sortedDocs = documents.sort((a, b) => {
    const dateA = new Date(a.metadata.date || '1970-01-01');
    const dateB = new Date(b.metadata.date || '1970-01-01');
    return dateB - dateA;
  });
  
  return `import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import TagList from '@site/src/components/TagList';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {documentRouteForLocale} from '@site/src/components/TagList/routes';

export default function Tag${tag.replace(/[^a-zA-Z0-9]/g, '').charAt(0).toUpperCase() + tag.replace(/[^a-zA-Z0-9]/g, '').slice(1)}Page() {
  const {i18n: {currentLocale}} = useDocusaurusContext();
  const tagName = ${JSON.stringify(tag)};
  const documents = ${JSON.stringify(sortedDocs.map(doc => ({
    ...documentListing(doc.metadata, doc.name),
    path: doc.path,
    pathsByLocale: doc.pathsByLocale,
    contentByLocale: doc.metadataByLocale && Object.fromEntries(
      Object.entries(doc.metadataByLocale).map(([locale, metadata]) =>
        [locale, documentListing(metadata, doc.name)])),
  })), null, 2)}.map(doc => ({
    ...doc, ...doc.contentByLocale?.[currentLocale],
    path: documentRouteForLocale(doc, currentLocale),
  })).filter(doc => doc.path && doc.tags.includes(tagName));
  const categories = [...new Set(documents.map(doc => doc.category).filter(Boolean))];
  const totalWords = documents.reduce((total, doc) => total + doc.wordCount, 0);
  const categoryList = categories.length ? categories.map(category => JSON.stringify(category)).join(', ') : '없음';

  return (
    <Layout
      title={\`#\${tagName} Tag Documentation\`}
      description={\`Documentation tagged with \${tagName} in the Engineering Playbook.\`}
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
                  #{tagName}
                </span>
              </h1>
              <div className="margin-top--md">
                <div className="row">
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          {documents.length}
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>문서</p>
                      </div>
                    </div>
                  </div>
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          {categories.length}
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>카테고리</p>
                      </div>
                    </div>
                  </div>
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          {Math.round(totalWords / 1000)}k
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>단어</p>
                      </div>
                    </div>
                  </div>
                  <div className="col col--3">
                    <div className="card">
                      <div className="card__body text--center">
                        <h3 style={{color: 'var(--ifm-color-primary)', margin: 0}}>
                          {Math.round(totalWords / 200)}
                        </h3>
                        <p style={{margin: 0, fontSize: '0.9rem'}}>분 읽기</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <p className="margin-top--md" style={{fontSize: '1.1rem'}}>
                <strong>관련 카테고리:</strong> {categoryList}
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
                              <span>{new Date(doc.date).toLocaleDateString('en-US')}</span>
                            )}
                            {doc.difficulty && (
                              <span>Level: {getDifficultyName(doc.difficulty)}</span>
                            )}
                            {doc.estimatedTime && (
                              <span>Read time: {doc.estimatedTime}</span>
                            )}
                          </div>
                          <TagList tags={doc.tags.filter(t => t !== tagName)} />
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
    'performance-networking': 'Infrastructure Optimization',
    'observability-monitoring': 'Operations & Observability',
    'genai-aiml': 'Agentic AI Platform',
    'hybrid-multicloud': 'Hybrid Infrastructure',
    'security-compliance': 'Security & Governance'
  };
  return names[category] || category;
}

function getDifficultyName(difficulty) {
  const names = {
    'beginner': 'Beginner',
    'intermediate': 'Intermediate',
    'advanced': 'Advanced'
  };
  return names[difficulty] || difficulty;
}`;
}

// Generate tags index page
function generateTagsIndexPage(tagStats) {
  const summaries = Object.fromEntries(Object.entries(tagStats).map(([tag, stats]) => [
    tag, {count: stats.count, categories: stats.categories, totalWords: stats.totalWords, byLocale: stats.byLocale},
  ]));
  
  return `import React, {useState} from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {tagPageRoute} from '@site/src/components/TagList/routes';

export default function TagsIndexPage() {
  const {i18n: {currentLocale}} = useDocusaurusContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const tagStats = Object.fromEntries(Object.entries(${JSON.stringify(summaries, null, 2)})
    .map(([tag, stats]) => [tag, stats.byLocale
      ? (stats.byLocale[currentLocale] || stats.byLocale.default) : stats])
    .filter(([, stats]) => stats?.count));

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
      description="Engineering Playbook의 모든 태그를 확인하고 관련 문서를 찾아보세요."
    >
      <div className="container margin-vert--lg">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <header className="margin-bottom--xl text--center">
              <h1>Tags</h1>
              <p style={{fontSize: '1.1rem', color: 'var(--ifm-color-emphasis-700)'}}>
                Browse <strong>{Object.keys(tagStats).length} tags</strong> to find relevant documentation
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
                    to={tagPageRoute(tag)}
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

const GENERATED_PREFIX = '// Generated by scripts/generate-tag-pages.js; sha256=';
const contentHash = content => createHash('sha256').update(content).digest('hex');
const generatedContent = content => `${GENERATED_PREFIX}${contentHash(content)}\n${content}`;
// Both slash variants address the same page, regardless of the site's preferred
// trailingSlash setting. Keep the emitted routes unchanged; canonicalize keys only.
const tagRouteKey = tag => applyTrailingSlash(tagPageRoute(tag), {
  baseUrl: '/', trailingSlash: false,
});

function isGeneratedOutput(content, relativePath) {
  if (content.startsWith(GENERATED_PREFIX)) {
    const newline = content.indexOf('\n');
    return newline !== -1 &&
      content.slice(GENERATED_PREFIX.length, newline) === contentHash(content.slice(newline + 1));
  }
  // Adopt only exact outputs of the pre-marker generator. Compare the entire
  // template and canonical JSON payload; a filename or partial header is not proof.
  try {
    if (relativePath === 'index.js') {
      const match = content.match(/  const tagStats = Object\.fromEntries\(Object\.entries\((\{[\s\S]*?\})\)\n    \.map/);
      if (!match) return false;
      const payload = JSON.stringify(JSON.parse(match[1]), null, 2);
      return content === generateTagsIndexPage({}).replace(
        '  const tagStats = Object.fromEntries(Object.entries({})',
        () => `  const tagStats = Object.fromEntries(Object.entries(${payload})`);
    }
    const match = content.match(/  const documents = (\[[\s\S]*?\])\.map\(doc => \(\{/);
    if (!match || !relativePath.endsWith('.js')) return false;
    const payload = JSON.stringify(JSON.parse(match[1]), null, 2);
    return content === generateTagPageContent(relativePath.slice(0, -3), {documents: []})
      .replace('  const documents = []', () => `  const documents = ${payload}`);
  } catch {
    return false;
  }
}

function readOutputFiles(outputDir) {
  const entries = new Map();
  if (!fs.existsSync(outputDir)) {
    // existsSync follows links and returns false for a dangling symlink.
    if (fs.lstatSync(outputDir, {throwIfNoEntry: false})) {
      throw new Error(`Refusing symlinked output directory: ${outputDir}`);
    }
    return entries;
  }
  if (!fs.lstatSync(outputDir).isDirectory()) {
    throw new Error(`Output directory is not a regular directory: ${outputDir}`);
  }
  function visit(directory, prefix = '') {
    for (const entry of fs.readdirSync(directory, {withFileTypes: true})) {
      const relative = prefix + entry.name;
      const fullPath = path.join(directory, entry.name);
      if (entry.isDirectory()) {
        entries.set(relative, {directory: true});
        visit(fullPath, `${relative}/`);
      } else {
        const content = entry.isFile() && relative.endsWith('.js')
          ? fs.readFileSync(fullPath, 'utf8') : null;
        entries.set(relative, {
          content,
          generated: content !== null && isGeneratedOutput(content, relative),
        });
      }
    }
  }
  visit(outputDir);
  return entries;
}

function planOutputs(outputDir, tagStats) {
  const routes = new Set([tagRouteKey('index')]);
  const planned = new Map();
  for (const [tag, stats] of Object.entries(tagStats)) {
    const relative = path.relative(outputDir, path.resolve(outputDir, `${tag}.js`));
    if (relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error(`Tag filename leaves the output directory: ${tag}`);
    }
    if (tag.includes('\\') || tag.split('/').some(part => !part || part === '.' || part === '..')) {
      throw new Error(`Unsupported generated tag filename: ${tag}`);
    }
    const route = tagRouteKey(tag);
    if (routes.has(route)) throw new Error(`Duplicate generated tag route: ${route}`);
    routes.add(route);
    planned.set(`${tag}.js`, generatedContent(generateTagPageContent(tag, stats)));
  }
  planned.set('index.js', generatedContent(generateTagsIndexPage(tagStats)));

  const existing = readOutputFiles(outputDir);
  for (const relative of planned.keys()) {
    const entry = existing.get(relative);
    if (entry && !entry.generated) {
      throw new Error(`Refusing to overwrite manual or modified output: ${relative}`);
    }
    for (let parent = path.posix.dirname(relative); parent !== '.'; parent = path.posix.dirname(parent)) {
      if (existing.has(parent) && !existing.get(parent).directory) {
        throw new Error(`Output parent is not a regular directory: ${parent}`);
      }
    }
  }
  for (const [relative, entry] of existing) {
    if (!entry.generated && !entry.directory && relative.endsWith('.js') &&
        routes.has(tagRouteKey(relative.slice(0, -3)))) {
      throw new Error(`Generated tag route conflicts with manual output: ${relative}`);
    }
  }
  return {
    planned,
    obsolete: [...existing].filter(([relative, entry]) => entry.generated && !planned.has(relative))
      .map(([relative]) => relative),
  };
}

// Main function
async function main({siteDir = SITE_DIR, siteConfig, outputDir = path.join(siteDir, 'src/pages/tags')} = {}) {
  console.log('🏷️  Generating tag pages...');
  const config = siteConfig || await loadFreshModule(path.join(siteDir, 'docusaurus.config.js'));
  const documents = await collectDocuments({siteDir, siteConfig: config});
  
  console.log(`Found ${documents.length} documents with tags`);
  
  // Generate tag statistics
  const tagStats = generateTagStats(documents);
  const tagCount = Object.keys(tagStats).length;
  
  console.log(`Generated statistics for ${tagCount} tags`);

  // Validate the complete write/delete plan before changing any output.
  const {planned, obsolete} = planOutputs(outputDir, tagStats);
  fs.mkdirSync(outputDir, {recursive: true});
  for (const [relative, content] of planned) {
    const filePath = path.join(outputDir, relative);
    fs.mkdirSync(path.dirname(filePath), {recursive: true});
    fs.writeFileSync(filePath, content);
  }
  // Unlink only verified generated files; leave manual files and directories alone.
  for (const relative of obsolete) fs.unlinkSync(path.join(outputDir, relative));
  const generatedPages = tagCount;
  
  console.log(`✅ Generated ${generatedPages} tag pages and 1 index page`);
  console.log(`📁 Output directory: ${outputDir}`);
  
  // Generate summary
  const topTags = Object.entries(tagStats)
    .sort(([,a], [,b]) => b.count - a.count)
    .slice(0, 10);
  
  console.log('\\n📊 Top 10 tags:');
  topTags.forEach(([tag, stats]) => {
    console.log(`   ${tag}: ${stats.count} documents`);
  });
  return {documents, tagStats, generatedPages, removedPages: obsolete.length, outputDir};
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = {
  scanMarkdownFiles,
  extractMetadata,
  generateTagStats,
  generateTagPageContent,
  generateTagsIndexPage,
  collectDocuments,
  main
};
