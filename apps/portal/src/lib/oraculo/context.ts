import type { OraculoContext } from './types';

interface RouteConfig {
  module: string;
  moduleLabel: string;
  prefix: string;
  defaultScreen: string;
  defaultScreenLabel: string;
  suggestions: Record<string, string[]>;
}

const ROUTE_CONFIGS: RouteConfig[] = [
  {
    module: 'portal',
    moduleLabel: 'FBR Portal',
    prefix: '/',
    defaultScreen: 'home',
    defaultScreenLabel: 'Home',
    suggestions: {
      '/': [
        'Quais modulos estao disponiveis no portal?',
        'Como a autenticacao local do portal funciona?',
      ],
    },
  },
  {
    module: 'finance',
    moduleLabel: 'FBR-Finance',
    prefix: '/finance',
    defaultScreen: 'overview',
    defaultScreenLabel: 'Overview',
    suggestions: {
      '/finance': [
        'Quais KPIs o Finance destaca na tela inicial?',
        'Como os papeis de aprovacao aparecem no modulo financeiro?',
      ],
      '/finance/pagamentos': [
        'Quem pode aprovar um pagamento acima de R$10k?',
        'Como o fluxo de pagamentos aparece no portal?',
      ],
      '/finance/conciliacao': [
        'Como a conciliacao e acionada no portal?',
        'Quais sinais de governanca aparecem na tela de conciliacao?',
      ],
      '/finance/recebimentos': [
        'Como os recebimentos sao organizados no Finance?',
        'Quais indicadores de recebimento esta tela mostra?',
      ],
      '/finance/centros-custo': [
        'Como a arvore de centros de custo e apresentada?',
        'Que relacao existe entre centros de custo e governanca?',
      ],
      '/finance/pl': [
        'Como o P&L aparece no portal?',
        'Quais dados a visao de forecast destaca?',
      ],
    },
  },
  {
    module: 'click',
    moduleLabel: 'FBR-Click',
    prefix: '/click',
    defaultScreen: 'workspace',
    defaultScreenLabel: 'Workspace',
    suggestions: {
      '/click': [
        'Como um SQL entra no pipeline do Click?',
        'Qual a diferenca entre deal manual e deal vindo do Leads?',
      ],
      '/click/audit': [
        'Como o audit log e apresentado no Click?',
        'Quais eventos o fluxo comercial registra?',
      ],
      '/click/kpis': [
        'Quais KPIs operacionais o Click acompanha?',
        'Como os estagios do funil aparecem no modulo?',
      ],
    },
  },
  {
    module: 'leads',
    moduleLabel: 'FBR-Leads',
    prefix: '/leads',
    defaultScreen: 'overview',
    defaultScreenLabel: 'Overview',
    suggestions: {
      '/leads': [
        'Quais KPIs o FBR-Leads mostra na home?',
        'Como a saude de dominios aparece no modulo?',
      ],
      '/leads/pipeline': [
        'Por que um lead trava no scoring?',
        'Como funciona a cadencia de 4 toques?',
      ],
      '/leads/domains': [
        'Como o portal mostra bounce rate e limite diario?',
        'Quais sinais indicam um dominio em risco?',
      ],
      '/leads/icp': [
        'Como os ICPs sao exibidos no modulo?',
        'Que atributos de segmentacao a tela destaca?',
      ],
      '/leads/agents': [
        'Quais agentes aparecem no FBR-Leads?',
        'Como o papel do scorer e descrito no portal?',
      ],
      '/leads/campaigns': [
        'Como campanhas outbound sao apresentadas?',
        'Quais metadados de campanha aparecem nesta tela?',
      ],
      '/leads/reports': [
        'Quais relatorios o FBR-Leads destaca?',
        'Como o portal resume performance do modulo?',
      ],
    },
  },
  {
    module: 'mkt',
    moduleLabel: 'FBR-MKT',
    prefix: '/mkt',
    defaultScreen: 'dashboard',
    defaultScreenLabel: 'Dashboard',
    suggestions: {
      '/mkt': [
        'Como a plataforma divide os 9 modulos de marketing?',
        'Quais agentes OpenClaw aparecem no dashboard?',
      ],
      '/mkt/novo': [
        'Como o fluxo de diagnostico comeca nesta tela?',
        'Quais passos antecedem a estrategia?',
      ],
      '/mkt/agentes': [
        'Quais agentes aparecem em MKT e que filas usam?',
        'Como a tela de agentes se conecta ao dashboard?',
      ],
      '/mkt/estrategias': [
        'Como as estrategias sao listadas no portal?',
        'Quais dados de versao e status aparecem na listagem?',
      ],
      '/mkt/calendario': [
        'Como o calendario editorial e apresentado?',
        'Que parte do fluxo de marketing alimenta esta tela?',
      ],
    },
  },
  {
    module: 'redacao',
    moduleLabel: 'FBR-Redacao',
    prefix: '/redacao',
    defaultScreen: 'overview',
    defaultScreenLabel: 'Overview',
    suggestions: {
      '/redacao': [
        'Quais superficies operacionais a redacao oferece?',
        'Como o dashboard inicial da redacao esta organizado?',
      ],
      '/redacao/producao': [
        'Como a producao editorial aparece no portal?',
        'Quais estados de producao sao exibidos?',
      ],
      '/redacao/publicados': [
        'Como artigos publicados sao apresentados?',
        'Que metadados acompanham conteudo publicado?',
      ],
      '/redacao/fontes': [
        'Como fontes editoriais sao gerenciadas?',
        'Quais acoes a tela de fontes disponibiliza?',
      ],
      '/redacao/alertas': [
        'Como alertas editoriais sao listados?',
        'O que acontece quando um alerta e resolvido?',
      ],
      '/redacao/ugc': [
        'Como o fluxo UGC aparece no portal?',
        'Quais acoes existem para aceitar ou rejeitar UGC?',
      ],
      '/redacao/agentes': [
        'Quais agentes compoem a redacao?',
        'Como o portal descreve o papel de cada agente?',
      ],
    },
  },
  {
    module: 'sales',
    moduleLabel: 'FBR-Sales',
    prefix: '/sales',
    defaultScreen: 'dashboard',
    defaultScreenLabel: 'Dashboard',
    suggestions: {
      '/sales': [
        'Quais indicadores de receita e anomalias aparecem no Sales?',
        'Como parceiros e media kits sao organizados no dashboard?',
      ],
    },
  },
  {
    module: 'social',
    moduleLabel: 'FBR-Social',
    prefix: '/social',
    defaultScreen: 'dashboard',
    defaultScreenLabel: 'Dashboard',
    suggestions: {
      '/social': [
        'Como o Social usa brand kits e jobs no portal?',
        'Quais integracoes o dashboard social destaca?',
      ],
    },
  },
  {
    module: 'videoflow',
    moduleLabel: 'FBR-VideoFlow',
    prefix: '/videoflow',
    defaultScreen: 'dashboard',
    defaultScreenLabel: 'Dashboard',
    suggestions: {
      '/videoflow': [
        'Quais agentes participam do pipeline do VideoFlow?',
        'Como concepts e productions aparecem no dashboard?',
      ],
    },
  },
  {
    module: 'design',
    moduleLabel: 'FBR-Design',
    prefix: '/design',
    defaultScreen: 'dashboard',
    defaultScreenLabel: 'Dashboard',
    suggestions: {
      '/design': [
        'Como brand kits e webhooks aparecem no FBR-Design?',
        'Quais entregaveis e slots de agentes o modulo mostra?',
      ],
    },
  },
];

