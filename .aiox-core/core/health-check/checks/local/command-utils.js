const { execFileSync } = require('child_process');

function getCandidates(command) {
  if (process.platform !== 'win32') {
    return [command];
  }

  switch (command) {
    case 'npm':
      return ['npm.cmd', 'npm'];
    case 'npx':
      return ['npx.cmd', 'npx'];
    case 'git':
      return ['git.exe', 'git'];
    case 'powershell':
      return ['powershell.exe', 'powershell', 'pwsh.exe', 'pwsh'];
    default:
      return [command];
  }
}

function runFirstAvailable(command, args = [], options = {}) {
  const attempts = [];

  for (const candidate of getCandidates(command)) {
    const fullCommand = [candidate, ...args].join(' ');

    try {
      return execFileSync(candidate, args, {
        encoding: 'utf8',
        windowsHide: true,
        ...options,
      }).trim();
    } catch (error) {
      attempts.push(`${fullCommand}: ${error.message}`);
    }
  }

  const error = new Error(`Unable to run ${command}. Attempts: ${attempts.join(' | ')}`);
  error.attempts = attempts;
  throw error;
}

module.exports = {
  runFirstAvailable,
};
