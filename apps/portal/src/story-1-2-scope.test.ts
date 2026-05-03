import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const root = path.resolve(__dirname, '..', '..', '..');
const storyPaths = [
  path.join(root, 'packages', 'ui', 'src'),
  path.join(root, 'packages', 'arva-integration', 'src'),
  path.join(root, 'apps', 'portal', 'src', 'app', 'api', 'arva'),
];
const forbiddenWorkflowTerms = ['crm pipeline', 'invoice reconciliation', 'lead scoring workflow', 'newsroom workflow'];

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const fullPath = path.join(dir, name);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      return sourceFiles(fullPath);
    }

    return /\.(ts|tsx|css)$/.test(name) ? [fullPath] : [];
  });
}

describe('Story 1.2 scope guard', () => {
  it('keeps implementation reusable and out of module-specific workflows', () => {
    const content = storyPaths.flatMap(sourceFiles).map((file) => readFileSync(file, 'utf8').toLowerCase());

    for (const term of forbiddenWorkflowTerms) {
      expect(content.join('\n')).not.toContain(term);
    }
  });
});
