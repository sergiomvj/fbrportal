#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const args = parseArgs(process.argv.slice(2));
const from = args.from ?? '1.2';
const to = args.to ?? '1.14';
const max = args.max ? Number(args.max) : Number.POSITIVE_INFINITY;
const dryRun = Boolean(args['dry-run']);
const continueOnFail = Boolean(args['continue']);
const allowDirty = Boolean(args['allow-dirty']);
const qaLoops = args['qa-loops'] ? Number(args['qa-loops']) : 2;
const fixLoops = args['fix-loops'] ? Number(args['fix-loops']) : 2;
const poReworkLoops = args['po-rework-loops'] ? Number(args['po-rework-loops']) : 1;
const codexTimeoutMs = args['codex-timeout-ms'] ? Number(args['codex-timeout-ms']) : 600000;
const gateTimeoutMs = args['gate-timeout-ms'] ? Number(args['gate-timeout-ms']) : 600000;
const includeReview = args['include-review'] !== false;
const includeDraft = args['include-draft'] !== false;
const includeReady = args['include-ready'] !== false;
const includeParents = Boolean(args['include-parents']);
const codexBin = args['codex-bin'] ?? process.env.CODEX_BIN ?? 'codex';
const resume = Boolean(args.resume);
const reset = Boolean(args.reset);
const failures = [];

const runDir = path.join(root, 'docs', 'story-runs');
const statePath = path.join(runDir, 'attack-state.json');
const runId = new Date().toISOString().replaceAll(':', '-').replace(/\.\d+Z$/, 'Z');
const reportPath = path.join(runDir, `attack-${runId}.md`);
const report = [
  `# Story Attack Run ${runId}`,
  '',
  `range: ${from}..${to}`,
  `dry_run: ${dryRun}`,
  `continue: ${continueOnFail}`,
  `qa_loops: ${qaLoops}`,
  `fix_loops: ${fixLoops}`,
  `po_rework_loops: ${poReworkLoops}`,
  `codex_timeout_ms: ${codexTimeoutMs}`,
  `gate_timeout_ms: ${gateTimeoutMs}`,
  `include_parents: ${includeParents}`,
  `codex_bin: ${codexBin}`,
  `resume: ${resume}`,
  '',
];
let attackState = {
  runId,
  from,
  to,
  completed: [],
  failed: [],
  current: null,
  interrupted: false,
  updatedAt: new Date().toISOString(),
};

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

function append(line = '') {
  report.push(line);
  writeFileSync(reportPath, `${report.join('\n')}\n`);
  console.log(line);
}

function loadState() {
  if (dryRun) {
    return;
  }

  if (reset && existsSync(statePath)) {
    unlinkSync(statePath);
  }

  if (!resume || !existsSync(statePath)) {
    return;
  }

  const parsed = JSON.parse(readFileSync(statePath, 'utf8'));
  attackState = {
    ...attackState,
    ...parsed,
    runId,
    interrupted: false,
    updatedAt: new Date().toISOString(),
  };
}

function saveState(patch = {}) {
  if (dryRun) {
    return;
  }

  attackState = {
    ...attackState,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  writeFileSync(statePath, `${JSON.stringify(attackState, null, 2)}\n`);
}

function markCurrent(story, stage) {
  saveState({
    current: story
      ? {
          name: story.name,
          number: story.number,
          stage,
        }
      : null,
  });
}

function markCompleted(storyName) {
  saveState({
    completed: Array.from(new Set([...attackState.completed, storyName])),
    current: null,
  });
}

function markFailed(storyName, message) {
  saveState({
    failed: [
      ...attackState.failed.filter((item) => item.storyName !== storyName),
      { storyName, message, at: new Date().toISOString() },
    ],
    current: null,
  });
}

function interrupt(signal) {
  append(`\n## INTERRUPTED: ${signal}`);
  append('');
  append('State saved. Resume command:');
  append('```powershell');
  append(`npm run stories:attack -- --from ${from} --to ${to} --allow-dirty --continue --resume --codex-bin "${codexBin}"`);
  append('```');
  append(`state: ${path.relative(root, statePath).replaceAll(path.sep, '/')}`);
  append(`report: ${path.relative(root, reportPath).replaceAll(path.sep, '/')}`);
  saveState({ interrupted: true });
  process.exit(130);
}

function run(command, commandArgs, options = {}) {
  const printable = [command, ...commandArgs].join(' ');
  append('');
  append('```powershell');
  append(printable);
  append('```');

  if (dryRun) {
    return { status: 0, stdout: '', stderr: '' };
  }

  const executable = process.platform === 'win32' && command === codexBin ? 'powershell.exe' : command;
  const argsForSpawn =
    process.platform === 'win32' && command === codexBin
      ? ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', `& ${psQuote(codexBin)} ${commandArgs.map(psQuote).join(' ')}`]
      : commandArgs;

  const result = spawnSync(executable, argsForSpawn, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32' && command !== codexBin,
    stdio: options.capture ? 'pipe' : 'inherit',
    timeout: options.timeoutMs,
  });

  if (result.error) {
    append(`command_error: ${result.error.message}`);
  }

  if (result.signal) {
    append(`command_signal: ${result.signal}`);
  }

  if (options.capture) {
    if (result.stdout) {
      append('stdout:');
      append('```text');
      append(result.stdout.trim());
      append('```');
    }

    if (result.stderr) {
      append('stderr:');
      append('```text');
      append(result.stderr.trim());
      append('```');
    }
  }

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    timedOut: result.error?.code === 'ETIMEDOUT',
  };
}

function psQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function gitOutput(...gitArgs) {
  const result = spawnSync('git', gitArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    stdio: 'pipe',
  });

  if ((result.status ?? 1) !== 0) {
    const reason = result.stderr ?? result.error?.message ?? 'unknown error';
    throw new Error(`git ${gitArgs.join(' ')} failed: ${reason}`);
  }

  return result.stdout.trim();
}

function ensureRunnableWorktree() {
  if (allowDirty) {
    return;
  }

  const status = gitOutput('status', '--short');

  if (!status) {
    return;
  }

  append('## BLOCKED: dirty worktree');
  append('');
  append('The attack automation will not overwrite uncommitted work unless `--allow-dirty` is set.');
  append('');
  append('```text');
  append(status);
  append('```');
  append('');
  append('Resume command:');
  append('```powershell');
  append(`npm run stories:attack -- --from ${from} --to ${to} --allow-dirty`);
  append('```');
  process.exit(2);
}

function commandExists(command) {
  if (dryRun) {
    return true;
  }

  if (command.includes('\\') || command.includes('/') || command.includes(':')) {
    const result = spawnSync('powershell.exe', ['-NoProfile', '-Command', `Test-Path -LiteralPath ${psQuote(command)}`], {
      cwd: root,
      encoding: 'utf8',
      stdio: 'pipe',
    });

    return (result.stdout ?? '').trim().toLowerCase() === 'true';
  }

  const probe =
    process.platform === 'win32'
      ? spawnSync('powershell.exe', ['-NoProfile', '-Command', `Get-Command ${psQuote(command)} -ErrorAction SilentlyContinue`], {
          cwd: root,
          encoding: 'utf8',
          stdio: 'pipe',
        })
      : spawnSync('command', ['-v', command], {
          cwd: root,
          encoding: 'utf8',
          shell: true,
          stdio: 'pipe',
        });

  return (probe.status ?? 1) === 0 && Boolean((probe.stdout ?? '').trim());
}

