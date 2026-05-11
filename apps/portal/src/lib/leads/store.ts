import { z } from 'zod';
import {
  Lead, LeadSchema, LeadsQuery, LeadsQuerySchema,
  ICP, ICPSchema,
  Domain, DomainSchema,
  EmailCadencia,
  EmailTemplate,
  Agent,
  AgentLog,
  Campaign, CampaignSchema,
  HandoffPayload, HandoffPayloadSchema,
  Report,
  DashboardKpis,
  LeadEtapaSchema,
} from './types';

export interface LeadsRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export class LeadsValidationError extends Error {
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

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function now() {
  return new Date().toISOString();
}

function today() {
  return now().slice(0, 10);
}

function parseJsonObject(input: unknown) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    throw new LeadsValidationError('JSON object payload is required.', 400);
  }
  return input;
}

function normalizeZodError(error: z.ZodError) {
  const hasMissingRequired = error.issues.some((issue) => issue.code === 'invalid_type' && issue.received === 'undefined');
  return new LeadsValidationError(hasMissingRequired ? 'Required fields are missing.' : 'Payload validation failed.', hasMissingRequired ? 400 : 422, error.issues);
}

const ICP_BR_EUA = 'llllllll-llll-4lll-8lll-llllllllll01';
const ICP_MKT_SP = 'llllllll-llll-4lll-8lll-llllllllll02';
const ICP_ECOM = 'llllllll-llll-4lll-8lll-llllllllll03';
const DOM_OUTREACH = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1';
const DOM_MAIL = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2';
const DOM_NOVO = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd3';
const DOM_WARMUP = 'dddddddd-dddd-4ddd-8ddd-ddddddddddd4';
const CAMP_MKT_Q2 = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1';
const CAMP_ECOM = 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2';

const initialICPs: ICP[] = [
  {
    id: ICP_BR_EUA,
    company_id: COMPANY_ALPHA,
    nome: 'Empresas Brasileiras nos EUA',
    descricao: 'Empresas brasileiras com presença ou interesse em expansão para os EUA, porte médio, setores de serviços digitais e tecnologia.',
    setor: ['Tecnologia', 'Serviços Digitais', 'Marketing Digital', 'SaaS'],
    porte: ['Médio', 'Grande'],
    cargo_alvo: ['CEO', 'Diretor de Marketing', 'CMO', 'Head de Expansão', 'Diretor Comercial'],
    regiao: ['SP', 'RJ', 'MG', 'PR'],
    score_minimo: 65,
    keywords: ['expansão EUA', 'imigrante', 'brasileiro EUA', 'digital', 'outbound'],
    exclusoes: ['food truck', 'restaurante', 'salão de beleza', 'freelancer'],
    porte_funcionarios_min: 20,
    porte_funcionarios_max: 500,
    faturamento_minimo: 500000,
    dominio_email_permitido: ['corporativo'],
    ativo: true,
    total_leads: 312,
    total_sqls: 18,
    taxa_conversao: 5.8,
    created_at: '2026-01-15T10:00:00.000Z',
  },
  {
    id: ICP_MKT_SP,
    company_id: COMPANY_ALPHA,
    nome: 'Marketing Agencies SP',
    descricao: 'Agências de marketing e publicidade em São Paulo com foco em performance digital.',
    setor: ['Marketing Digital', 'Agência de Publicidade', 'Advertising', 'Performance'],
    porte: ['Médio', 'Pequeno'],
    cargo_alvo: ['Diretor de Marketing', 'CMO', 'Head de Growth', 'Gerente de Marketing', 'Sócio-Diretor'],
    regiao: ['SP'],
    score_minimo: 60,
    keywords: ['growth', 'inbound', 'marketing automation', 'hubspot', 'performance'],
    exclusoes: ['estudante', 'estagiário', 'freelancer solo'],
    porte_funcionarios_min: 10,
    porte_funcionarios_max: 200,
    faturamento_minimo: 100000,
    dominio_email_permitido: ['todos'],
    ativo: true,
    total_leads: 187,
    total_sqls: 12,
    taxa_conversao: 6.4,
    created_at: '2026-02-01T10:00:00.000Z',
  },
  {
    id: ICP_ECOM,
    company_id: COMPANY_ALPHA,
    nome: 'E-commerce Mid-Market',
    descricao: 'E-commerces brasileiros com faturamento entre R$1M e R$50M buscando canais de aquisição.',
    setor: ['E-commerce', 'Retail', 'Varejo Online', 'Marketplace'],
    porte: ['Médio', 'Grande'],
    cargo_alvo: ['CMO', 'Head of Growth', 'Diretor Comercial', 'Head de E-commerce'],
    regiao: ['SP', 'RJ', 'MG', 'PR', 'SC'],
    score_minimo: 70,
    keywords: ['conversão', 'CAC', 'ROAS', 'aquisição', 'tráfego pago'],
    exclusoes: ['dropshipping', 'afiliado', 'revenda sem marca'],
    porte_funcionarios_min: 30,
    porte_funcionarios_max: 500,
    faturamento_minimo: 1000000,
    dominio_email_permitido: ['corporativo'],
    ativo: true,
    total_leads: 95,
    total_sqls: 7,
    taxa_conversao: 7.4,
    created_at: '2026-03-01T10:00:00.000Z',
  },
];

const initialDomains: Domain[] = [
  {
    id: DOM_OUTREACH,
    company_id: COMPANY_ALPHA,
    dominio: 'outreach.facebrasil.com.br',
    status: 'saudavel',
    warming_phase: 'fase4',
    warming_dia: 120,
    bounce_rate: 1.2,
    envios_hoje: 34,
    limite_diario: 80,
    open_rate: 28.5,
    spam_complaint_rate: 0.05,
    blacklist: false,
    spf_ok: true,
    dkim_ok: true,
    dmarc_ok: true,
    total_envios_7d: 245,
    total_bounces_7d: 3,
    created_at: '2025-12-01T10:00:00.000Z',
  },
  {
    id: DOM_MAIL,
    company_id: COMPANY_ALPHA,
    dominio: 'mail.facebrasil.com.br',
    status: 'saudavel',
    warming_phase: 'fase4',
    warming_dia: 95,
    bounce_rate: 0.8,
    envios_hoje: 28,
    limite_diario: 60,
    open_rate: 31.2,
    spam_complaint_rate: 0.02,
    blacklist: false,
    spf_ok: true,
    dkim_ok: true,
    dmarc_ok: true,
    total_envios_7d: 189,
    total_bounces_7d: 2,
    created_at: '2025-12-15T10:00:00.000Z',
  },
  {
    id: DOM_NOVO,
    company_id: COMPANY_ALPHA,
    dominio: 'novo.facebrasil.com.br',
    status: 'aquecendo',
    warming_phase: 'fase2',
    warming_dia: 38,
    bounce_rate: 0.0,
    envios_hoje: 12,
    limite_diario: 20,
    open_rate: 35.0,
    spam_complaint_rate: 0.0,
    blacklist: false,
    spf_ok: true,
    dkim_ok: true,
    dmarc_ok: false,
    total_envios_7d: 78,
    total_bounces_7d: 0,
    created_at: '2026-03-28T10:00:00.000Z',
  },
  {
    id: DOM_WARMUP,
    company_id: COMPANY_ALPHA,
    dominio: 'warmup.facebrasil.com.br',
    status: 'atencao',
    warming_phase: 'fase3',
    warming_dia: 65,
    bounce_rate: 2.8,
    envios_hoje: 22,
    limite_diario: 40,
    open_rate: 22.1,
    spam_complaint_rate: 0.15,
    blacklist: false,
    spf_ok: true,
    dkim_ok: true,
    dmarc_ok: true,
    total_envios_7d: 156,
    total_bounces_7d: 5,
    created_at: '2026-02-01T10:00:00.000Z',
  },
];

