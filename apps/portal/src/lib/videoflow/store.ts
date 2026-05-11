import { z } from 'zod';
import {
  Production,
  ProductionSchema,
  ProductionQuery,
  ProductionQuerySchema,
  ProductionStatus,
  Concept,
  ConceptQuery,
  Agent,
  TemplatePreset,
  VideoFlowDashboardKpis,
  CreateProductionBodySchema,
  UpdateVetorDABodySchema,
  CreateConceptBodySchema,
  HandoffSchema,
} from './types';

export interface VideoFlowRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export class VideoFlowValidationError extends Error {
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

function generateHash(data: string): string {
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16).padStart(64, '0');
}

const defaultVetorDA = {
  narrativa: {
    tom_emocional: 'neutro' as const,
    arco_dramatico: 'problema-solução' as const,
    pov: 'terceira-pessoa' as const,
    densidade_informacao: 0.5,
    tensao_resolucao: { tensao: 0.5, resolucao: 0.5 },
    abertura_emocional: 'gancho_forte' as const,
    cta: '',
  },
  visual: {
    paleta_cores: { primaria: '#1840E8', secundaria: '#FFFFFF', accento: '#FF3B30', fundo: '#0A0A0A' },
    temperatura_cor: 0,
    estilo_visual: 'corporativo' as const,
    hierarquia_visual: { foco: 'centro' as const, simetria: false, grid: 'terços' as const },
    tipografia: { fonte_titulo: 'Inter Bold', fonte_corpo: 'Inter Regular', tamanho_min: '16px', cor: '#FFFFFF' },
    densidade_quadros: 0.5,
    movimento_camera: 'estatico' as const,
    transicoes: 'corte_seco' as const,
  },
  sonoro: {
    genero_musical: 'corporativo' as const,
    energia_trilha: 0.5,
    presenca_voz: 'voiceover_ai' as const,
    uso_silencio: 0.2,
    design_som: { efeitos: [], ambiente: 'generico', sample_rate: '44100' },
    sincronia_audio_video: 'tempo_livre' as const,
  },
  formato: {
    duracao_total_seg: 60,
    proporcao: '16:9' as const,
    ritmo_corte: 0.5,
    plataforma: 'youtube' as const,
    legendas: { habilitado: true, estilo: 'closed' as const, idioma: 'pt-BR', fonte: 'Inter Bold', posicao: 'inferior' as const },
  },
  marca: {
    personalidade_marca: '',
    restricoes_visuais: [],
    tom_voz_marca: '',
    elementos_obrigatorios: [],
    brand_kit_id: undefined,
  },
  meta: {
    originalidade: 0.5,
    referencia_cultural: [],
    grau_convecionalismo: 0.5,
    consistencia_serie: null,
  },
};

