import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { getDiagnosticoByEstrategia, saveVersao, updateEstrategiaStatus, MktRequestContext } from '../store';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function processEstrategia(job: any, context: MktRequestContext) {
  const diagnostico = await getDiagnosticoByEstrategia(job.estrategia_id, context);
  if (!diagnostico) throw new Error('Diagnóstico não encontrado ou não aprovado.');

  // LLM Call
  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: z.object({
      posicionamento: z.string(),
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

Retorne um posicionamento claro, os KPIs principais, canais sugeridos e as campanhas core divididas em fases.`
  });

  // Save versao
  const versaoPayload = {
    estrategia_id: job.estrategia_id,
    versao: job.payload.versao || 1,
    snapshot_diagnostico: { swot: diagnostico.swot, uvp: diagnostico.uvp, persona: typeof diagnostico.persona === 'string' ? JSON.parse(diagnostico.persona as any) : diagnostico.persona },
    conteudo: { posicionamento: { uvp: object.posicionamento, brand_archetype: '', tom_de_voz: '', posicionamento_mercado: object.posicionamento }, kpis: [], mix_canais: [], campanhas: [] },
    gerado_por: 'estrategista_bot',
    status: 'ativa' as const
  };
  
  await saveVersao(versaoPayload);
  await updateEstrategiaStatus(job.estrategia_id, 'ativa', context);
}
