import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { getDiagnosticoByEstrategia, saveVersao, updateEstrategiaStatus, MktRequestContext } from '../store';
import { emitGeracao } from '../sse';
import type { MktCanal, MktCampanha, MktKpi, MktPersona, MktProcessingJob } from '../types';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function processEstrategia(job: MktProcessingJob, context: MktRequestContext) {
  const diagnostico = await getDiagnosticoByEstrategia(job.estrategia_id, context);
  if (!diagnostico) throw new Error('Diagnóstico não encontrado ou não aprovado.');

  emitGeracao(job.estrategia_id, 10, 'Iniciando geração de estratégia');

  // LLM Call
  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: z.object({
      posicionamento: z.string(),
      brand_archetype: z.string(),
      tom_de_voz: z.string(),
      kpis: z.array(z.string()),
      canais: z.array(z.string()),
      campanhas_core: z.array(z.object({
        nome: z.string(),
        objetivo: z.string(),
        fases: z.array(z.string())
      }))
    }),
    prompt: `Gere a estratégia de marketing com base no diagnóstico aprovado:
SWOT: ${diagnostico.swot}
UVP: ${diagnostico.uvp}
Persona: ${JSON.stringify(diagnostico.persona)}

Retorne um posicionamento claro, o arquétipo da marca (brand archetype), tom de voz, os KPIs principais, canais sugeridos e as campanhas core divididas em fases.`
  });

  const personaSnapshot = diagnostico.persona as MktPersona;
  const kpis = object.kpis.map((canal): MktKpi => ({ canal }));
  const mixCanais = object.canais.map((nome): MktCanal => ({
    nome,
    justificativa: `Canal sugerido a partir do diagnostico aprovado para ${personaSnapshot.nome}.`,
    percentual_alocacao: Math.max(1, Math.round(100 / Math.max(1, object.canais.length))),
  }));
  const campanhas = object.campanhas_core.map((campanha, index): MktCampanha => ({
    nome: campanha.nome,
    objetivo_smart: campanha.objetivo,
    mensagens_chave: campanha.fases,
    budget: 'A definir',
    timeline: campanha.fases.join(' -> '),
    formatos: ['social', 'landing_page'],
    audiencias_segmentadas: [personaSnapshot.nome],
    canal: object.canais[index] ?? object.canais[0] ?? 'digital',
    prioridade: index + 1,
  }));

  // Save versao
  const payload = (job.payload ?? {}) as { versao?: number };
  const versaoPayload = {
    estrategia_id: job.estrategia_id,
    versao: payload.versao ?? 1,
    conteudo: {
      posicionamento: {
        uvp: diagnostico.uvp,
        brand_archetype: object.brand_archetype,
        tom_de_voz: object.tom_de_voz,
        posicionamento_mercado: object.posicionamento,
      },
      kpis,
      mix_canais: mixCanais,
      campanhas,
    },
    gerado_por: 'estrategista_bot',
  };
  
  await saveVersao(versaoPayload);
  await updateEstrategiaStatus(job.estrategia_id, 'ativa', context);
  emitGeracao(job.estrategia_id, 100, 'Estratégia gerada com sucesso');
}
