import { beforeEach, describe, expect, it } from 'vitest';
import { resetRedacaoStoreForTests } from '@/lib/redacao/store';

function request(path: string, init: RequestInit = {}) {
  return new Request(`http://localhost${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      'x-user-id': '33333333-3333-4333-8333-333333333333',
      'x-workspace-id': '11111111-1111-4111-8111-111111111111',
      ...init.headers,
    },
  });
}

describe('Redacao proxy routes', () => {
  beforeEach(() => resetRedacaoStoreForTests());

  it('exposes published, detail and stage-intervention routes aligned to the PRD', async () => {
    const publicados = await import('./publicados/route');
    const artigo = await import('./artigos/[id]/route');
    const etapa = await import('./artigos/[id]/etapa/route');

    const publicadosResponse = await publicados.GET(request('/api/proxy/redacao/publicados'));
    const publicadosBody = await publicadosResponse.json();
    const artigoResponse = await artigo.GET(request('/api/proxy/redacao/artigos/aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa04'), {
      params: Promise.resolve({ id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa04' }),
    });
    const artigoBody = await artigoResponse.json();
    const invalidTransition = await etapa.PATCH(
      request('/api/proxy/redacao/artigos/aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa01/etapa', {
        method: 'PATCH',
        body: JSON.stringify({ etapa: 'coletado' }),
      }),
      { params: Promise.resolve({ id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa01' }) },
    );

    expect(publicadosResponse.status).toBe(200);
    expect(publicadosBody.publicados.every((entry: { etapa: string }) => entry.etapa === 'publicado')).toBe(true);
    expect(artigoResponse.status).toBe(200);
    expect(artigoBody.artigo.id).toBe('aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa04');
    expect(invalidTransition.status).toBe(400);
  });

  it('supports explicit UGC moderation and scoped alert resolution routes', async () => {
    const aceitar = await import('./ugc/[id]/aceitar/route');
    const rejeitar = await import('./ugc/[id]/rejeitar/route');
    const resolver = await import('./alertas/[id]/resolver/route');
    const alertas = await import('./alertas/route');

    const accepted = await aceitar.POST(request('/api/proxy/redacao/ugc/uuuu1111-uuuu-4uuu-8uuu-uuuuuuuuuuu1/aceitar', { method: 'POST' }), {
      params: Promise.resolve({ id: 'uuuu1111-uuuu-4uuu-8uuu-uuuuuuuuuuu1' }),
    });
    const acceptedBody = await accepted.json();
    const rejected = await rejeitar.POST(
      request('/api/proxy/redacao/ugc/uuuu1111-uuuu-4uuu-8uuu-uuuuuuuuuuu5/rejeitar', {
        method: 'POST',
        body: JSON.stringify({ motivo: 'Baixa relevancia editorial' }),
      }),
      { params: Promise.resolve({ id: 'uuuu1111-uuuu-4uuu-8uuu-uuuuuuuuuuu5' }) },
    );
    const resolved = await resolver.PATCH(request('/api/proxy/redacao/alertas/allll1111-alll-4all-8all-allllllllll2/resolver', { method: 'PATCH' }), {
      params: Promise.resolve({ id: 'allll1111-alll-4all-8all-allllllllll2' }),
    });
    const unresolvedOnly = await alertas.GET(request('/api/proxy/redacao/alertas'));
    const unresolvedBody = await unresolvedOnly.json();

    expect(accepted.status).toBe(200);
    expect(acceptedBody.ugc.status).toBe('aceito');
    expect(acceptedBody.artigo.etapa).toBe('coletado');
    expect(rejected.status).toBe(200);
    expect((await rejected.json()).ugc.status).toBe('rejeitado');
    expect(resolved.status).toBe(200);
    expect(unresolvedBody.alertas.every((entry: { resolvido: boolean }) => entry.resolvido === false)).toBe(true);
  });
});
