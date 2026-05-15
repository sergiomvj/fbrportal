import { z } from 'zod';
import type { MktCalendarItem, MktCopyVariant, MktLeadMagnet, MktRoadmapTask } from './types';

export const MktGeneratedCopySchema = z.object({
  variants: z.array(z.object({
    canal: z.string().min(1),
    tipo: z.enum(['headline', 'cta', 'body', 'landing_page', 'email']),
    campanha_nome: z.string().min(1),
    conteudo: z.string().min(1),
    tom: z.string().min(1).optional(),
  })).min(4),
  lead_magnets: z.array(z.object({
    nome: z.string().min(1),
    persona_alvo: z.string().min(1),
    funil_estagio: z.enum(['topo', 'meio', 'fundo']),
    landing_page: z.object({
      hero: z.string().min(1),
      beneficios: z.array(z.string().min(1)).min(1),
      social_proof: z.string().min(1),
      cta: z.string().min(1),
    }),
    nurture_emails: z.array(z.object({
      assunto: z.string().min(1),
      corpo: z.string().min(1),
      dia_envio: z.number().int().min(0),
    })).min(5).max(7),
  })).min(5).max(10),
});

export type MktGeneratedCopy = z.infer<typeof MktGeneratedCopySchema>;

export function buildCopyAndLeadMagnetArtifacts(
  generated: unknown,
  estrategiaId: string,
  versao: number,
) {
  const parsed = MktGeneratedCopySchema.parse(generated);

  const variants: Omit<MktCopyVariant, 'id' | 'created_at'>[] = parsed.variants.map((variant) => ({
    estrategia_id: estrategiaId,
    versao,
    campanha_nome: variant.campanha_nome,
    tipo: variant.tipo,
    canal: variant.canal,
    conteudo: variant.conteudo,
    tom: variant.tom,
  }));

  const leadMagnets: Omit<MktLeadMagnet, 'id' | 'created_at'>[] = parsed.lead_magnets.map((magnet) => ({
    estrategia_id: estrategiaId,
    versao,
    nome: magnet.nome,
    persona_alvo: magnet.persona_alvo,
    funil_estagio: magnet.funil_estagio,
    landing_page: magnet.landing_page,
    nurture_emails: magnet.nurture_emails,
  }));

  return { variants, leadMagnets };
}

export const MktGeneratedCalendarSchema = z.object({
  tarefas: z.array(z.object({
    dias_a_frente: z.number().int().min(0).max(89),
    canal: z.string().min(1),
    tipo: z.enum(['organico', 'pago']),
    tema: z.string().min(1),
    copy_resumo: z.string().min(1),
    is_quick_win: z.boolean(),
  })).length(90),
  roadmap_tasks: z.array(z.object({
    fase: z.enum(['0-30d', '30-60d', '60-90d']),
    item: z.string().min(1),
    responsavel: z.string().min(1),
    ferramenta: z.string().min(1),
    status: z.enum(['pendente', 'em_progresso', 'concluido']).default('pendente'),
    alerta_prazo: z.string().min(1),
  })).min(3),
}).superRefine((value, ctx) => {
  const days = new Set(value.tarefas.map((task) => task.dias_a_frente));
  if (days.size !== 90) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tarefas'],
      message: 'Calendar must contain one unique task for each of the 90 days.',
    });
  }

  const quickWins = value.tarefas.filter((task) => task.is_quick_win);
  if (quickWins.length === 0 || quickWins.some((task) => task.dias_a_frente > 29)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tarefas'],
      message: 'Quick wins must exist and stay within the first 30 days.',
    });
  }

  const phases = new Set(value.roadmap_tasks.map((task) => task.fase));
  for (const phase of ['0-30d', '30-60d', '60-90d'] as const) {
    if (!phases.has(phase)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['roadmap_tasks'],
        message: `Roadmap must include phase ${phase}.`,
      });
    }
  }
});

export type MktGeneratedCalendar = z.infer<typeof MktGeneratedCalendarSchema>;

function isoDateAfter(startDate: Date, days: number) {
  const date = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), startDate.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildCalendarAndRoadmapArtifacts(
  generated: unknown,
  estrategiaId: string,
  versao: number,
  startDate = new Date(),
) {
  const parsed = MktGeneratedCalendarSchema.parse(generated);

  const calendario: Omit<MktCalendarItem, 'id' | 'created_at'>[] = [...parsed.tarefas]
    .sort((a, b) => a.dias_a_frente - b.dias_a_frente)
    .map((task) => ({
      estrategia_id: estrategiaId,
      versao,
      data: isoDateAfter(startDate, task.dias_a_frente),
      canal: task.canal,
      tipo: task.tipo,
      tema: task.tema,
      copy_resumo: task.copy_resumo,
      status: 'pendente',
      is_quick_win: task.is_quick_win,
    }));

  const roadmap: Omit<MktRoadmapTask, 'id' | 'created_at'>[] = parsed.roadmap_tasks.map((task) => ({
    estrategia_id: estrategiaId,
    versao,
    fase: task.fase,
    item: task.item,
    responsavel: task.responsavel,
    ferramenta: task.ferramenta,
    status: task.status,
    alerta_prazo: task.alerta_prazo,
  }));

  return { calendario, roadmap };
}
