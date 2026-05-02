/**
 * Doctor Check: npm Packages
 *
 * Validates:
 * 1. node_modules/ exists in project root (quick sanity check)
 * 2. (INS-4.12) .aiox-core/node_modules/ exists and contains all declared deps
 *
 * @module aiox-core/doctor/checks/npm-packages
 * @story INS-4.1, INS-4.12
 */

const path = require('path');
const fs = require('fs');

const name = 'npm-packages';

async function run(context) {
  const projectPackageJson = path.join(context.projectRoot, 'package.json');
  const projectNodeModules = path.join(context.projectRoot, 'node_modules');
  const aioxCoreDir = path.join(context.projectRoot, '.aiox-core');
  const aioxCorePackageJson = path.join(aioxCoreDir, 'package.json');
  const aioxCoreNodeModules = path.join(aioxCoreDir, 'node_modules');
  const hasProjectPackage = fs.existsSync(projectPackageJson);
  const hasAioxCorePackage = fs.existsSync(aioxCorePackageJson);

  // Check 1: root install only matters when the root is an npm package.
  if (hasProjectPackage && !fs.existsSync(projectNodeModules)) {
    return {
      check: name,
      status: 'FAIL',
      message: 'node_modules not found in project root',
      fixCommand: 'npm install',
    };
  }

  // Check 2 (INS-4.12): .aiox-core/node_modules/ completeness
  if (hasAioxCorePackage) {
    if (!fs.existsSync(aioxCoreNodeModules)) {
      return {
        check: name,
        status: 'FAIL',
        message: '.aiox-core/package.json found, but .aiox-core/node_modules/ missing',
        fixCommand: 'cd .aiox-core && npm install --production',
      };
    }

    // Verify all declared deps are installed
    try {
      const pkg = JSON.parse(fs.readFileSync(aioxCorePackageJson, 'utf8'));
      const deps = Object.keys(pkg.dependencies || {});
      const missing = [];

      for (const dep of deps) {
        const depPath = path.join(aioxCoreNodeModules, dep);
        if (!fs.existsSync(depPath)) {
          missing.push(dep);
        }
      }

      if (missing.length > 0) {
        return {
          check: name,
          status: 'FAIL',
          message: `node_modules present, but .aiox-core missing deps: ${missing.join(', ')}`,
          fixCommand: 'cd .aiox-core && npm install --production',
        };
      }
    } catch {
      // If we can't parse package.json, just check existence passed above
    }
  }

  if (!hasProjectPackage && !hasAioxCorePackage) {
    return {
      check: name,
      status: 'WARN',
      message: 'No package.json found in project root or .aiox-core',
      fixCommand: null,
    };
  }

  return {
    check: name,
    status: 'PASS',
    message:
      (hasProjectPackage ? 'project node_modules present' : 'no root package.json to validate') +
      (fs.existsSync(aioxCoreNodeModules) ? ', .aiox-core deps complete' : ''),
    fixCommand: null,
  };
}

module.exports = { name, run };
