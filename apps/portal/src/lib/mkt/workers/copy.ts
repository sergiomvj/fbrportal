import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { getDiagnosticoByEstrategia, saveCopyVariants, MktRequestContext } from '../store';
import { emitGeracao } from '../sse';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function processCopy(job: any, context: MktRequestContext) {
  const diagnostico = await getDiagnosticoByEstrategia(job.estrategia_id, context);
  if (!diagnostico) throw new Error('Diagnóstico não encontrado ou não aprovado.');

  emitGeracao(job.estrategia_id, 10, 'Iniciando geração de copy', 'redator_bot');

  // LLM Call
  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: z.object({
      variants: z.array(z.object({
        canal: z.string(),
        titulo: z.string(),
        corpo: z.string(),
        cta: z.string()
      }))
    }),
    prompt: `Gere 3 variantes de Copy de marketing para os canais principais baseados no UVP: ${diagnostico.uvp}`
  });

  // Save copy
  const variantsToSave = object.variants.map(variant => ({
    estrategia_id: job.estrategia_id,
    tipo_conteudo: 'anuncio',
    canal_alvo: variant.canal,
    conteudo_texto: `${variant.titulo}\n\n${variant.corpo}\n\nCTA: ${variant.cta}`,
    aprovado: false
  } as any));
  await saveCopyVariants(variantsToSave);

  emitGeracao(job.estrategia_id, 100, 'Copy gerada com sucesso', 'redator_bot');
}
