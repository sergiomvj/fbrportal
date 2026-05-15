import { describe, expect, it } from 'vitest';
import {
  buildMktChatHistoryTurnSummaries,
  buildMktChatProactiveSuggestions,
  buildMktChatFallbackResponse,
  buildMktChatOperationalDigest,
  buildMktChatSystemPrompt,
  createMktChatTextDeltaStream,
  createMktChatSseStream,
  detectMktChatInconsistencyFlags,
  detectMktChatRefinementIntents,
  normalizeMktChatHistory,
  selectChatContextWindow,
  shouldQueueMktChatStrategyRefinement,
  type MktChatContext,
} from './chat';

const estrategiaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
const empresaId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const userId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

function context(): MktChatContext {
  return {
    estrategia: {
      id: estrategiaId,
      user_id: userId,
      empresa_id: empresaId,
      nome: 'Estrategia Contextual',
      nicho: 'SaaS B2B',
      status: 'ativa',
      doc_path: 'uploads/empresa/viabilidade.pdf',
      versao: 2,
    },
    diagnostico: {
      estrategia_id: estrategiaId,
      swot: {
        forcas: ['Autoridade'],
        fraquezas: ['Baixa cadencia'],
        oportunidades: ['Demanda ativa'],
        ameacas: ['Concorrencia'],
      },
      persona: {
        nome: 'Diretor Comercial',
        idade: '35-50',
        profissao: 'Executivo',
        dores: ['Pipeline instavel'],
        desejos: ['Previsibilidade'],
        comportamento_digital: 'Pesquisa benchmarks no LinkedIn',
        canais_preferidos: ['linkedin'],
      },
      uvp: 'Crescimento previsivel',
      score_viab: 82,
      justificativa: 'Mercado com demanda ativa.',
      aprovado: true,
    },
    versao: {
      estrategia_id: estrategiaId,
      versao: 2,
      gerado_por: 'estrategista_bot',
      conteudo: {
        posicionamento: {
          brand_archetype: 'Sage',
          tom_de_voz: 'Consultivo',
          uvp: 'Crescimento previsivel',
          posicionamento_mercado: 'Plataforma consultiva para B2B.',
        },
        mix_canais: [{ nome: 'linkedin', percentual_alocacao: 50, justificativa: 'Persona ativa.' }],
        kpis: [{ canal: 'linkedin', cac: 'R$ 420', roi: '3.2x' }],
        campanhas: [
          {
            nome: 'Diagnostico Executivo',
            objetivo_smart: 'Gerar 40 SQLs em 30 dias.',
            mensagens_chave: ['Reduzir CAC'],
            budget: 'R$ 12.000',
            timeline: '30 dias',
            formatos: ['ebook'],
            audiencias_segmentadas: ['Diretores comerciais'],
            canal: 'linkedin',
            prioridade: 1,
          },
        ],
      },
    },
    copy: [
      {
        estrategia_id: estrategiaId,
        versao: 2,
        campanha_nome: 'Diagnostico Executivo',
        tipo: 'headline',
        canal: 'linkedin',
        conteudo: 'Transforme autoridade em pipeline.',
      },
    ],
    leadMagnets: [
      {
        estrategia_id: estrategiaId,
        versao: 2,
        nome: 'Checklist de Pipeline',
        persona_alvo: 'Diretor Comercial',
        funil_estagio: 'topo',
        landing_page: {
          hero: 'Diagnostique seu pipeline',
          beneficios: ['Clareza'],
          social_proof: 'Usado por B2B.',
          cta: 'Baixar checklist',
        },
        nurture_emails: [
          { assunto: 'Diagnostico', corpo: 'Passo um.', dia_envio: 1 },
          { assunto: 'Prioridades', corpo: 'Passo dois.', dia_envio: 3 },
          { assunto: 'Execucao', corpo: 'Passo tres.', dia_envio: 5 },
          { assunto: 'Metricas', corpo: 'Passo quatro.', dia_envio: 7 },
          { assunto: 'Proposta', corpo: 'Passo cinco.', dia_envio: 10 },
        ],
      },
    ],
    calendario: [
      {
        estrategia_id: estrategiaId,
        versao: 2,
        data: '2026-05-14',
        canal: 'linkedin',
        tipo: 'organico',
        tema: 'Quick win de autoridade',
        copy_resumo: 'Post educativo',
        status: 'pendente',
        is_quick_win: true,
      },
    ],
    roadmap: [
      {
        estrategia_id: estrategiaId,
        versao: 2,
        fase: '0-30d',
        item: 'Publicar diagnostico executivo',
        responsavel: 'Marketing',
        ferramenta: 'LinkedIn',
        status: 'pendente',
        alerta_prazo: '2026-05-20',
      },
    ],
    history: [],
  };
}

