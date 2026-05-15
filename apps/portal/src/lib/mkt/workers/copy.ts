import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getDiagnosticoByEstrategia, saveCopyVariants, saveLeadMagnets, MktRequestContext } from '../store';
import { emitGeracao } from '../sse';
import { buildCopyAndLeadMagnetArtifacts, MktGeneratedCopySchema } from '../artifacts';
import type { MktProcessingJob } from '../types';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function processCopy(job: MktProcessingJob, context: MktRequestContext) {
  const diagnostico = await getDiagnosticoByEstrategia(job.estrategia_id, context);
  if (!diagnostico) throw new Error('Diagnostico nao encontrado ou nao aprovado.');

  emitGeracao(job.estrategia_id, 10, 'Iniciando geracao de copy', 'redator_bot');

  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: MktGeneratedCopySchema,
    prompt: `Gere o pacote de captacao do FBR-MKT a partir do diagnostico aprovado.
UVP: ${diagnostico.uvp}
Persona: ${JSON.stringify(diagnostico.persona)}

Contrato obrigatorio dos PRDs:
- variants deve cobrir headlines, CTAs, body copy, landing_page e email por campanha prioritaria.
- lead_magnets deve conter de 5 a 10 itens alinhados a persona e funil.
- cada lead magnet deve incluir landing_page com hero, beneficios, social_proof e CTA.
- cada lead magnet deve incluir sequencia nurture_emails com 5 a 7 emails.`,
  });

  const payload = (job.payload ?? {}) as { versao?: number };
  const { variants, leadMagnets } = buildCopyAndLeadMagnetArtifacts(
    object,
    job.estrategia_id,
    payload.versao ?? 1,
  );

  await saveCopyVariants(variants);
  await saveLeadMagnets(leadMagnets);

  emitGeracao(job.estrategia_id, 100, 'Copy e pacote de captacao gerados com sucesso', 'redator_bot');
}
