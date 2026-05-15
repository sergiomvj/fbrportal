import { describe, expect, it } from 'vitest';
import { buildCampaignRowsFromStrategyVersions } from './campaigns';
import type { MktCampaignSource } from './campaigns';

const estrategiaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const empresaId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const userId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function sources(): MktCampaignSource[] {
  return [
    {
      estrategia: {
        id: estrategiaId,
        user_id: userId,
        empresa_id: empresaId,
        nome: 'Estrategia com Campanhas',
        status: 'ativa',
        versao: 2,
        created_at: '2026-05-13T10:00:00.000Z',
      },
      versao: {
        estrategia_id: estrategiaId,
        versao: 2,
        gerado_por: 'estrategista_bot',
        created_at: '2026-05-13T10:05:00.000Z',
        conteudo: {
          posicionamento: {
            brand_archetype: 'Sage',
            tom_de_voz: 'Consultivo',
            uvp: 'Crescimento previsivel',
            posicionamento_mercado: 'Consultoria B2B.',
          },
          mix_canais: [{ nome: 'linkedin', percentual_alocacao: 60, justificativa: 'Persona ativa.' }],
          kpis: [{ canal: 'linkedin', roi: '3.2x' }],
          campanhas: [
            {
              nome: 'Diagnostico Executivo',
              objetivo_smart: 'Gerar 40 SQLs em 30 dias.',
              mensagens_chave: ['Pipeline previsivel'],
              budget: 'R$ 12.000',
              timeline: '30 dias',
              formatos: ['ebook', 'email'],
              audiencias_segmentadas: ['Diretores comerciais'],
              canal: 'linkedin',
              prioridade: 1,
            },
            {
              nome: 'Awareness de Marca',
              objetivo_smart: 'Aumentar alcance qualificado.',
              mensagens_chave: ['Autoridade'],
              budget: 'R$ 8.500',
              timeline: '45 dias',
              formatos: ['post'],
              audiencias_segmentadas: ['Founders'],
              canal: 'instagram',
              prioridade: 2,
            },
          ],
        },
      },
    },
  ];
}

describe('MKT campaign compatibility contracts', () => {
  it('projects strategy-version campaign briefings into the legacy campaigns API shape', () => {
    const result = buildCampaignRowsFromStrategyVersions(sources(), { page: 1, page_size: 10 });

    expect(result.pagination).toEqual({ page: 1, page_size: 10, total: 2, total_pages: 1 });
    expect(result.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          company_id: empresaId,
          nome: 'Awareness de Marca',
          status: 'ativa',
          tipo: 'awareness',
          budget: 8500,
          canal: 'instagram',
          responsavel: 'estrategista_bot',
        }),
        expect.objectContaining({
          nome: 'Diagnostico Executivo',
          tipo: 'leads',
          budget: 12000,
          roi: 3.2,
        }),
      ]),
    );
  });

  it('keeps filtering and pagination scoped to generated campaign rows', () => {
    const result = buildCampaignRowsFromStrategyVersions(sources(), {
      tipo: ['leads'],
      canal: 'linkedin',
      page: 1,
      page_size: 1,
    });

    expect(result.pagination).toEqual({ page: 1, page_size: 1, total: 1, total_pages: 1 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]?.nome).toBe('Diagnostico Executivo');
  });
});
