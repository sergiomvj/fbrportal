import { z } from 'zod';
import {
  Partner,
  PartnerSchema,
  PartnerEvent,
  VALID_TRANSITIONS,
  PartnersQuery,
  PartnersQuerySchema,
  EspacoPublicitario,
  EspacoPublicitarioSchema,
  Receita,
  ReceitaSchema,
  Anomaly,
  AnomalySeverity,
  MediaKit,
  MediaKitCreateBodySchema,
  RateCard,
  RateCardSchema,
  DashboardKpis,
  TransitionStageBody,
  TransitionStageBodySchema,
  AnomalyReviewBody,
  AnomalyReviewBodySchema,
  ReconciliationResult,
} from './types';

export interface SalesRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export class SalesValidationError extends Error {
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

const initialPartners: Partner[] = [
  {
    id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    company_id: COMPANY_ALPHA,
    nome: 'Google AdSense',
    tipo: 'ad_network',
    ad_network: 'google_adsense',
    estagio: 'active',
    contato_nome: 'João Silva',
    contato_email: 'joao.silva@google.com',
    contato_telefone: '+55 11 99999-0001',
    site: 'https://www.google.com/adsense',
    cnpj: '12.345.678/0001-90',
    cidade: 'São Paulo',
    estado: 'SP',
    pais: 'Brasil',
    valor_estimado: 250000,
    sla_pagamento: 30,
    data_contrato: '2025-01-15',
    data_vencimento_contrato: '2026-01-15',
    valor_contrato: 250000,
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2025-01-15T10:00:00.000Z',
    updated_at: '2025-06-01T10:00:00.000Z',
  },
  {
    id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp2',
    company_id: COMPANY_ALPHA,
    nome: 'Taboola',
    tipo: 'ad_network',
    ad_network: 'taboola',
    estagio: 'active',
    contato_nome: 'Maria Santos',
    contato_email: 'maria.santos@taboola.com',
    contato_telefone: '+55 21 99999-0002',
    site: 'https://www.taboola.com',
    cnpj: '98.765.432/0001-10',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    pais: 'Brasil',
    valor_estimado: 180000,
    sla_pagamento: 45,
    data_contrato: '2025-03-01',
    data_vencimento_contrato: '2026-03-01',
    valor_contrato: 180000,
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2025-03-01T10:00:00.000Z',
    updated_at: '2025-06-15T10:00:00.000Z',
  },
  {
    id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp3',
    company_id: COMPANY_ALPHA,
    nome: 'Ezoic',
    tipo: 'ad_network',
    ad_network: 'ezoic',
    estagio: 'negociacao',
    contato_nome: 'Carlos Oliveira',
    contato_email: 'carlos@ezoic.com',
    contato_telefone: '+55 31 99999-0003',
    site: 'https://www.ezoic.com',
    cnpj: '45.678.901/0001-23',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    pais: 'Brasil',
    valor_estimado: 120000,
    sla_pagamento: 30,
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2026-04-15T10:00:00.000Z',
    updated_at: '2026-04-15T10:00:00.000Z',
  },
  {
    id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp4',
    company_id: COMPANY_ALPHA,
    nome: 'Outbrain',
    tipo: 'ad_network',
    ad_network: 'outbrain',
    estagio: 'contract',
    contato_nome: 'Ana Pereira',
    contato_email: 'ana.pereira@outbrain.com',
    contato_telefone: '+55 41 99999-0004',
    site: 'https://www.outbrain.com',
    cnpj: '67.890.123/0001-45',
    cidade: 'Curitiba',
    estado: 'PR',
    pais: 'Brasil',
    valor_estimado: 95000,
    sla_pagamento: 30,
    data_contrato: '2026-05-01',
    data_vencimento_contrato: '2027-05-01',
    valor_contrato: 95000,
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2026-04-01T10:00:00.000Z',
    updated_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp5',
    company_id: COMPANY_ALPHA,
    nome: 'Mediavine',
    tipo: 'ad_network',
    ad_network: 'mediavine',
    estagio: 'prospect',
    contato_nome: 'Roberto Alves',
    contato_email: 'roberto@mediavine.com',
    contato_telefone: '+55 51 99999-0005',
    site: 'https://www.mediavine.com',
    cidade: 'Porto Alegre',
    estado: 'RS',
    pais: 'Brasil',
    valor_estimado: 85000,
    sla_pagamento: 30,
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2026-05-01T10:00:00.000Z',
    updated_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp6',
    company_id: COMPANY_ALPHA,
    nome: 'Mgid',
    tipo: 'ad_network',
    ad_network: 'mgid',
    estagio: 'onboarding',
    contato_nome: 'Fernanda Lima',
    contato_email: 'fernanda@mgid.com',
    contato_telefone: '+55 61 99999-0006',
    site: 'https://www.mgid.com',
    cnpj: '23.456.789/0001-67',
    cidade: 'Brasília',
    estado: 'DF',
    pais: 'Brasil',
    valor_estimado: 72000,
    sla_pagamento: 30,
    data_contrato: '2026-04-20',
    data_vencimento_contrato: '2027-04-20',
    valor_contrato: 72000,
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2026-04-20T10:00:00.000Z',
    updated_at: '2026-04-28T10:00:00.000Z',
  },
];

const initialPartnerEvents: PartnerEvent[] = [
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
    partner_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    tipo: 'transicao_estagio',
    de: 'prospect',
    para: 'negociacao',
    actor_type: 'humano',
    actor_id: USER_SYSTEM,
    actor_nome: 'Sistema',
    descricao: 'Início de negociação com Google AdSense',
    metadata: { origem: 'FBR-Click', valor_estimado: 250000 },
    created_at: '2025-01-10T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
    partner_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    tipo: 'proposta_enviada',
    actor_type: 'agente',
    actor_nome: 'Proposta Bot',
    descricao: 'Proposta comercial enviada',
    metadata: { proposta_id: 'prop-001', valor: 250000 },
    created_at: '2025-01-12T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
    partner_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    tipo: 'proposta_aceita',
    actor_type: 'humano',
    actor_id: USER_SYSTEM,
    actor_nome: 'Sistema',
    descricao: 'Proposta aceita pelo parceiro',
    created_at: '2025-01-14T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee4',
    partner_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    tipo: 'contrato_assinado',
    actor_type: 'humano',
    actor_id: USER_SYSTEM,
    actor_nome: 'Sistema',
    descricao: 'Contrato assinado em 15/01/2025',
    metadata: { data_assinatura: '2025-01-15', validade: '12 meses' },
    created_at: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee5',
    partner_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    tipo: 'onboarding_concluido',
    actor_type: 'agente',
    actor_nome: 'Onboarding Bot',
    descricao: 'Onboarding técnico concluído',
    metadata: { checklist_completo: true, tags_configuradas: true },
    created_at: '2025-01-25T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee6',
    partner_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    tipo: 'transicao_estagio',
    de: 'onboarding',
    para: 'active',
    actor_type: 'humano',
    actor_id: USER_SYSTEM,
    actor_nome: 'Sistema',
    descricao: 'Parceiro entrou em operação',
    created_at: '2025-01-25T10:00:00.000Z',
  },
];

