import { beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { resetVideoFlowStoreForTests } from '@/lib/videoflow/store';

function request(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  headers.set('content-type', headers.get('content-type') ?? 'application/json');
  headers.set('x-user-id', headers.get('x-user-id') ?? '33333333-3333-4333-8333-333333333333');
  headers.set('x-workspace-id', headers.get('x-workspace-id') ?? '11111111-1111-4111-8111-111111111111');
  const requestInit: RequestInit = { headers };
  if (init.method !== undefined) requestInit.method = init.method;
  if (init.body !== undefined) requestInit.body = init.body;

  return new NextRequest(new Request(`http://localhost${path}`, requestInit));
}

describe('VideoFlow proxy routes', () => {
  beforeEach(() => resetVideoFlowStoreForTests());

  it('returns a dashboard payload composed through the proxy layer', async () => {
    const { GET } = await import('./dashboard/route');
    const response = await GET(request('/api/proxy/videoflow/dashboard'));
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.kpis.agentes_ativos).toBeGreaterThan(0);
    expect(body.productions.length).toBeGreaterThan(0);
    expect(body.templates.length).toBeGreaterThan(0);
    expect(body.concepts.length).toBeGreaterThan(0);
  });

  it('creates an immutable handoff envelope and recomputes the hash as the pipeline advances', async () => {
    const route = await import('./productions/[id]/route');
    const updateResponse = await route.PATCH(
      request('/api/proxy/videoflow/productions/prod-0001-4001-8001-0003-000000000003', {
        method: 'PATCH',
        body: JSON.stringify({
          action: 'update_vetor_da',
          vetor_da: {
            narrativa: {
              tom_emocional: 'inspirador',
              arco_dramatico: 'lista-educativa',
              pov: 'terceira-pessoa',
              densidade_informacao: 0.5,
              tensao_resolucao: { tensao: 0.4, resolucao: 0.8 },
              abertura_emocional: 'gancho_forte',
              cta: 'Descubra agora',
            },
            visual: {
              paleta_cores: { primaria: '#123456', secundaria: '#FFFFFF', accento: '#FF9900', fundo: '#000000' },
              temperatura_cor: 0,
              estilo_visual: 'editorial',
              hierarquia_visual: { foco: 'centro', simetria: false, grid: 'centro' },
              tipografia: { fonte_titulo: 'Outfit', fonte_corpo: 'Inter', tamanho_min: '16px', cor: '#FFFFFF' },
              densidade_quadros: 0.5,
              movimento_camera: 'estatico',
              transicoes: 'corte_seco',
            },
            sonoro: {
              genero_musical: 'cinematico',
              energia_trilha: 0.5,
              presenca_voz: 'voiceover_ai',
              uso_silencio: 0.2,
              design_som: { efeitos: [], ambiente: 'studio', sample_rate: '44100' },
              sincronia_audio_video: 'tempo_livre',
            },
            formato: {
              duracao_total_seg: 60,
              proporcao: '16:9',
              ritmo_corte: 0.5,
              plataforma: 'youtube',
              legendas: { habilitado: true, estilo: 'closed', idioma: 'pt-BR', fonte: 'Inter', posicao: 'inferior' },
            },
            marca: {
              personalidade_marca: 'Editorial confiável',
              restricoes_visuais: ['Sem neon'],
              tom_voz_marca: 'Claro',
              elementos_obrigatorios: ['Logo'],
            },
            meta: {
              originalidade: 0.8,
              referencia_cultural: [],
              grau_convecionalismo: 0.3,
              consistencia_serie: null,
            },
          },
        }),
      }),
      { params: Promise.resolve({ id: 'prod-0001-4001-8001-0003-000000000003' }) },
    );
    const updatedBody = await updateResponse.json();
    const firstHash = updatedBody.production.handoff.hash_envelope;

    const advancedResponse = await route.PATCH(
      request('/api/proxy/videoflow/productions/prod-0001-4001-8001-0003-000000000003', {
        method: 'PATCH',
        body: JSON.stringify({ action: 'advance_pipeline' }),
      }),
      { params: Promise.resolve({ id: 'prod-0001-4001-8001-0003-000000000003' }) },
    );
    const advancedBody = await advancedResponse.json();

    expect(updatedBody.production.handoff.algoritmo_assinatura).toBe('sha256');
    expect(updatedBody.production.handoff.pipeline.outputs.orquestrador).toBeTruthy();
    expect(updatedBody.production.handoff.publication_handoff.destination_module).toBe('fbr-social');
    expect(advancedBody.production.handoff.hash_envelope).not.toBe(firstHash);
    expect(advancedBody.production.handoff.pipeline.historico.at(-1)?.hash_envelope).toBe(advancedBody.production.handoff.hash_envelope);
  });
});
