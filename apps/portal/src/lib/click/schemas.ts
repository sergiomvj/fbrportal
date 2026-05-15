import { z } from 'zod';
import { clickPriorities, clickSources, clickStages } from './types';

export const scoreSchema = z.number().int().min(0).max(100);
export const clickStageSchema = z.enum(clickStages);
export const clickSourceSchema = z.enum(clickSources);

export const createDealSchema = z.object({
  title: z.string().min(2, 'Informe o titulo do deal.'),
  companyName: z.string().min(2, 'Informe a empresa.'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Informe um e-mail valido.').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  valueCents: z.number().int().min(0),
  stage: clickStageSchema.default('contato_inicial'),
  source: clickSourceSchema.default('manual'),
  priority: z.enum(clickPriorities).default('media'),
  score: scoreSchema.default(50),
});

export const leadQualifiedSchema = z.object({
  lead_id: z.string().min(1),
  empresa_id: z.string().optional(),
  empresa_nome: z.string().min(1),
  empresa_cnpj: z.string().nullable().optional(),
  contato_nome: z.string().nullable().optional(),
  contato_email: z.string().email().nullable().optional(),
  contato_cargo: z.string().nullable().optional(),
  contato_linkedin: z.string().nullable().optional(),
  contato_telefone: z.string().nullable().optional(),
  score: scoreSchema,
  icp_id: z.string().nullable().optional(),
  icp_nome: z.string().nullable().optional(),
  icp_origem: z.string().optional(),
  etapa_final: z.string().optional(),
  historico_interacoes: z.array(z.unknown()).optional(),
  dados_enriquecimento: z.record(z.unknown()).optional(),
  cadencia: z.record(z.unknown()).optional(),
  deduplicacao: z.record(z.unknown()).optional(),
  cadencia_completa: z.boolean().optional(),
  total_respostas: z.number().int().min(0).optional(),
  prioridade: z.enum(clickPriorities).optional(),
  motivo_prioridade: z.string().optional(),
  sugestao_acao: z.string().optional(),
}).passthrough();

export const leadQualifiedEventSchema = z.object({
  event: z.literal('lead.qualified'),
  timestamp: z.string().optional(),
  module_source: z.literal('fbr-leads').optional(),
  data: leadQualifiedSchema,
}).passthrough();

export const strategyExportedEventSchema = z.object({
  event: z.literal('strategy.exported'),
  data: z.object({
    estrategia_id: z.string().min(1),
    nome: z.string().min(1),
    nicho: z.string().min(1),
    documento_original: z.string(),
    score_viabilidade: scoreSchema,
    canais_sugeridos: z.array(z.string()),
    exportado_por: z.string().min(1),
  }),
});

export const messageSchema = z.object({
  body: z.string().min(1),
  actorType: z.enum(['human', 'agent']).default('human'),
});

export const taskSchema = z.object({
  title: z.string().min(1),
  status: z.enum(['open', 'done']).default('open'),
});

export function normalizeLeadQualified(input: unknown) {
  const payload = leadQualifiedSchema.parse(input);

  return {
    title: `Lead qualificado - ${payload.empresa_nome}`,
    companyName: payload.empresa_nome,
    contactName: payload.contato_nome ?? undefined,
    contactEmail: payload.contato_email ?? undefined,
    valueCents: 0,
    stage: 'contato_inicial' as const,
    source: 'fbr_leads' as const,
    priority: payload.prioridade ?? (payload.score >= 80 ? ('alta' as const) : ('media' as const)),
    score: payload.score,
    leadId: payload.lead_id,
  };
}

export function normalizeLeadQualifiedEvent(input: unknown) {
  return normalizeLeadQualified(leadQualifiedEventSchema.parse(input).data);
}
