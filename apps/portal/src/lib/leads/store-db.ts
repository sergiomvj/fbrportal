import { z } from 'zod';
import { createSupabaseServerClient } from '../supabase-admin';
import type {
  Lead,
  LeadSourceRun,
  LeadSourceRecord,
  LeadCaptureFonte,
  LeadSourceRunStatus,
  LeadsQuery,
  Domain,
  ICP,
  EmailTemplate,
  LeadEtapa,
} from './types';

export interface LeadsRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export class LeadsDbValidationError extends Error {
  constructor(
    message: string,
    readonly status: 400 | 404 | 409 | 422,
    readonly issues?: unknown,
  ) {
    super(message);
  }
}

const COMPANY_ALPHA = '11111111-1111-4111-8111-111111111111';
const USER_SYSTEM = '33333333-3333-4333-8333-333333333333';

function now() {
  return new Date().toISOString();
}

export function getLeadsTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, user: USER_SYSTEM };
}

export function contextFromHeaders(headers: Headers, fallbackModuleSource = 'leads'): LeadsRequestContext | Response {
  const userId = headers.get('x-user-id');
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id') ?? headers.get('x-empresa-id');
  const moduleSource = headers.get('x-module-source') ?? fallbackModuleSource;

  if (!userId || !companyId) {
    return Response.json({ code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and company headers are required.' }, { status: 401 });
  }

  const companyCheck = z.string().uuid().safeParse(companyId);
  if (!companyCheck.success) {
    return Response.json({ code: 'INVALID_COMPANY', message: 'Company header must be a valid UUID.' }, { status: 422 });
  }

  return { userId, companyId, moduleSource };
}

export async function listLeadsDb(context: LeadsRequestContext, query: Partial<LeadsQuery> = {}) {
  const supabase = createSupabaseServerClient();

  let q = supabase.from('leads_leads').select('*', { count: 'exact' }).eq('empresa_id', context.companyId);

  if (query.busca) {
    const searchPattern = `%${query.busca}%`;
    q = q.or(`empresa_nome.ilike.${searchPattern},contato_nome.ilike.${searchPattern},contato_email.ilike.${searchPattern}`);
  }

  if (query.etapa && query.etapa.length > 0) {
    q = q.in('etapa', query.etapa);
  }

  if (query.fonte && query.fonte.length > 0) {
    q = q.in('fonte', query.fonte);
  }

  if (query.icp_id) {
    q = q.eq('icp_id', query.icp_id);
  }

  if (query.score_min !== undefined) {
    q = q.gte('score', query.score_min);
  }

  if (query.score_max !== undefined) {
    q = q.lte('score', query.score_max);
  }

  if (query.email_valido && query.email_valido.length > 0) {
    q = q.in('email_valido', query.email_valido);
  }

  if (query.cidade) {
    q = q.ilike('cidade', query.cidade);
  }

  if (query.estado) {
    q = q.eq('estado', query.estado);
  }

  q = q.order(query.sort_by ?? 'created_at', { ascending: query.sort_dir === 'asc' });

  const page = typeof query.page === 'number' ? query.page : (parseInt(String(query.page ?? '1')) || 1);
  const pageSize = typeof query.page_size === 'number' ? query.page_size : (parseInt(String(query.page_size ?? '20')) || 20);
  const start = (page - 1) * pageSize;
  q = q.range(start, start + pageSize - 1);

  const { data, error, count } = await q;

  if (error) throw new Error(error.message);

  return {
    items: data as Lead[],
    pagination: {
      page,
      page_size: pageSize,
      total: count || 0,
      total_pages: Math.ceil((count || 0) / pageSize),
    },
  };
}

export async function getLeadDb(context: LeadsRequestContext, id: string): Promise<Lead> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_leads').select('*').eq('id', id).eq('empresa_id', context.companyId).single();

  if (error || !data) {
    throw new LeadsDbValidationError('Lead não encontrado.', 404);
  }

  return data as Lead;
}

export async function createLeadDb(context: LeadsRequestContext, data: unknown): Promise<Lead> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;
  
  const validated = {
    empresa_id: context.companyId,
    user_id: context.userId,
    empresa_nome: input.empresa_nome as string,
    empresa_cnpj: input.empresa_cnpj as string | undefined,
    contato_nome: input.contato_nome as string | undefined,
    contato_email: input.contato_email as string | undefined,
    contato_cargo: input.contato_cargo as string | undefined,
    contato_linkedin: input.contato_linkedin as string | undefined,
    contato_telefone: input.contato_telefone as string | undefined,
    setor: input.setor as string | undefined,
    porte: input.porte as string | undefined,
    regiao: input.regiao as string | undefined,
    cidade: input.cidade as string | undefined,
    estado: input.estado as string | undefined,
    funcionarios: input.funcionarios as number | undefined,
    faturamento: input.faturamento as number | undefined,
    fonte: (input.fonte as string) || 'manual',
    fonte_url: input.fonte_url as string | undefined,
    etapa: (input.etapa as string) || 'captado',
    score: (input.score as number) || 0,
    email_valido: (input.email_valido as string) || 'nao_verificado',
    icp_id: input.icp_id as string | undefined,
    site_url: input.site_url as string | undefined,
    site_tecnologias: (input.site_tecnologias as string[]) || [],
    site_https: input.site_https as boolean | undefined,
    site_blog_ativo: input.site_blog_ativo as boolean | undefined,
    created_at: now(),
    updated_at: now(),
  };

  const { data: lead, error } = await supabase.from('leads_leads').insert(validated).select().single();

  if (error) throw new Error(error.message);

  return lead as Lead;
}