const initialAgents = [
  { id: 'a1', nome: 'Auditor de Domínios', time_numero: 1, time_nome: 'Guardiões do Mail Server', role: 'Auditoria de reputação e blacklist', status: 'online', tasks_ativas: 1, processadas_24h: 12, fila: 2, llm_primario: 'ollama' },
  { id: 'a2', nome: 'Gestor de Aquecimento', time_numero: 1, time_nome: 'Guardiões do Mail Server', role: 'Controle de fases e volume de aquecimento', status: 'online', tasks_ativas: 0, processadas_24h: 4, fila: 0, llm_primario: 'ollama' },
  { id: 'a3', nome: 'Monitor de Reputação', time_numero: 1, time_nome: 'Guardiões do Mail Server', role: 'SPF/DKIM/DMARC e MXToolbox checks', status: 'online', tasks_ativas: 1, processadas_24h: 8, fila: 1, llm_primario: 'ollama' },
  { id: 'a4', nome: 'Controlador de Rotação', time_numero: 1, time_nome: 'Guardiões do Mail Server', role: 'Round-robin ponderado de domínios', status: 'online', tasks_ativas: 0, processadas_24h: 6, fila: 0, llm_primario: 'ollama' },
  { id: 'a5', nome: 'Scraper Web', time_numero: 2, time_nome: 'Garimpeiros', role: 'Firecrawl para sites institucionais', status: 'processando', tasks_ativas: 2, processadas_24h: 45, fila: 8, llm_primario: 'ollama' },
  { id: 'a6', nome: 'Scraper Especializado', time_numero: 2, time_nome: 'Garimpeiros', role: 'Playwright para fontes com JavaScript', status: 'online', tasks_ativas: 1, processadas_24h: 22, fila: 3, llm_primario: 'ollama' },
  { id: 'a7', nome: 'Coletor CNPJ', time_numero: 2, time_nome: 'Garimpeiros', role: 'CNPJ.biz API para dados públicos', status: 'online', tasks_ativas: 0, processadas_24h: 38, fila: 5, llm_primario: 'ollama' },
  { id: 'a8', nome: 'Minerador LinkedIn', time_numero: 2, time_nome: 'Garimpeiros', role: 'Apify para perfis e empresas', status: 'online', tasks_ativas: 1, processadas_24h: 15, fila: 4, llm_primario: 'ollama' },
  { id: 'a9', nome: 'Agente de Gatilhos', time_numero: 2, time_nome: 'Garimpeiros', role: 'Monitora vagas, rodadas, expansões', status: 'offline', tasks_ativas: 0, processadas_24h: 0, fila: 0, llm_primario: 'ollama' },
  { id: 'a10', nome: 'Enriquecedor', time_numero: 3, time_nome: 'Analistas', role: 'Enriquecimento de dados de múltiplas fontes', status: 'online', tasks_ativas: 3, processadas_24h: 52, fila: 12, llm_primario: 'ollama' },
  { id: 'a11', nome: 'Validador de Email', time_numero: 3, time_nome: 'Analistas', role: 'ZeroBounce API — validação de email', status: 'online', tasks_ativas: 1, processadas_24h: 67, fila: 6, llm_primario: 'ollama' },
  { id: 'a12', nome: 'Analista de ICP', time_numero: 3, time_nome: 'Analistas', role: 'Matching de setor, porte, cargo, região', status: 'online', tasks_ativas: 2, processadas_24h: 48, fila: 9, llm_primario: 'ollama' },
  { id: 'a13', nome: 'Scorer', time_numero: 3, time_nome: 'Analistas', role: 'Modelo de IA com 12+ variáveis (Ollama → Claude)', status: 'processando', tasks_ativas: 1, processadas_24h: 41, fila: 7, llm_primario: 'ollama -> claude' },
  { id: 'a14', nome: 'Pesquisador de Contexto', time_numero: 4, time_nome: 'Redatores', role: 'Busca notícias, site e LinkedIn do lead', status: 'online', tasks_ativas: 2, processadas_24h: 18, fila: 4, llm_primario: 'ollama' },
  { id: 'a15', nome: 'Redator Principal', time_numero: 4, time_nome: 'Redatores', role: 'Geração de email personalizado via Claude', status: 'online', tasks_ativas: 1, processadas_24h: 14, fila: 3, llm_primario: 'claude' },
  { id: 'a16', nome: 'Revisor', time_numero: 4, time_nome: 'Redatores', role: 'Anti-spam, links, tom, tamanho', status: 'online', tasks_ativas: 0, processadas_24h: 13, fila: 2, llm_primario: 'ollama' },
  { id: 'a17', nome: 'Testador A/B', time_numero: 4, time_nome: 'Redatores', role: 'Geração de variantes de subject e CTA', status: 'offline', tasks_ativas: 0, processadas_24h: 0, fila: 0, llm_primario: 'ollama' },
  { id: 'a18', nome: 'Dispatcher', time_numero: 5, time_nome: 'Cadenciadores', role: 'Seleciona domínio saudável para envio', status: 'online', tasks_ativas: 1, processadas_24h: 32, fila: 5, llm_primario: 'ollama' },
  { id: 'a19', nome: 'Agendador', time_numero: 5, time_nome: 'Cadenciadores', role: 'Timing de cadência respeitando fuso', status: 'online', tasks_ativas: 0, processadas_24h: 28, fila: 3, llm_primario: 'ollama' },
  { id: 'a20', nome: 'Monitor de Respostas', time_numero: 5, time_nome: 'Cadenciadores', role: 'Detecta resposta positiva e dispara handoff', status: 'online', tasks_ativas: 1, processadas_24h: 8, fila: 1, llm_primario: 'ollama' },
  { id: 'a21', nome: 'Registrador', time_numero: 5, time_nome: 'Cadenciadores', role: 'Audit log de todos os envios', status: 'online', tasks_ativas: 0, processadas_24h: 32, fila: 0, llm_primario: 'ollama' },
  { id: 'a22', nome: 'Analista de Conversões', time_numero: 6, time_nome: 'Inteligência', role: 'Feedback loop deal.won/lost', status: 'online', tasks_ativas: 0, processadas_24h: 5, fila: 0, llm_primario: 'ollama' },
  { id: 'a23', nome: 'Otimizador de ICP', time_numero: 6, time_nome: 'Inteligência', role: 'Ajusta pesos e thresholds baseado em SQLs', status: 'online', tasks_ativas: 0, processadas_24h: 3, fila: 0, llm_primario: 'ollama' },
  { id: 'a24', nome: 'Refinador de Mensagens', time_numero: 6, time_nome: 'Inteligência', role: 'Identifica padrões de resposta por setor', status: 'online', tasks_ativas: 0, processadas_24h: 2, fila: 0, llm_primario: 'claude' },
] as Agent[];

