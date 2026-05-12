import { beforeEach, describe, expect, it, vi } from 'vitest';

const getSession = vi.hoisted(() => vi.fn());
const queryOraculo = vi.hoisted(() => vi.fn());

vi.mock('@fbr/auth', () => ({
  getSession,
}));

vi.mock('@/lib/oraculo/query', () => ({
  queryOraculo,
}));

describe('/api/oraculo/query', () => {
  beforeEach(() => {
    getSession.mockReset();
    queryOraculo.mockReset();
  });

  it('rejects unauthenticated requests', async () => {
    getSession.mockResolvedValue(null);
    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/oraculo/query', {
        body: JSON.stringify({ question: 'Como funciona o portal?', context: {} }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: 'Unauthorized.' });
  });

  it('returns grounded citations for authenticated requests', async () => {
    getSession.mockResolvedValue({
      userId: 'user-1',
      email: 'operator@example.com',
      role: 'operator',
      empresaId: 'empresa-1',
    });
    queryOraculo.mockResolvedValue({
      answer: 'O fluxo parte do ClickWorkspace [apps/portal/src/app/click/_components/ClickWorkspace.tsx:251].',
      context: {
        module: 'click',
        moduleLabel: 'FBR-Click',
        screen: 'workspace',
        screenLabel: 'Workspace',
        pathname: '/click',
        suggestedQuestions: [],
      },
      sources: [
        {
          filePath: 'apps/portal/src/app/click/_components/ClickWorkspace.tsx',
          title: 'apps/portal/src/app/click/_components/ClickWorkspace.tsx',
          lineStart: 251,
          lineEnd: 253,
          excerpt: 'Deals vindos de `lead.qualified` entram em `contato_inicial`.',
        },
      ],
    });

    const { POST } = await import('./route');
    const response = await POST(
      new Request('http://localhost/api/oraculo/query', {
        body: JSON.stringify({
          question: 'Como um SQL entra no pipeline do Click?',
          context: {
            module: 'click',
            moduleLabel: 'FBR-Click',
            screen: 'workspace',
            screenLabel: 'Workspace',
            pathname: '/click',
            suggestedQuestions: [],
          },
        }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      }),
    );

    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.answer).toContain('ClickWorkspace');
    expect(body.sources.length).toBeGreaterThan(0);
    expect(body.sources[0]).toMatchObject({
      filePath: expect.any(String),
      lineStart: expect.any(Number),
      excerpt: expect.any(String),
    });
    expect(queryOraculo).toHaveBeenCalledTimes(1);
  });
});