export async function createSourceRunDb(
  context: LeadsRequestContext,
  fonte: LeadCaptureFonte,
  query: Record<string, unknown> = {},
): Promise<LeadSourceRun> {
  const supabase = createSupabaseServerClient();

  const run = {
    empresa_id: context.companyId,
    fonte,
    query: query as object,
    status: 'pending' as LeadSourceRunStatus,
    total_records: 0,
    leads_created: 0,
    duplicates: 0,
    failed_records: 0,
    created_by: context.userId,
    created_at: now(),
  };

  const { data, error } = await supabase.from('leads_source_runs').insert(run).select().single();

  if (error) throw new Error(error.message);

  return data as LeadSourceRun;
}

export async function updateSourceRunDb(
  runId: string,
  updates: {
    status?: LeadSourceRunStatus;
    total_records?: number;
    leads_created?: number;
    duplicates?: number;
    failed_records?: number;
    error?: string;
    started_at?: string;
    completed_at?: string;
  },
): Promise<LeadSourceRun> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_source_runs').update(updates).eq('id', runId).select().single();

  if (error) throw new Error(error.message);

  return data as LeadSourceRun;
}

export async function getSourceRunDb(context: LeadsRequestContext, runId: string): Promise<LeadSourceRun> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_source_runs').select('*').eq('id', runId).eq('empresa_id', context.companyId).single();

  if (error || !data) {
    throw new LeadsDbValidationError('Source run não encontrado.', 404);
  }

  return data as LeadSourceRun;
}

export async function listSourceRunsDb(context: LeadsRequestContext): Promise<LeadSourceRun[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_source_runs').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as LeadSourceRun[]) || [];
}

export async function createSourceRecordDb(
  context: LeadsRequestContext,
  sourceRunId: string,
  record: {
    fonte: LeadCaptureFonte;
    source_key: string;
    raw_payload: Record<string, unknown>;
    normalized_lead_id?: string;
    duplicate_status?: 'new' | 'duplicate';
    duplicate_of_lead_id?: string;
    error?: string;
  },
): Promise<LeadSourceRecord> {
  const supabase = createSupabaseServerClient();

  const rec = {
    empresa_id: context.companyId,
    source_run_id: sourceRunId,
    fonte: record.fonte,
    source_key: record.source_key,
    raw_payload: record.raw_payload as object,
    normalized_lead_id: record.normalized_lead_id || null,
    duplicate_status: record.duplicate_status || 'new',
    duplicate_of_lead_id: record.duplicate_of_lead_id || null,
    error: record.error || null,
    captured_at: now(),
    created_at: now(),
  };

  const { data, error } = await supabase.from('leads_source_records').insert(rec).select().single();

  if (error) throw new Error(error.message);

  return data as LeadSourceRecord;
}

