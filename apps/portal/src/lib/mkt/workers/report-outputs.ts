import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import type { ProjectMarketingData } from '../importer';

const openai = createOpenAI({
  apiKey: process.env.ZAI_API_KEY || process.env.OPENAI_API_KEY || 'dummy',
  baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

function extractField(value: string | { content: string } | undefined | null): string {
  if (!value) return '';
  return typeof value === 'string' ? value : value.content;
}

function safeField<T>(value: T | undefined | null, fallback: T): T {
  return value ?? fallback;
}

// ── Output 1: Briefing de campanha ──────────────────────────────────

const BriefingSchema = z.object({
  headline: z.string().min(1),
  subheadline: z.string().min(1),
  tom_de_voz: z.string().min(1),
  argumento_principal: z.string().min(1),
  copy: z.object({
    headline_primaria: z.string(),
    headline_secundaria: z.string(),
    cta_principal: z.string(),
    cta_secundario: z.string(),
    body_copy_resumo: z.string(),
  }),
  visual_direction: z.object({
    mood: z.string(),
    paleta_sugerida: z.array(z.string()),
    referencias_visuais: z.array(z.string()),
    evitar: z.array(z.string()),
  }),
  publico: z.object({
    segmentacao_meta_ads: z.object({
      idade_min: z.number(),
      idade_max: z.number(),
      interesses: z.array(z.string()),
      localizacao: z.string().optional(),
    }),
    segmentacao_google_ads: z.object({
      palavras_chave_intencao: z.array(z.string()),
      match_types_sugeridos: z.array(z.enum(['exact', 'phrase', 'broad'])),
      negative_keywords: z.array(z.string()),
      audiencias_similares: z.array(z.string()),
    }),
  }),
});

export type BriefingOutput = z.infer<typeof BriefingSchema>;

// ── Output 2: Plano de mídia ────────────────────────────────────────

const PlanoMidiaSchema = z.object({
  canais: z.array(z.object({
    canal: z.string(),
    alocacao_percentual: z.number().min(0).max(100),
    prioridade_original: z.string(),
    formato_anuncio: z.string(),
    kpi_primario: z.string(),
    kpi_meta: z.string(),
    instrucoes_configuracao: z.array(z.string()),
    match_types: z.array(z.string()).optional(),
    negative_keywords: z.array(z.string()).optional(),
  })),
  budget_total_sugerido: z.string(),
  observacoes: z.array(z.string()),
});

export type PlanoMidiaOutput = z.infer<typeof PlanoMidiaSchema>;

// ── Output 3: Sprint de tarefas (FBR-Click) ────────────────────────

const SprintTarefasSchema = z.object({
  tarefas: z.array(z.object({
    titulo: z.string(),
    descricao: z.string(),
    prazo: z.string(),
    prioridade: z.enum(['alta', 'media', 'baixa']),
    metrica_conclusao: z.string(),
    tags: z.array(z.string()),
    project_id_tag: z.string(),
  })),
  sprint_duracao_semanas: z.number(),
  responsavel_sugerido: z.string(),
});

export type SprintTarefasOutput = z.infer<typeof SprintTarefasSchema>;

// ── Output 4: Funil de captação ─────────────────────────────────────

const FunilCaptacaoSchema = z.object({
  assets: z.array(z.object({
    nome_lead_magnet: z.string(),
    copy_cta: z.string(),
    landing_page: z.object({
      headline: z.string(),
      beneficio_principal: z.string(),
      campos_formulario: z.array(z.string()),
    }),
  })),
  etapas_funil: z.array(z.object({
    nome_etapa: z.string(),
    trigger_ativacao: z.string(),
    mensagem: z.string(),
    canal_entrega: z.enum(['email', 'retargeting', 'whatsapp', 'sms', 'push']),
    sequencia_dias: z.array(z.number()),
  })),
});

export type FunilCaptacaoOutput = z.infer<typeof FunilCaptacaoSchema>;

// ── Output 5: OKRs do ciclo ─────────────────────────────────────────

const OKRsSchema = z.object({
  objective: z.string(),
  key_results: z.array(z.object({
    descricao: z.string(),
    tipo: z.enum(['alcance', 'conversao', 'leads', 'trial_to_paid', 'engajamento']),
    canal_referencia: z.string().optional(),
    valor_base: z.number().default(0),
    meta: z.number(),
    unidade: z.string(),
    justificativa_meta: z.string(),
  })),
  ciclo_duracao: z.string(),
});

export type OKRsOutput = z.infer<typeof OKRsSchema>;

// ── Orquestrador: gera todos os 5 outputs ───────────────────────────

export interface ReportOutputs {
  briefing: BriefingOutput;
  plano_midia: PlanoMidiaOutput;
  sprint: SprintTarefasOutput;
  funil: FunilCaptacaoOutput;
  okrs: OKRsOutput;
}

export async function generateReportOutputs(
  data: ProjectMarketingData,
  projectId: string,
): Promise<ReportOutputs> {
  const ms = data.marketing_strategy;
  const lgs = data.lead_generation_strategy;

  const uvp = extractField(ms.value_proposition);
  const primary = safeField(ms.target_audience?.primary, '');
  const secondary = safeField(ms.target_audience?.secondary, '');
  const approach = safeField(ms.approach_strategy, '');
  const channels = safeField(ms.channels, []);
  const tactics = safeField(ms.tactics, []);
  const leadMagnets = safeField(lgs?.lead_magnets, []);
  const conversionTactics = safeField(lgs?.conversion_tactics, []);

  const [briefing, planoMidia, sprint, funil, okrs] = await Promise.all([
    generateBriefing(uvp, primary, secondary, approach),
    generatePlanoMidia(channels),
    generateSprint(tactics, projectId),
    generateFunil(leadMagnets, conversionTactics, uvp, primary),
    generateOKRs(approach, channels, leadMagnets, conversionTactics),
  ]);

  return { briefing, plano_midia: planoMidia, sprint, funil, okrs };
}

async function generateBriefing(
  uvp: string,
  primary: string,
  secondary: string,
  approach: string,
): Promise<BriefingOutput> {
  if (!uvp && !primary && !approach) {
    return {
      headline: 'Briefing indisponível — dados insuficientes',
      subheadline: '',
      tom_de_voz: '',
      argumento_principal: '',
      copy: {
        headline_primaria: '',
        headline_secundaria: '',
        cta_principal: '',
        cta_secundario: '',
        body_copy_resumo: '',
      },
      visual_direction: {
        mood: '',
        paleta_sugerida: [],
        referencias_visuais: [],
        evitar: [],
      },
      publico: {
        segmentacao_meta_ads: { idade_min: 18, idade_max: 65, interesses: [], localizacao: undefined },
        segmentacao_google_ads: { palavras_chave_intencao: [], match_types_sugeridos: [], negative_keywords: [], audiencias_similares: [] },
      },
    };
  }

  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: BriefingSchema,
    prompt: `Você é um estrategista de marketing sênior. Gere um briefing de campanha estruturado.

ENTRADA:
- Proposta de valor: ${uvp}
- Público primário: ${primary}
- Público secundário: ${secondary}
- Estratégia de abordagem: ${approach}

REGRAS:
1. Extraia a promessa central da value_proposition e formate como headline + subheadline prontos para uso criativo.
2. A partir do público primário, gere critérios de segmentação diretamente aplicáveis no Meta Ads (idade, interesses) e Google Ads (palavras-chave de intenção, match types, negative keywords).
3. A partir da estratégia de abordagem, extraia o tom de voz e o argumento principal.
4. O briefing deve ter seções separadas para COPY, VISUAL DIRECTION e PÚBLICO — não como narrativa.
5. Produza em português brasileiro.`,
  });

  return object;
}

