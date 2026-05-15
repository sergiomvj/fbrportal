import type {
  MktCalendarItem,
  MktChatMessage,
  MktCopyVariant,
  MktDiagnostico,
  MktEstrategia,
  MktEstrategiaVersao,
  MktLeadMagnet,
  MktRoadmapTask,
} from './types';

export interface MktChatContext {
  estrategia: MktEstrategia;
  diagnostico: MktDiagnostico | null;
  versao: MktEstrategiaVersao | null;
  copy: MktCopyVariant[];
  leadMagnets: MktLeadMagnet[];
  calendario: MktCalendarItem[];
  roadmap: MktRoadmapTask[];
  history: MktChatMessage[];
}

export interface MktChatFallbackInput {
  context: MktChatContext;
  message: string;
}

export type MktChatRefinementIntent =
  | 'tone_adjustment'
  | 'budget_redistribution'
  | 'date_refinement'
  | 'strategy_parameter_tuning'
  | 'copy_variant_generation';

export function selectChatContextWindow(messages: MktChatMessage[], limit = 20): MktChatMessage[] {
  return messages.slice(Math.max(messages.length - limit, 0));
}

export function normalizeMktChatHistory(messages: MktChatMessage[]): MktChatMessage[] {
  return [...messages].sort((left, right) => {
    const leftTime = Date.parse(left.created_at ?? '');
    const rightTime = Date.parse(right.created_at ?? '');

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
    if (Number.isNaN(leftTime)) return 1;
    if (Number.isNaN(rightTime)) return -1;

    return leftTime - rightTime;
  });
}

export function buildMktChatSystemPrompt(context: MktChatContext): string {
  const strategy = context.versao?.conteudo;
  const calendarSummary = summarizeCalendar(context.calendario);
  const roadmapSummary = summarizeRoadmap(context.roadmap);
  const historySummary = summarizeHistory(context.history);
  const inconsistencyFlags = detectMktChatInconsistencyFlags(context);
  const suggestions = buildMktChatProactiveSuggestions(context);
  const operationalDigest = buildMktChatOperationalDigest(context);

  return [
    'Voce e o assistente contextual do FBR-MKT.',
    'Responda com orientacao pratica, preserve a versao historica da estrategia e proponha ajustes via novos artefatos quando necessario.',
    '',
    `Estrategia ativa: ${context.estrategia.nome}`,
    `Nicho: ${context.estrategia.nicho ?? context.diagnostico?.nicho ?? 'Nao informado'}`,
    `Status: ${context.estrategia.status}`,
    `Versao atual: ${context.versao?.versao ?? context.estrategia.versao}`,
    `Documento original: ${context.estrategia.doc_path ?? 'Nao informado'}`,
    '',
    `Diagnostico: ${JSON.stringify({
      swot: context.diagnostico?.swot ?? null,
      persona: context.diagnostico?.persona ?? null,
      uvp: context.diagnostico?.uvp ?? strategy?.posicionamento.uvp ?? null,
      score_viabilidade: context.diagnostico?.score_viab ?? null,
      justificativa: context.diagnostico?.justificativa ?? null,
    })}`,
    `Estrategia: ${JSON.stringify({
      posicionamento: strategy?.posicionamento ?? null,
      mix_canais: strategy?.mix_canais ?? [],
      kpis: strategy?.kpis ?? [],
      campanhas: strategy?.campanhas ?? [],
    })}`,
    `Copy e captacao: ${JSON.stringify({
      variants: context.copy.slice(0, 12).map((item) => ({
        campanha: item.campanha_nome,
        tipo: item.tipo,
        canal: item.canal,
        tom: item.tom ?? null,
        conteudo: item.conteudo,
      })),
      lead_magnets: context.leadMagnets.slice(0, 8).map((item) => ({
        nome: item.nome,
        persona_alvo: item.persona_alvo,
        funil_estagio: item.funil_estagio,
        cta: item.landing_page.cta,
      })),
    })}`,
    `Calendario: ${JSON.stringify(calendarSummary)}`,
    `Roadmap: ${JSON.stringify(roadmapSummary)}`,
    `Resumo operacional: ${JSON.stringify(operationalDigest)}`,
    `Historico recente: ${JSON.stringify(historySummary)}`,
    `Sinais de inconsistencia: ${JSON.stringify(inconsistencyFlags)}`,
    `Sugestoes proativas: ${JSON.stringify(suggestions)}`,
    `Operacoes de refinamento suportadas: ${JSON.stringify({
      tone_adjustment: 'ajuste de tom de voz em nova resposta/artefato',
      budget_redistribution: 'simulacao de redistribuicao de budget sem editar versao historica',
      date_refinement: 'ajuste de datas do calendario/roadmap via nova proposta',
      strategy_parameter_tuning: 'ajuste de canais, KPIs, campanhas ou posicionamento via nova versao',
      copy_variant_generation: 'novas variantes de copy vinculadas a campanha',
    })}`,
    '',
    'Ao responder, considere diagnostico, estrategia, copy, calendario, roadmap e historico recente como um unico contexto operacional.',
    'Quando houver sinais de inconsistencia, aponte o impacto e proponha a menor acao corretiva sem alterar versoes historicas em lugar.',
    'Se o usuario pedir ajuste de tom, budget, data, canais, KPIs, campanha, posicionamento ou copy, trate como refinamento versionado: explique a mudanca proposta, o artefato afetado e que a versao historica permanece preservada.',
  ].join('\n');
}