export async function listSourceRecordsByRunDb(context: LeadsRequestContext, runId: string): Promise<LeadSourceRecord[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_source_records').select('*').eq('source_run_id', runId).eq('empresa_id', context.companyId);

  if (error) throw new Error(error.message);

  return (data as LeadSourceRecord[]) || [];
}

export async function findLeadByHashDb(context: LeadsRequestContext, hash: string): Promise<Lead | null> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_leads').select('*').eq('empresa_id', context.companyId).eq('hash_deduplicacao', hash).maybeSingle();

  if (error && error.code !== 'PGRST116') throw new Error(error.message);

  return (data as Lead) || null;
}

export async function updateLeadStageDb(context: LeadsRequestContext, leadId: string, etapa: LeadEtapa): Promise<Lead> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_leads').update({ etapa, updated_at: now() }).eq('id', leadId).eq('empresa_id', context.companyId).select().single();

  if (error || !data) {
    throw new LeadsDbValidationError('Lead não encontrado.', 404);
  }

  return data as Lead;
}

export async function updateLeadScoreDb(context: LeadsRequestContext, leadId: string, score: number, scoreDetalhado?: object): Promise<Lead> {
  const supabase = createSupabaseServerClient();
  const update = { score, updated_at: now() };
  if (scoreDetalhado) {
    (update as Record<string, unknown>)['score_detalhado'] = scoreDetalhado;
  }

  const { data, error } = await supabase.from('leads_leads').update(update).eq('id', leadId).eq('empresa_id', context.companyId).select().single();

  if (error || !data) {
    throw new LeadsDbValidationError('Lead não encontrado.', 404);
  }

  return data as Lead;
}

export async function listDomainsDb(context: LeadsRequestContext): Promise<Domain[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_domains').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as Domain[]) || [];
}

export async function createDomainDb(context: LeadsRequestContext, data: unknown): Promise<Domain> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;

  const domain = {
    empresa_id: context.companyId,
    dominio: input.dominio as string,
    status: (input.status as string) || 'aquecendo',
    warming_phase: (input.warming_phase as string) || 'fase1',
    warming_dia: (input.warming_dia as number) || 0,
    bounce_rate: (input.bounce_rate as number) || 0,
    envios_hoje: (input.envios_hoje as number) || 0,
    limite_diario: (input.limite_diario as number) || 5,
    open_rate: (input.open_rate as number) || 0,
    spam_complaint_rate: (input.spam_complaint_rate as number) || 0,
    blacklist: (input.blacklist as boolean) || false,
    spf_ok: (input.spf_ok as boolean) || false,
    dkim_ok: (input.dkim_ok as boolean) || false,
    dmarc_ok: (input.dmarc_ok as boolean) || false,
    created_at: now(),
    updated_at: now(),
  };

  const { data: created, error } = await supabase.from('leads_domains').insert(domain).select().single();

  if (error) throw new Error(error.message);

  return created as Domain;
}

export async function updateDomainDb(context: LeadsRequestContext, domainId: string, data: unknown): Promise<Domain> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;

  const update: Record<string, unknown> = { updated_at: now() };
  if (input.status !== undefined) update.status = input.status;
  if (input.warming_phase !== undefined) update.warming_phase = input.warming_phase;
  if (input.warming_dia !== undefined) update.warming_dia = input.warming_dia;
  if (input.bounce_rate !== undefined) update.bounce_rate = input.bounce_rate;
  if (input.envios_hoje !== undefined) update.envios_hoje = input.envios_hoje;
  if (input.limite_diario !== undefined) update.limite_diario = input.limite_diario;
  if (input.open_rate !== undefined) update.open_rate = input.open_rate;
  if (input.spam_complaint_rate !== undefined) update.spam_complaint_rate = input.spam_complaint_rate;
  if (input.blacklist !== undefined) update.blacklist = input.blacklist;
  if (input.spf_ok !== undefined) update.spf_ok = input.spf_ok;
  if (input.dkim_ok !== undefined) update.dkim_ok = input.dkim_ok;
  if (input.dmarc_ok !== undefined) update.dmarc_ok = input.dmarc_ok;

  const { data: updated, error } = await supabase.from('leads_domains').update(update).eq('id', domainId).eq('empresa_id', context.companyId).select().single();

  if (error || !updated) {
    throw new LeadsDbValidationError('Domínio não encontrado.', 404);
  }

  return updated as Domain;
}