const initialCampaigns: Campaign[] = [
  {
    id: CAMP_MKT_Q2,
    company_id: COMPANY_ALPHA,
    nome: 'Prospecção Marketing Agencies Q2',
    descricao: 'Campanha outbound para agências de marketing em SP com foco em performance digital.',
    icp_id: ICP_MKT_SP,
    status: 'ativa',
    total_leads: 142,
    leads_qualificados: 38,
    taxa_abertura: 29.5,
    taxa_clique: 4.2,
    taxa_resposta: 3.8,
    bounce_rate: 1.1,
    dominio_id: DOM_OUTREACH,
    cadencia_config: [
      { toque: 1, dia: 0, horario_inicio: '09:00', horario_fim: '11:00' },
      { toque: 2, dia: 4, horario_inicio: '14:00', horario_fim: '16:00' },
      { toque: 3, dia: 9, horario_inicio: '10:00', horario_fim: '12:00' },
      { toque: 4, dia: 16, horario_inicio: '09:00', horario_fim: '11:00' },
    ],
    created_at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: CAMP_ECOM,
    company_id: COMPANY_ALPHA,
    nome: 'E-commerce Outbound Maio',
    descricao: 'Campanha para e-commerces mid-market buscando canais de aquisição.',
    icp_id: ICP_ECOM,
    status: 'pausada',
    total_leads: 67,
    leads_qualificados: 12,
    taxa_abertura: 25.3,
    taxa_clique: 3.1,
    taxa_resposta: 2.9,
    bounce_rate: 2.4,
    dominio_id: DOM_MAIL,
    cadencia_config: [
      { toque: 1, dia: 0, horario_inicio: '09:00', horario_fim: '11:00' },
      { toque: 2, dia: 4, horario_inicio: '14:00', horario_fim: '16:00' },
      { toque: 3, dia: 9, horario_inicio: '10:00', horario_fim: '12:00' },
      { toque: 4, dia: 16, horario_inicio: '09:00', horario_fim: '11:00' },
    ],
    created_at: '2026-05-01T10:00:00.000Z',
  },
];

const initialEmailTemplates: EmailTemplate[] = [
  {
    id: 'tpl01', company_id: COMPANY_ALPHA, icp_id: ICP_MKT_SP, nome: 'Toque 1 — Contexto', toque: 1,
    subject_template: '{contato}, notei que a {empresa} está investindo em performance',
    body_template: 'Olá {contato},\n\nNotei que a {empresa} tem investido bastante em performance digital — {gatilho_especifico}.\n\nTrabalho com empresas do seu porte ajudando a escalar canais de aquisição sem depender exclusivamente de tráfego pago.\n\nTeria 15 minutos essa semana para conversar?\n\nAbraço,\nJulia — Facebrasil',
    variaveis: ['contato', 'empresa', 'cargo', 'gatilho_especifico'], ativo: true, created_at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'tpl02', company_id: COMPANY_ALPHA, icp_id: ICP_MKT_SP, nome: 'Toque 2 — Valor', toque: 2,
    subject_template: 'Re: {empresa} — conteúdo relevante para {setor}',
    body_template: 'Olá {contato},\n\nNa última mensagem mencionei sobre canais de aquisição. Compartilho um case recente de uma agência de SP que conseguiu reduzir o CAC em 35% com uma abordagem diferente.\n\nPosso te mostrar como funciona em 10 minutos?\n\nJulia — Facebrasil',
    variaveis: ['contato', 'empresa', 'setor'], ativo: true, created_at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'tpl03', company_id: COMPANY_ALPHA, icp_id: ICP_MKT_SP, nome: 'Toque 3 — Urgência', toque: 3,
    subject_template: '{empresa} e {empresa_similar} — resultados similares?',
    body_template: 'Olá {contato},\n\nUma empresa similar à {empresa} no setor de {setor} começou a trabalhar conosco recentemente. Os resultados foram rápidos.\n\nSe fizer sentido para vocês, posso compartilhar os números.\n\nJulia — Facebrasil',
    variaveis: ['contato', 'empresa', 'setor', 'empresa_similar'], ativo: true, created_at: '2026-04-01T10:00:00.000Z',
  },
  {
    id: 'tpl04', company_id: COMPANY_ALPHA, icp_id: ICP_MKT_SP, nome: 'Toque 4 — Breakup', toque: 4,
    subject_template: 'Entendo, {contato} — ficou a porta aberta',
    body_template: 'Olá {contato},\n\nEntendo que este não é o momento ideal. Fica aqui o meu contato para quando fizer sentido.\n\nBoa sorte com os projetos na {empresa}!\n\nJulia — Facebrasil',
    variaveis: ['contato', 'empresa'], ativo: true, created_at: '2026-04-01T10:00:00.000Z',
  },
];