function toScreenLabel(screen: string): string {
  return screen
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ');
}

function findRouteConfig(pathname: string): RouteConfig {
  const matched = ROUTE_CONFIGS
    .filter((config) => pathname === config.prefix || pathname.startsWith(`${config.prefix}/`) || config.prefix === '/')
    .sort((left, right) => right.prefix.length - left.prefix.length);

  return matched[0] ?? ROUTE_CONFIGS[0]!;
}

function buildScreen(config: RouteConfig, pathname: string) {
  const suggestionPath = Object.keys(config.suggestions)
    .filter((route) => pathname === route || pathname.startsWith(`${route}/`))
    .sort((left, right) => right.length - left.length)[0];

  if (suggestionPath) {
    const suffix = suggestionPath.replace(config.prefix, '').replace(/^\//, '');
    return {
      screen: suffix || config.defaultScreen,
      screenLabel: suffix ? toScreenLabel(suffix) : config.defaultScreenLabel,
      suggestedQuestions: config.suggestions[suggestionPath]!,
    };
  }

  const segments = pathname.replace(config.prefix, '').split('/').filter(Boolean);
  const screen = segments.join('-') || config.defaultScreen;

  return {
    screen,
    screenLabel: screen === config.defaultScreen ? config.defaultScreenLabel : toScreenLabel(screen),
    suggestedQuestions: config.suggestions[config.prefix] ?? [],
  };
}

export function resolveOraculoContext(pathname: string): OraculoContext {
  const config = findRouteConfig(pathname);
  const screen = buildScreen(config, pathname);

  return {
    module: config.module,
    moduleLabel: config.moduleLabel,
    screen: screen.screen,
    screenLabel: screen.screenLabel,
    pathname,
    suggestedQuestions: screen.suggestedQuestions,
  };
}