const initialEspacos: EspacoPublicitario[] = [
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeee101',
    company_id: COMPANY_ALPHA,
    produto_id: 'prod-001',
    produto_nome: 'Portal Facebrasil',
    nome: 'Banner Leaderboard',
    tipo: 'banner',
    posicao: 'topo',
    dimensao_largura: 728,
    dimensao_altura: 90,
    cpm_base: 15.00,
    ocupacao: 72,
    demanda: 'normal',
    ativo: true,
    created_at: '2025-01-01T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeee102',
    company_id: COMPANY_ALPHA,
    produto_id: 'prod-001',
    produto_nome: 'Portal Facebrasil',
    nome: 'Banner Rectangle',
    tipo: 'banner',
    posicao: 'sidebar',
    dimensao_largura: 300,
    dimensao_altura: 250,
    cpm_base: 12.00,
    ocupacao: 45,
    demanda: 'normal',
    ativo: true,
    created_at: '2025-01-01T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeee103',
    company_id: COMPANY_ALPHA,
    produto_id: 'prod-001',
    produto_nome: 'Portal Facebrasil',
    nome: 'Native In-Feed',
    tipo: 'native',
    posicao: 'entre_conteudos',
    cpm_base: 18.00,
    ocupacao: 85,
    demanda: 'alta',
    ativo: true,
    created_at: '2025-01-01T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeee104',
    company_id: COMPANY_ALPHA,
    produto_id: 'prod-002',
    produto_nome: 'Revista XYZ',
    nome: 'Sponsored Article',
    tipo: 'sponsored_content',
    posicao: 'body',
    cpm_base: 25.00,
    ocupacao: 30,
    demanda: 'baixa',
    ativo: true,
    created_at: '2025-02-01T10:00:00.000Z',
  },
  {
    id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeee105',
    company_id: COMPANY_ALPHA,
    produto_id: 'prod-003',
    produto_nome: 'Canal YouTube',
    nome: 'Pre-Roll 15s',
    tipo: 'video',
    posicao: 'pre-roll',
    cpm_base: 22.00,
    ocupacao: 65,
    demanda: 'normal',
    ativo: true,
    created_at: '2025-03-01T10:00:00.000Z',
  },
];