async function generatePlanoMidia(
  channels: Array<{ name: string; description: string; priority: string }>,
): Promise<PlanoMidiaOutput> {
  if (!channels || channels.length === 0) {
    return { canais: [], budget_total_sugerido: '0', observacoes: ['Nenhum canal fornecido'] };
  }

  const priorityWeight: Record<string, number> = { High: 40, Medium: 25, Low: 10 };
  const totalWeight = channels.reduce((sum, ch) => sum + (priorityWeight[ch.priority] || 10), 0);

  const preAllocated = channels.map((ch) => ({
    canal: ch.name,
    alocacao_bruta: priorityWeight[ch.priority] || 10,
    descricao: ch.description,
    prioridade: ch.priority,
  }));

  const normalizedAllocations = preAllocated.map((ch) => ({
    ...ch,
    alocacao_percentual: Math.round((ch.alocacao_bruta / totalWeight) * 100),
  }));

  const residual = 100 - normalizedAllocations.reduce((s, c) => s + c.alocacao_percentual, 0);
  if (residual !== 0 && normalizedAllocations.length > 0) {
    normalizedAllocations[0]!.alocacao_percentual += residual;
  }

  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: PlanoMidiaSchema,
    prompt: `Você é um planejador de mídia sênior. Gere um plano de mídia detalhado.

ENTRADA - Canais com alocação pré-calculada:
${normalizedAllocations.map((ch) => `- ${ch.canal} (Prioridade: ${ch.prioridade}, Alocação: ${ch.alocacao_percentual}%, Descrição: ${ch.descricao})`).join('\n')}

REGRAS:
1. Para cada canal, mantenha a alocação percentual fornecida. 
2. Recomende o formato de anúncio mais adequado por canal.
3. Defina um KPI primário e uma meta realista por canal.
4. Converta a descrição de cada canal em instruções de configuração de campanha. Exemplo: "Focar em palavras-chave de intenção de compra" vira lista de match types e negative keywords sugeridos.
5. Sugira um budget total mensal em formato de string (ex: "R$ 5.000 - R$ 10.000").
6. Produza em português brasileiro.`,
  });

  return object;
}