describe('MKT chat context', () => {
  it('assembles the PRD-required diagnostic, strategy, copy, calendar, and roadmap context', () => {
    const prompt = buildMktChatSystemPrompt(context());

    expect(prompt).toContain('Diagnostico:');
    expect(prompt).toContain('Estrategia:');
    expect(prompt).toContain('Copy e captacao:');
    expect(prompt).toContain('Calendario:');
    expect(prompt).toContain('Roadmap:');
    expect(prompt).toContain('Resumo operacional:');
    expect(prompt).toContain('Historico recente:');
    expect(prompt).toContain('Sinais de inconsistencia:');
    expect(prompt).toContain('Sugestoes proativas:');
    expect(prompt).toContain('Operacoes de refinamento suportadas:');
    expect(prompt).toContain('refinamento versionado');
    expect(prompt).toContain('Quick win de autoridade');
    expect(prompt).toContain('Publicar diagnostico executivo');
  });

  it('includes recent chat history and proactive inconsistency flags in the model prompt', () => {
    const ctx = context();
    ctx.history = [
      {
        id: crypto.randomUUID(),
        estrategia_id: estrategiaId,
        role: 'user',
        conteudo: 'E se reduzirmos o budget pela metade?',
        created_at: '2026-05-13T10:00:00.000Z',
      },
      {
        id: crypto.randomUUID(),
        estrategia_id: estrategiaId,
        role: 'assistant',
        conteudo: 'Redistribua verba para LinkedIn e proteja o quick win.',
        created_at: '2026-05-13T10:00:10.000Z',
      },
    ];
    ctx.versao!.conteudo.mix_canais.push({ nome: 'google_ads', percentual_alocacao: 30, justificativa: 'Captura demanda ativa.' });

    const prompt = buildMktChatSystemPrompt(ctx);

    expect(prompt).toContain('E se reduzirmos o budget pela metade?');
    expect(prompt).toContain('Redistribua verba para LinkedIn');
    expect(prompt).toContain('canais da estrategia sem calendario: google_ads');
    expect(prompt).toContain('revisar objetivo e budget da campanha');
  });

  it('uses only the latest 20 messages for the model context window', () => {
    const messages = Array.from({ length: 25 }, (_, index) => ({
      id: crypto.randomUUID(),
      estrategia_id: estrategiaId,
      role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
      conteudo: `Mensagem ${index + 1}`,
      created_at: new Date().toISOString(),
    }));

    const window = selectChatContextWindow(messages);

    expect(window).toHaveLength(20);
    expect(window.at(0)?.conteudo).toBe('Mensagem 6');
    expect(window.at(-1)?.conteudo).toBe('Mensagem 25');
  });

  it('normalizes persisted chat history into chronological conversation order', () => {
    const messages = [
      {
        id: crypto.randomUUID(),
        estrategia_id: estrategiaId,
        role: 'assistant' as const,
        conteudo: 'Resposta mais nova',
        created_at: '2026-05-13T10:00:30.000Z',
      },
      {
        id: crypto.randomUUID(),
        estrategia_id: estrategiaId,
        role: 'user' as const,
        conteudo: 'Pergunta mais antiga',
        created_at: '2026-05-13T10:00:00.000Z',
      },
    ];

    expect(normalizeMktChatHistory(messages).map((message) => message.conteudo)).toEqual([
      'Pergunta mais antiga',
      'Resposta mais nova',
    ]);
  });

  it('builds automatic summaries every 10 chat turns for long context windows', () => {
    const messages = Array.from({ length: 25 }, (_, index) => ({
      id: crypto.randomUUID(),
      estrategia_id: estrategiaId,
      role: index % 2 === 0 ? ('user' as const) : ('assistant' as const),
      conteudo: `Turno ${index + 1}`,
      created_at: new Date().toISOString(),
    }));

    const summaries = buildMktChatHistoryTurnSummaries(messages);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]).toMatchObject({ intervalo: '1-10' });
    expect(summaries[1]).toMatchObject({ intervalo: '11-20' });
    expect(summaries[1]?.resumo).toContain('Turno 20');
    expect(buildMktChatSystemPrompt({ ...context(), history: messages })).toContain('resumos_a_cada_10_turnos');
  });

  it('serializes assistant text as character-level SSE events for the sidebar stream reader', async () => {
    async function* textChunks() {
      yield 'Primeiro ';
      yield 'trecho';
    }

    const reader = createMktChatSseStream(textChunks()).getReader();
    const decoder = new TextDecoder();
    let output = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      output += decoder.decode(value, { stream: true });
    }

    const deltaPayloads = output
      .split('\n\n')
      .map((event) => {
        const eventType = event.split('\n').find((line) => line.startsWith('event: '))?.slice(7);
        const dataLine = event.split('\n').find((line) => line.startsWith('data: '));
        if (eventType !== 'delta' || !dataLine) return '';
        return (JSON.parse(dataLine.slice(6)) as { delta?: string }).delta ?? '';
      })
      .filter(Boolean);

    expect(deltaPayloads.join('')).toBe('Primeiro trecho');
    expect(deltaPayloads.slice(0, 9)).toEqual(['P', 'r', 'i', 'm', 'e', 'i', 'r', 'o', ' ']);
    expect(deltaPayloads.every((delta) => delta.length === 1)).toBe(true);
    expect(output).toContain('event: done');
  });

  it('streams local fallback responses as small deltas for consistent sidebar rendering', async () => {
    const deltas: string[] = [];

    for await (const delta of createMktChatTextDeltaStream('abc')) {
      deltas.push(delta);
    }

    expect(deltas).toEqual(['a', 'b', 'c']);
  });

  it('exposes contextual suggestions and inconsistency flags for the chat sidebar contract', () => {
    const ctx = context();
    ctx.versao!.conteudo.mix_canais.push({ nome: 'google_ads', percentual_alocacao: 30, justificativa: 'Captura demanda ativa.' });

    expect(buildMktChatProactiveSuggestions(ctx)).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Diagnostico Executivo'),
        expect.stringContaining('Quick win de autoridade'),
      ]),
    );
    expect(detectMktChatInconsistencyFlags(ctx)).toEqual(
      expect.arrayContaining(['canais da estrategia sem calendario: google_ads']),
    );
  });

  it('builds a deterministic fallback answer when no LLM key is configured', () => {
    const response = buildMktChatFallbackResponse({
      context: context(),
      message: 'Reduza o budget pela metade, ajuste o tom e antecipe o calendario.',
    });

    expect(response).toContain('Resposta contextual provisoria');
    expect(response).toContain('Reduza o budget pela metade');
    expect(response).toContain('Historico considerado: sem historico recente');
    expect(response).toContain('Contexto operacional considerado: diagnostico aprovado, score 82');
    expect(response).toContain('1 variantes; primeira headline/linkedin para Diagnostico Executivo');
    expect(response).toContain('1 itens; primeiro 2026-05-14 linkedin/organico');
    expect(response).toContain('1 tarefas; primeira 0-30d');
    expect(response).toContain('Sugestoes proativas:');
    expect(response).toContain('Sinais de inconsistencia: nenhum sinal critico');
    expect(response).toContain('Refinamentos detectados: tone_adjustment, budget_redistribution, date_refinement');
    expect(response).toContain('Regra de versao');
    expect(response).toContain('Quick win de autoridade');
    expect(response).toContain('Publicar diagnostico executivo');
    expect(response).toContain('modo de contingencia local');
  });

  it('classifies scenario and refinement requests without mutating historic strategy versions', () => {
    expect(detectMktChatRefinementIntents(
      'Torne a copy mais formal, redistribua verba para Google Ads e ajuste o KPI da campanha.',
    )).toEqual([
      'tone_adjustment',
      'budget_redistribution',
      'strategy_parameter_tuning',
      'copy_variant_generation',
    ]);
  });

  it('queues versioned strategy refinement only for actionable chat requests', () => {
    expect(shouldQueueMktChatStrategyRefinement('Torne a copy mais formal e redistribua budget.')).toBe(true);
    expect(shouldQueueMktChatStrategyRefinement('Qual era o budget da campanha?')).toBe(false);
  });

  it('builds a compact operational digest from diagnostic, strategy, copy, calendar, and roadmap', () => {
    expect(buildMktChatOperationalDigest(context())).toEqual({
      diagnostico: expect.stringContaining('persona Diretor Comercial'),
      estrategia: expect.stringContaining('campanha Diagnostico Executivo (R$ 12.000)'),
      copy: expect.stringContaining('Transforme autoridade em pipeline.'),
      calendario: expect.stringContaining('Quick win de autoridade'),
      roadmap: expect.stringContaining('Publicar diagnostico executivo'),
    });
  });
});
