import type { Campaign, CampaignTipo, CampaignsQuery, MktEstrategia, MktEstrategiaVersao } from './types';

export interface MktCampaignSource {
  estrategia: MktEstrategia;
  versao: MktEstrategiaVersao;
}

export function buildCampaignRowsFromStrategyVersions(
  sources: MktCampaignSource[],
  query: Partial<CampaignsQuery> = {},
): { items: Campaign[]; pagination: { page: number; page_size: number; total: number; total_pages: number } } {
  const page = query.page ?? 1;
  const pageSize = query.page_size ?? 10;
  const rows = sources.flatMap(({ estrategia, versao }) =>
    versao.conteudo.campanhas.map((campanha): Campaign => ({
      company_id: estrategia.empresa_id,
      nome: campanha.nome,
      status: statusFromEstrategia(estrategia.status),
      tipo: tipoFromCampaign(campanha.objetivo_smart, campanha.formatos),
      budget: parseBudget(campanha.budget),
      gasto: 0,
      roi: parseRoi(versao.conteudo.kpis.find((kpi) => kpi.canal === campanha.canal)?.roi),
      data_inicio: estrategia.created_at ?? versao.created_at ?? new Date(0).toISOString(),
      canal: campanha.canal,
      responsavel: versao.gerado_por,
      created_at: versao.created_at ?? estrategia.created_at,
    })),
  );

  const filtered = rows.filter((row) => {
    if (query.status && query.status.length > 0 && !query.status.includes(row.status)) return false;
    if (query.tipo && query.tipo.length > 0 && !query.tipo.includes(row.tipo)) return false;
    if (query.canal && row.canal !== query.canal) return false;
    return true;
  });

  const sorted = [...filtered].sort((left, right) => compareCampaigns(left, right, query));
  const start = (page - 1) * pageSize;
  const totalPages = Math.ceil(filtered.length / pageSize);

  return {
    items: sorted.slice(start, start + pageSize),
    pagination: {
      page,
      page_size: pageSize,
      total: filtered.length,
      total_pages: totalPages,
    },
  };
}

function statusFromEstrategia(status: MktEstrategia['status']): Campaign['status'] {
  if (status === 'ativa') return 'ativa';
  if (status === 'arquivada') return 'concluida';
  return 'rascunho';
}

function tipoFromCampaign(objective: string, formats: string[]): CampaignTipo {
  const text = `${objective} ${formats.join(' ')}`.toLowerCase();
  if (text.includes('remarketing')) return 'remarketing';
  if (text.includes('convers') || text.includes('venda')) return 'conversao';
  if (text.includes('institucional')) return 'institucional';
  if (text.includes('produto')) return 'produto';
  if (text.includes('lead') || text.includes('sql') || text.includes('diagnostico') || text.includes('email')) return 'leads';
  return 'awareness';
}

function parseBudget(value: string): number {
  const normalized = value
    .replace(/[^\d,.]/g, '')
    .replace(/\.(?=\d{3}(?:\D|$))/g, '')
    .replace(',', '.');
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

function parseRoi(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : 0;
}

function compareCampaigns(left: Campaign, right: Campaign, query: Partial<CampaignsQuery>) {
  const direction = query.sort_dir === 'asc' ? 1 : -1;
  const sortBy = query.sort_by ?? 'data_inicio';
  const leftValue = left[sortBy];
  const rightValue = right[sortBy];

  if (typeof leftValue === 'number' && typeof rightValue === 'number') {
    return (leftValue - rightValue) * direction;
  }

  return String(leftValue ?? '').localeCompare(String(rightValue ?? '')) * direction;
}
