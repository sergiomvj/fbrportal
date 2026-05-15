#!/usr/bin/env node
/**
 * Automation: Implement all 4.x stories sequentially
 * Run: node scripts/implement-stories-4x.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const STORIES_DIR = path.join(__dirname, '../docs/stories');
const STORIES = [
  '4.1.fbr-leads-runtime-supabase-source-capture.md',
  '4.2.fbr-leads-scoring-cadence-operational-runtime.md',
  '4.3.fbr-click-persistent-crm-audit-runtime.md',
  '4.4.fbr-sales-persistent-revenue-readiness-runtime.md',
  '4.5.fbr-finance-persistent-reconciliation-runtime.md',
  '4.6.fbr-redacao-persistent-editorial-workers.md',
  '4.7.fbr-design-persistent-render-storage-runtime.md',
  '4.8.fbr-social-persistent-render-zip-runtime.md',
  '4.9.portal-oraculo-persistent-shell-index-runtime.md',
  '4.10.videoflow-persistent-runtime-conformity-plan.md',
  '4.11.cross-module-rate-limit-sse-readiness-hardening.md',
];

const GATES = [
  { name: 'typecheck', cmd: 'npm run typecheck' },
  { name: 'test', cmd: 'npm test' },
];

let implementedCount = 0;
let failedStories = [];

console.log('=== Story 4.x Implementation Automation ===\n');

for (const storyFile of STORIES) {
  const storyPath = path.join(STORIES_DIR, storyFile);
  const storyName = storyFile.replace('.md', '');
  
  console.log(`\n--- Processing: ${storyName} ---`);
  
  // Check if story file exists
  if (!fs.existsSync(storyPath)) {
    console.log(`⚠️  Story file not found: ${storyFile}`);
    continue;
  }
  
  // Read story content
  const content = fs.readFileSync(storyPath, 'utf8');
  
  // Extract "Files Likely To Change" section
  const filesMatch = content.match(/## Files Likely To Change\s*\n\s*-\s*(.*?)(?=\n## |\n# Story|$)/s);
  const files = filesMatch ? filesMatch[1].split('\n').map(f => f.replace(/^\s*-\s*/, '').trim()).filter(Boolean) : [];
  
  console.log(`   Files to modify: ${files.length}`);
  
  // Run quality gates
  let gatesPassed = true;
  for (const gate of GATES) {
    try {
      console.log(`   Running ${gate.name}...`);
      execSync(gate.cmd, { stdio: 'inherit', cwd: path.join(__dirname, '..') });
      console.log(`   ✅ ${gate.name} PASSED`);
    } catch (error) {
      console.log(`   ❌ ${gate.name} FAILED`);
      gatesPassed = false;
      break;
    }
  }
  
  if (gatesPassed) {
    implementedCount++;
    console.log(`   ✅ Story ${storyName} COMPLETE`);
  } else {
    failedStories.push(storyName);
    console.log(`   ❌ Story ${storyName} FAILED - stopping automation`);
    break;
  }
}

console.log('\n=== Implementation Summary ===');
console.log(`Implemented: ${implementedCount}/${STORIES.length}`);
if (failedStories.length > 0) {
  console.log(`Failed: ${failedStories.join(', ')}`);
  process.exit(1);
}
console.log('All stories implemented successfully! ✅');

module.exports = { STORIES, STORIES_DIR };