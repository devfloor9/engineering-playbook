---
title: "Algolia Search Setup Guide"
description: "Learn how to set up and manage Algolia DocSearch for the Engineering Playbook."
tags: [algolia, search, docusaurus, setup]
category: "setup"
date: "2025-01-15"
authors: [devfloor9]
difficulty: "intermediate"
estimated_time: "30 minutes"
---

# Algolia Search Setup Guide

> 📅 **Written**: 2025-01-15 | ⏱️ **Reading time**: ~4 min

This guide explains how to set up and manage Algolia DocSearch for the Engineering Playbook.

## Overview

Algolia DocSearch is a powerful search solution for documentation sites. This playbook provides the following search features:

- Real-time search results
- Multi-language support (Korean/English)
- Category-based filtering
- Tag-based search
- Mobile-optimized search UI

## Prerequisites

- Algolia account (free account available)
- Website deployed on GitHub Pages or other hosting environment
- Node.js 18+ environment

## Step 1: Set Up Algolia Account

### Create Algolia Account

1. Create an account on the [Algolia website](https://www.algolia.com/)
2. Create a new application
3. Record the following information:
   - Application ID
   - Search-Only API Key
   - Admin API Key

### Configure Environment Variables

Create a `.env` file in your local development environment:

```bash
# .env file
ALGOLIA_APP_ID=your_application_id
ALGOLIA_SEARCH_API_KEY=your_search_only_api_key
ALGOLIA_ADMIN_API_KEY=your_admin_api_key
ALGOLIA_INDEX_NAME=engineering-playbook
```

## Step 2: Set Up DocSearch Crawler

### Apply for DocSearch

1. Apply on the [DocSearch application page](https://docsearch.algolia.com/apply/)
2. Provide the following information:
   - Website URL: `https://devfloor9.github.io/engineering-playbook/`
   - Email address
   - Repository URL: `https://github.com/devfloor9/engineering-playbook`

### Manual Crawler Setup (Optional)

While waiting for DocSearch approval, you can set up the crawler manually:

```bash
# Run crawler using Docker
docker run -it --env-file=.env -e "CONFIG=$(cat algolia-config.json | jq -r tostring)" algolia/docsearch-scraper
```

## Step 3: Configure and Manage Index

### Check Index Status

```bash
# Check index status
node scripts/algolia-index.js status
```

### Initial Index Setup

```bash
# Apply index configuration
node scripts/algolia-index.js setup
```

### Verify Configuration

```bash
# Check current configuration
node scripts/algolia-index.js config
```

## Step 4: Production Environment Setup

### GitHub Actions Environment Variables

Set the following variables in Settings > Secrets and variables > Actions in your GitHub repository:

```
ALGOLIA_APP_ID=your_application_id
ALGOLIA_SEARCH_API_KEY=your_search_only_api_key
ALGOLIA_INDEX_NAME=engineering-playbook
```

### Automatic Indexing Workflow

Create a `.github/workflows/algolia-index.yml` file:

```yaml
name: Update Algolia Index

on:
  push:
    branches: [main]
    paths: ['docs/**', 'blog/**']
  schedule:
    # Run every day at midnight
    - cron: '0 0 * * *'

jobs:
  algolia-index:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build site
        run: npm run build
        
      - name: Update Algolia index
        env:
          ALGOLIA_APP_ID: ${{ secrets.ALGOLIA_APP_ID }}
          ALGOLIA_ADMIN_API_KEY: ${{ secrets.ALGOLIA_ADMIN_API_KEY }}
          ALGOLIA_INDEX_NAME: ${{ secrets.ALGOLIA_INDEX_NAME }}
        run: |
          docker run \
            --env-file=<(env | grep ALGOLIA) \
            -e "CONFIG=$(cat algolia-config.json | jq -r tostring)" \
            algolia/docsearch-scraper
```

## Step 5: Customize Search Functionality

### Customize Search UI

You can customize search styles in `src/css/custom.css`:

```css
/* Search input field styling */
.DocSearch-Button {
  border-radius: 1rem;
  background: var(--ifm-color-emphasis-100);
}

/* Search result highlighting */
.algolia-docsearch-suggestion--highlight {
  background: var(--ifm-color-primary);
  color: white;
}
```

### Add Search Filters

Adjust search parameters in `docusaurus.config.js`:

```javascript
algolia: {
  // ... basic configuration
  searchParameters: {
    facetFilters: ['language:ko', 'language:en'],
    hitsPerPage: 10,
    // Add category-based filtering
    filters: 'type:content OR type:lvl1 OR type:lvl2'
  },
}
```

## Step 6: Optimize Search Performance

### Optimize Index

1. **Set searchable attributes priority**:
   ```json
   {
     "searchableAttributes": [
       "unordered(hierarchy.lvl0)",
       "unordered(hierarchy.lvl1)",
       "unordered(hierarchy.lvl2)",
       "content"
     ]
   }
   ```

2. **Configure facets**:
   ```json
   {
     "attributesForFaceting": [
       "type",
       "lang",
       "docusaurus_tag"
     ]
   }
   ```

3. **Set custom ranking**:
   ```json
   {
     "customRanking": [
       "desc(weight.pageRank)",
       "desc(weight.level)",
       "asc(weight.position)"
     ]
   }
   ```

## Troubleshooting

### Common Issues

#### Issue 1: Search Results Not Appearing

**Symptoms:**
- No results when typing in search box
- "No results" message displayed

**Causes:**
- Index is empty
- API key configuration error
- Crawler not running

**Solution:**
```bash
# Check index status
node scripts/algolia-index.js status

# Verify environment variables
node scripts/algolia-index.js config

# Run crawler manually
docker run -it --env-file=.env -e "CONFIG=$(cat algolia-config.json | jq -r tostring)" algolia/docsearch-scraper
```

#### Issue 2: Korean Search Not Working

**Symptoms:**
- English search works but Korean search doesn't
- Korean content not indexed

**Causes:**
- Language configuration error
- Korean pages excluded in crawler configuration

**Solution:**
```json
// Verify in algolia-config.json
{
  "start_urls": [
    {
      "url": "https://devfloor9.github.io/engineering-playbook/docs/",
      "tags": ["docs", "ko"]
    },
    {
      "url": "https://devfloor9.github.io/engineering-playbook/en/docs/",
      "tags": ["docs", "en"]
    }
  ]
}
```

#### Issue 3: Slow Search Speed

**Symptoms:**
- Search results take long to load
- Delay when typing

**Causes:**
- Index size too large
- Search parameters need optimization

**Solution:**
```javascript
// Optimize in docusaurus.config.js
searchParameters: {
  hitsPerPage: 8, // Limit number of results
  attributesToRetrieve: [
    'hierarchy.lvl0',
    'hierarchy.lvl1',
    'hierarchy.lvl2',
    'content'
  ], // Retrieve only necessary attributes
}
```

## Monitoring and Analytics

### Check Search Analytics

1. Review search analytics in the Algolia dashboard
2. Analyze popular search queries and search patterns
3. Monitor search performance metrics

### Regular Maintenance

```bash
# Check index status weekly
node scripts/algolia-index.js status

# Optimize index monthly
node scripts/algolia-index.js setup
```

## References

- [Algolia DocSearch Official Documentation](https://docsearch.algolia.com/)
- [Docusaurus Search Configuration Guide](https://docusaurus.io/docs/search)
- [Algolia JavaScript API Reference](https://www.algolia.com/doc/api-reference/api-methods/)
- [DocSearch Crawler Configuration](https://docsearch.algolia.com/docs/config-file)

---

**Last Updated:** 2025-01-15  
**Reviewer:** devfloor9  
**Version:** 1.0
