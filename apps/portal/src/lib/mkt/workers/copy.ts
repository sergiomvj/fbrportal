import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { getDiagnosticoByEstrategia, saveCopyVariants, MktRequestContext } from '../store';
import { emitGeracao } from '../sse';
import type { MktCopyVariant, MktProcessingJob } from '../types';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function processCopy(job: MktProcessingJob, context: MktRequestContext) {
  const diagnostico = await getDiagnosticoByEstrategia(job.estrategia_id, context);
  if (!diagnostico) throw new Error('Diagnóstico não encontrado ou não aprovado.');

  emitGeracao(job.estrategia_id, 10, 'Iniciando geração de copy', 'redator_bot');

  // LLM Call
  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: z.object({
      variants: z.array(z.object({
        canal: z.string(),
        tipo: z.enum(['headline', 'cta', 'body', 'landing_page', 'email']),
        campanha_nome: z.string(),
        conteudo: z.string(),
        tom: z.string()
      }))
    }),
    prompt: `Gere 10 variantes de Copy de marketing cobrindo múltiplos canais (ex: Instagram, Email, Landing Page) e múltiplos tipos (headline, cta, body, landing_page, email). Baseie as copies no UVP: ${diagnostico.uvp}`
  });

  // Save copy
  const variantsToSave: Omit<MktCopyVariant, 'id' | 'created_at'>[] = object.variants.map((variant) => ({
    estrategia_id: job.estrategia_id,
    versao: 1,
    campanha_nome: variant.campanha_nome,
    tipo: variant.tipo,
    canal: variant.canal,
    conteudo: variant.conteudo,
    tom: variant.tom,
  }));
  await saveCopyVariants(variantsToSave);

  emitGeracao(job.estrategia_id, 100, 'Copy gerada com sucesso', 'redator_bot');
}
