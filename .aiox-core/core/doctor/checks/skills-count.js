/**
 * Doctor Check: Skills Count
 *
 * Counts skill directories in IDE skill locations.
 * Supports Claude skills and Codex local-first skills.
 *
 * @module aiox-core/doctor/checks/skills-count
 * @story INS-4.8
 */

const path = require('path');
const fs = require('fs');

const name = 'skills-count';

function countSkills(skillsDir) {
  if (!fs.existsSync(skillsDir)) {
    return 0;
  }

  let entries;
  try {
    entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  } catch {
    return 0;
  }

  return entries.filter(
    (d) => d.isDirectory() && fs.existsSync(path.join(skillsDir, d.name, 'SKILL.md')),
  ).length;
}

async function run(context) {
  const claudeSkillsDir = path.join(context.projectRoot, '.claude', 'skills');
  const codexSkillsDir = path.join(context.projectRoot, '.codex', 'skills');
  const codexAgentsDir = path.join(context.projectRoot, '.codex', 'agents');
  const claudeCount = countSkills(claudeSkillsDir);
  const codexCount = countSkills(codexSkillsDir);
  const totalCount = claudeCount + codexCount;
  const codexAgentCount = fs.existsSync(codexAgentsDir)
    ? fs.readdirSync(codexAgentsDir).filter((entry) => entry.endsWith('.md')).length
    : 0;

  if (claudeCount === 0 && codexCount === 0) {
    return {
      check: name,
      status: 'FAIL',
      message: 'No skills found in .claude/skills or .codex/skills',
      fixCommand: 'npx aiox-core install --force',
    };
  }

  if (codexCount >= 1 && codexAgentCount >= 10) {
    return {
      check: name,
      status: 'PASS',
      message: `Codex local-first mode active (${codexCount} Codex skill bundles, ${codexAgentCount} agent shortcuts)`,
      fixCommand: null,
    };
  }

  if (totalCount >= 7) {
    return {
      check: name,
      status: 'PASS',
      message: `${totalCount} skills found across IDEs`,
      fixCommand: null,
    };
  }

  return {
    check: name,
    status: 'WARN',
    message: `Limited skill coverage detected (Claude: ${claudeCount}, Codex: ${codexCount})`,
    fixCommand: 'npx aiox-core install --force',
  };
}

module.exports = { name, run };
