/* eslint-disable security/detect-non-literal-fs-filename */
/**
 * detect-build-env.js
 *
 * Utility to detect whether the current build is targeting a release branch
 * (e.g. `release/**`, CI staging/production environment, or explicit RELEASE_BUILD=true).
 */

const { execSync } = require('child_process');

function isReleaseBranch() {
  if (process.env.RELEASE_BUILD === 'true' || process.env.RELEASE_BUILD === '1') {
    return true;
  }

  // Check GitHub Actions ref
  const ghRef = process.env.GITHUB_REF || '';
  const ghRefName = process.env.GITHUB_REF_NAME || '';
  if (ghRef.startsWith('refs/heads/release/') || ghRefName.startsWith('release/')) {
    return true;
  }

  // Check local git branch if git is available
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
    }).trim();
    if (branch.startsWith('release/')) {
      return true;
    }
  } catch {
    // Git command failed or not a git repository
  }

  return false;
}

function getDefaultLogLevel() {
  return isReleaseBranch() ? 'error' : 'debug';
}

module.exports = {
  isReleaseBranch,
  getDefaultLogLevel,
};