export function buildMktChatFallbackResponse({ context, message }: MktChatFallbackInput): string {
  const strategy = context.versao?.conteudo;
  const topChannels = strategy?.mix_canais.slice(0, 3).map((item) => item.nome).join(', ') || 'canais ainda nao definidos';
  const topCampaigns = strategy?.campanhas.slice(0, 3).map((item) => item.nome).join(', ') || 'campanhas ainda nao definidas';
  const quickWins = context.calendario.filter((item) => item.is_quick_win).slice(0, 3);
  const roadmap = context.roadmap.slice(0, 3);
  const history = summarizeHistory(context.history);
  const inconsistencyFlags = detectMktChatInconsistencyFlags(context);
  const suggestions = buildMktChatProactiveSuggestions(context);
  const refinementIntents = detectMktChatRefinementIntents(message);
  const operationalDigest = buildMktChatOperationalDigest(context);

  return [
    `Resposta contextual provisoria para "${context.estrategia.nome}".`,
    `Pedido atual: ${message.trim()}`,
    `Historico considerado: ${history.resumo || 'sem historico recente'}`,
    `Contexto operacional considerado: ${operationalDigest.diagnostico}; ${operationalDigest.estrategia}; ${operationalDigest.copy}; ${operationalDigest.calendario}; ${operationalDigest.roadmap}.`,
    '',
    `UVP: ${context.diagnostico?.uvp ?? strategy?.posicionamento.uvp ?? 'Nao definida'}`,
    `Persona principal: ${context.diagnostico?.persona.nome ?? 'Nao definida'}`,
    `Canais prioritarios: ${topChannels}.`,
    `Campanhas prioritarias: ${topCampaigns}.`,
    `Assets de captacao disponiveis: ${context.copy.length} copies e ${context.leadMagnets.length} lead magnets.`,
    `Sinais de inconsistencia: ${inconsistencyFlags.length > 0 ? inconsistencyFlags.join('; ') : 'nenhum sinal critico no contexto atual'}.`,
    `Refinamentos detectados: ${refinementIntents.length > 0 ? refinementIntents.join(', ') : 'nenhum refinamento versionado solicitado'}.`,
    '',
    'Sugestoes proativas:',
    ...suggestions.map((item, index) => `${index + 1}. ${item}`),
    '',
    'Acoes recomendadas agora:',
    ...quickWins.map((item, index) => `${index + 1}. Quick win em ${item.data} via ${item.canal}: ${item.tema}.`),
    ...roadmap.map((item, index) => `${index + quickWins.length + 1}. ${item.fase} - ${item.item} (${item.responsavel ?? 'sem responsavel'}).`),
    ...(refinementIntents.length > 0
      ? ['', 'Regra de versao: estes ajustes devem virar nova proposta/versionamento, sem sobrescrever a estrategia aprovada atual.']
      : []),
    '',
    'Observacao: esta resposta foi gerada em modo de contingencia local porque nenhuma chave LLM valida estava configurada no ambiente.',
  ].join('\n');
}

export async function* createMktChatTextDeltaStream(text: string): AsyncIterable<string> {
  for (const char of text) {
    yield char;
  }
}

export function createMktChatSseStream(textStream: AsyncIterable<string>): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const delta of textStream) {
          for (const char of delta) {
            controller.enqueue(encoder.encode(`event: delta\ndata: ${JSON.stringify({ delta: char })}\n\n`));
          }
        }
        controller.enqueue(encoder.encode('event: done\ndata: {}\n\n'));
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Erro desconhecido no stream do chat.';
        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });
}

