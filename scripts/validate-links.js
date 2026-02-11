#!/usr/bin/env node

/**
 * Link Validation Script
 * 
 * This script validates all internal and external links in markdown files
 * to ensure they are working and accessible.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');
const https = require('https');
const http = require('http');

// Configuration
const DOCS_DIR = path.join(__dirname, '..', 'docs');
const BLOG_DIR = path.join(__dirname, '..', 'blog');
const STATIC_DIR = path.join(__dirname, '..', 'static');

// Link patterns
const LINK_PATTERNS = {
  markdown: /\[([^\]]*)\]\(([^)]+)\)/g,
  html: /<a[^>]+href=["']([^"']+)["'][^>]*>/g,
  image: /!\[([^\]]*)\]\(([^)]+)\)/g
};

// Results tracking
const results = {
  totalFiles: 0,
  totalLinks: 0,
  brokenLinks: [],
  missingImages: [],
  invalidAnchors: [],
  externalLinks: [],
  warnings: []
};

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

// Extract links from markdown content
function extractLinks(content, filePath) {
  const links = [];
  
  // Extract markdown links
  let match;
  while ((match = LINK_PATTERNS.markdown.exec(content)) !== null) {
    links.push({
      type: 'link',
      text: match[1],
      url: match[2],
      line: getLineNumber(content, match.index)
    });
  }
  
  // Extract HTML links
  LINK_PATTERNS.html.lastIndex = 0;
  while ((match = LINK_PATTERNS.html.exec(content)) !== null) {
    links.push({
      type: 'html-link',
      text: '',
      url: match[1],
      line: getLineNumber(content, match.index)
    });
  }
  
  // Extract images
  LINK_PATTERNS.image.lastIndex = 0;
  while ((match = LINK_PATTERNS.image.exec(content)) !== null) {
    links.push({
      type: 'image',
      text: match[1],
      url: match[2],
      line: getLineNumber(content, match.index)
    });
  }
  
  return links;
}

// Get line number for a given index in content
function getLineNumber(content, index) {
  return content.substring(0, index).split('\n').length;
}

// Check if internal link exists
function checkInternalLink(url, currentFilePath) {
  // Remove anchor
  const [linkPath, anchor] = url.split('#');
  
  if (!linkPath) {
    // Just an anchor link, check if anchor exists in current file
    return checkAnchorInFile(currentFilePath, anchor);
  }
  
  // Resolve relative path
  const currentDir = path.dirname(currentFilePath);
  let targetPath;
  
  if (linkPath.startsWith('/')) {
    // Check Docusaurus static directory first for /img/, /assets/ paths
    const staticPath = path.join(STATIC_DIR, linkPath.substring(1));
    if (fs.existsSync(staticPath)) {
      return { exists: true };
    }
    // Absolute path from root
    targetPath = path.join(__dirname, '..', linkPath.substring(1));
  } else {
    // Relative path
    targetPath = path.resolve(currentDir, linkPath);
  }
  
  // Check if file exists
  if (fs.existsSync(targetPath)) {
    if (anchor) {
      return checkAnchorInFile(targetPath, anchor);
    }
    return { exists: true };
  }
  
  // Try with .md extension
  if (fs.existsSync(targetPath + '.md')) {
    if (anchor) {
      return checkAnchorInFile(targetPath + '.md', anchor);
    }
    return { exists: true };
  }
  
  // Try as directory with index.md
  const indexPath = path.join(targetPath, 'index.md');
  if (fs.existsSync(indexPath)) {
    if (anchor) {
      return checkAnchorInFile(indexPath, anchor);
    }
    return { exists: true };
  }
  
  return { exists: false, reason: 'File not found' };
}

// Convert heading text to slug format (handles Unicode/Korean characters)
function headingToSlug(heading) {
  return heading
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, '') // keep letters (incl unicode), numbers, spaces, hyphens
    .replace(/\s+/g, '-')              // spaces to hyphens
    .replace(/-+/g, '-')               // collapse multiple hyphens
    .replace(/^-|-$/g, '');            // trim leading/trailing hyphens
}

// Check if anchor exists in file
function checkAnchorInFile(filePath, anchor) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { content: body } = matter(content);

    // Extract all headings and convert to slugs
    const headingRegex = /^#+\s+(.+)$/gm;
    let match;
    while ((match = headingRegex.exec(body)) !== null) {
      const slug = headingToSlug(match[1]);
      if (slug === anchor) {
        return { exists: true };
      }
    }

    // Check for explicit anchor tags
    const anchorPattern = new RegExp(`<a[^>]+(?:id|name)=["']${anchor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>`, 'i');
    if (anchorPattern.test(body)) {
      return { exists: true };
    }

    return { exists: false, reason: `Anchor '#${anchor}' not found` };
  } catch (error) {
    return { exists: false, reason: `Error reading file: ${error.message}` };
  }
}

// Check external link
function checkExternalLink(url) {
  return new Promise((resolve) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      method: 'HEAD',
      timeout: 5000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; LinkChecker/1.0)'
      }
    };
    
    const req = client.request(url, options, (res) => {
      resolve({
        exists: res.statusCode >= 200 && res.statusCode < 400,
        statusCode: res.statusCode,
        reason: res.statusCode >= 400 ? `HTTP ${res.statusCode}` : null
      });
    });
    
    req.on('error', (error) => {
      resolve({
        exists: false,
        reason: error.message
      });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({
        exists: false,
        reason: 'Request timeout'
      });
    });
    
    req.end();
  });
}

// Validate links in a file
async function validateFile(file) {
  try {
    const content = fs.readFileSync(file.fullPath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);
    
    const links = extractLinks(body, file.fullPath);
    results.totalLinks += links.length;
    
    console.log(`Checking ${file.relativePath} (${links.length} links)...`);
    
    for (const link of links) {
      if (link.url.startsWith('http://') || link.url.startsWith('https://')) {
        // External link
        results.externalLinks.push({
          file: file.relativePath,
          line: link.line,
          url: link.url,
          type: link.type
        });
        
        const result = await checkExternalLink(link.url);
        if (!result.exists) {
          results.brokenLinks.push({
            file: file.relativePath,
            line: link.line,
            url: link.url,
            type: link.type,
            reason: result.reason
          });
        }
      } else if (link.url.startsWith('mailto:') || link.url.startsWith('tel:')) {
        // Skip mailto and tel links
        continue;
      } else {
        // Internal link
        if (link.type === 'image') {
          // Check if image exists
          const imagePath = link.url.startsWith('/') 
            ? path.join(STATIC_DIR, link.url.substring(1))
            : path.resolve(path.dirname(file.fullPath), link.url);
            
          if (!fs.existsSync(imagePath)) {
            results.missingImages.push({
              file: file.relativePath,
              line: link.line,
              url: link.url,
              reason: 'Image file not found'
            });
          }
        } else {
          // Check internal link
          const result = checkInternalLink(link.url, file.fullPath);
          if (!result.exists) {
            results.brokenLinks.push({
              file: file.relativePath,
              line: link.line,
              url: link.url,
              type: link.type,
              reason: result.reason
            });
          }
        }
      }
    }
  } catch (error) {
    results.warnings.push({
      file: file.relativePath,
      message: `Error processing file: ${error.message}`
    });
  }
}

// Generate report
function generateReport() {
  console.log('\\n📊 Link Validation Report');
  console.log('========================');
  console.log(`Total files checked: ${results.totalFiles}`);
  console.log(`Total links found: ${results.totalLinks}`);
  console.log(`External links: ${results.externalLinks.length}`);
  console.log(`Broken links: ${results.brokenLinks.length}`);
  console.log(`Missing images: ${results.missingImages.length}`);
  console.log(`Warnings: ${results.warnings.length}`);
  
  if (results.brokenLinks.length > 0) {
    console.log('\\n❌ Broken Links:');
    results.brokenLinks.forEach(link => {
      console.log(`   ${link.file}:${link.line} - ${link.url}`);
      console.log(`     Reason: ${link.reason}`);
    });
  }
  
  if (results.missingImages.length > 0) {
    console.log('\\n🖼️  Missing Images:');
    results.missingImages.forEach(image => {
      console.log(`   ${image.file}:${image.line} - ${image.url}`);
      console.log(`     Reason: ${image.reason}`);
    });
  }
  
  if (results.warnings.length > 0) {
    console.log('\\n⚠️  Warnings:');
    results.warnings.forEach(warning => {
      console.log(`   ${warning.file} - ${warning.message}`);
    });
  }
  
  if (results.brokenLinks.length === 0 && results.missingImages.length === 0) {
    console.log('\\n✅ All links are valid!');
  }
  
  return results.brokenLinks.length === 0 && results.missingImages.length === 0;
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const checkExternal = args.includes('--external');
  const verbose = args.includes('--verbose');
  
  console.log('🔗 Starting link validation...');
  if (!checkExternal) {
    console.log('   (Use --external to check external links)');
  }
  
  // Scan all markdown files
  const docsFiles = scanMarkdownFiles(DOCS_DIR);
  const blogFiles = scanMarkdownFiles(BLOG_DIR);
  const allFiles = [...docsFiles, ...blogFiles];
  
  results.totalFiles = allFiles.length;
  console.log(`Found ${allFiles.length} markdown files`);
  
  // Validate each file
  for (const file of allFiles) {
    await validateFile(file);
  }
  
  // Generate and display report
  const success = generateReport();
  
  // Exit with appropriate code
  process.exit(success ? 0 : 1);
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  scanMarkdownFiles,
  extractLinks,
  checkInternalLink,
  checkExternalLink,
  validateFile,
  generateReport
};