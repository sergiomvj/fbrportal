#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const from = args.from ?? '1.2';
const to = args.to ?? '1.14';
const stopOnFail = args['stop-on-fail'] !== false;
const shouldPush = Boolean(args.push);
const allowDirty = Boolean(args['allow-dirty']);
const max = args.max ? Number(args.max) : Number.POSITIVE_INFINITY;
const dryRun = Boolean(args['dry-run']);

const runDir = path.join(root, 'docs', 'story-runs');
mkdirSync(runDir, { recursive: true });

const runId = new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z');
const reportPath = path.join(runDir, `${runId}.md`);
const report = [`# Story Auto Run ${runId}`, '', `range: ${from}..${to}`, `push: ${shouldPush}`, `dry_run: ${dryRun}`, ''];

function append(line = '') {
  report.push(line);
  writeFileSync(reportPath, `${report.join('\n')}\n`);
  console.log(line);
}

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (!token.startsWith('--')) {
      continue;
    }

    const key = token.slice(2);
    const next = argv[index + 1];

    if (!next || next.startsWith('--')) {
      parsed[key] = true;
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

function run(command, commandArgs, options = {}) {
  append(`\n\`\`\`powershell\n${[command, ...commandArgs].join(' ')}\n\`\`\``);

  if (dryRun) {
    return { status: 0, stdout: '', stderr: '' };
  }

  const result = spawnSync(command, commandArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: options.capture ? 'pipe' : 'inherit',
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function gitOutput(...gitArgs) {
  const result = spawnSync('git', gitArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'pipe',
  });

  if ((result.status ?? 1) !== 0) {
    throw new Error(`git ${gitArgs.join(' ')} failed: ${result.stderr}`);
  }

  return result.stdout.trim();
}

function ensureCleanWorktree() {
  const status = gitOutput('status', '--short');

  if (status && !allowDirty) {
    append('## BLOCKED');
    append('Working tree is not clean. Commit, stash, or pass `--allow-dirty` intentionally.');
    append('');
    append('```text');
    append(status);
    append('```');
    process.exit(2);
  }
}

function storyNumber(name) {
  const match = name.match(/^(\d+(?:\.\d+)+)\./);
  return match ? match[1] : null;
}

function compareStoryNumbers(left, right) {
  const a = left.split('.').map(Number);
  const b = right.split('.').map(Number);
  const length = Math.max(a.length, b.length);

  for (let index = 0; index < length; index += 1) {
    const diff = (a[index] ?? 0) - (b[index] ?? 0);

    if (diff !== 0) {
      return diff;
    }
  }

  return 0;
}

function getStatus(storyPath) {
  const content = readFileSync(storyPath, 'utf8');
  const statusMatch = content.match(/^## Status\s*\r?\n\s*(.+?)\s*$/m);
  return statusMatch?.[1]?.trim() ?? 'Unknown';
}

function codexStep(label, prompt) {
  append(`\n## ${label}`);
  const result = run('codex', [
    'exec',
    '-C',
    root,
    '-a',
    'never',
    '-s',
    'danger-full-access',
    prompt,
  ]);

  if (result.status !== 0) {
    append(`FAILED: ${label}`);
    return false;
  }

  return true;
}

function qualityGates() {
  append('\n## Quality Gates');
  for (const script of ['lint', 'typecheck', 'test', 'build']) {
    const result = run('npm', ['run', script]);

    if (result.status !== 0) {
      append(`FAILED: npm run ${script}`);
      return false;
    }
  }

  return true;
}

function fail(message) {
  append(`\n## FAILED\n${message}`);

  if (stopOnFail) {
    process.exit(1);
  }
}

const storiesDir = path.join(root, 'docs', 'stories');

if (!existsSync(storiesDir)) {
  throw new Error('docs/stories directory not found.');
}

ensureCleanWorktree();

const stories = readdirSync(storiesDir)
  .filter((name) => name.endsWith('.md'))
  .map((name) => ({ name, number: storyNumber(name), file: path.join(storiesDir, name) }))
  .filter((story) => story.number)
  .filter((story) => compareStoryNumbers(story.number, from) >= 0)
  .filter((story) => compareStoryNumbers(story.number, to) <= 0)
  .sort((a, b) => compareStoryNumbers(a.number, b.number))
  .slice(0, max);

append(`stories: ${stories.map((story) => story.name).join(', ')}`);

for (const story of stories) {
  const storyRelativePath = path.relative(root, story.file).replaceAll(path.sep, '/');
  let status = getStatus(story.file);

  append(`\n# Processing ${story.name}`);
  append(`initial_status: ${status}`);

  if (['Done', 'Deployed'].includes(status)) {
    append('SKIPPED: already complete.');
    continue;
  }

  if (status === 'Draft') {
    const ok = codexStep(
      `PO validate ${story.name}`,
      `$aios-god-mode .codex\\agents\\po.md *validate-story-draft ${storyRelativePath}`,
    );

    if (!ok) {
      fail(`PO validation failed for ${story.name}.`);
      continue;
    }

    status = dryRun ? 'Ready' : getStatus(story.file);

    if (status !== 'Ready') {
      fail(`PO did not promote ${story.name} to Ready. Current status: ${status}.`);
      continue;
    }
  }

  if (status !== 'Ready') {
    fail(`Story ${story.name} is not Ready. Current status: ${status}.`);
    continue;
  }

  if (!codexStep(`Dev develop ${story.name}`, `$aios-god-mode .codex\\agents\\dev.md *develop ${storyRelativePath}`)) {
    fail(`Dev failed for ${story.name}.`);
    continue;
  }

  if (!qualityGates()) {
    fail(`Quality gates failed after Dev for ${story.name}.`);
    continue;
  }

  if (!codexStep(`QA review ${story.name}`, `$aios-god-mode .codex\\agents\\qa.md *review ${storyRelativePath}`)) {
    fail(`QA review failed for ${story.name}.`);
    continue;
  }

  if (!qualityGates()) {
    fail(`Quality gates failed after QA for ${story.name}.`);
    continue;
  }

  const devopsPrompt = shouldPush
    ? `$aios-god-mode .codex\\agents\\devops.md *push-story ${storyRelativePath}`
    : `$aios-god-mode .codex\\agents\\devops.md *prepare-story ${storyRelativePath}`;

  if (!codexStep(`DevOps ${shouldPush ? 'push' : 'prepare'} ${story.name}`, devopsPrompt)) {
    fail(`DevOps failed for ${story.name}.`);
    continue;
  }
}

append('\n# COMPLETE');
append(`report: ${path.relative(root, reportPath).replaceAll(path.sep, '/')}`);
