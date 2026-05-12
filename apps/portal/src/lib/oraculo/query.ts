import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { OraculoContext, OraculoQueryResponse, OraculoSource } from './types';

interface SourceRootConfig {
  dirs: string[];
  files: string[];
}

const TEXT_EXTENSIONS = new Set(['.ts', '.tsx', '.md', '.sql']);
const MODULE_SOURCE_ROOTS: Record<string, SourceRootConfig> = {
  portal: {
    dirs: ['apps/portal/src/app', 'packages/auth/src'],
    files: ['fbr-portal-docs/Oraculo/prd.md', 'docs/stories/1.12.portal-ui-shell-navigation.md'],
  },
  finance: {
    dirs: ['apps/portal/src/app/finance', 'apps/portal/src/lib/finance'],
    files: ['docs/stories/1.4.fbr-finance-backbone-completion.md'],
  },
  click: {
    dirs: ['apps/portal/src/app/click', 'apps/portal/src/lib/click'],
    files: ['docs/stories/1.3.fbr-click-crm-completion.md'],
  },
  leads: {
    dirs: ['apps/portal/src/app/leads', 'apps/portal/src/lib/leads'],
    files: ['docs/stories/1.5.fbr-leads-outbound-completion.md'],
  },
  mkt: {
    dirs: ['apps/portal/src/app/mkt', 'apps/portal/src/lib/mkt'],
    files: ['docs/stories/2.5.fbr-mkt-conformity-alignment.md'],
  },
  redacao: {
    dirs: ['apps/portal/src/app/redacao', 'apps/portal/src/lib/redacao'],
    files: ['docs/stories/1.7.fbr-redacao-newsroom-completion.md'],
  },
  sales: {
    dirs: ['apps/portal/src/app/sales', 'apps/portal/src/lib/sales'],
    files: ['docs/stories/1.8.fbr-sales-revenue-completion.md'],
  },
  social: {
    dirs: ['apps/portal/src/app/social', 'apps/portal/src/lib/social'],
    files: ['docs/stories/1.9.fbr-social-visual-production-completion.md'],
  },
  videoflow: {
    dirs: ['apps/portal/src/app/videoflow', 'apps/portal/src/lib/videoflow'],
    files: ['docs/stories/1.10.videoflow-production-agent-completion.md'],
  },
  design: {
    dirs: ['apps/portal/src/app/design', 'apps/portal/src/lib/design'],
    files: ['docs/stories/1.11.fbr-design-graphic-agent-completion.md'],
  },
};

const SHARED_ROOTS: SourceRootConfig = {
  dirs: ['packages/portal-bridge/src'],
  files: ['AGENTS.md', 'fbr-portal-docs/Oraculo/prd.md'],
};

const SOURCE_CACHE = new Map<string, string[]>();
const openrouter = createOpenAI({
  apiKey: process.env.OPENROUTER_API_KEY || 'dummy',
  baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1',
});

function repoRoot() {
  return resolve(process.cwd(), '..', '..');
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

function unique<T>(values: T[]) {
  return [...new Set(values)];
}

function tokenize(value: string) {
  return unique(
    normalize(value)
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length >= 3),
  );
}

function shouldIncludeFile(pathname: string) {
  const lower = pathname.toLowerCase();
  if (lower.includes('node_modules') || lower.includes('.next') || lower.includes('test-results')) {
    return false;
  }

  if (lower.includes('.test.') || lower.includes('.spec.')) {
    return false;
  }

  return [...TEXT_EXTENSIONS].some((extension) => lower.endsWith(extension));
}

function walkDirectory(root: string): string[] {
  const entries = readdirSync(root, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const absolute = join(root, entry.name);
    if (entry.isDirectory()) {
      return walkDirectory(absolute);
    }

    return shouldIncludeFile(absolute) ? [absolute] : [];
  });
}

function collectFiles(context: OraculoContext) {
  const cacheKey = context.module;
  const cached = SOURCE_CACHE.get(cacheKey);
  if (cached) {
    return cached;
  }

  const moduleConfig: SourceRootConfig = MODULE_SOURCE_ROOTS[context.module] ?? MODULE_SOURCE_ROOTS.portal ?? SHARED_ROOTS;
  const base = repoRoot();
  const files = unique([
    ...moduleConfig.files.map((file) => resolve(base, file)).filter((file) => existsSync(file)),
    ...SHARED_ROOTS.files.map((file) => resolve(base, file)).filter((file) => existsSync(file)),
    ...moduleConfig.dirs.flatMap((dir) => {
      const absolute = resolve(base, dir);
      return existsSync(absolute) && statSync(absolute).isDirectory() ? walkDirectory(absolute) : [];
    }),
    ...SHARED_ROOTS.dirs.flatMap((dir) => {
      const absolute = resolve(base, dir);
      return existsSync(absolute) && statSync(absolute).isDirectory() ? walkDirectory(absolute) : [];
    }),
  ]);

  SOURCE_CACHE.set(cacheKey, files);
  return files;
}