async function generateSprint(
  tactics: Array<{ tactic: string; description: string; timeline: string }>,
  projectId: string,
): Promise<SprintTarefasOutput> {
  if (!tactics || tactics.length === 0) {
    return { tarefas: [], sprint_duracao_semanas: 0, responsavel_sugerido: '' };
  }

  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: SprintTarefasSchema,
    prompt: `Você é um gerente de projetos de marketing. Gere um sprint de tarefas para o FBR-Click.

ENTRADA - Táticas:
${tactics.map((t) => `- Tática: ${t.tactic} | Descrição: ${t.description} | Timeline: ${t.timeline}`).join('\n')}

PROJECT_ID: ${projectId}

REGRAS:
1. Cada tática gera UMA tarefa com: título = tactic, descrição = description.
2. O prazo é derivado do campo timeline (converta "Mês 1" em data concreta a partir de hoje).
3. A métrica de conclusão deve ser inferida pelo contexto da tática (ex: "Webinar realizado com X inscritos", "Landing page publicada com taxa de conversão > 2%").
4. O project_id entra como tag de rastreabilidade em CADA tarefa.
5. Sugira uma duração total do sprint em semanas.
6. Sugira um responsável padrão para as tarefas.
7. Produza em português brasileiro.`,
  });

  return object;
}

async function generateFunil(
  leadMagnets: Array<{ name: string; description: string }>,
  conversionTactics: Array<{ tactic: string; description: string }>,
  uvp: string,
  primary: string,
): Promise<FunilCaptacaoOutput> {
  if ((!leadMagnets || leadMagnets.length === 0) && (!conversionTactics || conversionTactics.length === 0)) {
    return { assets: [], etapas_funil: [] };
  }

  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: FunilCaptacaoSchema,
    prompt: `Você é um especialista em funis de captação. Gere um funil completo.

ENTRADA:
- UVP: ${uvp}
- Público: ${primary}
- Lead Magnets: ${leadMagnets.map((lm) => `${lm.name}: ${lm.description}`).join('; ') || 'Nenhum fornecido'}
- Táticas de conversão: ${conversionTactics.map((ct) => `${ct.tactic}: ${ct.description}`).join('; ') || 'Nenhuma fornecida'}

REGRAS:
1. Cada lead magnet vira um asset com: nome, copy de CTA, e estrutura de landing page mínima (headline, benefício, campos de formulário).
2. Cada tática de conversão vira uma etapa do funil com: trigger de ativação, mensagem, canal de entrega (email, retargeting, WhatsApp conforme contexto), e sequência de dias.
3. O funil deve ter fluxo lógico: topo (atração) → meio (engajamento) → fundo (conversão).
4. Produza em português brasileiro.`,
  });

  return object;
}

async function generateOKRs(
  approach: string,
  channels: Array<{ name: string; priority: string }>,
  leadMagnets: Array<{ name: string }>,
  conversionTactics: Array<{ tactic: string }>,
): Promise<OKRsOutput> {
  const activeChannels = channels.map((c) => c.name);
  const magnetNames = leadMagnets.map((m) => m.name);
  const tacticNames = conversionTactics.map((t) => t.tactic);

  if (!approach && activeChannels.length === 0 && magnetNames.length === 0) {
    return { objective: '', key_results: [], ciclo_duracao: '30 dias' };
  }

  const { object } = await generateObject({
    model: openai(process.env.LLM_MODEL || 'gpt-4o'),
    schema: OKRsSchema,
    prompt: `Você é um consultor de OKRs de marketing. Gere OKRs para o ciclo.

ENTRADA:
- Estratégia: ${approach}
- Canais ativos: ${activeChannels.join(', ') || 'Nenhum'}
- Lead magnets: ${magnetNames.join(', ') || 'Nenhum'}
- Táticas de conversão: ${tacticNames.join(', ') || 'Nenhuma'}

REGRAS:
1. Proponha UM Objective derivado da approach_strategy.
2. Proponha 2 a 4 Key Results mensuráveis:
   - Um por canal ativo (alcance/impressões).
   - Um por lead magnet (conversão/leads captados).
   - Um por tática de conversão (taxa de conversão ou trial → paid).
3. Cada KR tem valor-base zero e meta derivada de benchmarks do setor.
4. A meta deve ser ajustável manualmente antes de aprovar.
5. Defina a duração do ciclo (ex: "30 dias", "90 dias").
6. Produza em português brasileiro.`,
  });

  return object;
}