const initialReceitas: Receita[] = [
  {
    id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrr01',
    company_id: COMPANY_ALPHA,
    parceiro_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    periodo_ref: '2025-04',
    valor_esperado: 20833.33,
    valor_recebido: 20833.33,
    status: 'reconciliado',
    data_esperada: '2025-05-30',
    data_recebimento: '2025-05-28',
    created_at: '2025-04-30T10:00:00.000Z',
  },
  {
    id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrr02',
    company_id: COMPANY_ALPHA,
    parceiro_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    periodo_ref: '2025-05',
    valor_esperado: 20833.33,
    valor_recebido: 19500.00,
    status: 'anomalia',
    data_esperada: '2025-06-30',
    data_recebimento: '2025-06-28',
    divergencia_percentual: -6.4,
    created_at: '2025-05-31T10:00:00.000Z',
  },
  {
    id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrr03',
    company_id: COMPANY_ALPHA,
    parceiro_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp2',
    periodo_ref: '2025-04',
    valor_esperado: 15000.00,
    valor_recebido: 15000.00,
    status: 'reconciliado',
    data_esperada: '2025-05-15',
    data_recebimento: '2025-05-14',
    created_at: '2025-04-30T10:00:00.000Z',
  },
  {
    id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrr04',
    company_id: COMPANY_ALPHA,
    parceiro_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp2',
    periodo_ref: '2025-05',
    valor_esperado: 15000.00,
    valor_recebido: 15000.00,
    status: 'reconciliado',
    data_esperada: '2025-06-15',
    data_recebimento: '2025-06-16',
    created_at: '2025-05-31T10:00:00.000Z',
  },
  {
    id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrr05',
    company_id: COMPANY_ALPHA,
    parceiro_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp6',
    periodo_ref: '2025-04',
    valor_esperado: 6000.00,
    
    status: 'pendente',
    data_esperada: '2025-05-20',
    created_at: '2025-04-30T10:00:00.000Z',
  },
  {
    id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrr06',
    company_id: COMPANY_ALPHA,
    parceiro_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    periodo_ref: '2025-05',
    valor_esperado: 20833.33,
    valor_recebido: 20833.33,
    status: 'reconciliado',
    data_esperada: '2025-06-30',
    data_recebimento: '2025-06-29',
    created_at: '2025-05-31T10:00:00.000Z',
  },
];

const initialAnomalies: Anomaly[] = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    company_id: COMPANY_ALPHA,
    receita_id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrr02',
    parceiro_id: 'pppppppp-pppp-4ppp-8ppp-ppppppppppp1',
    tipo: 'valor_divergente',
    descricao: 'Recebido R$ 19.500,00 vs esperado R$ 20.833,33 (-6.4%)',
    severidade: 'alta',
    score: 2,
    metadata: {
      valor_esperado: 20833.33,
      valor_recebido: 19500.00,
      divergencia_percentual: -6.4,
    },
    status: 'pendente_revisao',
    created_at: '2025-06-28T10:00:00.000Z',
  },
];

const initialMediaKits: MediaKit[] = [
  {
    id: 'kkkkkkkk-kkkk-4kkk-8kkk-kkkkkkkkkkkk1',
    company_id: COMPANY_ALPHA,
    produto_id: 'prod-001',
    produto_nome: 'Portal Facebrasil',
    periodo_inicio: '2025-01-01',
    periodo_fim: '2025-04-30',
    status: 'concluido',
    download_url: 'https://storage.example.com/media-kits/kit-001.pdf',
    share_url: 'https://share.example.com/kit-001',
    share_expira_em: '2025-06-30T10:00:00.000Z',
    created_at: '2025-05-01T10:00:00.000Z',
    updated_at: '2025-05-02T10:00:00.000Z',
  },
];

const initialRateCards: RateCard[] = [
  {
    id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrc1',
    company_id: COMPANY_ALPHA,
    espaco_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeee101',
    nome: 'Leaderboard Standard',
    cpm: 15.00,
    modelo: 'cpm',
    ativo: true,
    created_at: '2025-01-01T10:00:00.000Z',
  },
  {
    id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrc2',
    company_id: COMPANY_ALPHA,
    espaco_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeee102',
    nome: 'Rectangle Standard',
    cpm: 12.00,
    modelo: 'cpm',
    ativo: true,
    created_at: '2025-01-01T10:00:00.000Z',
  },
  {
    id: 'rrrrrrrr-rrrr-4rrr-8rrr-rrrrrrrrrrc3',
    company_id: COMPANY_ALPHA,
    espaco_id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeee103',
    nome: 'Native Premium',
    cpm: 18.00,
    modelo: 'cpm',
    ativo: true,
    created_at: '2025-01-01T10:00:00.000Z',
  },
];

let partners: Partner[] = [];
let partnerEvents: PartnerEvent[] = [];
let espacos: EspacoPublicitario[] = [];
let receitas: Receita[] = [];
let anomalies: Anomaly[] = [];
let mediaKits: MediaKit[] = [];
let rateCards: RateCard[] = [];

function resetSalesStoreForTests() {
  partners = clone(initialPartners);
  partnerEvents = clone(initialPartnerEvents);
  espacos = clone(initialEspacos);
  receitas = clone(initialReceitas);
  anomalies = clone(initialAnomalies);
  mediaKits = clone(initialMediaKits);
  rateCards = clone(initialRateCards);
}