function titleFromPath(pathname: string) {
  return pathname.replace(`${repoRoot()}\\`, '').replaceAll('\\', '/');
}

function buildSource(filePath: string, lines: string[], lineIndex: number): OraculoSource {
  const start = Math.max(0, lineIndex - 1);
  const end = Math.min(lines.length - 1, lineIndex + 1);

  return {
    filePath: titleFromPath(filePath),
    title: titleFromPath(filePath),
    lineStart: start + 1,
    lineEnd: end + 1,
    excerpt: lines.slice(start, end + 1).join('\n').trim(),
  };
}

function scoreLine(line: string, tokens: string[]) {
  const normalizedLine = normalize(line);
  return tokens.reduce((score, token) => score + (normalizedLine.includes(token) ? 3 : 0), 0);
}

function scorePath(pathname: string, tokens: string[]) {
  const normalizedPath = normalize(pathname);
  return tokens.reduce((score, token) => score + (normalizedPath.includes(token) ? 2 : 0), 0);
}

function searchSources(question: string, context: OraculoContext): OraculoSource[] {
  const tokens = unique([
    ...tokenize(question),
    ...tokenize(context.module),
    ...tokenize(context.screen),
  ]);

  const hits = collectFiles(context)
    .flatMap((filePath) => {
      const content = readFileSync(filePath, 'utf8');
      const lines = content.split(/\r?\n/);
      const pathScore = scorePath(filePath, tokens);

      return lines
        .map((line, index) => ({
          filePath,
          index,
          score: pathScore + scoreLine(line, tokens),
          line,
          lines,
        }))
        .filter((entry) => entry.score > 0)
        .map((entry) => ({
          source: buildSource(entry.filePath, entry.lines, entry.index),
          score: entry.score,
        }));
    })
    .sort((left, right) => right.score - left.score)
    .slice(0, 6);

  return unique(hits.map((hit) => JSON.stringify(hit.source))).map((value) => JSON.parse(value) as OraculoSource);
}

function buildLimitation(question: string) {
  return [
    `Nao encontrei evidencia suficiente nos arquivos mapeados para responder "${question}" com seguranca.`,
    'Tente citar uma rota, entidade, agente, tabela ou fluxo mais especifico desta tela.',
  ].join(' ');
}

function formatSourcesForPrompt(sources: OraculoSource[]) {
  return sources
    .map((source, index) => {
      return [
        `[FONTE ${index + 1}] ${source.filePath}:${source.lineStart}-${source.lineEnd}`,
        source.excerpt,
      ].join('\n');
    })
    .join('\n\n');
}

async function buildAnswer(question: string, context: OraculoContext, sources: OraculoSource[]) {
  if (sources.length === 0) {
    return buildLimitation(question);
  }

  const { text } = await generateText({
    model: openrouter(process.env.OPENROUTER_MODEL || 'anthropic/claude-opus-4.7-fast'),
    temperature: 0.1,
    system: [
      'Voce e o Oraculo do FBR Portal.',
      'Responda apenas com base nas fontes fornecidas.',
      'Nao invente comportamento, regras ou fluxos nao suportados pelas fontes.',
      'Se as fontes forem insuficientes, diga explicitamente que a evidencia e insuficiente.',
      'Explique de forma objetiva em portugues do Brasil.',
      'Quando afirmar algo concreto, mencione as fontes no formato [arquivo:linha].',
    ].join(' '),
    prompt: [
      `Contexto atual: modulo ${context.moduleLabel}, tela ${context.screenLabel}, rota ${context.pathname}.`,
      `Pergunta do usuario: ${question}`,
      'Fontes recuperadas do repositorio:',
      formatSourcesForPrompt(sources),
      'Responda usando somente essas fontes.',
    ].join('\n\n'),
  });

  return text.trim() || buildLimitation(question);
}

export async function queryOraculo(question: string, context: OraculoContext): Promise<OraculoQueryResponse> {
  const sources = searchSources(question, context);

  return {
    answer: await buildAnswer(question, context, sources),
    context,
    sources,
  };
}
