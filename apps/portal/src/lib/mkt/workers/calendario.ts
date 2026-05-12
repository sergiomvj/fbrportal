import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { getDiagnosticoByEstrategia, saveRoadmapTasks, MktRequestContext } from '../store';
import { emitGeracao } from '../sse';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function processCalendario(job: any, context: MktRequestContext) {
  const diagnostico = await getDiagnosticoByEstrategia(job.estrategia_id, context);
  if (!diagnostico) throw new Error('Diagnóstico não encontrado ou não aprovado.');

  emitGeracao(job.estrategia_id, 10, 'Iniciando geração de calendário', 'calendario_bot');

  // LLM Call
  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: z.object({
      tarefas: z.array(z.object({
        titulo: z.string(),
        descricao: z.string(),
        dias_a_frente: z.number()
      }))
    }),
    prompt: `Gere um cronograma inicial de 3 tarefas para lançar a estratégia de marketing baseada no UVP: ${diagnostico.uvp}`
  });

  // Save calendario
  const hoje = new Date();
  const tasksToSave = object.tarefas.map(t => {
    const dataAlvo = new Date(hoje);
    dataAlvo.setDate(dataAlvo.getDate() + t.dias_a_frente);
    return {
      estrategia_id: job.estrategia_id,
      titulo: t.titulo,
      descricao: t.descricao,
      status: 'pending',
      data_prevista: dataAlvo.toISOString()
    } as any;
  });
  await saveRoadmapTasks(tasksToSave);

  emitGeracao(job.estrategia_id, 100, 'Calendário gerado com sucesso', 'calendario_bot');
}
