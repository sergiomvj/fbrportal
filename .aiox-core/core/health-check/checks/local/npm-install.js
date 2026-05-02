/**
 * npm Installation Check
 *
 * Verifies npm is installed and working.
 *
 * @module aiox-core/health-check/checks/local/npm-install
 * @version 1.0.0
 * @story HCS-2 - Health Check System Implementation
 */

const { BaseCheck, CheckSeverity, CheckDomain } = require('../../base-check');
const { runFirstAvailable } = require('./command-utils');

/**
 * Minimum required npm version
 */
const MIN_NPM_VERSION = '8.0.0';

/**
 * npm installation check
 *
 * @class NpmInstallCheck
 * @extends BaseCheck
 */
class NpmInstallCheck extends BaseCheck {
  constructor() {
    super({
      id: 'local.npm-install',
      name: 'npm Installation',
      description: 'Verifies npm is installed and working',
      domain: CheckDomain.LOCAL,
      severity: CheckSeverity.CRITICAL,
      timeout: 5000,
      cacheable: true,
      healingTier: 3, // Manual installation
      tags: ['npm', 'installation'],
    });
  }

  /**
   * Execute the check
   * @param {Object} context - Execution context
   * @returns {Promise<Object>} Check result
   */
  async execute(_context) {
    try {
      // Check npm version
      const npmVersion = runFirstAvailable('npm', ['--version'], {
        timeout: 10000,
      });

      // Check version meets minimum
      if (this.compareVersions(npmVersion, MIN_NPM_VERSION) < 0) {
        return this.warning(`npm version ${npmVersion} is below recommended ${MIN_NPM_VERSION}`, {
          recommendation: 'Update npm with: npm install -g npm@latest',
          healable: true,
          healingTier: 2,
          details: {
            current: npmVersion,
            minimum: MIN_NPM_VERSION,
          },
        });
      }

      // Check npm registry connectivity (quick ping)
      try {
        runFirstAvailable('npm', ['ping'], {
          timeout: 10000,
        });
      } catch {
        return this.warning(`npm installed (v${npmVersion}) but registry unreachable`, {
          recommendation: 'Check network connection or npm registry configuration',
          details: {
            version: npmVersion,
            registry: 'unreachable',
          },
        });
      }

      // Get npm config info
      let registry = 'https://registry.npmjs.org/';
      try {
        registry = runFirstAvailable('npm', ['config', 'get', 'registry'], {
          timeout: 3000,
        });
      } catch {
        // Use default
      }

      return this.pass(`npm ${npmVersion} installed and working`, {
        details: {
          version: npmVersion,
          registry,
        },
      });
    } catch (error) {
      if ((error.attempts || []).some((attempt) => attempt.includes('EPERM') || attempt.includes('EINVAL'))) {
        return this.warning('npm binary exists but could not be executed in the current environment', {
          recommendation: 'Retry in a normal terminal session outside restricted sandboxing',
          details: { error: error.message, attempts: error.attempts || [] },
        });
      }

      return this.fail('npm is not installed or not in PATH', {
        recommendation: 'Install Node.js from https://nodejs.org (npm is included)',
        healable: false,
        healingTier: 3,
        details: { error: error.message, attempts: error.attempts || [] },
      });
    }
  }

  /**
   * Compare semver versions
   * @private
   */
  compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < 3; i++) {
      if ((parts1[i] || 0) < (parts2[i] || 0)) return -1;
      if ((parts1[i] || 0) > (parts2[i] || 0)) return 1;
    }
    return 0;
  }

  /**
   * Get healer (manual guide)
   */
  getHealer() {
    return {
      name: 'npm-install-guide',
      action: 'manual',
      manualGuide: 'Install npm via Node.js',
      steps: [
        'Visit https://nodejs.org',
        'Download the LTS version',
        'Run the installer (npm is included)',
        'Restart your terminal',
        'Verify with: npm --version',
      ],
      documentation: 'https://docs.npmjs.com/downloading-and-installing-node-js-and-npm',
    };
  }
}

module.exports = NpmInstallCheck;
