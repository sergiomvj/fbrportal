import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function walkFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? walkFiles(path) : [path];
  });
}

describe('Click client security boundaries', () => {
  it('does not import backend-only secrets or server env modules into the Click UI surface', () => {
    const files = walkFiles(join(process.cwd(), 'src/app/click')).filter(
      (file) => /\.(tsx?|css)$/.test(file) && !/\.test\./.test(file),
    );
    const content = files.map((file) => readFileSync(file, 'utf8')).join('\n');

    expect(content).not.toContain('env.server');
    expect(content).not.toContain('supabase-admin');
    expect(content).not.toContain('process.env');
  });
});