const initialLeads = [
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', company_id: COMPANY_ALPHA,
    empresa_nome: 'TechBR Soluções', empresa_cnpj: '12.345.678/0001-90',
    contato_nome: 'Rafael Souza', contato_email: 'rafael@techbr.com.br', contato_cargo: 'Diretor de Marketing',
    contato_linkedin: 'https://linkedin.com/in/rafaelsouza', contato_telefone: '+55 11 98765-4321',
    setor: 'Marketing Digital', porte: 'Médio', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 45, faturamento: 4800000,
    fonte: 'linkedin', fonte_url: 'https://linkedin.com/company/techbr',
    etapa: 'cadencia', score: 87, icp_id: ICP_BR_EUA, email_valido: 'safe',
    presenca_digital: 'forte', site_url: 'https://techbr.com.br',
    site_tecnologias: ['React', 'HubSpot', 'Google Analytics'], site_pagespeed: 72, site_https: true, site_blog_ativo: true,
    headline: 'CMO | Growth Marketing | Ex-Googler',
    ultima_atividade: '2026-04-28', conexoes_comum: 5,
    notas: 'Empresa abriu escritório em Miami em jan/26. Interesse em expansão.',
    fontes_origem: ['linkedin', 'cnpj_biz'],
    score_detalhado: { aderencia_setor: 15, porte_empresa: 10, cargo_contato: 12, regiao: 8, tamanho_empresa: 7, qualidade_email: 10, presenca_digital: 8, atividade_recente: 7, engajamento_cadencia: 10, enriquecimento_completo: 5, fit_icp_keywords: 3, score_site: 5, bonus_total: 8, penalidade_total: 0 },
    created_by: USER_SYSTEM, created_at: '2026-04-15T10:00:00.000Z', updated_at: '2026-05-04T14:30:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', company_id: COMPANY_ALPHA,
    empresa_nome: 'AgênciaX Digital', contato_nome: 'Carolina Mendes',
    contato_email: 'carolina@agenciax.com.br', contato_cargo: 'Sócia-Diretora',
    setor: 'Agência de Publicidade', porte: 'Pequeno', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 18, fonte: 'google_maps', fonte_url: 'https://g.co/place/agenciax',
    etapa: 'sql_entregue', score: 92, icp_id: ICP_MKT_SP, email_valido: 'safe',
    presenca_digital: 'forte', site_url: 'https://agenciax.com.br',
    site_tecnologias: ['WordPress', 'Google Ads', 'Meta Pixel'], site_pagespeed: 65, site_https: true, site_blog_ativo: true,
    fontes_origem: ['google_maps', 'site'],
    created_by: USER_SYSTEM, created_at: '2026-04-10T08:00:00.000Z', updated_at: '2026-05-02T11:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa03', company_id: COMPANY_ALPHA,
    empresa_nome: 'E-commerce Beta', empresa_cnpj: '98.765.432/0001-10',
    contato_nome: 'Fernando Lima', contato_email: 'fernando@ecommercebeta.com',
    contato_cargo: 'Head of Growth', contato_telefone: '+55 21 91234-5678',
    setor: 'E-commerce', porte: 'Médio', regiao: 'RJ', cidade: 'Rio de Janeiro', estado: 'RJ',
    funcionarios: 120, faturamento: 15000000,
    fonte: 'cnpj_biz', etapa: 'redacao', score: 78, icp_id: ICP_ECOM, email_valido: 'safe',
    presenca_digital: 'media', site_url: 'https://ecommercebeta.com',
    site_tecnologias: ['Shopify', 'Google Analytics', 'Hotjar'], site_pagespeed: 58, site_https: true, site_blog_ativo: false,
    fontes_origem: ['cnpj_biz', 'site'],
    created_by: USER_SYSTEM, created_at: '2026-04-22T14:00:00.000Z', updated_at: '2026-05-05T09:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', company_id: COMPANY_ALPHA,
    empresa_nome: 'Gamma Solutions', contato_nome: 'Pedro Costa',
    contato_email: 'pedro@gamma.com.br', contato_cargo: 'CTO',
    setor: 'Tecnologia', porte: 'Pequeno', regiao: 'MG', cidade: 'Belo Horizonte', estado: 'MG',
    funcionarios: 30, fonte: 'site', fonte_url: 'https://gamma.com.br',
    etapa: 'scoring', score: 72, icp_id: ICP_BR_EUA, email_valido: 'safe',
    presenca_digital: 'media', site_url: 'https://gamma.com.br', site_https: true, site_blog_ativo: true,
    fontes_origem: ['site', 'linkedin'],
    created_by: USER_SYSTEM, created_at: '2026-04-20T10:00:00.000Z', updated_at: '2026-05-04T16:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa05', company_id: COMPANY_ALPHA,
    empresa_nome: 'Delta Retail', empresa_cnpj: '45.678.901/0001-23',
    contato_nome: 'Ana Oliveira', contato_email: 'ana@deltaretail.com',
    contato_cargo: 'Head of Growth', contato_telefone: '+55 41 99876-5432',
    setor: 'Retail', porte: 'Grande', regiao: 'PR', cidade: 'Curitiba', estado: 'PR',
    funcionarios: 200, faturamento: 30000000,
    fonte: 'linkedin', etapa: 'icp_matching', score: 0, icp_id: ICP_ECOM, email_valido: 'safe',
    fontes_origem: ['linkedin'],
    created_by: USER_SYSTEM, created_at: '2026-05-03T08:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa06', company_id: COMPANY_ALPHA,
    empresa_nome: 'PubliMax Engenharia', contato_nome: 'Roberto Almeida',
    contato_email: 'roberto@publimax.com.br', contato_cargo: 'Gerente Comercial',
    setor: 'Engenharia', porte: 'Médio', regiao: 'SP', cidade: 'Campinas', estado: 'SP',
    funcionarios: 85, fonte: 'cnpj_biz', etapa: 'email_validado', score: 0,
    email_valido: 'safe', fontes_origem: ['cnpj_biz'],
    created_by: USER_SYSTEM, created_at: '2026-05-04T11:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa07', company_id: COMPANY_ALPHA,
    empresa_nome: 'StartUp Nimbus', contato_nome: 'Luciana Ferreira',
    contato_email: 'lu@nimbus.io', contato_cargo: 'CEO',
    setor: 'SaaS', porte: 'Pequeno', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 12, fonte: 'linkedin', etapa: 'captado', score: 0,
    email_valido: 'nao_verificado', fontes_origem: ['linkedin'],
    created_by: USER_SYSTEM, created_at: '2026-05-05T09:30:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa08', company_id: COMPANY_ALPHA,
    empresa_nome: 'Brasa Foods LTDA', contato_nome: 'Marcos Pereira',
    contato_email: 'marcos@brasafoods.com', contato_cargo: 'Diretor',
    setor: 'Alimentação', porte: 'Pequeno', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 8, fonte: 'google_maps', etapa: 'descartado', score: 15,
    email_valido: 'catch_all', motivo_descarte: 'Fora do ICP — setor de alimentação',
    fontes_origem: ['google_maps'],
    created_by: USER_SYSTEM, created_at: '2026-05-02T13:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa09', company_id: COMPANY_ALPHA,
    empresa_nome: 'CloudMax Hosting', contato_nome: 'Diego Santos',
    contato_email: 'diego@cloudmax.com.br', contato_cargo: 'VP Engineering',
    setor: 'Tecnologia', porte: 'Médio', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 55, fonte: 'site', etapa: 'email_validado', score: 0,
    email_valido: 'invalido', motivo_descarte: 'Email inválido — descarte automático',
    fontes_origem: ['site'],
    created_by: USER_SYSTEM, created_at: '2026-05-01T15:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa10', company_id: COMPANY_ALPHA,
    empresa_nome: 'FitAcademia Premium', contato_nome: 'Juliana Rocha',
    contato_email: 'ju@fitacademia.com', contato_cargo: 'Gerente',
    setor: 'Fitness', porte: 'Pequeno', regiao: 'RJ', cidade: 'Rio de Janeiro', estado: 'RJ',
    funcionarios: 5, fonte: 'google_maps', etapa: 'descartado', score: 8,
    motivo_descarte: 'Score insuficiente e fora do ICP', fontes_origem: ['google_maps'],
    created_by: USER_SYSTEM, created_at: '2026-04-28T10:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11', company_id: COMPANY_ALPHA,
    empresa_nome: 'MediaPulse Digital', empresa_cnpj: '34.567.890/0001-45',
    contato_nome: 'Thiago Barbosa', contato_email: 'thiago@mediapulse.com.br',
    contato_cargo: 'Diretor de Marketing', contato_telefone: '+55 11 97654-3210',
    setor: 'Marketing Digital', porte: 'Médio', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 38, faturamento: 3200000,
    fonte: 'linkedin', etapa: 'cadencia', score: 81, icp_id: ICP_MKT_SP, email_valido: 'safe',
    presenca_digital: 'forte', site_url: 'https://mediapulse.com.br',
    site_tecnologias: ['Next.js', 'Google Ads', 'Meta Business'], site_pagespeed: 78, site_https: true, site_blog_ativo: true,
    fontes_origem: ['linkedin', 'site'],
    created_by: USER_SYSTEM, created_at: '2026-04-18T09:00:00.000Z', updated_at: '2026-05-03T10:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa12', company_id: COMPANY_ALPHA,
    empresa_nome: 'Orbita Labs', contato_nome: 'Camila Torres',
    contato_email: 'camila@orbitalabs.io', contato_cargo: 'Head de Expansão',
    setor: 'SaaS', porte: 'Médio', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 65, fonte: 'linkedin', etapa: 'scoring', score: 0, icp_id: ICP_BR_EUA,
    email_valido: 'safe', fontes_origem: ['linkedin'],
    created_by: USER_SYSTEM, created_at: '2026-05-05T07:45:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa13', company_id: COMPANY_ALPHA,
    empresa_nome: 'LojaVirtual Pro', empresa_cnpj: '67.890.123/0001-56',
    contato_nome: 'Renato Dias', contato_email: 'renato@lojavirtualpro.com.br',
    contato_cargo: 'Head de E-commerce', contato_telefone: '+55 41 36543-2109',
    setor: 'E-commerce', porte: 'Médio', regiao: 'PR', cidade: 'Curitiba', estado: 'PR',
    funcionarios: 42, faturamento: 8500000,
    fonte: 'cnpj_biz', etapa: 'icp_matching', score: 0, icp_id: ICP_ECOM,
    email_valido: 'safe', fontes_origem: ['cnpj_biz', 'site'],
    site_url: 'https://lojavirtualpro.com.br', site_https: true,
    created_by: USER_SYSTEM, created_at: '2026-05-04T16:30:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14', company_id: COMPANY_ALPHA,
    empresa_nome: 'BuzzMaker Social', contato_nome: 'Patricia Moraes',
    contato_email: 'patricia@buzzmaker.com', contato_cargo: 'Sócia-Diretora',
    setor: 'Marketing Digital', porte: 'Pequeno', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 15, fonte: 'linkedin', etapa: 'sql_entregue', score: 90, icp_id: ICP_MKT_SP,
    email_valido: 'safe', presenca_digital: 'forte', fontes_origem: ['linkedin'],
    created_by: USER_SYSTEM, created_at: '2026-04-05T10:00:00.000Z', updated_at: '2026-05-01T08:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa15', company_id: COMPANY_ALPHA,
    empresa_nome: 'ComércioImport Ltda', contato_nome: 'André Gomes',
    contato_email: 'andre@comercioimport.com', contato_cargo: 'Diretor Financeiro',
    setor: 'Importação', porte: 'Grande', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 180, fonte: 'cnpj_biz', etapa: 'descartado', score: 22,
    motivo_descarte: 'Fora do ICP — setor de importação não está nos targets', fontes_origem: ['cnpj_biz'],
    created_by: USER_SYSTEM, created_at: '2026-04-25T14:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa16', company_id: COMPANY_ALPHA,
    empresa_nome: 'Innovatech AI', contato_nome: 'Mariana Costa',
    contato_email: 'mariana@innovatech.ai', contato_cargo: 'CMO',
    setor: 'Tecnologia', porte: 'Médio', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 52, fonte: 'site', etapa: 'captado', score: 0,
    email_valido: 'nao_verificado', fontes_origem: ['site'],
    site_url: 'https://innovatech.ai', site_https: true, site_blog_ativo: true,
    created_by: USER_SYSTEM, created_at: '2026-05-06T08:15:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa17', company_id: COMPANY_ALPHA,
    empresa_nome: 'ConversionHub', contato_nome: 'Bruno Alves',
    contato_email: 'bruno@conversionhub.com.br', contato_cargo: 'Head de Growth',
    setor: 'Marketing Digital', porte: 'Pequeno', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 22, fonte: 'linkedin', etapa: 'redacao', score: 76, icp_id: ICP_MKT_SP,
    email_valido: 'safe', fontes_origem: ['linkedin'],
    created_by: USER_SYSTEM, created_at: '2026-04-28T11:00:00.000Z', updated_at: '2026-05-05T14:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa18', company_id: COMPANY_ALPHA,
    empresa_nome: 'BrasilConnect USA', empresa_cnpj: '23.456.789/0001-01',
    contato_nome: 'Rodrigo Martins', contato_email: 'rodrigo@brasilconnect.com',
    contato_cargo: 'CEO', contato_telefone: '+1 786 555-0199',
    setor: 'Serviços Digitais', porte: 'Médio', regiao: 'SP', cidade: 'São Paulo', estado: 'SP',
    funcionarios: 35, fonte: 'linkedin', etapa: 'cadencia', score: 84, icp_id: ICP_BR_EUA,
    email_valido: 'safe', fontes_origem: ['linkedin', 'site'],
    notas: 'Escritório em Fort Lauderdale. Interesse em publicidade para brasileiros nos EUA.',
    created_by: USER_SYSTEM, created_at: '2026-04-12T10:00:00.000Z', updated_at: '2026-05-04T08:00:00.000Z',
  },
] as Lead[];