resetSalesStoreForTests();

export function getSalesTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, user: USER_SYSTEM };
}

export function parsePartnersQuery(url: string): PartnersQuery {
  const params = new URL(url).searchParams;
  const rawEstagio = params.getAll('estagio').flatMap((item) => item.split(',')).filter(Boolean);
  const rawTipo = params.getAll('tipo').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return PartnersQuerySchema.parse({
      busca: params.get('busca') ?? undefined,
      estagio: rawEstagio.length > 0 ? rawEstagio : undefined,
      tipo: rawTipo.length > 0 ? rawTipo : undefined,
      page: params.get('page') ?? undefined,
      page_size: params.get('page_size') ?? undefined,
      sort_by: params.get('sort_by') ?? undefined,
      sort_dir: params.get('sort_dir') ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const hasMissingRequired = error.issues.some(
        (issue) => issue.code === 'invalid_type' && issue.received === 'undefined'
      );
      throw new SalesValidationError(
        hasMissingRequired ? 'Required fields are missing.' : 'Payload validation failed.',
        hasMissingRequired ? 400 : 422,
        error.issues
      );
    }
    throw error;
  }
}

export function listPartners(context: SalesRequestContext, query: Partial<PartnersQuery> = {}) {
  const parsed = PartnersQuerySchema.parse(query);

  const filtered = partners.filter((p) => {
    if (p.company_id !== context.companyId) return false;
    if (parsed.busca) {
      const busca = parsed.busca.toLowerCase();
      if (!p.nome.toLowerCase().includes(busca)) return false;
    }
    if (parsed.estagio && !parsed.estagio.includes(p.estagio)) return false;
    if (parsed.tipo && !parsed.tipo.includes(p.tipo)) return false;
    return true;
  });

  filtered.sort((left, right) => {
    const direction = parsed.sort_dir === 'asc' ? 1 : -1;
    const leftValue = left[parsed.sort_by] ?? '';
    const rightValue = right[parsed.sort_by] ?? '';
    if (typeof leftValue === 'string' && typeof rightValue === 'string') {
      return leftValue > rightValue ? direction : leftValue < rightValue ? -direction : 0;
    }
    if (typeof leftValue === 'number' && typeof rightValue === 'number') {
      return direction * (leftValue - rightValue);
    }
    return 0;
  });

  const start = (parsed.page - 1) * parsed.page_size;
  const items = filtered.slice(start, start + parsed.page_size);

  return {
    items,
    pagination: {
      page: parsed.page,
      page_size: parsed.page_size,
      total: filtered.length,
      total_pages: Math.ceil(filtered.length / parsed.page_size),
    },
  };
}

export function getPartner(context: SalesRequestContext, id: string) {
  const partner = partners.find((p) => p.id === id && p.company_id === context.companyId);
  if (!partner) throw new SalesValidationError('Partner not found.', 404);
  return partner;
}

export function createPartner(context: SalesRequestContext, data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new SalesValidationError('JSON object payload is required.', 400);
  }

  try {
    const validated = PartnerSchema.parse({
      ...data,
      company_id: context.companyId,
      created_by: context.userId,
      created_at: now(),
      updated_at: now(),
      id: crypto.randomUUID(),
    });

    const exists = partners.some(
      (p) =>
        p.company_id === validated.company_id &&
        p.nome.toLowerCase() === validated.nome.toLowerCase() &&
        p.tipo === validated.tipo
    );
    if (exists) {
      throw new SalesValidationError('Partner with this name and type already exists.', 409);
    }

    partners.push(validated);

    partnerEvents.push({
      id: crypto.randomUUID(),
      partner_id: validated.id!,
      tipo: 'transicao_estagio',
      de: undefined,
      para: 'prospect',
      actor_type: 'humano',
      actor_id: context.userId,
      descricao: 'Parceiro criado',
      created_at: now(),
    });

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const hasMissingRequired = error.issues.some(
        (issue) => issue.code === 'invalid_type' && issue.received === 'undefined'
      );
      throw new SalesValidationError(
        hasMissingRequired ? 'Required fields are missing.' : 'Payload validation failed.',
        hasMissingRequired ? 400 : 422,
        error.issues
      );
    }
    throw error;
  }
}

export function updatePartner(context: SalesRequestContext, id: string, data: unknown) {
  const partner = partners.find((p) => p.id === id && p.company_id === context.companyId);
  if (!partner) throw new SalesValidationError('Partner not found.', 404);

  if (typeof data !== 'object' || data === null) {
    throw new SalesValidationError('JSON object payload is required.', 400);
  }

  try {
    const validated = PartnerSchema.partial().parse(data);
    Object.assign(partner, validated, { updated_at: now() });
    return partner;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SalesValidationError('Payload validation failed.', 422, error.issues);
    }
    throw error;
  }
}

