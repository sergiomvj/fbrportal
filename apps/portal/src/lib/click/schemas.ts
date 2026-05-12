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
  empresa_nome: z.string().min(1),
  contato_nome: z.string().optional(),
  contato_email: z.string().email().optional(),
  score: scoreSchema,
  icp_origem: z.string().optional(),
  historico_interacoes: z.array(z.unknown()).optional(),
  dados_enriquecimento: z.record(z.unknown()).optional(),
  cadencia_completa: z.boolean().optional(),
  total_respostas: z.number().int().min(0).optional(),
});

export const leadQualifiedEventSchema = z.object({
  event: z.literal('lead.qualified'),
  data: leadQualifiedSchema,
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
    contactName: payload.contato_nome,
    contactEmail: payload.contato_email,
    valueCents: 0,
    stage: 'contato_inicial' as const,
    source: 'fbr_leads' as const,
    priority: payload.score >= 80 ? ('alta' as const) : ('media' as const),
    score: payload.score,
    leadId: payload.lead_id,
  };
}

export function normalizeLeadQualifiedEvent(input: unknown) {
  return normalizeLeadQualified(leadQualifiedEventSchema.parse(input).data);
}
