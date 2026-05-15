import type { LeadsRequestContext } from './store-db';
import type { LeadCaptureFonte } from './types';
import {
  createSourceRunDb,
  updateSourceRunDb,
  createSourceRecordDb,
  createLeadDb,
  findLeadByHashDb,
  getSourceRunDb,
} from './store-db';

function normalizeStableKey(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9@.:/-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function leadHashFor(fonte: LeadCaptureFonte, raw: Record<string, unknown>) {
  const email = extractText(raw, 'email', 'contato_email', 'email_cadastral');
  if (email) return `email:${email.toLowerCase()}`;

  const cnpj = extractText(raw, 'cnpj', 'empresa_cnpj');
  if (cnpj) return `cnpj:${normalizeStableKey(cnpj)}`;

  const site = extractText(raw, 'url_site', 'site');
  if (site) return `site:${normalizeStableKey(site.replace(/^https?:\/\//i, '').replace(/\/$/, ''))}`;

  const company = extractText(raw, 'empresa_nome', 'nome_fantasia', 'razao_social', 'nome');
  if (company) return `fonte:${normalizeStableKey(company)}`;

  return `unknown:${Date.now()}`;
}

function sourceKeyFor(fonte: LeadCaptureFonte, raw: Record<string, unknown>) {
  const key =
    fonte === 'linkedin'
      ? extractText(raw, 'linkedin_url', 'email', 'contato_email', 'empresa_linkedin_url')
      : fonte === 'cnpj_biz'
        ? extractText(raw, 'cnpj', 'empresa_cnpj')
        : fonte === 'google_maps'
          ? extractText(raw, 'place_id', 'site', 'telefone', 'nome')
          : extractText(raw, 'url_site', 'site', 'email', 'contato_email');

  if (key) return `${fonte}:${normalizeStableKey(key)}`;

  const company = extractText(raw, 'empresa_nome', 'nome_fantasia', 'razao_social', 'nome');
  if (company) return `${fonte}:${normalizeStableKey(company)}`;

  return `${fonte}:unknown-${Date.now()}`;
}

function extractText(input: Record<string, unknown>, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'string' && value.trim().length > 0) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return undefined;
}

function extractNumber(input: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = input[key];
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value.replace(/[^\d.,-]/g, '').replace(',', '.'));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return undefined;
}

function extractStringArray(input: Record<string, unknown>, ...keys: string[]): string[] | undefined {
  for (const key of keys) {
    const value = input[key];
    if (Array.isArray(value)) return value.map((item) => String(item).trim()).filter(Boolean);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.split(',').map((item) => item.trim()).filter(Boolean);
    }
  }
  return undefined;
}

function requirePersistedId(entity: { id?: string | undefined }, entityName: string): string {
  if (!entity.id) {
    throw new Error(`${entityName} was not persisted with an id.`);
  }

  return entity.id;
}

interface CaptureResult {
  run: Awaited<ReturnType<typeof createSourceRunDb>>;
  leads: Awaited<ReturnType<typeof createLeadDb>>[];
  leads_created: number;
  duplicates: number;
  failed: number;
  records: Awaited<ReturnType<typeof createSourceRecordDb>>[];
}

