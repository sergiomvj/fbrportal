import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { getDiagnosticoByEstrategia, saveCalendarItems, saveRoadmapTasks, MktRequestContext } from '../store';
import { emitGeracao } from '../sse';
import { buildCalendarAndRoadmapArtifacts, MktGeneratedCalendarSchema } from '../artifacts';
import type { MktProcessingJob } from '../types';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function processCalendario(job: MktProcessingJob, context: MktRequestContext) {
  const diagnostico = await getDiagnosticoByEstrategia(job.estrategia_id, context);
  if (!diagnostico) throw new Error('Diagnostico nao encontrado ou nao aprovado.');

  emitGeracao(job.estrategia_id, 10, 'Iniciando geracao de calendario', 'calendario_bot');

  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: MktGeneratedCalendarSchema,
    prompt: `Gere o calendario editorial e roadmap operacional do FBR-MKT a partir do diagnostico aprovado.
UVP: ${diagnostico.uvp}
Persona: ${JSON.stringify(diagnostico.persona)}

Contrato obrigatorio dos PRDs:
- tarefas deve conter exatamente 90 itens, um para cada dia de dias_a_frente 0 ate 89.
- cada item deve distinguir organico vs pago, canal, tema, copy_resumo e status editorial implicito.
- quick wins devem existir somente nos primeiros 30 dias.
- roadmap_tasks deve conter as fases 0-30d, 30-60d e 60-90d, com responsavel, ferramenta e alerta_prazo.`,
  });

  const payload = (job.payload ?? {}) as { versao?: number };
  const { calendario, roadmap } = buildCalendarAndRoadmapArtifacts(
    object,
    job.estrategia_id,
    payload.versao ?? 1,
  );

  await saveCalendarItems(calendario);
  await saveRoadmapTasks(roadmap);

  emitGeracao(job.estrategia_id, 100, 'Calendario e roadmap gerados com sucesso', 'calendario_bot');
}