function ensureCodexAvailable() {
  const isPlaceholder =
    codexBin.toLowerCase().includes('c:\\path\\to\\') ||
    codexBin.toLowerCase().includes('c:\\real\\path\\') ||
    codexBin.toLowerCase().includes('/path/to/') ||
    codexBin.toLowerCase().includes('/real/path/');

  if (isPlaceholder) {
    append('## BLOCKED: placeholder Codex path');
    append('');
    append(`The value \`${codexBin}\` is an example path, not the real Codex CLI path.`);
    append('');
    append('Find the real executable in the shell where Codex works, then resume with:');
    append('');
    append('```powershell');
    append(`npm run stories:attack -- --from ${from} --to ${to} --allow-dirty --continue --resume --codex-bin "C:\\real\\path\\to\\codex.cmd"`);
    append('```');
    saveState({ interrupted: true });
    process.exit(2);
  }

  if (commandExists(codexBin)) {
    return;
  }

  append('## BLOCKED: Codex CLI not found');
  append('');
  append(`The automation needs a Codex CLI executable, but \`${codexBin}\` is not available to this PowerShell process.`);
  append('');
  append('Resume with one of these forms after exposing the executable:');
  append('');
  append('```powershell');
  append(`$env:CODEX_BIN="C:\\path\\to\\codex.cmd"; npm run stories:attack -- --from ${from} --to ${to} --allow-dirty --continue`);
  append('```');
  append('');
  append('```powershell');
  append(`npm run stories:attack -- --from ${from} --to ${to} --allow-dirty --continue --codex-bin "C:\\path\\to\\codex.cmd"`);
  append('```');
  saveState({ interrupted: true });
  process.exit(2);
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

function getStoryMeta(storyPath) {
  const content = readFileSync(storyPath, 'utf8');
  const title = content.match(/^#\s+(.+)$/m)?.[1]?.trim() ?? path.basename(storyPath);
  const status = content.match(/^## Status\s*\r?\n\s*(.+?)\s*$/m)?.[1]?.trim() ?? 'Unknown';

  return { content, status, title };
}

function shouldProcess(status) {
  if (['Done', 'Deployed'].includes(status)) {
    return false;
  }

  if (status === 'Draft') {
    return includeDraft;
  }

  if (status === 'Ready') {
    return includeReady;
  }

  if (status === 'Ready for Review') {
    return includeReview;
  }

  return true;
}

function isParentSplitStory(storyPath) {
  const { content } = getStoryMeta(storyPath);

  return /^## Split Plan\s*$/m.test(content);
}

function codexPrompt(prompt) {
  return run(codexBin, [
    '-a',
    'never',
    '-s',
    'workspace-write',
    'exec',
    '-C',
    root,
    prompt,
  ], { timeoutMs: codexTimeoutMs });
}

function aiosStep(label, storyRelativePath, command, extra = '') {
  append(`\n## ${label}`);
  return codexPrompt(
    [
      '$aios-god-mode',
      command,
      storyRelativePath,
      extra,
      'Siga a Constitution, nao invente requisitos, atualize checklist/File List/QA Results quando aplicavel, rode gates exigidos ou registre bloqueio concreto.',
    ]
      .filter(Boolean)
      .join(' '),
  ).status === 0;
}

function gates(label) {
  append(`\n## Gates: ${label}`);

  for (const script of ['lint', 'typecheck', 'test', 'build']) {
    const result = run('npm.cmd', ['run', script], { timeoutMs: gateTimeoutMs });

    if (result.status !== 0) {
      append(`FAILED: npm run ${script}`);
      if (result.timedOut) {
        append(`TIMEOUT: npm run ${script} exceeded ${gateTimeoutMs}ms`);
      }
      return false;
    }
  }

  return true;
}

function repairGates(storyRelativePath, attempt) {
  append(`\n## Gate repair attempt ${attempt}`);
  return codexPrompt(
    [
      '$aios-god-mode',
      'Corrija somente os erros dos gates desta story:',
      storyRelativePath,
      'Nao reverta trabalho do usuario.',
      'Mantenha escopo da story.',
      'Depois rode lint, typecheck, test e build; atualize Debug Log References/QA Results.',
    ].join(' '),
  ).status === 0;
}

function reworkDraft(storyRelativePath, attempt) {
  append(`\n## Draft rework attempt ${attempt}`);
  return codexPrompt(
    [
      '$aios-god-mode',
      '@sm *rework-story',
      storyRelativePath,
      'Resolva os bloqueios PO registrados na propria story sem inventar requisitos.',
      'Se depender de decisao arquitetural ausente, registre a decisao necessaria de forma concreta e mantenha a story em Draft/NO-GO.',
      'Atualize Change Log, Dev Agent Record e File List quando aplicavel.',
    ].join(' '),
  ).status === 0;
}

function qaGatePath(story) {
  const suffix = story.name
    .replace(/\.md$/, '')
    .replace(new RegExp(`^${story.number.replaceAll('.', '\\.')}\\.`), '')
    .replaceAll('.', '-');

  return path.join(root, 'docs', 'qa', 'gates', `${story.number}-${suffix}.yml`);
}

function getQaGate(story) {
  const gatePath = qaGatePath(story);

  if (!existsSync(gatePath)) {
    return { gate: 'UNKNOWN', gatePath };
  }

  const content = readFileSync(gatePath, 'utf8');
  const gate = content.match(/^gate:\s*['"]?([A-Z]+)['"]?\s*$/m)?.[1] ?? 'UNKNOWN';

  return { gate, gatePath };
}

function failStory(storyName, message) {
  failures.push({ storyName, message });
  markFailed(storyName, message);
  append(`\n## FAILED: ${storyName}`);
  append(message);

  if (!continueOnFail) {
    append('');
    append('Resume command:');
    append('```powershell');
    append(`npm run stories:attack -- --from ${from} --to ${to} --allow-dirty --continue`);
    append('```');
    process.exit(1);
  }
}

function runGatesWithRepair(storyRelativePath, label) {
  if (gates(label)) {
    return true;
  }

  for (let attempt = 1; attempt <= fixLoops; attempt += 1) {
    if (!repairGates(storyRelativePath, attempt)) {
      continue;
    }

    if (gates(`${label} after repair ${attempt}`)) {
      return true;
    }
  }

  return false;
}

const storiesDir = path.join(root, 'docs', 'stories');

if (!existsSync(storiesDir)) {
  throw new Error('docs/stories directory not found.');
}

mkdirSync(runDir, { recursive: true });
loadState();
saveState({
  runId,
  from,
  to,
  dryRun,
  continueOnFail,
  codexBin,
});
process.on('SIGINT', () => interrupt('SIGINT'));
process.on('SIGTERM', () => interrupt('SIGTERM'));
ensureRunnableWorktree();
ensureCodexAvailable();

const stories = readdirSync(storiesDir)
  .filter((name) => name.endsWith('.md'))
  .map((name) => ({ name, number: storyNumber(name), file: path.join(storiesDir, name) }))
  .filter((story) => story.number)
  .filter((story) => compareStoryNumbers(story.number, from) >= 0)
  .filter((story) => compareStoryNumbers(story.number, to) <= 0)
  .sort((a, b) => compareStoryNumbers(a.number, b.number))
  .filter((story) => includeParents || !isParentSplitStory(story.file))
  .filter((story) => shouldProcess(getStoryMeta(story.file).status))
  .filter((story) => !resume || !attackState.completed.includes(story.name))
  .slice(0, max);

append(`stories: ${stories.map((story) => story.name).join(', ') || 'none'}`);

for (const story of stories) {
  const storyRelativePath = path.relative(root, story.file).replaceAll(path.sep, '/');
  let meta = getStoryMeta(story.file);

  markCurrent(story, 'start');
  append(`\n# Processing ${story.name}`);
  append(`title: ${meta.title}`);
  append(`initial_status: ${meta.status}`);

  if (meta.status === 'Draft') {
    let promoted = false;

    for (let attempt = 0; attempt <= poReworkLoops; attempt += 1) {
      if (attempt > 0) {
        markCurrent(story, `draft-rework-attempt-${attempt}`);
        reworkDraft(storyRelativePath, attempt);
      }

      markCurrent(story, `po-validation-attempt-${attempt + 1}`);
      const ok = aiosStep(`PO validation attempt ${attempt + 1}`, storyRelativePath, '@po *validate-story-draft');

      if (!ok) {
        failStory(story.name, `PO validation command failed on attempt ${attempt + 1}.`);
        break;
      }

      meta = dryRun ? { ...meta, status: 'Ready' } : getStoryMeta(story.file);

      if (meta.status === 'Ready') {
        promoted = true;
        break;
      }
    }

    if (!promoted) {
      failStory(story.name, `PO validation did not promote story to Ready. Current status: ${meta.status}`);
      continue;
    }
  }

  if (meta.status === 'Ready') {
    markCurrent(story, 'dev-implementation');
    const ok = aiosStep('Dev implementation', storyRelativePath, '@dev *develop');

    if (!ok) {
      failStory(story.name, 'Dev implementation command failed.');
      continue;
    }

    markCurrent(story, 'gates-after-dev');
    if (!runGatesWithRepair(storyRelativePath, 'after dev')) {
      failStory(story.name, 'Quality gates failed after repair attempts.');
      continue;
    }

    meta = getStoryMeta(story.file);
  }

  if (meta.status === 'Ready for Review') {
    let reviewed = false;

    for (let attempt = 1; attempt <= qaLoops + 1; attempt += 1) {
      markCurrent(story, `qa-review-attempt-${attempt}`);
      const ok = aiosStep(`QA review attempt ${attempt}`, storyRelativePath, '@qa *review');

      if (!ok) {
        failStory(story.name, `QA review command failed on attempt ${attempt}.`);
        break;
      }

      const qaGate = getQaGate(story);

      if (qaGate.gate === 'FAIL') {
        append(`QA gate file is FAIL: ${path.relative(root, qaGate.gatePath).replaceAll(path.sep, '/')}`);

        if (attempt <= qaLoops) {
          markCurrent(story, `dev-qa-fixes-attempt-${attempt}`);
          aiosStep(`Dev QA fixes attempt ${attempt}`, storyRelativePath, '@dev *fix-qa');
          continue;
        }

        failStory(story.name, 'QA gate is FAIL after QA loop attempts.');
        break;
      }

      markCurrent(story, `gates-after-qa-attempt-${attempt}`);
      if (runGatesWithRepair(storyRelativePath, `after QA attempt ${attempt}`)) {
        reviewed = true;
        break;
      }

      if (attempt <= qaLoops) {
        markCurrent(story, `dev-qa-fixes-attempt-${attempt}`);
        aiosStep(`Dev QA fixes attempt ${attempt}`, storyRelativePath, '@dev *fix-qa');
      }
    }

    if (!reviewed) {
      failStory(story.name, 'QA loop exhausted without green gates.');
      continue;
    }
  }

  append(`completed_story: ${story.name}`);
  markCompleted(story.name);
}

append('\n# COMPLETE');
saveState({ current: null, interrupted: false });
if (failures.length > 0) {
  append('');
  append('## Failed Stories');
  for (const failure of failures) {
    append(`- ${failure.storyName}: ${failure.message}`);
  }
}
append(`report: ${path.relative(root, reportPath).replaceAll(path.sep, '/')}`);

if (failures.length > 0) {
  process.exitCode = 1;
}