export function transitionPartnerStage(
  context: SalesRequestContext,
  partnerId: string,
  body: TransitionStageBody
) {
  const partner = partners.find((p) => p.id === partnerId && p.company_id === context.companyId);
  if (!partner) throw new SalesValidationError('Partner not found.', 404);

  const parsed = TransitionStageBodySchema.parse(body);
  const currentStage = partner.estagio;
  const targetStage = parsed.para;

  const allowedTransitions = VALID_TRANSITIONS[currentStage];
  if (!allowedTransitions.includes(targetStage)) {
    throw new SalesValidationError(
      `Invalid transition from '${currentStage}' to '${targetStage}'. Allowed: ${allowedTransitions.join(', ')}`,
      400
    );
  }

  if (targetStage === 'negociacao' && (!partner.contato_nome || !partner.contato_email)) {
    throw new SalesValidationError(
      'Cannot transition to NEGOTIATION without contact name and email.',
      400
    );
  }

  if (targetStage === 'contract' && !parsed.metadata?.proposta_aceita) {
    throw new SalesValidationError(
      'Cannot transition to CONTRACT without accepted proposal.',
      400
    );
  }

  if (targetStage === 'contract' && !partner.data_contrato) {
    throw new SalesValidationError(
      'Cannot transition to CONTRACT without contract date.',
      400
    );
  }

  if (targetStage === 'active' && !parsed.metadata?.checklist_concluido) {
    throw new SalesValidationError(
      'Cannot transition to ACTIVE without onboarding checklist completion.',
      400
    );
  }

  const previousStage = partner.estagio;
  partner.estagio = targetStage;
  partner.updated_at = now();

  partnerEvents.push({
    id: crypto.randomUUID(),
    partner_id: partnerId,
    tipo: 'transicao_estagio',
    de: previousStage,
    para: targetStage,
    actor_type: 'humano',
    actor_id: context.userId,
    descricao: parsed.descricao || `Transição de ${previousStage} para ${targetStage}`,
    metadata: parsed.metadata,
    created_at: now(),
  });

  return partner;
}

export function listPartnerEvents(context: SalesRequestContext, partnerId: string) {
  const partner = partners.find((p) => p.id === partnerId && p.company_id === context.companyId);
  if (!partner) throw new SalesValidationError('Partner not found.', 404);

  return partnerEvents
    .filter((e) => e.partner_id === partnerId)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
}

export function calculateCpmDinamico(cpmBase: number, ocupacao: number, demanda: string = 'normal'): number {
  let multOcupacao: number;
  if (ocupacao < 30) {
    multOcupacao = 0.8;
  } else if (ocupacao < 60) {
    multOcupacao = 1.0;
  } else if (ocupacao < 80) {
    multOcupacao = 1.2;
  } else {
    multOcupacao = 1.5;
  }

  const multDemanda: Record<string, number> = {
    baixa: 0.9,
    normal: 1.0,
    alta: 1.15,
  };

  return Math.round(cpmBase * multOcupacao * (multDemanda[demanda] || 1.0) * 100) / 100;
}

export function listEspacos(context: SalesRequestContext, includeInactive: boolean = false) {
  let filtered = espacos.filter((e) => e.company_id === context.companyId);
  if (!includeInactive) {
    filtered = filtered.filter((e) => e.ativo);
  }
  return filtered.map((e) => ({
    ...e,
    cpm_dinamico: calculateCpmDinamico(e.cpm_base, e.ocupacao, e.demanda),
  }));
}

export function getEspaco(context: SalesRequestContext, id: string) {
  const espaco = espacos.find((e) => e.id === id && e.company_id === context.companyId);
  if (!espaco) throw new SalesValidationError('Espaço not found.', 404);
  return {
    ...espaco,
    cpm_dinamico: calculateCpmDinamico(espaco.cpm_base, espaco.ocupacao, espaco.demanda),
  };
}

export function createEspaco(context: SalesRequestContext, data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new SalesValidationError('JSON object payload is required.', 400);
  }

  try {
    const validated = EspacoPublicitarioSchema.parse({
      ...data,
      company_id: context.companyId,
      created_at: now(),
      updated_at: now(),
      id: crypto.randomUUID(),
    });
    espacos.push(validated);
    return {
      ...validated,
      cpm_dinamico: calculateCpmDinamico(validated.cpm_base, validated.ocupacao, validated.demanda),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SalesValidationError('Payload validation failed.', 422, error.issues);
    }
    throw error;
  }
}

export function updateEspaco(context: SalesRequestContext, id: string, data: unknown) {
  const espaco = espacos.find((e) => e.id === id && e.company_id === context.companyId);
  if (!espaco) throw new SalesValidationError('Espaço not found.', 404);

  if (typeof data !== 'object' || data === null) {
    throw new SalesValidationError('JSON object payload is required.', 400);
  }

  try {
    const validated = EspacoPublicitarioSchema.partial().parse(data);
    Object.assign(espaco, validated, { updated_at: now() });
    return {
      ...espaco,
      cpm_dinamico: calculateCpmDinamico(espaco.cpm_base, espaco.ocupacao, espaco.demanda),
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SalesValidationError('Payload validation failed.', 422, error.issues);
    }
    throw error;
  }
}

