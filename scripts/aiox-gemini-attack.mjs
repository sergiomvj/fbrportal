#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

/**
 * AIOX Gemini Attack - Shortcut Script
 * This script invokes the Gemini CLI to run the 'attackRemainingStories' task.
 */

const root = process.cwd();
const args = process.argv.slice(2);

console.log('🚀 Iniciando AIOX Gemini Attack...');

const prompt = `Execute a tarefa attackRemainingStories com os seguintes argumentos: ${args.join(' ')}. 
Use o sub-agente generalist para processar as histórias em lote e mantenha o log em docs/story-runs/`;

const result = spawnSync('gemini-cli', ['invoke_agent', '--agent_name', 'aiox-master', '--prompt', prompt], {
  cwd: root,
  encoding: 'utf8',
  stdio: 'inherit',
});

if (result.status !== 0) {
  console.error('❌ Erro ao invocar Gemini CLI.');
  process.exit(result.status ?? 1);
}

console.log('✅ Automação concluída.');
