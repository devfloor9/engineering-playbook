#!/usr/bin/env node

/**
 * Metadata Validation Script
 * 
 * This script validates frontmatter metadata in markdown files
 * according to the defined schema and best practices.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Define required metadata schema
const REQUIRED_FIELDS = {
  docs: ['title', 'description', 'tags'],
  blog: ['title', 'authors', 'tags']
};

const VALID_CATEGORIES = [
  'performance-networking',
  'observability-monitoring', 
  'genai-aiml',
  'hybrid-multicloud',
  'security-compliance',
  'setup'
];

const VALID_DIFFICULTIES = ['beginner', 'intermediate', 'advanced'];

function validateMetadata(filePath, type = 'docs') {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);
    
    const errors = [];
    const warnings = [];
    
    // Check required fields
    REQUIRED_FIELDS[type].forEach(field => {
      if (!frontmatter[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    });
    
    // Validate title
    if (frontmatter.title && frontmatter.title.length > 60) {
      warnings.push(`Title is ${frontmatter.title.length} characters (recommended: ≤60 for SEO)`);
    }
    
    // Validate description
    if (frontmatter.description && frontmatter.description.length > 160) {
      warnings.push(`Description is ${frontmatter.description.length} characters (recommended: ≤160 for SEO)`);
    }
    
    // Validate tags
    if (frontmatter.tags) {
      if (!Array.isArray(frontmatter.tags)) {
        errors.push('Tags must be an array');
      } else if (frontmatter.tags.length === 0) {
        errors.push('At least one tag is required');
      } else if (frontmatter.tags.length > 8) {
        warnings.push(`${frontmatter.tags.length} tags found (recommended: ≤5)`);
      }
    }
    
    // Validate category
    if (frontmatter.category && !VALID_CATEGORIES.includes(frontmatter.category)) {
      errors.push(`Invalid category: '${frontmatter.category}'. Valid options: ${VALID_CATEGORIES.join(', ')}`);
    }
    
    // Validate difficulty
    if (frontmatter.difficulty && !VALID_DIFFICULTIES.includes(frontmatter.difficulty)) {
      errors.push(`Invalid difficulty: '${frontmatter.difficulty}'. Valid options: ${VALID_DIFFICULTIES.join(', ')}`);
    }
    
    // Validate date format
    if (frontmatter.date) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(frontmatter.date)) {
        errors.push('Date must be in YYYY-MM-DD format');
      }
    }
    
    return { errors, warnings, frontmatter };
  } catch (error) {
    return {
      errors: [`Failed to parse file: ${error.message}`],
      warnings: [],
      frontmatter: {}
    };
  }
}

function scanDirectory(dir) {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...scanDirectory(fullPath));
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function main() {
  const docsDir = path.join(__dirname, '..', 'docs');
  const blogDir = path.join(__dirname, '..', 'blog');
  
  console.log('🔍 Validating metadata...');
  
  let totalFiles = 0;
  let totalErrors = 0;
  let totalWarnings = 0;
  
  // Validate docs
  const docsFiles = scanDirectory(docsDir);
  console.log(`\nChecking ${docsFiles.length} documentation files...`);
  
  docsFiles.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const { errors, warnings } = validateMetadata(filePath, 'docs');
    
    totalFiles++;
    totalErrors += errors.length;
    totalWarnings += warnings.length;
    
    if (errors.length > 0 || warnings.length > 0) {
      console.log(`\n📄 ${relativePath}`);
      
      errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
      
      warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning}`);
      });
    }
  });
  
  // Validate blog posts
  const blogFiles = scanDirectory(blogDir);
  console.log(`\nChecking ${blogFiles.length} blog files...`);
  
  blogFiles.forEach(filePath => {
    const relativePath = path.relative(process.cwd(), filePath);
    const { errors, warnings } = validateMetadata(filePath, 'blog');
    
    totalFiles++;
    totalErrors += errors.length;
    totalWarnings += warnings.length;
    
    if (errors.length > 0 || warnings.length > 0) {
      console.log(`\n📄 ${relativePath}`);
      
      errors.forEach(error => {
        console.log(`  ❌ ${error}`);
      });
      
      warnings.forEach(warning => {
        console.log(`  ⚠️  ${warning}`);
      });
    }
  });
  
  // Summary
  console.log(`\n📊 Validation Summary:`);
  console.log(`  Files checked: ${totalFiles}`);
  console.log(`  Errors: ${totalErrors}`);
  console.log(`  Warnings: ${totalWarnings}`);
  
  if (totalErrors === 0) {
    console.log(`\n✅ All metadata is valid!`);
  } else {
    console.log(`\n❌ Found ${totalErrors} errors that need to be fixed.`);
  }
  
  process.exit(totalErrors > 0 ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { validateMetadata, scanDirectory };