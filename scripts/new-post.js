// scripts/new-post.js
const fs = require('fs');
const path = require('path');

const type = process.argv[2]; // blog, docs, etc.
const name = process.argv[3]; // file-name

if (!type || !name) {
  console.log('Usage: npm run new-post [type] [name]');
  console.log('Example: npm run new-post blog terraform-best-practices');
  process.exit(1);
}

const date = new Date();
const year = date.getFullYear();
const month = String(date.getMonth() + 1).padStart(2, '0');

let filePath;
let content;

switch(type) {
  case 'blog':
    filePath = `blog/${year}/${month}/${date.toISOString().split('T')[0]}-${name}.md`;
    content = `---
title: "${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}"
date: ${date.toISOString().split('T')[0]}
tags: []
---

# ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

## Introduction

Content here...
`;
    break;
    
  case 'docs':
    filePath = `docs/${name}.md`;
    content = `# ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

## Overview

Content here...
`;
    break;
    
  default:
    filePath = `${type}/${name}.md`;
    content = `# ${name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}

Content here...
`;
}

// 디렉토리 생성
const dir = path.dirname(filePath);
fs.mkdirSync(dir, { recursive: true });

// 파일 생성
fs.writeFileSync(filePath, content);
console.log(`✅ Created: ${filePath}`);

// SUMMARY.md 업데이트
require('./generate-summary.js');
