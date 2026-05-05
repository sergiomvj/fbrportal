#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const storiesDir = path.join(root, 'docs', 'stories');

function getStoryStatus(file) {
  try {
    const content = readFileSync(file, 'utf8');
    const match = content.match(/^## Status\s*\r?\n\s*(.+?)\s*$/m);
    return match ? match[1].trim() : 'Unknown';
  } catch (e) {
    return 'Error';
  }
}

function invokeGemini(prompt) {
  console.log(`\n🤖 Invocando Gemini: "${prompt.substring(0, 100)}..."`);
  const result = spawnSync('gemini-cli', ['invoke_agent', '--agent_name', 'generalist', '--prompt', prompt], {
    cwd: root,
    encoding: 'utf8',
    stdio: 'inherit',
  });
  return result.status === 0;
}

const files = readdirSync(storiesDir)
  .filter(f => f.endsWith('.md') && f !== 'README.md')
  .sort();

console.log('🚀 Iniciando Pipeline Autônoma V2...');

for (const file of files) {
  const filePath = path.join(storiesDir, file);
  let status = getStoryStatus(filePath);
  const storyId = file.replace('.md', '');

  if (status === 'Done' || status === 'Deployed') continue;

  console.log(`\n📦 [STORY ${storyId}] Status: ${status}`);

  if (status === 'Draft') {
    invokeGemini(`Você é o Agente @po. Valide a story docs/stories/${file}. Se estiver correta, mude o status para 'Ready'.`);
    status = getStoryStatus(filePath);
  }

  if (status === 'Ready') {
    invokeGemini(`Você é o Agente @dev. Implemente a story docs/stories/${file}. Rode os testes e gates. Se OK, mude para 'Ready for Review'.`);
    status = getStoryStatus(filePath);
  }

  if (status === 'Ready for Review') {
    invokeGemini(`Você é o Agente @qa. Realize o review da story docs/stories/${file}. Se todos os ACs forem atendidos e testes passarem, mude para 'Done'.`);
  }
}

console.log('\n✅ Automação completa.');