export function getEspacoPerformance(context: SalesRequestContext, id: string) {
  const espaco = espacos.find((e) => e.id === id && e.company_id === context.companyId);
  if (!espaco) throw new SalesValidationError('Espaço not found.', 404);

  const nowDate = new Date();
  const receita30 = receitas.filter((r) => {
    const data = new Date(r.created_at!);
    const diff = (nowDate.getTime() - data.getTime()) / (1000 * 60 * 60 * 24);
    return r.parceiro_id && diff <= 30;
  });

  const receita60 = receitas.filter((r) => {
    const data = new Date(r.created_at!);
    const diff = (nowDate.getTime() - data.getTime()) / (1000 * 60 * 60 * 24);
    return r.parceiro_id && diff <= 60;
  });

  const receita90 = receita60;

  return {
    espaco_id: id,
    cpm_medio: espaco.cpm_base,
    fill_rate: espaco.ocupacao / 100,
    revenue_30_dias: receita30.reduce((sum, r) => sum + (r.valor_recebido || 0), 0),
    revenue_60_dias: receita60.reduce((sum, r) => sum + (r.valor_recebido || 0), 0),
    revenue_90_dias: receita90.reduce((sum, r) => sum + (r.valor_recebido || 0), 0),
  };
}

export function listReceitas(context: SalesRequestContext, filters?: { status?: string; parceiro_id?: string; periodo?: string }) {
  let filtered = receitas.filter((r) => r.company_id === context.companyId);

  if (filters?.status) {
    filtered = filtered.filter((r) => r.status === filters.status);
  }
  if (filters?.parceiro_id) {
    filtered = filtered.filter((r) => r.parceiro_id === filters.parceiro_id);
  }
  if (filters?.periodo) {
    filtered = filtered.filter((r) => r.periodo_ref === filters.periodo);
  }

  return filtered.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
}

export function createReceita(context: SalesRequestContext, data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new SalesValidationError('JSON object payload is required.', 400);
  }

  try {
    const validated = ReceitaSchema.parse({
      ...data,
      company_id: context.companyId,
      created_at: now(),
      updated_at: now(),
      id: crypto.randomUUID(),
    });
    receitas.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SalesValidationError('Payload validation failed.', 422, error.issues);
    }
    throw error;
  }
}

export function runReconciliation(context: SalesRequestContext): ReconciliationResult {
  const TOLERANCE_PERCENTAGE = 5;
  const TOLERANCE_ABSOLUTE = 50;
  const PAYMENT_WINDOW_DAYS = 5;

  let processadas = 0;
  let reconciliadas = 0;
  let anomaliasEncontradas = 0;

  const pendentes = receitas.filter((r) => r.company_id === context.companyId && r.status === 'pendente');

  for (const receita of pendentes) {
    processadas++;

    const partner = partners.find((p) => p.id === receita.parceiro_id);
    if (!partner) {
      anomalies.push({
        id: crypto.randomUUID(),
        company_id: context.companyId,
        receita_id: receita.id,
        parceiro_id: receita.parceiro_id,
        tipo: 'ausencia_dados',
        descricao: 'Parceiro não encontrado para receita',
        severidade: 'media',
        score: 1,
        status: 'pendente_revisao',
        created_at: now(),
      });
      anomaliasEncontradas++;
      continue;
    }

    if (receita.valor_recebido !== undefined && receita.valor_recebido !== null) {
      const divergencia = receita.valor_recebido - receita.valor_esperado;
      const divergenciaPercentual = Math.abs(divergencia / receita.valor_esperado * 100);

      if (divergenciaPercentual > TOLERANCE_PERCENTAGE || Math.abs(divergencia) > TOLERANCE_ABSOLUTE) {
        receita.status = 'anomalia';
        receita.divergencia_percentual = Number((divergenciaPercentual * -1).toFixed(1));

        const score = calculateAnomalyScore(divergenciaPercentual, false, false, 0);
        const severidade = calculateAnomalySeverity(score);

        anomalies.push({
          id: crypto.randomUUID(),
          company_id: context.companyId,
          receita_id: receita.id,
          parceiro_id: receita.parceiro_id,
          tipo: 'valor_divergente',
          descricao: `Recebido R$ ${receita.valor_recebido.toFixed(2)} vs esperado R$ ${receita.valor_esperado.toFixed(2)} (${receita.divergencia_percentual.toFixed(1)}%)`,
          severidade,
          score,
          metadata: {
            valor_esperado: receita.valor_esperado,
            valor_recebido: receita.valor_recebido,
            divergencia_percentual: receita.divergencia_percentual,
          },
          status: 'pendente_revisao',
          created_at: now(),
        });
        anomaliasEncontradas++;
      } else {
        receita.status = 'reconciliado';
        reconciliadas++;
      }
    } else {
      const dataEsperada = new Date(receita.data_esperada || now());
      const dataAtual = new Date();
      const diffDias = (dataAtual.getTime() - dataEsperada.getTime()) / (1000 * 60 * 60 * 24);

      if (diffDias > PAYMENT_WINDOW_DAYS) {
        receita.status = 'anomalia';
        anomalies.push({
          id: crypto.randomUUID(),
          company_id: context.companyId,
          receita_id: receita.id,
          parceiro_id: receita.parceiro_id,
          tipo: 'atraso_pagamento',
          descricao: `Pagamento atrasado ${Math.floor(diffDias)} dias`,
          severidade: 'alta',
          score: 2,
          metadata: {
            dias_atrasado: Math.floor(diffDias),
            data_esperada: receita.data_esperada,
          },
          status: 'pendente_revisao',
          created_at: now(),
        });
        anomaliasEncontradas++;
      }
    }
  }

  return {
    processadas,
    reconciliadas,
    anomalias_encontradas: anomaliasEncontradas,
  };
}