const initialProductions: Production[] = [
  {
    id: 'prod-0001-4001-8001-0001-000000000001',
    company_id: COMPANY_ALPHA,
    nome: 'Segurança do Trabalho - EPIs',
    briefing: {
      empresa_id: COMPANY_ALPHA,
      user_id: USER_SYSTEM,
      objetivo: 'Conscientizar sobre segurança do trabalho',
      canal: 'instagram_reels',
      duracao_seg: 45,
      público_alvo: 'Funcionários de indústria, 25-45 anos',
      tom: 'Didático, urgente, humano',
      referencias: [],
      brand_kit_id: null,
    },
    vetor_da: defaultVetorDA,
    handoff: null,
    status: 'producao',
    custo_estimado: 1.80,
    custo_real: 0.72,
    etapa_pipeline: 'elementos',
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2026-05-01T10:00:00.000Z',
    updated_at: '2026-05-03T14:30:00.000Z',
  },
  {
    id: 'prod-0001-4001-8001-0002-000000000002',
    company_id: COMPANY_ALPHA,
    nome: 'Lançamento Produto X',
    briefing: {
      empresa_id: COMPANY_ALPHA,
      user_id: USER_SYSTEM,
      objetivo: 'Apresentar novo produto ao mercado',
      canal: 'youtube',
      duracao_seg: 120,
      público_alvo: 'Profissionais liberais, 30-50 anos',
      tom: 'Profissional, entusiasmado',
      referencias: [],
      brand_kit_id: null,
    },
    vetor_da: defaultVetorDA,
    handoff: null,
    status: 'revisao',
    custo_estimado: 4.80,
    custo_real: 3.60,
    etapa_pipeline: 'editor',
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2026-04-20T10:00:00.000Z',
    updated_at: '2026-05-02T16:00:00.000Z',
  },
  {
    id: 'prod-0001-4001-8001-0003-000000000003',
    company_id: COMPANY_ALPHA,
    nome: 'Tutorial - Uso do App',
    briefing: {
      empresa_id: COMPANY_ALPHA,
      user_id: USER_SYSTEM,
      objetivo: 'Ensinar如何使用 do aplicativo',
      canal: 'linkedin',
      duracao_seg: 90,
      público_alvo: 'Usuários novos do app',
      tom: 'Claro, instructional',
      referencias: [],
      brand_kit_id: null,
    },
    vetor_da: null,
    handoff: null,
    status: 'briefing',
    custo_estimado: 0,
    custo_real: 0,
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2026-05-05T10:00:00.000Z',
    updated_at: '2026-05-05T10:00:00.000Z',
  },
  {
    id: 'prod-0001-4001-8001-0004-000000000004',
    company_id: COMPANY_ALPHA,
    nome: 'Case de Sucesso - Cliente Y',
    briefing: {
      empresa_id: COMPANY_ALPHA,
      user_id: USER_SYSTEM,
      objetivo: 'Apresentar resultado do cliente',
      canal: 'youtube',
      duracao_seg: 180,
      público_alvo: 'Potenciais clientes B2B',
      tom: 'Inspirador, profissional',
      referencias: [],
      brand_kit_id: null,
    },
    vetor_da: defaultVetorDA,
    handoff: null,
    status: 'concluido',
    custo_estimado: 7.20,
    custo_real: 6.48,
    etapa_pipeline: 'concluido',
    owner_id: USER_SYSTEM,
    created_by: USER_SYSTEM,
    created_at: '2026-03-15T10:00:00.000Z',
    updated_at: '2026-04-01T18:00:00.000Z',
  },
];

const initialConcepts: Concept[] = [
  {
    id: 'conc-0001-4001-8001-0001-000000000001',
    company_id: COMPANY_ALPHA,
    titulo: 'Segurança Industrial - EPIs',
    canal: 'instagram_reels',
    tom: 'urgente',
    tags: ['segurança', 'industrial', 'epi', 'urgente'],
    vetor_da_extraido: defaultVetorDA,
    score_qualidade: 0.85,
    aprovado: true,
    usos: 12,
    created_at: '2026-02-15T10:00:00.000Z',
  },
  {
    id: 'conc-0001-4001-8001-0002-000000000002',
    company_id: COMPANY_ALPHA,
    titulo: 'Tutorial App - Step by Step',
    canal: 'youtube',
    tom: 'educativo',
    tags: ['tutorial', 'app', 'educativo', ' passo-a-passo'],
    vetor_da_extraido: defaultVetorDA,
    score_qualidade: 0.78,
    aprovado: true,
    usos: 8,
    created_at: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'conc-0001-4001-8001-0003-000000000003',
    company_id: COMPANY_ALPHA,
    titulo: 'Lançamento Produto Tech',
    canal: 'linkedin',
    tom: 'corporativo',
    tags: ['lançamento', 'tech', 'corporativo', 'profissional'],
    vetor_da_extraido: defaultVetorDA,
    score_qualidade: 0.72,
    aprovado: false,
    usos: 3,
    created_at: '2026-04-10T10:00:00.000Z',
  },
];

