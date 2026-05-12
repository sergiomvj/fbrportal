import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import { getDiagnosticoByEstrategia, saveCalendarItems, MktRequestContext } from '../store';
import { emitGeracao } from '../sse';
import type { MktProcessingJob, MktCalendarItem } from '../types';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

export async function processCalendario(job: MktProcessingJob, context: MktRequestContext) {
  const diagnostico = await getDiagnosticoByEstrategia(job.estrategia_id, context);
  if (!diagnostico) throw new Error('Diagnóstico não encontrado ou não aprovado.');

  emitGeracao(job.estrategia_id, 10, 'Iniciando geração de calendário', 'calendario_bot');

  // LLM Call
  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: z.object({
      tarefas: z.array(z.object({
        dias_a_frente: z.number(),
        canal: z.string(),
        tipo: z.enum(['organico', 'pago']),
        tema: z.string(),
        copy_resumo: z.string(),
        is_quick_win: z.boolean()
      }))
    }),
    prompt: `Gere um calendário editorial detalhado de 90 dias para a estratégia de marketing baseada no UVP: ${diagnostico.uvp}.
Inclua pelo menos 10 posts distribuídos ao longo dos 90 dias, mesclando orgânico e pago.
Destaque os 'quick wins' que podem trazer retorno rápido.`
  });

  // Save calendario
  const hoje = new Date();
  const itemsToSave: Omit<MktCalendarItem, 'id' | 'created_at'>[] = object.tarefas.map(t => {
    const dataAlvo = new Date(hoje);
    dataAlvo.setDate(dataAlvo.getDate() + t.dias_a_frente);
    return {
      estrategia_id: job.estrategia_id,
      versao: 1,
      data: dataAlvo.toISOString().substring(0, 10),
      canal: t.canal,
      tipo: t.tipo,
      tema: t.tema,
      copy_resumo: t.copy_resumo,
      status: 'pendente',
      is_quick_win: t.is_quick_win
    };
  });
  await saveCalendarItems(itemsToSave);

  emitGeracao(job.estrategia_id, 100, 'Calendário gerado com sucesso', 'calendario_bot');
}