export async function captureLeadsFromSourceDb(
  context: LeadsRequestContext,
  data: unknown,
): Promise<CaptureResult> {
  const input = data as Record<string, unknown>;
  const fonte = input.fonte as LeadCaptureFonte;
  const records = input.records as Record<string, unknown>[];

  if (!fonte || !['linkedin', 'cnpj_biz', 'google_maps', 'site'].includes(fonte)) {
    throw new Error('Invalid source type');
  }

  if (!Array.isArray(records) || records.length === 0) {
    throw new Error('Records array is required');
  }

  const run = await createSourceRunDb(context, fonte, input.query as Record<string, unknown> || {});
  const runId = requirePersistedId(run, 'Source run');

  await updateSourceRunDb(runId, { status: 'processing', started_at: new Date().toISOString() });

  let leadsCreated = 0;
  let duplicates = 0;
  let failed = 0;
  const createdRecords: Awaited<ReturnType<typeof createSourceRecordDb>>[] = [];
  const createdLeads: Awaited<ReturnType<typeof createLeadDb>>[] = [];

  for (const raw of records) {
    try {
      const sourceKey = sourceKeyFor(fonte, raw);
      const leadHash = leadHashFor(fonte, raw);

      const existingLead = await findLeadByHashDb(context, leadHash);

      let normalizedLeadId: string | undefined;

      if (!existingLead) {
        const leadData = {
          empresa_nome: extractText(raw, 'empresa_nome', 'nome_fantasia', 'razao_social', 'nome') || 'Empresa sem nome',
          empresa_cnpj: extractText(raw, 'cnpj', 'empresa_cnpj'),
          contato_nome: extractText(raw, 'contato_nome', 'nome_contato') || 'Contato a identificar',
          contato_email: extractText(raw, 'email', 'contato_email'),
          contato_cargo: extractText(raw, 'cargo', 'contato_cargo'),
          contato_linkedin: extractText(raw, 'linkedin_url', 'contato_linkedin'),
          contato_telefone: extractText(raw, 'telefone', 'ddd_telefone', 'contato_telefone'),
          setor: extractText(raw, 'setor', 'cnae_descricao', 'categoria'),
          porte: extractText(raw, 'porte', 'tamanho_empresa'),
          regiao: extractText(raw, 'regiao', 'uf', 'endereco_completo'),
          cidade: extractText(raw, 'municipio', 'cidade'),
          estado: extractText(raw, 'uf', 'estado'),
          funcionarios: extractNumber(raw, 'funcionarios', 'funcionarios_estimado'),
          faturamento: extractNumber(raw, 'faturamento', 'faturamento_estimado', 'capital_social'),
          fonte,
          fonte_url: extractText(raw, 'linkedin_url', 'empresa_linkedin_url', 'url_site', 'site'),
          etapa: 'captado',
          email_valido: 'nao_verificado',
          site_url: extractText(raw, 'url_site', 'site'),
          site_tecnologias: extractStringArray(raw, 'tecnologias', 'site_tecnologias') || [],
          site_https: raw.https_ativo === true || extractText(raw, 'url_site', 'site')?.startsWith('https://'),
          hash_deduplicacao: leadHash,
          fontes_origem: [fonte],
        };

        const createdLead = await createLeadDb(context, leadData);
        normalizedLeadId = createdLead.id;
        createdLeads.push(createdLead);
        leadsCreated++;
      } else {
        normalizedLeadId = existingLead.id;
        duplicates++;
      }

      const sourceRecord = {
        fonte,
        source_key: sourceKey,
        raw_payload: raw,
        duplicate_status: existingLead ? 'duplicate' : 'new',
        ...(normalizedLeadId ? { normalized_lead_id: normalizedLeadId } : {}),
        ...(existingLead?.id ? { duplicate_of_lead_id: existingLead.id } : {}),
      } as const;
      const record = await createSourceRecordDb(context, runId, sourceRecord);

      createdRecords.push(record);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await createSourceRecordDb(context, runId, {
        fonte,
        source_key: `error-${Date.now()}`,
        raw_payload: raw,
        duplicate_status: 'new',
        error: errorMessage,
      });
      failed++;
    }
  }

  const finalStatus = failed > 0 && leadsCreated === 0 ? 'failed' : 'done';
  await updateSourceRunDb(runId, {
    status: finalStatus,
    total_records: records.length,
    leads_created: leadsCreated,
    duplicates,
    failed_records: failed,
    completed_at: new Date().toISOString(),
    ...(finalStatus === 'failed' ? { error: 'All records failed' } : {}),
  });

  return {
    run: await getSourceRunDb(context, runId),
    leads: createdLeads,
    leads_created: leadsCreated,
    duplicates,
    failed,
    records: createdRecords,
  };
}

export { getSourceRunDb, listSourceRunsDb } from './store-db';
export { listSourceRecordsByRunDb } from './store-db';
