#!/usr/bin/env node

/**
 * Auto-Categorization Script
 * 
 * This script automatically suggests categories and tags for documents
 * based on their content, title, and existing metadata.
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Category definitions with keywords
const CATEGORY_KEYWORDS = {
  'performance-networking': {
    keywords: [
      'dns', 'coredns', 'networking', 'network', 'performance', 'latency',
      'cilium', 'calico', 'cni', 'eni', 'vpc', 'subnet', 'routing',
      'bandwidth', 'throughput', 'optimization', 'tuning', 'load balancer',
      'ingress', 'egress', 'service mesh', 'istio', 'envoy'
    ],
    weight: 1.0
  },
  'observability-monitoring': {
    keywords: [
      'monitoring', 'observability', 'metrics', 'logs', 'traces',
      'prometheus', 'grafana', 'alertmanager', 'hubble', 'jaeger',
      'datadog', 'newrelic', 'cloudwatch', 'logging', 'alerting',
      'dashboard', 'visualization', 'sli', 'slo', 'error rate'
    ],
    weight: 1.0
  },
  'genai-aiml': {
    keywords: [
      'ai', 'ml', 'machine learning', 'artificial intelligence',
      'gpu', 'cuda', 'nvidia', 'mig', 'time-slicing', 'genai',
      'llm', 'large language model', 'inference', 'training',
      'pytorch', 'tensorflow', 'jupyter', 'notebook', 'model',
      'langfuse', 'huggingface', 'transformer'
    ],
    weight: 1.0
  },
  'hybrid-multicloud': {
    keywords: [
      'hybrid', 'multi-cloud', 'multicloud', 'on-premises', 'edge',
      'outposts', 'wavelength', 'local zones', 'bursting',
      'federation', 'cluster api', 'crossplane', 'anthos',
      'azure arc', 'aws outposts', 'vmware', 'openshift'
    ],
    weight: 1.0
  },
  'security-compliance': {
    keywords: [
      'security', 'compliance', 'rbac', 'iam', 'authentication',
      'authorization', 'encryption', 'tls', 'ssl', 'certificate',
      'policy', 'opa', 'gatekeeper', 'falco', 'admission controller',
      'pod security', 'network policy', 'service account',
      'secrets', 'vault', 'rosa', 'pci', 'hipaa', 'sox'
    ],
    weight: 1.0
  }
};

// Tag suggestions based on content analysis
const TAG_PATTERNS = {
  // Core technologies
  'eks': /\b(eks|elastic kubernetes service)\b/gi,
  'kubernetes': /\b(kubernetes|k8s)\b/gi,
  'aws': /\b(aws|amazon web services)\b/gi,
  
  // Networking
  'dns': /\b(dns|domain name|coredns)\b/gi,
  'cilium': /\bcilium\b/gi,
  'calico': /\bcalico\b/gi,
  'networking': /\b(network|networking|vpc|subnet)\b/gi,
  'load-balancer': /\b(load.?balancer|alb|nlb|elb)\b/gi,
  
  // Monitoring
  'prometheus': /\bprometheus\b/gi,
  'grafana': /\bgrafana\b/gi,
  'monitoring': /\b(monitor|monitoring|observability)\b/gi,
  'logging': /\b(log|logging|logs)\b/gi,
  'metrics': /\b(metric|metrics|telemetry)\b/gi,
  
  // AI/ML
  'gpu': /\b(gpu|graphics processing unit|cuda)\b/gi,
  'ai': /\b(ai|artificial intelligence)\b/gi,
  'ml': /\b(ml|machine learning)\b/gi,
  'genai': /\b(genai|generative ai|llm|large language model)\b/gi,
  
  // Security
  'security': /\b(security|secure|encryption)\b/gi,
  'rbac': /\b(rbac|role.?based access control)\b/gi,
  'iam': /\b(iam|identity and access management)\b/gi,
  'compliance': /\b(compliance|compliant|audit)\b/gi,
  
  // Performance
  'performance': /\b(performance|optimization|tuning)\b/gi,
  'scaling': /\b(scal|autoscal|hpa|vpa|cluster.?autoscaler)\b/gi,
  
  // Tools
  'helm': /\bhelm\b/gi,
  'terraform': /\bterraform\b/gi,
  'docker': /\b(docker|container)\b/gi,
  'istio': /\bistio\b/gi
};

// Analyze document content and suggest category
function analyzeContent(content, title = '', existingTags = []) {
  const text = (title + ' ' + content).toLowerCase();
  const categoryScores = {};
  
  // Calculate category scores based on keyword matches
  Object.entries(CATEGORY_KEYWORDS).forEach(([category, config]) => {
    let score = 0;
    config.keywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = text.match(regex);
      if (matches) {
        score += matches.length * config.weight;
      }
    });
    categoryScores[category] = score;
  });
  
  // Boost score if existing tags match category
  existingTags.forEach(tag => {
    Object.entries(CATEGORY_KEYWORDS).forEach(([category, config]) => {
      if (config.keywords.includes(tag.toLowerCase())) {
        categoryScores[category] += 2;
      }
    });
  });
  
  // Find the category with highest score
  const suggestedCategory = Object.entries(categoryScores)
    .sort(([,a], [,b]) => b - a)[0];
  
  return {
    suggestedCategory: suggestedCategory[1] > 0 ? suggestedCategory[0] : null,
    categoryScores,
    confidence: suggestedCategory[1] > 0 ? Math.min(suggestedCategory[1] / 10, 1) : 0
  };
}

// Suggest tags based on content
function suggestTags(content, title = '', existingTags = []) {
  const text = title + ' ' + content;
  const suggestedTags = [];
  
  Object.entries(TAG_PATTERNS).forEach(([tag, pattern]) => {
    if (pattern.test(text) && !existingTags.includes(tag)) {
      const matches = text.match(pattern);
      suggestedTags.push({
        tag,
        confidence: Math.min(matches.length / 5, 1),
        matches: matches.length
      });
    }
  });
  
  // Sort by confidence and return top suggestions
  return suggestedTags
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 8);
}

// Analyze a single file
function analyzeFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const { data: frontmatter, content: body } = matter(content);
    
    const title = frontmatter.title || '';
    const existingTags = frontmatter.tags || [];
    const existingCategory = frontmatter.category;
    
    const categoryAnalysis = analyzeContent(body, title, existingTags);
    const tagSuggestions = suggestTags(body, title, existingTags);
    
    return {
      filePath,
      frontmatter,
      categoryAnalysis,
      tagSuggestions,
      hasCategory: !!existingCategory,
      hasTags: existingTags.length > 0
    };
  } catch (error) {
    console.warn(`Warning: Could not analyze ${filePath}:`, error.message);
    return null;
  }
}

// Scan directory for markdown files
function scanDirectory(dir, basePath = '') {
  const files = [];
  
  if (!fs.existsSync(dir)) {
    return files;
  }
  
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...scanDirectory(fullPath, path.join(basePath, item)));
    } else if (item.endsWith('.md') || item.endsWith('.mdx')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Generate categorization report
function generateReport(analyses) {
  const report = {
    totalFiles: analyses.length,
    filesWithCategory: analyses.filter(a => a.hasCategory).length,
    filesWithTags: analyses.filter(a => a.hasTags).length,
    suggestions: {
      categories: analyses.filter(a => !a.hasCategory && a.categoryAnalysis.suggestedCategory),
      tags: analyses.filter(a => a.tagSuggestions.length > 0)
    }
  };
  
  return report;
}

// Apply suggestions to a file (dry run by default)
function applySuggestions(analysis, options = { dryRun: true, minConfidence: 0.3 }) {
  const { filePath, frontmatter, categoryAnalysis, tagSuggestions } = analysis;
  const { dryRun, minConfidence } = options;
  
  let updated = false;
  const newFrontmatter = { ...frontmatter };
  
  // Apply category suggestion
  if (!frontmatter.category && 
      categoryAnalysis.suggestedCategory && 
      categoryAnalysis.confidence >= minConfidence) {
    newFrontmatter.category = categoryAnalysis.suggestedCategory;
    updated = true;
  }
  
  // Apply tag suggestions
  const currentTags = frontmatter.tags || [];
  const newTags = [...currentTags];
  
  tagSuggestions.forEach(({ tag, confidence }) => {
    if (confidence >= minConfidence && !currentTags.includes(tag)) {
      newTags.push(tag);
      updated = true;
    }
  });
  
  if (newTags.length > currentTags.length) {
    newFrontmatter.tags = newTags;
  }
  
  if (updated && !dryRun) {
    // Read original file
    const originalContent = fs.readFileSync(filePath, 'utf8');
    const { content: body } = matter(originalContent);
    
    // Create new frontmatter
    const newContent = matter.stringify(body, newFrontmatter);
    
    // Write back to file
    fs.writeFileSync(filePath, newContent);
  }
  
  return {
    filePath,
    updated,
    changes: {
      category: !frontmatter.category && newFrontmatter.category ? newFrontmatter.category : null,
      addedTags: newTags.filter(tag => !currentTags.includes(tag))
    }
  };
}

// Main function
function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'analyze';
  
  const docsDir = path.join(__dirname, '..', 'docs');
  const blogDir = path.join(__dirname, '..', 'blog');
  
  console.log('🔍 Auto-categorization script starting...');
  
  // Scan all markdown files
  const docsFiles = scanDirectory(docsDir);
  const blogFiles = scanDirectory(blogDir);
  const allFiles = [...docsFiles, ...blogFiles];
  
  console.log(`Found ${allFiles.length} markdown files`);
  
  // Analyze all files
  const analyses = allFiles
    .map(analyzeFile)
    .filter(analysis => analysis !== null);
  
  console.log(`Successfully analyzed ${analyses.length} files`);
  
  switch (command) {
    case 'analyze':
    case 'report':
      // Generate and display report
      const report = generateReport(analyses);
      
      console.log('\\n📊 Categorization Report:');
      console.log(`   Total files: ${report.totalFiles}`);
      console.log(`   Files with categories: ${report.filesWithCategory} (${Math.round(report.filesWithCategory/report.totalFiles*100)}%)`);
      console.log(`   Files with tags: ${report.filesWithTags} (${Math.round(report.filesWithTags/report.totalFiles*100)}%)`);
      
      console.log('\\n💡 Category Suggestions:');
      report.suggestions.categories.slice(0, 10).forEach(analysis => {
        const { filePath, categoryAnalysis } = analysis;
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`   ${relativePath}`);
        console.log(`     → ${categoryAnalysis.suggestedCategory} (confidence: ${Math.round(categoryAnalysis.confidence * 100)}%)`);
      });
      
      console.log('\\n🏷️  Tag Suggestions (top 5 files):');
      report.suggestions.tags.slice(0, 5).forEach(analysis => {
        const { filePath, tagSuggestions } = analysis;
        const relativePath = path.relative(process.cwd(), filePath);
        const topTags = tagSuggestions.slice(0, 3);
        console.log(`   ${relativePath}`);
        topTags.forEach(({ tag, confidence }) => {
          console.log(`     → #${tag} (${Math.round(confidence * 100)}%)`);
        });
      });
      break;
      
    case 'apply':
      // Apply suggestions
      const dryRun = !args.includes('--confirm');
      const minConfidence = parseFloat(args.find(arg => arg.startsWith('--min-confidence='))?.split('=')[1]) || 0.5;
      
      console.log(`\\n🔧 Applying suggestions (dry run: ${dryRun}, min confidence: ${minConfidence})...`);
      
      const results = analyses.map(analysis => 
        applySuggestions(analysis, { dryRun, minConfidence })
      );
      
      const updatedFiles = results.filter(r => r.updated);
      
      console.log(`\\n✅ ${updatedFiles.length} files would be updated:`);
      updatedFiles.forEach(({ filePath, changes }) => {
        const relativePath = path.relative(process.cwd(), filePath);
        console.log(`   ${relativePath}`);
        if (changes.category) {
          console.log(`     + category: ${changes.category}`);
        }
        if (changes.addedTags.length > 0) {
          console.log(`     + tags: ${changes.addedTags.join(', ')}`);
        }
      });
      
      if (dryRun) {
        console.log('\\n💡 To apply changes, run: node scripts/auto-categorize.js apply --confirm');
      } else {
        console.log('\\n🎉 Changes applied successfully!');
      }
      break;
      
    default:
      console.log(`
🤖 Auto-Categorization Script

Usage: node scripts/auto-categorize.js [command] [options]

Commands:
  analyze, report    Show categorization analysis and suggestions (default)
  apply             Apply suggestions to files
  
Options:
  --confirm         Actually apply changes (default is dry run)
  --min-confidence=X  Minimum confidence threshold (0.0-1.0, default: 0.5)

Examples:
  node scripts/auto-categorize.js
  node scripts/auto-categorize.js apply
  node scripts/auto-categorize.js apply --confirm --min-confidence=0.7
      `);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = {
  analyzeContent,
  suggestTags,
  analyzeFile,
  applySuggestions,
  generateReport
};