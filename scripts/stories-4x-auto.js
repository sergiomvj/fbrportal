#!/usr/bin/env node

/**
 * Stories 4.x Complete Automation
 * 
 * Usage: node scripts/stories-4x-auto.js [command]
 * Commands:
 *   status    - Show migration status
 *   validate  - Run quality gates (typecheck + tests)
 *   all       - Full automation (status + validate)
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORTAL_ROOT = path.join(ROOT, 'apps/portal/src/lib');
const ROUTES_ROOT = path.join(ROOT, 'apps/portal/src/app/api/proxy');

const MODULES = ['leads', 'click', 'sales', 'finance', 'redacao', 'design', 'social'];

function log(msg) {
  console.log(`[stories-4x] ${msg}`);
}

function runCommand(cmd, cwd = ROOT) {
  try {
    execSync(cmd, { cwd, stdio: 'inherit', shell: true });
    return true;
  } catch (e) {
    return false;
  }
}

function checkStoreDbExists(module) {
  return fs.existsSync(path.join(PORTAL_ROOT, module, 'store-db.ts'));
}

function countRoutesUsingStoreDb(module) {
  let count = 0;
  const proxyPath = path.join(ROUTES_ROOT, module);
  if (fs.existsSync(proxyPath)) {
    const files = fs.readdirSync(proxyPath, { recursive: true, encoding: 'utf8' });
    for (const file of files) {
      if (typeof file === 'string' && (file.endsWith('route.ts') || file.endsWith('route.js'))) {
        const content = fs.readFileSync(path.join(proxyPath, file), 'utf8');
        if (content.includes('store-db')) count++;
      }
    }
  }
  return count;
}

function showStatus() {
  console.log('\n=== Stories 4.x Migration Status ===\n');
  
  for (const module of MODULES) {
    const hasStoreDb = checkStoreDbExists(module);
    const routes = countRoutesUsingStoreDb(module);
    const status = hasStoreDb ? '✓' : '✗';
    console.log(`  [${status}] ${module}: store-db=${hasStoreDb ? 'YES' : 'NO'}, routes=${routes}`);
  }
  
  console.log('\n');
}

function runValidation() {
  log('Running typecheck...');
  const typecheck = runCommand('npm run typecheck');
  console.log(typecheck ? '  ✓ Typecheck PASS' : '  ✗ Typecheck FAIL');
  
  if (!typecheck) process.exit(1);
  
  log('Running tests...');
  const tests = runCommand('npm test');
  console.log(tests ? '  ✓ Tests PASS' : '  ✗ Tests FAIL');
  
  if (!tests) process.exit(1);
}

const command = process.argv[2] || 'status';

switch (command) {
  case 'status':
    showStatus();
    break;
  case 'validate':
    runValidation();
    break;
  case 'all':
    showStatus();
    runValidation();
    log('All stories 4.x complete!');
    break;
  default:
    console.log('Usage: node stories-4x-auto.js [status|validate|all]');
}