export async function deleteDomainDb(context: LeadsRequestContext, domainId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('leads_domains').delete().eq('id', domainId).eq('empresa_id', context.companyId);

  if (error) throw new Error(error.message);
}

export async function listICPsDb(context: LeadsRequestContext): Promise<ICP[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_icps').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as ICP[]) || [];
}

export async function createICPDb(context: LeadsRequestContext, data: unknown): Promise<ICP> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;

  const icp = {
    empresa_id: context.companyId,
    nome: input.nome as string,
    descricao: input.descricao as string | undefined,
    setor: (input.setor as string[]) || [],
    porte: (input.porte as string[]) || [],
    cargo_alvo: (input.cargo_alvo as string[]) || [],
    regiao: (input.regiao as string[]) || [],
    score_minimo: (input.score_minimo as number) || 60,
    keywords: (input.keywords as string[]) || [],
    exclusoes: (input.exclusoes as string[]) || [],
    porte_funcionarios_min: input.porte_funcionarios_min as number | undefined,
    porte_funcionarios_max: input.porte_funcionarios_max as number | undefined,
    faturamento_minimo: input.faturamento_minimo as number | undefined,
    dominio_email_permitido: (input.dominio_email_permitido as string[]) || ['todos'],
    ativo: input.ativo !== false,
    created_at: now(),
    updated_at: now(),
  };

  const { data: created, error } = await supabase.from('leads_icps').insert(icp).select().single();

  if (error) throw new Error(error.message);

  return created as ICP;
}

export async function updateICPDb(context: LeadsRequestContext, icpId: string, data: unknown): Promise<ICP> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;

  const update: Record<string, unknown> = { updated_at: now() };
  if (input.nome !== undefined) update.nome = input.nome;
  if (input.descricao !== undefined) update.descricao = input.descricao;
  if (input.setor !== undefined) update.setor = input.setor;
  if (input.porte !== undefined) update.porte = input.porte;
  if (input.cargo_alvo !== undefined) update.cargo_alvo = input.cargo_alvo;
  if (input.regiao !== undefined) update.regiao = input.regiao;
  if (input.score_minimo !== undefined) update.score_minimo = input.score_minimo;
  if (input.keywords !== undefined) update.keywords = input.keywords;
  if (input.exclusoes !== undefined) update.exclusoes = input.exclusoes;
  if (input.ativo !== undefined) update.ativo = input.ativo;

  const { data: updated, error } = await supabase.from('leads_icps').update(update).eq('id', icpId).eq('empresa_id', context.companyId).select().single();

  if (error || !updated) {
    throw new LeadsDbValidationError('ICP não encontrado.', 404);
  }

  return updated as ICP;
}

export async function deleteICPDb(context: LeadsRequestContext, icpId: string): Promise<void> {
  const supabase = createSupabaseServerClient();
  const { error } = await supabase.from('leads_icps').delete().eq('id', icpId).eq('empresa_id', context.companyId);

  if (error) throw new Error(error.message);
}

export async function listEmailTemplatesDb(context: LeadsRequestContext): Promise<EmailTemplate[]> {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.from('leads_email_templates').select('*').eq('empresa_id', context.companyId).order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  return (data as EmailTemplate[]) || [];
}

export async function createEmailTemplateDb(context: LeadsRequestContext, data: unknown): Promise<EmailTemplate> {
  const supabase = createSupabaseServerClient();
  const input = data as Record<string, unknown>;

  const template = {
    empresa_id: context.companyId,
    icp_id: input.icp_id as string | undefined,
    nome: input.nome as string,
    toque: input.toque as number,
    subject_template: input.subject_template as string,
    body_template: input.body_template as string,
    variaveis: (input.variaveis as string[]) || [],
    ativo: input.ativo !== false,
    created_at: now(),
  };

  const { data: created, error } = await supabase.from('leads_email_templates').insert(template).select().single();

  if (error) throw new Error(error.message);

  return created as EmailTemplate;
}
