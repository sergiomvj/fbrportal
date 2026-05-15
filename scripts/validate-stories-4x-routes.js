#!/usr/bin/env node

/**
 * Stories 4.x Route Migration Validator
 * Verifies that routes use persistent store-db.ts instead of in-memory store.ts
 * 
 * Usage: node scripts/validate-stories-4x-routes.js [--fix]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORTAL_ROOT = path.join(ROOT, 'apps/portal/src/lib');
const ROUTES_ROOT = path.join(ROOT, 'apps/portal/src/app/api/proxy');

const MODULES = ['leads', 'click', 'sales', 'finance', 'redacao', 'design', 'social'];
const FIX_MODE = process.argv.includes('--fix');

function log(msg) {
  console.log(`[stories-4x-validate] ${msg}`);
}

function checkRouteUsesInMemoryStore(routePath) {
  const content = fs.readFileSync(routePath, 'utf8');
  
  const patterns = [
    /import\s*\{[^}]*\}\s*from\s*['"]\.\.\/store['"]/,
    /import\s*\{[^}]*\}\s*from\s*['"]\.\/store['"]/,
    /from\s*['"]\.\.?\/store['"]/,
    /\bstore\.[a-zA-Z]+\(/,
  ];
  
  for (const pattern of patterns) {
    if (pattern.test(content)) {
      if (!content.includes('store-db')) {
        return true;
      }
    }
  }
  
  return false;
}

function getStoreDbFunctions(content) {
  const functions = [];
  const regex = /export\s+async\s+function\s+(\w+Db)/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    functions.push(match[1]);
  }
  return functions;
}

function analyzeRoutes() {
  const results = {};
  
  for (const module of MODULES) {
    const storeDbPath = path.join(PORTAL_ROOT, module, 'store-db.ts');
    const proxyPath = path.join(ROUTES_ROOT, module);
    
    results[module] = {
      hasStoreDb: fs.existsSync(storeDbPath),
      availableFunctions: [],
      routesUsingInMemory: [],
      routesUsingStoreDb: [],
    };
    
    if (results[module].hasStoreDb) {
      const content = fs.readFileSync(storeDbPath, 'utf8');
      results[module].availableFunctions = getStoreDbFunctions(content);
    }
    
    if (fs.existsSync(proxyPath)) {
      const files = fs.readdirSync(proxyPath, { recursive: true, encoding: 'utf8' });
      
      for (const file of files) {
        if (typeof file === 'string' && (file.endsWith('route.ts') || file.endsWith('route.js'))) {
          const fullPath = path.join(proxyPath, file);
          
          if (checkRouteUsesInMemoryStore(fullPath)) {
            results[module].routesUsingInMemory.push(file);
          } else {
            results[module].routesUsingStoreDb.push(file);
          }
        }
      }
    }
  }
  
  return results;
}

function showResults(results) {
  console.log('\n=== Route Migration Status ===\n');
  
  let totalInMemory = 0;
  let totalStoreDb = 0;
  
  for (const [module, data] of Object.entries(results)) {
    console.log(`Module: ${module}`);
    console.log(`  Store-db.ts: ${data.hasStoreDb ? 'EXISTS' : 'MISSING'}`);
    console.log(`  Available functions: ${data.availableFunctions.length > 0 ? data.availableFunctions.join(', ') : 'none'}`);
    console.log(`  Routes using in-memory store: ${data.routesUsingInMemory.length}`);
    console.log(`  Routes using store-db: ${data.routesUsingStoreDb.length}`);
    
    if (data.routesUsingInMemory.length > 0) {
      console.log(`    - ${data.routesUsingInMemory.join('\n    - ')}`);
    }
    
    console.log('');
    totalInMemory += data.routesUsingInMemory.length;
    totalStoreDb += data.routesUsingStoreDb.length;
  }
  
  console.log(`Total: ${totalInMemory} routes using in-memory, ${totalStoreDb} using store-db`);
}

function generateMigrationPlan(results) {
  const plan = [];
  
  for (const [module, data] of Object.entries(results)) {
    if (!data.hasStoreDb) {
      plan.push({ module, action: 'CREATE_STORE_DB', reason: 'Missing store-db.ts' });
    }
    
    if (data.routesUsingInMemory.length > 0) {
      for (const route of data.routesUsingInMemory) {
        plan.push({ module, action: 'UPDATE_ROUTE', route, reason: 'Uses in-memory store' });
      }
    }
  }
  
  return plan;
}

function main() {
  log('Analyzing route migration status...');
  
  const results = analyzeRoutes();
  showResults(results);
  
  const plan = generateMigrationPlan(results);
  
  console.log('\n=== Migration Plan ===\n');
  for (const item of plan) {
    console.log(`[${item.action}] ${item.module}${item.route ? '/' + item.route : ''}: ${item.reason}`);
  }
  
  if (FIX_MODE) {
    console.log('\n=== Applying Fixes (not implemented in this script) ===\n');
    console.log('To fix manually:');
    console.log('1. Ensure store-db.ts exists for each module');
    console.log('2. Update route imports to use store-db instead of store');
    console.log('3. Replace store.* calls with storeDb.* calls');
  }
  
  const totalIssues = plan.filter(p => p.action === 'UPDATE_ROUTE').length;
  
  if (totalIssues > 0) {
    console.log(`\n${totalIssues} routes need migration to use persistent stores.`);
    process.exit(1);
  } else {
    console.log('\nAll routes are using persistent stores. ✓');
  }
}

main();