function calculateAnomalyScore(
  divergenciaPercentual: number,
  isDuplicata: boolean,
  isMissingData: boolean,
  historicalAnomalyCount: number
): number {
  let score = 0;
  if (divergenciaPercentual > 5) score += 1;
  if (divergenciaPercentual > 10) score += 1;
  if (divergenciaPercentual > 20) score += 2;
  if (isDuplicata) score += 3;
  if (isMissingData) score += 1;
  if (historicalAnomalyCount > 3) score += 2;
  return score;
}

function calculateAnomalySeverity(score: number): AnomalySeverity {
  if (score >= 5) return 'critica';
  if (score >= 3) return 'alta';
  if (score >= 1) return 'media';
  return 'baixa';
}

export function listAnomalies(context: SalesRequestContext, filters?: { tipo?: string; severidade?: string; status?: string }) {
  let filtered = anomalies.filter((a) => a.company_id === context.companyId);

  if (filters?.tipo) {
    filtered = filtered.filter((a) => a.tipo === filters.tipo);
  }
  if (filters?.severidade) {
    filtered = filtered.filter((a) => a.severidade === filters.severidade);
  }
  if (filters?.status) {
    filtered = filtered.filter((a) => a.status === filters.status);
  }

  return filtered.sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
}

export function reviewAnomaly(context: SalesRequestContext, anomalyId: string, body: AnomalyReviewBody) {
  const anomaly = anomalies.find((a) => a.id === anomalyId && a.company_id === context.companyId);
  if (!anomaly) throw new SalesValidationError('Anomaly not found.', 404);

  if (anomaly.status !== 'pendente_revisao') {
    throw new SalesValidationError('Anomaly already reviewed.', 409);
  }

  const parsed = AnomalyReviewBodySchema.parse(body);

  if (parsed.acao === 'aprovar') {
    anomaly.status = 'aprovada';
  } else if (parsed.acao === 'rejeitar') {
    anomaly.status = 'rejeitada';
  } else {
    anomaly.status = 'pendente_revisao';
  }

  anomaly.revisao_observacao = parsed.observacao;
  anomaly.revisado_por = context.userId;
  anomaly.revisado_em = now();

  const partner = partners.find((p) => p.id === anomaly.parceiro_id);
  if (partner) {
    partnerEvents.push({
      id: crypto.randomUUID(),
      partner_id: partner.id!,
      tipo: 'anomalia_detectada',
      actor_type: 'humano',
      actor_id: context.userId,
      descricao: `Anomalia ${anomaly.tipo} revisada: ${parsed.acao}`,
      metadata: { anomaly_id: anomalyId, observacao: parsed.observacao },
      created_at: now(),
    });
  }

  return anomaly;
}

export function listMediaKits(context: SalesRequestContext) {
  return mediaKits
    .filter((m) => m.company_id === context.companyId)
    .sort((a, b) => new Date(b.created_at!).getTime() - new Date(a.created_at!).getTime());
}

export function getMediaKit(context: SalesRequestContext, id: string) {
  const mediaKit = mediaKits.find((m) => m.id === id && m.company_id === context.companyId);
  if (!mediaKit) throw new SalesValidationError('Media Kit not found.', 404);
  return mediaKit;
}

