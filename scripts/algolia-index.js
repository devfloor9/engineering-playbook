#!/usr/bin/env node

/**
 * Algolia Index Management Script
 * 
 * This script helps manage the Algolia search index for the EKS Engineering Playbook.
 * It can be used to manually update the search index or check index status.
 */

const fs = require('fs');
const path = require('path');

// Configuration
const ALGOLIA_CONFIG = {
  appId: process.env.ALGOLIA_APP_ID,
  apiKey: process.env.ALGOLIA_ADMIN_API_KEY, // Admin API key for index management
  indexName: process.env.ALGOLIA_INDEX_NAME || 'engineering-playbook',
};

// Check if required environment variables are set
function checkEnvironment() {
  const required = ['ALGOLIA_APP_ID', 'ALGOLIA_ADMIN_API_KEY'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => console.error(`   - ${key}`));
    console.error('\nPlease set these variables before running the script.');
    console.error('You can create a .env file with the following format:');
    console.error('');
    console.error('ALGOLIA_APP_ID=your_app_id');
    console.error('ALGOLIA_ADMIN_API_KEY=your_admin_api_key');
    console.error('ALGOLIA_INDEX_NAME=engineering-playbook');
    process.exit(1);
  }
}

// Display help information
function showHelp() {
  console.log(`
🔍 Algolia Index Management Script

Usage: node scripts/algolia-index.js [command]

Commands:
  help        Show this help message
  status      Check index status and statistics
  config      Show current Algolia configuration
  setup       Setup index with proper settings
  clear       Clear all records from the index (use with caution!)

Environment Variables:
  ALGOLIA_APP_ID         Your Algolia application ID
  ALGOLIA_ADMIN_API_KEY  Your Algolia admin API key (not search key!)
  ALGOLIA_INDEX_NAME     Index name (default: engineering-playbook)

Examples:
  node scripts/algolia-index.js status
  node scripts/algolia-index.js setup
  
Note: This script requires the algoliasearch package to be installed.
Install it with: npm install algoliasearch
  `);
}

// Show current configuration
function showConfig() {
  console.log('🔧 Current Algolia Configuration:');
  console.log(`   App ID: ${ALGOLIA_CONFIG.appId || 'Not set'}`);
  console.log(`   Index Name: ${ALGOLIA_CONFIG.indexName}`);
  console.log(`   Admin API Key: ${ALGOLIA_CONFIG.apiKey ? '***' + ALGOLIA_CONFIG.apiKey.slice(-4) : 'Not set'}`);
  
  // Check if algolia-config.json exists
  const configPath = path.join(__dirname, '..', 'algolia-config.json');
  if (fs.existsSync(configPath)) {
    console.log(`   Config File: ✅ algolia-config.json found`);
  } else {
    console.log(`   Config File: ❌ algolia-config.json not found`);
  }
}

// Check index status
async function checkStatus() {
  try {
    const algoliasearch = require('algoliasearch');
    const client = algoliasearch(ALGOLIA_CONFIG.appId, ALGOLIA_CONFIG.apiKey);
    const index = client.initIndex(ALGOLIA_CONFIG.indexName);
    
    console.log('📊 Checking index status...');
    
    // Get index settings
    const settings = await index.getSettings();
    console.log(`   Index exists: ✅`);
    console.log(`   Searchable attributes: ${settings.searchableAttributes?.length || 0}`);
    
    // Get index statistics
    const stats = await index.search('', { hitsPerPage: 0 });
    console.log(`   Total records: ${stats.nbHits}`);
    console.log(`   Processing time: ${stats.processingTimeMS}ms`);
    
  } catch (error) {
    if (error.status === 404) {
      console.log('   Index exists: ❌ Index not found');
      console.log('   Suggestion: Run "setup" command to create the index');
    } else {
      console.error('❌ Error checking index status:', error.message);
    }
  }
}

// Setup index with proper settings
async function setupIndex() {
  try {
    const algoliasearch = require('algoliasearch');
    const client = algoliasearch(ALGOLIA_CONFIG.appId, ALGOLIA_CONFIG.apiKey);
    const index = client.initIndex(ALGOLIA_CONFIG.indexName);
    
    console.log('🔧 Setting up Algolia index...');
    
    // Read configuration from algolia-config.json
    const configPath = path.join(__dirname, '..', 'algolia-config.json');
    let indexSettings = {};
    
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      indexSettings = config.custom_settings || {};
      console.log('   ✅ Loaded settings from algolia-config.json');
    } else {
      // Default settings if config file doesn't exist
      indexSettings = {
        searchableAttributes: [
          'unordered(hierarchy.lvl0)',
          'unordered(hierarchy.lvl1)',
          'unordered(hierarchy.lvl2)',
          'unordered(hierarchy.lvl3)',
          'unordered(hierarchy.lvl4)',
          'unordered(hierarchy.lvl5)',
          'content'
        ],
        attributesForFaceting: [
          'type',
          'lang',
          'language',
          'version',
          'docusaurus_tag'
        ],
        attributesToRetrieve: [
          'hierarchy',
          'content',
          'anchor',
          'url',
          'url_without_anchor',
          'type'
        ],
        attributesToHighlight: [
          'hierarchy',
          'content'
        ],
        attributesToSnippet: [
          'content:10'
        ],
        distinct: true,
        attributeForDistinct: 'url'
      };
      console.log('   ⚠️  Using default settings (algolia-config.json not found)');
    }
    
    // Apply settings to index
    await index.setSettings(indexSettings);
    console.log('   ✅ Index settings applied successfully');
    
    console.log('🎉 Index setup completed!');
    console.log('\nNext steps:');
    console.log('1. Configure DocSearch crawler with your algolia-config.json');
    console.log('2. Run the crawler to populate the index');
    console.log('3. Update your environment variables in production');
    
  } catch (error) {
    console.error('❌ Error setting up index:', error.message);
  }
}

// Clear index (use with caution!)
async function clearIndex() {
  try {
    const algoliasearch = require('algoliasearch');
    const client = algoliasearch(ALGOLIA_CONFIG.appId, ALGOLIA_CONFIG.apiKey);
    const index = client.initIndex(ALGOLIA_CONFIG.indexName);
    
    console.log('⚠️  WARNING: This will delete all records from the index!');
    console.log('   Index:', ALGOLIA_CONFIG.indexName);
    
    // In a real implementation, you might want to add a confirmation prompt
    console.log('   Clearing index...');
    await index.clearObjects();
    console.log('   ✅ Index cleared successfully');
    
  } catch (error) {
    console.error('❌ Error clearing index:', error.message);
  }
}

// Main function
async function main() {
  const command = process.argv[2] || 'help';
  
  switch (command) {
    case 'help':
      showHelp();
      break;
      
    case 'config':
      showConfig();
      break;
      
    case 'status':
      checkEnvironment();
      await checkStatus();
      break;
      
    case 'setup':
      checkEnvironment();
      await setupIndex();
      break;
      
    case 'clear':
      checkEnvironment();
      await clearIndex();
      break;
      
    default:
      console.error(`❌ Unknown command: ${command}`);
      console.error('Run "node scripts/algolia-index.js help" for usage information.');
      process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().catch(error => {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  checkStatus,
  setupIndex,
  clearIndex,
  showConfig
};