const initialEmailCadencias: EmailCadencia[] = [
  { id: 'ec01', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', company_id: COMPANY_ALPHA, toque: 1, dominio_id: DOM_OUTREACH, status: 'aberto', subject: 'Rafael, notei que a TechBR está investindo em performance', body: '...', agente: 'redator-principal', enviado_em: '2026-05-04T09:15:00.000Z', aberto_em: '2026-05-04T14:22:00.000Z', created_at: '2026-05-04T09:15:00.000Z' },
  { id: 'ec02', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', company_id: COMPANY_ALPHA, toque: 2, dominio_id: DOM_OUTREACH, status: 'enviado', subject: 'Re: TechBR Soluções — conteúdo relevante para Marketing Digital', body: '...', agente: 'redator-principal', enviado_em: '2026-05-06T14:30:00.000Z', created_at: '2026-05-06T14:30:00.000Z' },
  { id: 'ec03', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', company_id: COMPANY_ALPHA, toque: 1, dominio_id: DOM_MAIL, status: 'respondido', subject: 'Carolina, como a AgênciaX pode escalar sem depender só de tráfego pago?', body: '...', agente: 'redator-principal', enviado_em: '2026-04-25T09:00:00.000Z', aberto_em: '2026-04-25T11:30:00.000Z', respondido_em: '2026-04-28T10:15:00.000Z', resposta_tipo: 'positiva', resposta_conteudo: 'Oi Julia, sim, tenho interesse. Podemos conversar quinta?', created_at: '2026-04-25T09:00:00.000Z' },
  { id: 'ec04', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', company_id: COMPANY_ALPHA, toque: 2, dominio_id: DOM_MAIL, status: 'respondido', subject: 'Re: AgênciaX — case de redução de CAC', body: '...', agente: 'redator-principal', enviado_em: '2026-04-29T14:00:00.000Z', respondido_em: '2026-04-30T09:00:00.000Z', resposta_tipo: 'positiva', resposta_conteudo: 'Perfeito, agenda pra quinta às 14h.', created_at: '2026-04-29T14:00:00.000Z' },
  { id: 'ec05', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11', company_id: COMPANY_ALPHA, toque: 1, dominio_id: DOM_OUTREACH, status: 'aberto', subject: 'Thiago, a MediaPulse pode escalar canais de aquisição?', body: '...', agente: 'redator-principal', enviado_em: '2026-05-01T09:45:00.000Z', aberto_em: '2026-05-01T16:20:00.000Z', created_at: '2026-05-01T09:45:00.000Z' },
  { id: 'ec06', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa11', company_id: COMPANY_ALPHA, toque: 2, dominio_id: DOM_OUTREACH, status: 'enviado', subject: 'Re: MediaPulse Digital — conteúdo relevante', body: '...', agente: 'redator-principal', enviado_em: '2026-05-03T14:10:00.000Z', created_at: '2026-05-03T14:10:00.000Z' },
  { id: 'ec07', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa14', company_id: COMPANY_ALPHA, toque: 1, dominio_id: DOM_MAIL, status: 'respondido', subject: 'Patricia, como a BuzzMaker pode escalar resultados?', body: '...', agente: 'redator-principal', enviado_em: '2026-04-20T09:30:00.000Z', respondido_em: '2026-04-22T11:00:00.000Z', resposta_tipo: 'positiva', resposta_conteudo: 'Interesse sim! Vamos conversar?', created_at: '2026-04-20T09:30:00.000Z' },
  { id: 'ec08', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa18', company_id: COMPANY_ALPHA, toque: 1, dominio_id: DOM_OUTREACH, status: 'aberto', subject: 'Rodrigo, a BrasilConnect pode alcançar brasileiros nos EUA?', body: '...', agente: 'redator-principal', enviado_em: '2026-05-02T10:00:00.000Z', aberto_em: '2026-05-02T15:45:00.000Z', created_at: '2026-05-02T10:00:00.000Z' },
];

const initialAgentLogs: AgentLog[] = [
  { id: 'log01', agent_nome: 'Scraper Web', tipo: 'agent_complete', mensagem: 'Captados 12 leads de sites institucionais — ciclo concluído', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa16', timestamp: '2026-05-06T08:30:00.000Z' },
  { id: 'log02', agent_nome: 'Coletor CNPJ', tipo: 'agent_complete', mensagem: 'Lote CNPJ.biz processado — 8 novas empresas filtradas', timestamp: '2026-05-06T08:15:00.000Z' },
  { id: 'log03', agent_nome: 'Validador de Email', tipo: 'agent_complete', mensagem: 'Lote de 15 emails validados — 12 safe, 2 catch_all, 1 invalido', timestamp: '2026-05-06T07:45:00.000Z' },
  { id: 'log04', agent_nome: 'Scorer', tipo: 'agent_progress', mensagem: 'Scoring em lote — 8 leads processados (avg score: 68)', timestamp: '2026-05-06T07:30:00.000Z' },
  { id: 'log05', agent_nome: 'Redator Principal', tipo: 'agent_complete', mensagem: 'Email personalizado gerado para lead aaaa04 — Gamma Solutions', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa04', timestamp: '2026-05-05T16:00:00.000Z' },
  { id: 'log06', agent_nome: 'Dispatcher', tipo: 'agent_complete', mensagem: 'Toque #2 enviado via outreach.facebrasil.com.br para aaaa01', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa01', timestamp: '2026-05-06T14:30:00.000Z' },
  { id: 'log07', agent_nome: 'Monitor de Respostas', tipo: 'alerta_novo', mensagem: 'Resposta positiva detectada — lead aaaa02 (AgênciaX Digital)', lead_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaa02', timestamp: '2026-04-28T10:15:00.000Z' },
  { id: 'log08', agent_nome: 'Monitor de Reputação', tipo: 'alerta_novo', mensagem: 'Domínio warmup.facebrasil.com.br — bounce rate subiu para 2.8%', timestamp: '2026-05-05T22:00:00.000Z' },
  { id: 'log09', agent_nome: 'Analista de ICP', tipo: 'agent_complete', mensagem: '5 leads classificados por ICP — 2 MKT_SP, 2 BR_EUA, 1 sem match', timestamp: '2026-05-06T06:00:00.000Z' },
  { id: 'log10', agent_nome: 'Gestor de Aquecimento', tipo: 'agent_complete', mensagem: 'novo.facebrasil.com.br avançou para fase 2 — dia 38', timestamp: '2026-05-05T00:00:00.000Z' },
  { id: 'log11', agent_nome: 'Minerador LinkedIn', tipo: 'agent_complete', mensagem: '15 perfis minerados via Apify — rate limit OK', timestamp: '2026-05-06T07:00:00.000Z' },
  { id: 'log12', agent_nome: 'Agente de Gatilhos', tipo: 'agent_failure', mensagem: 'Timeout ao verificar vagas — retry 1/3 agendado', timestamp: '2026-05-06T06:30:00.000Z' },
  { id: 'log13', agent_nome: 'Enriquecedor', tipo: 'agent_complete', mensagem: '10 leads enriquecidos com dados de site + LinkedIn', timestamp: '2026-05-06T07:15:00.000Z' },
  { id: 'log14', agent_nome: 'Registrador', tipo: 'agent_complete', mensagem: 'Audit log atualizado — 32 envios registrados hoje', timestamp: '2026-05-06T15:00:00.000Z' },
  { id: 'log15', agent_nome: 'Analista de Conversões', tipo: 'agent_complete', mensagem: 'Feedback loop: 2 deals won esta semana — reforçando padrões ICP', timestamp: '2026-05-06T08:00:00.000Z' },
];

const initialReports: Report[] = [
  {
    id: 'rpt01', company_id: COMPANY_ALPHA, periodo: '2026-W18', tipo: 'semanal',
    leads_captados: 87, leads_qualificados: 34, sqls_entregues: 5,
    taxa_resposta: 3.2, bounce_rate: 1.1, score_medio: 64,
    icp_perfomance: [
      { icp_id: ICP_BR_EUA, icp_nome: 'Empresas Brasileiras nos EUA', leads: 32, sqls: 2, taxa_conversao: 6.3 },
      { icp_id: ICP_MKT_SP, icp_nome: 'Marketing Agencies SP', leads: 38, sqls: 2, taxa_conversao: 5.3 },
      { icp_id: ICP_ECOM, icp_nome: 'E-commerce Mid-Market', leads: 17, sqls: 1, taxa_conversao: 5.9 },
    ],
    sugestoes: [
      'Aumentar peso da variável "presença digital" no scoring — leads com blog ativo convertem 2x mais',
      'Domínio warmup entrou em atenção — considerar pausa parcial até bounce rate < 2%',
      'ICP E-commerce tem menor volume mas maior taxa de conversão — aumentar captação CNPJ.biz',
      'Agente de Gatilhos offline há 2 dias — verificar integração com API de vagas',
    ],
    gerado_por: 'time6_inteligencia', created_at: '2026-05-05T08:00:00.000Z',
  },
  {
    id: 'rpt02', company_id: COMPANY_ALPHA, periodo: '2026-W17', tipo: 'semanal',
    leads_captados: 72, leads_qualificados: 28, sqls_entregues: 3,
    taxa_resposta: 2.8, bounce_rate: 1.4, score_medio: 61,
    icp_perfomance: [
      { icp_id: ICP_BR_EUA, icp_nome: 'Empresas Brasileiras nos EUA', leads: 28, sqls: 1, taxa_conversao: 3.6 },
      { icp_id: ICP_MKT_SP, icp_nome: 'Marketing Agencies SP', leads: 31, sqls: 2, taxa_conversao: 6.5 },
      { icp_id: ICP_ECOM, icp_nome: 'E-commerce Mid-Market', leads: 13, sqls: 0, taxa_conversao: 0 },
    ],
    sugestoes: [
      'Toque 3 (urgência leve) teve melhor taxa de resposta — testar mais referências a clientes similares',
      'ICP E-commerce sem SQLs — revisar score_minimo (70 pode estar alto demais para volume disponível)',
    ],
    gerado_por: 'time6_inteligencia', created_at: '2026-04-28T08:00:00.000Z',
  },
];

let leads: Lead[] = [];
let icps: ICP[] = [];
let domains: Domain[] = [];
let agents: Agent[] = [];
let campaigns: Campaign[] = [];
let emailCadencias: EmailCadencia[] = [];
let emailTemplates: EmailTemplate[] = [];
let agentLogs: AgentLog[] = [];
let reports: Report[] = [];

export function resetLeadsStoreForTests() {
  leads = clone(initialLeads);
  icps = clone(initialICPs);
  domains = clone(initialDomains);
  agents = clone(initialAgents);
  campaigns = clone(initialCampaigns);
  emailCadencias = clone(initialEmailCadencias);
  emailTemplates = clone(initialEmailTemplates);
  agentLogs = clone(initialAgentLogs);
  reports = clone(initialReports);
}

resetLeadsStoreForTests();

export function getLeadsTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, user: USER_SYSTEM };
}

export function contextFromHeaders(headers: Headers): LeadsRequestContext | Response {
  const userId = headers.get('x-user-id');
  const companyId = headers.get('x-company-id') ?? headers.get('x-workspace-id') ?? headers.get('x-empresa-id');
  const moduleSource = headers.get('x-module-source') ?? 'fbr-portal';

  if (!userId || !companyId) {
    return Response.json({ code: 'UNAUTHORIZED_CONTEXT', message: 'X-User-Id and company headers are required.' }, { status: 401 });
  }

  const companyCheck = z.string().uuid().safeParse(companyId);
  if (!companyCheck.success) {
    return Response.json({ code: 'INVALID_COMPANY', message: 'Company header must be a valid UUID.' }, { status: 422 });
  }

  return { userId, companyId, moduleSource };
}

export function parseLeadsQuery(url: string): LeadsQuery {
  const params = new URL(url).searchParams;
  const rawEtapa = params.getAll('etapa').flatMap((item) => item.split(',')).filter(Boolean);
  const rawFonte = params.getAll('fonte').flatMap((item) => item.split(',')).filter(Boolean);
  const rawEmail = params.getAll('email_valido').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return LeadsQuerySchema.parse({
      busca: params.get('busca') ?? undefined,
      etapa: rawEtapa.length > 0 ? rawEtapa : undefined,
      fonte: rawFonte.length > 0 ? rawFonte : undefined,
      icp_id: params.get('icp_id') ?? undefined,
      score_min: params.get('score_min') ?? undefined,
      score_max: params.get('score_max') ?? undefined,
      email_valido: rawEmail.length > 0 ? rawEmail : undefined,
      data_inicio: params.get('data_inicio') ?? undefined,
      data_fim: params.get('data_fim') ?? undefined,
      cidade: params.get('cidade') ?? undefined,
      estado: params.get('estado') ?? undefined,
      page: params.get('page') ?? undefined,
      page_size: params.get('page_size') ?? undefined,
      sort_by: params.get('sort_by') ?? undefined,
      sort_dir: params.get('sort_dir') ?? undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listLeads(context: LeadsRequestContext, query: Partial<LeadsQuery> = {}) {
  const parsed = LeadsQuerySchema.parse(query);

  const filtered = leads.filter((lead) => {
    if (lead.company_id !== context.companyId) return false;
    if (parsed.busca) {
      const q = parsed.busca.toLowerCase();
      if (!lead.contato_nome.toLowerCase().includes(q) && !lead.empresa_nome.toLowerCase().includes(q) && !(lead.contato_email?.toLowerCase().includes(q))) return false;
    }
    if (parsed.etapa && !parsed.etapa.includes(lead.etapa)) return false;
    if (parsed.fonte && !parsed.fonte.includes(lead.fonte)) return false;
    if (parsed.icp_id && lead.icp_id !== parsed.icp_id) return false;
    if (parsed.score_min && lead.score < parsed.score_min) return false;
    if (parsed.score_max && lead.score > parsed.score_max) return false;
    if (parsed.email_valido && !parsed.email_valido.includes(lead.email_valido)) return false;
    if (parsed.data_inicio && (lead.created_at ?? '') < parsed.data_inicio) return false;
    if (parsed.data_fim && (lead.created_at ?? '') > parsed.data_fim + 'T23:59:59.999Z') return false;
    if (parsed.cidade && lead.cidade?.toLowerCase() !== parsed.cidade.toLowerCase()) return false;
    if (parsed.estado && lead.estado?.toLowerCase() !== parsed.estado.toLowerCase()) return false;
    return true;
  });

  filtered.sort((left, right) => {
    const direction = parsed.sort_dir === 'asc' ? 1 : -1;
    const leftValue = left[parsed.sort_by] ?? '';
    const rightValue = right[parsed.sort_by] ?? '';
    return leftValue > rightValue ? direction : leftValue < rightValue ? -direction : 0;
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

export function getLead(context: LeadsRequestContext, id: string) {
  const lead = leads.find((l) => l.id === id && l.company_id === context.companyId);
  if (!lead) throw new LeadsValidationError('Lead não encontrado.', 404);
  return lead;
}

export function createLead(context: LeadsRequestContext, data: unknown) {
  const input = parseJsonObject(data);
  try {
    const validated = LeadSchema.parse({
      ...input,
      company_id: context.companyId,
      created_by: context.userId,
      created_at: now(),
      updated_at: now(),
      id: crypto.randomUUID(),
    });
    leads.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function updateLead(context: LeadsRequestContext, id: string, data: unknown) {
  const lead = leads.find((l) => l.id === id && l.company_id === context.companyId);
  if (!lead) throw new LeadsValidationError('Lead não encontrado.', 404);
  const input = parseJsonObject(data);
  try {
    const validated = LeadSchema.partial().parse(input);
    Object.assign(lead, validated, { updated_at: now() });
    return lead;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function descartarLead(context: LeadsRequestContext, id: string, motivo: string) {
  const lead = leads.find((l) => l.id === id && l.company_id === context.companyId);
  if (!lead) throw new LeadsValidationError('Lead não encontrado.', 404);
  if (!motivo || motivo.trim().length === 0) throw new LeadsValidationError('Motivo é obrigatório para descarte.', 400);
  lead.etapa = 'descartado';
  lead.motivo_descarte = motivo;
  lead.updated_at = now();
  return lead;
}

export function avancarEtapa(context: LeadsRequestContext, id: string, etapa: string) {
  const lead = leads.find((l) => l.id === id && l.company_id === context.companyId);
  if (!lead) throw new LeadsValidationError('Lead não encontrado.', 404);
  const parsedEtapa = LeadEtapaSchema.safeParse(etapa);
  if (!parsedEtapa.success) throw new LeadsValidationError('Etapa inválida.', 422);
  if (lead.etapa === 'descartado') throw new LeadsValidationError('Lead descartado não pode avançar.', 422);
  lead.etapa = parsedEtapa.data;
  lead.updated_at = now();
  return lead;
}

export function listICPs(context: LeadsRequestContext) {
  return icps.filter((icp) => icp.company_id === context.companyId);
}

export function createICP(context: LeadsRequestContext, data: unknown) {
  const input = parseJsonObject(data);
  try {
    const validated = ICPSchema.parse({
      ...input,
      company_id: context.companyId,
      created_at: now(),
      id: crypto.randomUUID(),
    });
    const activeCount = icps.filter((i) => i.company_id === context.companyId && i.ativo).length;
    if (validated.ativo && activeCount >= 5) {
      throw new LeadsValidationError('Limite de 5 ICPs ativos atingido.', 422);
    }
    icps.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function updateICP(context: LeadsRequestContext, id: string, data: unknown) {
  const icp = icps.find((i) => i.id === id && i.company_id === context.companyId);
  if (!icp) throw new LeadsValidationError('ICP não encontrado.', 404);
  const input = parseJsonObject(data);
  try {
    const validated = ICPSchema.partial().parse(input);
    Object.assign(icp, validated);
    return icp;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listDomains(context: LeadsRequestContext) {
  return domains.filter((d) => d.company_id === context.companyId);
}

export function getDomain(context: LeadsRequestContext, id: string) {
  const domain = domains.find((d) => d.id === id && d.company_id === context.companyId);
  if (!domain) throw new LeadsValidationError('Domínio não encontrado.', 404);
  return domain;
}

export function updateDomain(context: LeadsRequestContext, id: string, data: unknown) {
  const domain = domains.find((d) => d.id === id && d.company_id === context.companyId);
  if (!domain) throw new LeadsValidationError('Domínio não encontrado.', 404);
  const input = parseJsonObject(data);
  try {
    const validated = DomainSchema.partial().parse(input);
    Object.assign(domain, validated);
    return domain;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listAgents(companyId?: string) {
  if (companyId) return agents.filter(() => true);
  return agents;
}

export function toggleAgentPause(agentNome: string) {
  const agent = agents.find((a) => a.nome === agentNome);
  if (!agent) throw new LeadsValidationError('Agente não encontrado.', 404);
  agent.paused = !agent.paused;
  if (agent.paused) agent.status = 'offline';
  else agent.status = 'online';
  return agent;
}

export function listAgentLogs(limit = 50) {
  return agentLogs.slice(-limit).reverse();
}

export function listCampaigns(context: LeadsRequestContext) {
  return campaigns.filter((c) => c.company_id === context.companyId);
}

export function createCampaign(context: LeadsRequestContext, data: unknown) {
  const input = parseJsonObject(data);
  try {
    const validated = CampaignSchema.parse({
      ...input,
      company_id: context.companyId,
      created_at: now(),
      id: crypto.randomUUID(),
    });
    campaigns.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function listEmailCadencias(context: LeadsRequestContext, leadId?: string) {
  const result = emailCadencias.filter((ec) => ec.company_id === context.companyId);
  if (leadId) return result.filter((ec) => ec.lead_id === leadId);
  return result;
}

export function listEmailTemplates(context: LeadsRequestContext, icpId?: string) {
  const result = emailTemplates.filter((t) => t.company_id === context.companyId);
  if (icpId) return result.filter((t) => t.icp_id === icpId);
  return result;
}

export function handoffToClick(context: LeadsRequestContext, leadId: string): HandoffPayload {
  const lead = leads.find((l) => l.id === leadId && l.company_id === context.companyId);
  if (!lead) throw new LeadsValidationError('Lead não encontrado.', 404);

  const cadenciaItems = emailCadencias.filter((ec) => ec.lead_id === leadId);
  const enviados = cadenciaItems.filter((ec) => ec.status !== 'bounce').length;
  const aberturas = cadenciaItems.filter((ec) => ec.status === 'aberto' || ec.status === 'respondido' || ec.status === 'clicou').length;
  const respostas = cadenciaItems.filter((ec) => ec.status === 'respondido').length;

  const payload: HandoffPayload = {
    event: 'sql_handoff',
    lead: {
      lead_id: lead.id!,
      name: lead.contato_nome,
      role: lead.contato_cargo,
      company: lead.empresa_nome,
      cnpj: lead.empresa_cnpj,
      email: lead.contato_email!,
      score: lead.score,
      source: lead.fonte,
      icp_match: icps.find((i) => i.id === lead.icp_id)?.nome,
      enrichment_notes: lead.notas,
      interaction_summary: `${enviados} e-mails enviados. ${aberturas} aberturas. ${respostas} respostas.`,
    },
    action: {
      create_deal: true,
      notify_user_id: 'usr_julia_manager',
      post_to_channel: 'chn_leads_qualificados',
    },
  };

  try {
    HandoffPayloadSchema.parse(payload);
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }

  lead.etapa = 'sql_entregue';
  lead.updated_at = now();

  return payload;
}

export function listReports(context: LeadsRequestContext) {
  return reports.filter((r) => r.company_id === context.companyId);
}

export function getDashboardKpis(context: LeadsRequestContext): DashboardKpis {
  const companyLeads = leads.filter((l) => l.company_id === context.companyId);
  const todayStr = today();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekAgoStr = weekAgo.toISOString();

  const leadsCaptadosHoje = companyLeads.filter((l) => (l.created_at ?? '').startsWith(todayStr)).length;
  const leadsSemana = companyLeads.filter((l) => (l.created_at ?? '') >= weekAgoStr).length;
  const validados = companyLeads.filter((l) => l.email_valido === 'safe').length;
  const comEmail = companyLeads.filter((l) => l.email_valido !== 'nao_verificado').length;
  const taxaValidacao = comEmail > 0 ? Number(((validados / comEmail) * 100).toFixed(1)) : 0;

  const companyCadencias = emailCadencias.filter((ec) => ec.company_id === context.companyId);
  const emailsEnviadosHoje = companyCadencias.filter((ec) => (ec.enviado_em ?? '').startsWith(todayStr)).length;
  const bounces = companyCadencias.filter((ec) => ec.status === 'bounce').length;
  const totalCadencia = companyCadencias.length;
  const bounceRate = totalCadencia > 0 ? Number(((bounces / totalCadencia) * 100).toFixed(1)) : 0;

  const sqlsEntregues = companyLeads.filter((l) => l.etapa === 'sql_entregue').length;
  const scoreMedio = companyLeads.length > 0 ? Number((companyLeads.reduce((sum, l) => sum + l.score, 0) / companyLeads.length).toFixed(0)) : 0;

  const leadsPorEtapa = Object.entries(
    companyLeads.reduce((acc, l) => { acc[l.etapa] = (acc[l.etapa] ?? 0) + 1; return acc; }, {} as Record<string, number>),
  ).map(([etapa, count]) => ({ etapa, count }));

  const leadsPorFonte = Object.entries(
    companyLeads.reduce((acc, l) => { acc[l.fonte] = (acc[l.fonte] ?? 0) + 1; return acc; }, {} as Record<string, number>),
  ).map(([fonte, count]) => ({ fonte, count }));

  const leadsPorIcp = Object.entries(
    companyLeads.reduce((acc, l) => {
      const icpName = icps.find((i) => i.id === l.icp_id)?.nome ?? 'Sem ICP';
      acc[icpName] = (acc[icpName] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  ).map(([icp, count]) => ({ icp, count }));

  const companyDomains = domains.filter((d) => d.company_id === context.companyId);
  const saudeDominios = companyDomains.map((d) => ({
    dominio: d.dominio,
    status: d.status,
    bounce_rate: d.bounce_rate,
    envios_hoje: d.envios_hoje,
    limite_diario: d.limite_diario,
    percentual_utilizado: d.limite_diario > 0 ? Number(((d.envios_hoje / d.limite_diario) * 100).toFixed(0)) : 0,
  }));

  const ultimosSqls = companyLeads
    .filter((l) => l.etapa === 'sql_entregue')
    .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? ''))
    .slice(0, 5)
    .map((l) => ({
      lead_id: l.id!,
      contato_nome: l.contato_nome,
      empresa_nome: l.empresa_nome,
      score: l.score,
      icp_nome: icps.find((i) => i.id === l.icp_id)?.nome,
      entregue_em: l.updated_at ?? l.created_at ?? '',
    }));

  return {
    leads_captados_hoje: leadsCaptadosHoje,
    leads_semana: leadsSemana,
    taxa_validacao: taxaValidacao,
    emails_enviados_hoje: emailsEnviadosHoje,
    bounce_rate: bounceRate,
    sqls_entregues: sqlsEntregues,
    score_medio: scoreMedio,
    total_leads: companyLeads.length,
    leads_por_etapa: leadsPorEtapa,
    leads_por_fonte: leadsPorFonte,
    leads_por_icp: leadsPorIcp,
    saude_dominios: saudeDominios,
    ultimos_sqls: ultimosSqls,
  };
}