export function createMediaKit(context: SalesRequestContext, body: unknown) {
  const parsed = MediaKitCreateBodySchema.parse(body);

  const periodoInicio = new Date(parsed.periodo_inicio);
  const periodoFim = new Date(parsed.periodo_fim);
  const diffDias = (periodoFim.getTime() - periodoInicio.getTime()) / (1000 * 60 * 60 * 24);

  if (diffDias < 30) {
    throw new SalesValidationError('Período mínimo de 30 dias necessário para gerar media kit.', 400);
  }

  const existing = mediaKits.find(
    (m) =>
      m.company_id === context.companyId &&
      m.produto_id === parsed.produto_id &&
      m.periodo_inicio === parsed.periodo_inicio &&
      m.periodo_fim === parsed.periodo_fim &&
      m.status === 'concluido'
  );

  if (existing) {
    return existing;
  }

  const mediaKit: MediaKit = {
    id: crypto.randomUUID(),
    company_id: context.companyId,
    produto_id: parsed.produto_id,
    produto_nome: `Produto ${parsed.produto_id}`,
    periodo_inicio: parsed.periodo_inicio,
    periodo_fim: parsed.periodo_fim,
    status: 'concluido',
    download_url: `https://storage.example.com/media-kits/${crypto.randomUUID()}.pdf`,
    share_url: `https://share.example.com/kit-${crypto.randomUUID()}`,
    share_expira_em: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_at: now(),
    updated_at: now(),
  };

  mediaKits.push(mediaKit);
  return mediaKit;
}

export function getDashboardKpis(context: SalesRequestContext): DashboardKpis {
  const companyPartners = partners.filter((p) => p.company_id === context.companyId);
  const companyReceitas = receitas.filter((r) => r.company_id === context.companyId);
  const companyAnomalies = anomalies.filter((a) => a.company_id === context.companyId);

  const nowDate = new Date();
  const currentMonth = nowDate.toISOString().substring(0, 7);
  const lastMonthDate = new Date(nowDate.getFullYear(), nowDate.getMonth() - 1, 1);
  const lastMonth = lastMonthDate.toISOString().substring(0, 7);

  const revenueMes = companyReceitas
    .filter((r) => r.periodo_ref === currentMonth && r.status === 'reconciliado')
    .reduce((sum, r) => sum + (r.valor_recebido || 0), 0);

  const revenueMesAnterior = companyReceitas
    .filter((r) => r.periodo_ref === lastMonth && r.status === 'reconciliado')
    .reduce((sum, r) => sum + (r.valor_recebido || 0), 0);

  const variacao = revenueMesAnterior > 0 ? ((revenueMes - revenueMesAnterior) / revenueMesAnterior) * 100 : 0;

  const parceriasPorEstagio = companyPartners.reduce((acc, p) => {
    acc[p.estagio] = (acc[p.estagio] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const anomaliasPendentes = companyAnomalies.filter((a) => a.status === 'pendente_revisao');
  const anomaliasPorSeveridade = anomaliasPendentes.reduce(
    (acc, a) => {
      acc[a.severidade] = (acc[a.severidade] || 0) + 1;
      return acc;
    },
    { critica: 0, alta: 0, media: 0 } as Record<string, number>
  );

  const forecast = revenueMes * 1.08;

  const companyEspacos = espacos.filter((e) => e.company_id === context.companyId);
  const ocupacaoMedia =
    companyEspacos.length > 0
      ? companyEspacos.reduce((sum, e) => sum + e.ocupacao, 0) / companyEspacos.length
      : 0;

  return {
    revenue_total_mes: revenueMes,
    revenue_total_mes_anterior: revenueMesAnterior,
    revenue_variacao_percentual: Number(variacao.toFixed(1)),
    parcerias_por_estagio: parceriasPorEstagio,
    anomalias_pendentes: {
      total: anomaliasPendentes.length,
      critica: anomaliasPorSeveridade.critica || 0,
      alta: anomaliasPorSeveridade.alta || 0,
      media: anomaliasPorSeveridade.media || 0,
    },
    receita_forecast_proximo_mes: Number(forecast.toFixed(2)),
    parceiros_ativos: companyPartners.filter((p) => p.estagio === 'active').length,
    parceiros_em_negociacao: companyPartners.filter((p) => p.estagio === 'negociacao').length,
    tickets_pendentes: companyPartners.filter((p) => {
      const updated = new Date(p.updated_at || p.created_at || now());
      const diffDias = (nowDate.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
      return diffDias > 14 && p.estagio !== 'active' && p.estagio !== 'encerrado';
    }).length,
    ocupacao_media: Number(ocupacaoMedia.toFixed(1)),
  };
}

export function listRateCards(context: SalesRequestContext) {
  return rateCards.filter((r) => r.company_id === context.companyId && r.ativo);
}

export function createRateCard(context: SalesRequestContext, data: unknown) {
  if (typeof data !== 'object' || data === null) {
    throw new SalesValidationError('JSON object payload is required.', 400);
  }

  try {
    const validated = RateCardSchema.parse({
      ...data,
      company_id: context.companyId,
      created_at: now(),
      updated_at: now(),
      id: crypto.randomUUID(),
    });
    rateCards.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new SalesValidationError('Payload validation failed.', 422, error.issues);
    }
    throw error;
  }
}