function summarizeCalendar(items: MktCalendarItem[]) {
  return {
    total_itens: items.length,
    primeiros_10: items.slice(0, 10).map((item) => ({
      data: item.data,
      canal: item.canal,
      tipo: item.tipo,
      tema: item.tema,
      copy_resumo: item.copy_resumo,
      status: item.status,
      quick_win: item.is_quick_win,
    })),
    quick_wins: items
      .filter((item) => item.is_quick_win)
      .slice(0, 10)
      .map((item) => ({ data: item.data, canal: item.canal, tema: item.tema })),
  };
}

function summarizeRoadmap(tasks: MktRoadmapTask[]) {
  return tasks.map((task) => ({
    fase: task.fase,
    item: task.item,
    responsavel: task.responsavel ?? null,
    ferramenta: task.ferramenta ?? null,
    status: task.status,
    alerta_prazo: task.alerta_prazo ?? null,
  }));
}

function summarizeHistory(messages: MktChatMessage[]) {
  const turns = messages.slice(-10).map((item) => ({
    role: item.role,
    conteudo: item.conteudo.replace(/\s+/g, ' ').trim().slice(0, 280),
    created_at: item.created_at,
  }));

  return {
    total_no_contexto: messages.length,
    ultimos_10_turnos: turns,
    resumos_a_cada_10_turnos: buildMktChatHistoryTurnSummaries(messages),
    resumo: turns.map((item) => `${item.role}: ${item.conteudo}`).join(' | '),
  };
}

export function buildMktChatHistoryTurnSummaries(messages: MktChatMessage[]) {
  const normalized = messages.map((item) => ({
    role: item.role,
    conteudo: item.conteudo.replace(/\s+/g, ' ').trim().slice(0, 160),
  }));

  const summaries: { intervalo: string; resumo: string }[] = [];
  for (let start = 0; start < normalized.length; start += 10) {
    const group = normalized.slice(start, start + 10);
    if (group.length < 10 && start > 0) continue;
    summaries.push({
      intervalo: `${start + 1}-${start + group.length}`,
      resumo: group.map((item) => `${item.role}: ${item.conteudo}`).join(' | '),
    });
  }

  return summaries;
}

export function detectMktChatInconsistencyFlags(context: MktChatContext): string[] {
  const flags: string[] = [];
  const strategy = context.versao?.conteudo;
  const strategyChannels = new Set(strategy?.mix_canais.map((item) => item.nome) ?? []);
  const calendarChannels = new Set(context.calendario.map((item) => item.canal));
  const copyCampaigns = new Set(context.copy.map((item) => item.campanha_nome));
  const strategyCampaigns = new Set(strategy?.campanhas.map((item) => item.nome) ?? []);

  if (!context.diagnostico?.aprovado) {
    flags.push('diagnostico ainda nao aprovado');
  }

  if (!context.versao) {
    flags.push('estrategia ainda sem versao ativa para preservar');
  }

  const channelsWithoutCalendar = [...strategyChannels].filter((channel) => !calendarChannels.has(channel));
  if (channelsWithoutCalendar.length > 0 && context.calendario.length > 0) {
    flags.push(`canais da estrategia sem calendario: ${channelsWithoutCalendar.join(', ')}`);
  }

  const campaignsWithoutCopy = [...strategyCampaigns].filter((campaign) => !copyCampaigns.has(campaign));
  if (campaignsWithoutCopy.length > 0 && context.copy.length > 0) {
    flags.push(`campanhas sem copy vinculada: ${campaignsWithoutCopy.join(', ')}`);
  }

  if (context.roadmap.length === 0 && context.calendario.length > 0) {
    flags.push('calendario existe sem roadmap operacional correspondente');
  }

  return flags;
}

export function detectMktChatRefinementIntents(message: string): MktChatRefinementIntent[] {
  const normalized = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  const intents = new Set<MktChatRefinementIntent>();

  if (/\b(tom|voz|formal|informal|direto|consultivo|persuasivo)\b/.test(normalized)) {
    intents.add('tone_adjustment');
  }

  if (/\b(budget|orcamento|verba|investimento|reduzir|aumentar|redistribuir)\b/.test(normalized)) {
    intents.add('budget_redistribution');
  }

  if (/\b(data|prazo|calendario|roadmap|semana|mes|adiar|antecipar)\b/.test(normalized)) {
    intents.add('date_refinement');
  }

  if (/\b(canal|canais|kpi|campanha|posicionamento|persona|uvp|estrategia|parametro)\b/.test(normalized)) {
    intents.add('strategy_parameter_tuning');
  }

  if (/\b(copy|headline|cta|email|landing|anuncio|criativo|variante)\b/.test(normalized)) {
    intents.add('copy_variant_generation');
  }

  return [...intents];
}