const initialAgents: Agent[] = [
  {
    id: 'agnt-0001-4001-8001-0001-000000000001',
    company_id: COMPANY_ALPHA,
    nome: 'Maestro',
    funcao: 'orquestrador',
    descricao: 'Orquestra todo o pipeline de produção, define o vetor de DA',
    model: 'Claude Sonnet 4.6',
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'agnt-0001-4001-8001-0002-000000000002',
    company_id: COMPANY_ALPHA,
    nome: 'Curador',
    funcao: 'referencias',
    descricao: 'Busca e analisa referências no banco de conceitos',
    model: 'Gemini 2.5 Flash',
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'agnt-0001-4001-8001-0003-000000000003',
    company_id: COMPANY_ALPHA,
    nome: 'Arquiteto',
    funcao: 'elementos',
    descricao: 'Seleciona elementos visuais, áudio e assets',
    model: 'Claude Haiku 4.5',
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'agnt-0001-4001-8001-0004-000000000004',
    company_id: COMPANY_ALPHA,
    nome: 'Montador',
    funcao: 'editor',
    descricao: 'Compõe roteiro, storyboard e edição final',
    model: 'Claude Sonnet 4.6',
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'agnt-0001-4001-8001-0005-000000000005',
    company_id: COMPANY_ALPHA,
    nome: 'Empacotador',
    funcao: 'publicacao',
    descricao: 'Gera pacote final para publicação',
    model: 'Claude Haiku 4.5',
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'agnt-0001-4001-8001-0006-000000000006',
    company_id: COMPANY_ALPHA,
    nome: 'Vigia',
    funcao: 'supervisor',
    descricao: 'Monitora custos, qualidade e timeline',
    model: 'Gemini 2.5 Flash',
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
];

const initialTemplates: TemplatePreset[] = [
  {
    id: 'tmpl-0001-4001-8001-0001-000000000001',
    company_id: COMPANY_ALPHA,
    nome: 'Shorts Viral',
    tipo: 'shorts',
    descricao: 'Template para vídeos curtos virais',
    duracao_padrao: 30,
    proporcao_padrao: '9:16',
    plataforma_padrao: 'instagram_reels',
    vetor_da: defaultVetorDA,
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'tmpl-0001-4001-8001-0002-000000000002',
    company_id: COMPANY_ALPHA,
    nome: 'Video Corporativo',
    tipo: 'video_comum',
    descricao: 'Template para vídeos institucionais',
    duracao_padrao: 120,
    proporcao_padrao: '16:9',
    plataforma_padrao: 'youtube',
    vetor_da: defaultVetorDA,
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
  {
    id: 'tmpl-0001-4001-8001-0003-000000000003',
    company_id: COMPANY_ALPHA,
    nome: 'Mini Doc',
    tipo: 'mini_doc',
    descricao: 'Template para mini documentários',
    duracao_padrao: 300,
    proporcao_padrao: '16:9',
    plataforma_padrao: 'youtube',
    vetor_da: defaultVetorDA,
    ativo: true,
    created_at: '2026-01-01T10:00:00.000Z',
  },
];

let productions: Production[] = [];
let concepts: Concept[] = [];
let agents: Agent[] = [];
let templates: TemplatePreset[] = [];

function resetVideoFlowStoreForTests() {
  productions = clone(initialProductions);
  concepts = clone(initialConcepts);
  agents = clone(initialAgents);
  templates = clone(initialTemplates);
}

resetVideoFlowStoreForTests();

export function getVideoFlowTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, user: USER_SYSTEM };
}

export function parseProductionQuery(url: string): ProductionQuery {
  const params = new URL(url).searchParams;
  const rawStatus = params.getAll('status').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return ProductionQuerySchema.parse({
      busca: params.get('busca') ?? undefined,
      status: rawStatus.length > 0 ? rawStatus : undefined,
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
      throw new VideoFlowValidationError(
        hasMissingRequired ? 'Required fields are missing.' : 'Payload validation failed.',
        hasMissingRequired ? 400 : 422,
        error.issues
      );
    }
    throw error;
  }
}