export function shouldQueueMktChatStrategyRefinement(message: string, intents = detectMktChatRefinementIntents(message)): boolean {
  if (intents.length === 0) return false;

  const normalized = message
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  return /\b(ajust\w*|alter\w*|mude|mudar|troque|trocar|refin\w*|simul\w*|gere|gerar|crie|criar|reduz\w*|aument\w*|redistribu\w*|antecip\w*|adi\w*|torne|faca)\b/.test(normalized);
}

export function buildMktChatProactiveSuggestions(context: MktChatContext): string[] {
  const suggestions: string[] = [];
  const strategy = context.versao?.conteudo;
  const firstQuickWin = context.calendario.find((item) => item.is_quick_win);
  const firstRoadmapPending = context.roadmap.find((item) => item.status !== 'concluido');
  const firstCampaign = strategy?.campanhas[0];

  if (firstCampaign) {
    suggestions.push(`revisar objetivo e budget da campanha "${firstCampaign.nome}" antes de gerar novos ativos`);
  }

  if (firstQuickWin) {
    suggestions.push(`priorizar quick win de ${firstQuickWin.data} em ${firstQuickWin.canal}: ${firstQuickWin.tema}`);
  }

  if (firstRoadmapPending) {
    suggestions.push(`confirmar responsavel e prazo para "${firstRoadmapPending.item}" no roadmap`);
  }

  if (context.leadMagnets.length > 0) {
    suggestions.push(`validar CTA do lead magnet "${context.leadMagnets[0]?.nome}" contra a persona principal`);
  }

  if (suggestions.length === 0) {
    suggestions.push('consolidar diagnostico, versao ativa, copy, calendario e roadmap antes de simular novos cenarios');
  }

  return suggestions.slice(0, 4);
}

export function buildMktChatOperationalDigest(context: MktChatContext) {
  const strategy = context.versao?.conteudo;
  const primaryCampaign = strategy?.campanhas[0];
  const firstCopy = context.copy[0];
  const firstCalendarItem = context.calendario[0];
  const firstRoadmapTask = context.roadmap[0];

  return {
    diagnostico: [
      `diagnostico ${context.diagnostico?.aprovado ? 'aprovado' : 'pendente'}`,
      `score ${context.diagnostico?.score_viab ?? 'sem score'}`,
      `persona ${context.diagnostico?.persona.nome ?? 'nao definida'}`,
      `uvp ${context.diagnostico?.uvp ?? strategy?.posicionamento.uvp ?? 'nao definida'}`,
    ].join(', '),
    estrategia: [
      `versao ${context.versao?.versao ?? context.estrategia.versao ?? 'sem versao'}`,
      `tom ${strategy?.posicionamento.tom_de_voz ?? 'nao definido'}`,
      `canais ${(strategy?.mix_canais.map((item) => `${item.nome}:${item.percentual_alocacao}%`).join(', ')) || 'nao definidos'}`,
      `campanha ${primaryCampaign ? `${primaryCampaign.nome} (${primaryCampaign.budget ?? 'budget nao definido'})` : 'nao definida'}`,
    ].join(', '),
    copy: firstCopy
      ? `${context.copy.length} variantes; primeira ${firstCopy.tipo}/${firstCopy.canal} para ${firstCopy.campanha_nome}: ${firstCopy.conteudo}`
      : 'sem variantes de copy persistidas',
    calendario: firstCalendarItem
      ? `${context.calendario.length} itens; primeiro ${firstCalendarItem.data} ${firstCalendarItem.canal}/${firstCalendarItem.tipo}: ${firstCalendarItem.tema} (${firstCalendarItem.status})`
      : 'sem calendario persistido',
    roadmap: firstRoadmapTask
      ? `${context.roadmap.length} tarefas; primeira ${firstRoadmapTask.fase}: ${firstRoadmapTask.item} (${firstRoadmapTask.status})`
      : 'sem roadmap persistido',
  };
}