export function listProductions(context: VideoFlowRequestContext, query: Partial<ProductionQuery> = {}) {
  const parsed = ProductionQuerySchema.parse(query);

  const filtered = productions.filter((p) => {
    if (p.company_id !== context.companyId) return false;
    if (parsed.busca) {
      const busca = parsed.busca.toLowerCase();
      if (!p.nome.toLowerCase().includes(busca)) return false;
    }
    if (parsed.status && !parsed.status.includes(p.status)) return false;
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

export function getProduction(context: VideoFlowRequestContext, id: string) {
  const production = productions.find((p) => p.id === id && p.company_id === context.companyId);
  if (!production) throw new VideoFlowValidationError('Production not found.', 404);
  return production;
}

export function createProduction(context: VideoFlowRequestContext, body: unknown) {
  const parsed = CreateProductionBodySchema.parse(body);

  const production: Production = {
    id: crypto.randomUUID(),
    company_id: context.companyId,
    nome: parsed.nome,
    briefing: parsed.briefing,
    vetor_da: null,
    handoff: null,
    status: 'briefing',
    custo_estimado: 0,
    custo_real: 0,
    owner_id: context.userId,
    created_by: context.userId,
    created_at: now(),
    updated_at: now(),
  };

  productions.push(production);
  return production;
}

export function updateProduction(context: VideoFlowRequestContext, id: string, data: unknown) {
  const production = productions.find((p) => p.id === id && p.company_id === context.companyId);
  if (!production) throw new VideoFlowValidationError('Production not found.', 404);

  if (typeof data !== 'object' || data === null) {
    throw new VideoFlowValidationError('JSON object payload is required.', 400);
  }

  try {
    const validated = ProductionSchema.partial().parse(data);
    Object.assign(production, validated, { updated_at: now() });
    return production;
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new VideoFlowValidationError('Payload validation failed.', 422, error.issues);
    }
    throw error;
  }
}

export function updateVetorDA(context: VideoFlowRequestContext, id: string, body: unknown) {
  const production = productions.find((p) => p.id === id && p.company_id === context.companyId);
  if (!production) throw new VideoFlowValidationError('Production not found.', 404);

  const parsed = UpdateVetorDABodySchema.parse(body);

  const handoff: HandoffSchema = {
    production_id: production.id!,
    versao_schema: '1.0',
    briefing: production.briefing,
    vetor_da: parsed.vetor_da,
    esqueleto: null,
    memoria_de_marca: null,
    pipeline: {
      etapa_atual: 'orquestrador',
      etapas_concluidas: [],
      historico: [],
    },
    hash_envelope: '',
  };

  const envelopeData = JSON.stringify({
    ...handoff,
    hash_envelope: undefined,
    pipeline: {
      ...handoff.pipeline,
      historico: undefined,
    },
  });
  handoff.hash_envelope = generateHash(envelopeData);

  production.vetor_da = parsed.vetor_da;
  production.handoff = handoff;
  production.status = 'orquestrador';
  production.custo_estimado = calculateCustoEstimado(parsed.vetor_da);
  production.etapa_pipeline = 'orquestrador';
  production.updated_at = now();

  return production;
}

function calculateCustoEstimado(vetorDA: unknown): number {
  if (!vetorDA) return 0;
  const vetor = vetorDA as { formato?: { duracao_total_seg?: number } };
  const duracao = vetor?.formato?.duracao_total_seg || 60;
  const custoPorMinuto = 0.04;
  return Math.round((duracao / 60) * custoPorMinuto * 100) / 100;
}

export function advancePipeline(context: VideoFlowRequestContext, productionId: string) {
  const production = productions.find((p) => p.id === productionId && p.company_id === context.companyId);
  if (!production) throw new VideoFlowValidationError('Production not found.', 404);

  const pipelineStages = ['briefing', 'orquestrador', 'producao', 'revisao', 'pacote_pronto', 'concluido'];
  const currentIndex = pipelineStages.indexOf(production.status);

  if (currentIndex === -1 || currentIndex === pipelineStages.length - 1) {
    return production;
  }

  const nextStage = pipelineStages[currentIndex + 1]!;
  production.status = nextStage as ProductionStatus;
  production.etapa_pipeline = nextStage;

  if (nextStage === 'concluido') {
    production.custo_real = production.custo_estimado * 0.9;
  }

  production.updated_at = now();

  if (production.handoff) {
    production.handoff.pipeline.etapas_concluidas.push(nextStage);
    production.handoff.pipeline.etapa_atual = nextStage;
    production.handoff.pipeline.historico.push({
      agente: 'system',
      timestamp: now(),
      hash_output: generateHash(JSON.stringify(production.handoff)),
    });
  }

  return production;
}

export function listConcepts(context: VideoFlowRequestContext, query?: Partial<ConceptQuery>) {
  let filtered = concepts.filter((c) => c.company_id === context.companyId);

  if (query?.busca) {
    const busca = query.busca.toLowerCase();
    filtered = filtered.filter(
      (c) => c.titulo.toLowerCase().includes(busca) || c.tags.some((t) => t.toLowerCase().includes(busca))
    );
  }
  if (query?.canal) {
    filtered = filtered.filter((c) => c.canal === query.canal);
  }
  if (query?.aprovado !== undefined) {
    filtered = filtered.filter((c) => c.aprovado === query.aprovado);
  }

  return filtered;
}

export function getConcept(context: VideoFlowRequestContext, id: string) {
  const concept = concepts.find((c) => c.id === id && c.company_id === context.companyId);
  if (!concept) throw new VideoFlowValidationError('Concept not found.', 404);
  return concept;
}

export function createConcept(context: VideoFlowRequestContext, body: unknown) {
  const parsed = CreateConceptBodySchema.parse(body);

  const concept: Concept = {
    id: crypto.randomUUID(),
    company_id: context.companyId,
    titulo: parsed.titulo,
    video_url: parsed.video_url,
    thumbnail_url: parsed.thumbnail_url,
    canal: parsed.canal,
    tom: parsed.tom,
    tags: parsed.tags || [],
    aprovado: false,
    usos: 0,
    created_at: now(),
  };

  concepts.push(concept);
  return concept;
}

export function searchConceptsSimilarity(context: VideoFlowRequestContext, query: string, topK: number = 3) {
  const busca = query.toLowerCase();
  
  const filtered = concepts.filter(
    (c) =>
      c.company_id === context.companyId &&
      (c.titulo.toLowerCase().includes(busca) ||
        c.tags.some((t) => t.toLowerCase().includes(busca)) ||
        c.tom?.toLowerCase().includes(busca))
  );

  const sorted = filtered
    .map((c) => ({
      concept: c,
      score: c.score_qualidade || 0.5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return sorted.map((s) => ({
    concept: s.concept,
    similaridade: s.score,
  }));
}

export function approveConcept(context: VideoFlowRequestContext, id: string) {
  const concept = concepts.find((c) => c.id === id && c.company_id === context.companyId);
  if (!concept) throw new VideoFlowValidationError('Concept not found.', 404);

  concept.aprovado = true;
  return concept;
}

export function listAgents(context: VideoFlowRequestContext) {
  return agents.filter((a) => a.company_id === context.companyId && a.ativo);
}

export function listTemplates(context: VideoFlowRequestContext) {
  return templates.filter((t) => t.company_id === context.companyId && t.ativo);
}

export function getTemplate(context: VideoFlowRequestContext, id: string) {
  const template = templates.find((t) => t.id === id && t.company_id === context.companyId);
  if (!template) throw new VideoFlowValidationError('Template not found.', 404);
  return template;
}

export function createProductionFromTemplate(context: VideoFlowRequestContext, templateId: string, nome: string) {
  const template = getTemplate(context, templateId);

  const production: Production = {
    id: crypto.randomUUID(),
    company_id: context.companyId,
    nome,
    briefing: {
      empresa_id: context.companyId,
      user_id: context.userId,
      objetivo: '',
      canal: template.plataforma_padrao,
      duracao_seg: template.duracao_padrao,
      público_alvo: '',
      tom: '',
      referencias: [],
      brand_kit_id: null,
    },
    vetor_da: template.vetor_da || null,
    handoff: null,
    status: 'briefing',
    custo_estimado: calculateCustoEstimado(template.vetor_da),
    custo_real: 0,
    owner_id: context.userId,
    created_by: context.userId,
    created_at: now(),
    updated_at: now(),
  };

  productions.push(production);
  return production;
}

export function getVideoFlowDashboardKpis(context: VideoFlowRequestContext): VideoFlowDashboardKpis {
  const companyProductions = productions.filter((p) => p.company_id === context.companyId);
  const companyConcepts = concepts.filter((c) => c.company_id === context.companyId);

  const producoesPorStatus = companyProductions.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const custoTotal = companyProductions.reduce((sum, p) => sum + p.custo_real, 0);
  const concluidas = companyProductions.filter((p) => p.status === 'concluido').length;
  const ativas = companyProductions.filter((p) => p.status !== 'concluido' && p.status !== 'falhou').length;

  const custoMedioMinuto = custoTotal / (companyProductions.reduce((sum, p) => sum + (p.briefing.duracao_seg / 60), 0) || 1);

  return {
    producoes_ativas: ativas,
    producoes_concluidas: concluidas,
    custo_total_mes: custoTotal,
    custo_medio_minuto: Math.round(custoMedioMinuto * 100) / 100,
    conceitos_aprovados: companyConcepts.filter((c) => c.aprovado).length,
    agentes_ativos: agents.filter((a) => a.company_id === context.companyId && a.ativo).length,
    producoes_por_status: producoesPorStatus,
    custo_por_semana: [
      { semana: '2026-W18', custo: 2.40 },
      { semana: '2026-W19', custo: 4.80 },
      { semana: '2026-W20', custo: 3.60 },
    ],
  };
}