import { z } from 'zod';
import {
  Artigo,
  ArtigosQuery,
  ArtigosQuerySchema,
  ArtigoSchema,
  FonteRSS,
  FonteRSSSchema,
  UGCSubmission,
  UGCSubmissionSchema,
  Alerta,
  RedacaoAgent,
  DashboardKpis,
} from './types';

export interface RedacaoRequestContext {
  companyId: string;
  userId: string;
  moduleSource: string;
}

export class RedacaoValidationError extends Error {
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
    throw new RedacaoValidationError('JSON object payload is required.', 400);
  }
  return input;
}

function normalizeZodError(error: z.ZodError) {
  const hasMissingRequired = error.issues.some((issue) => issue.code === 'invalid_type' && issue.received === 'undefined');
  return new RedacaoValidationError(hasMissingRequired ? 'Required fields are missing.' : 'Payload validation failed.', hasMissingRequired ? 400 : 422, error.issues);
}

const initialFontes: FonteRSS[] = [
  {
    id: 'ffff1111-ffff-4fff-8fff-fffffffffff1',
    company_id: COMPANY_ALPHA,
    nome: 'Orlando Sentinel RSS',
    url: 'https://www.orlandosentinel.com/rss2.0.xml',
    cidade: 'Orlando',
    ativo: true,
    ultimo_ok: '2026-05-08T04:30:00.000Z',
    intervalo_minutos: 15,
    created_at: '2026-01-10T10:00:00.000Z',
  },
  {
    id: 'ffff1111-ffff-4fff-8fff-fffffffffff2',
    company_id: COMPANY_ALPHA,
    nome: 'Miami Herald RSS',
    url: 'https://www.miamiherald.com/rss-feed.xml',
    cidade: 'Miami',
    ativo: true,
    ultimo_ok: '2026-05-08T05:00:00.000Z',
    intervalo_minutos: 15,
    created_at: '2026-01-15T10:00:00.000Z',
  },
  {
    id: 'ffff1111-ffff-4fff-8fff-fffffffffff3',
    company_id: COMPANY_ALPHA,
    nome: 'Boston.com RSS',
    url: 'https://www.boston.com/rss.xml',
    cidade: 'Boston',
    ativo: true,
    ultimo_ok: '2026-05-08T03:45:00.000Z',
    intervalo_minutos: 20,
    created_at: '2026-02-01T10:00:00.000Z',
  },
  {
    id: 'ffff1111-ffff-4fff-8fff-fffffffffff4',
    company_id: COMPANY_ALPHA,
    nome: 'Newark Star-Ledger RSS',
    url: 'https://www.nj.com/star-ledger/rss.xml',
    cidade: 'Newark',
    ativo: true,
    ultimo_ok: '2026-05-08T06:00:00.000Z',
    intervalo_minutos: 15,
    created_at: '2026-02-10T10:00:00.000Z',
  },
  {
    id: 'ffff1111-ffff-4fff-8fff-fffffffffff5',
    company_id: COMPANY_ALPHA,
    nome: 'Atlanta Journal RSS',
    url: 'https://www.ajc.com/rss.xml',
    cidade: 'Atlanta',
    ativo: true,
    ultimo_ok: '2026-05-08T05:15:00.000Z',
    intervalo_minutos: 15,
    created_at: '2026-02-20T10:00:00.000Z',
  },
  {
    id: 'ffff1111-ffff-4fff-8fff-fffffffffff6',
    company_id: COMPANY_ALPHA,
    nome: 'Tampa Bay Times RSS',
    url: 'https://www.tampabay.com/rss.xml',
    cidade: 'Tampa',
    ativo: true,
    ultimo_ok: '2026-05-08T04:00:00.000Z',
    intervalo_minutos: 20,
    created_at: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'ffff1111-ffff-4fff-8fff-fffffffffff7',
    company_id: COMPANY_ALPHA,
    nome: 'South Florida Sun-Sentinel RSS',
    url: 'https://www.sun-sentinel.com/rss2.0.xml',
    cidade: 'Fort Lauderdale',
    ativo: true,
    ultimo_ok: '2026-05-08T03:30:00.000Z',
    intervalo_minutos: 15,
    created_at: '2026-03-10T10:00:00.000Z',
  },
  {
    id: 'ffff1111-ffff-4fff-8fff-fffffffffff8',
    company_id: COMPANY_ALPHA,
    nome: 'NYC Daily News RSS',
    url: 'https://www.nydailynews.com/rss.xml',
    cidade: 'New York City',
    ativo: false,
    ultimo_ok: '2026-04-20T10:00:00.000Z',
    intervalo_minutos: 15,
    created_at: '2026-03-15T10:00:00.000Z',
  },
];

const initialArtigos = [
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa01',
    company_id: COMPANY_ALPHA,
    titulo: 'Novos parques temáticos em Orlando atraem público recorde de famílias brasileiras',
    conteudo_pt: 'A cidade de Orlando registrou um aumento significativo no número de visitantes brasileiros nos primeiros quatro meses de 2026. Os novos parques temáticos inaugurados no final do ano passado têm sido o principal atrativo para famílias do Brasil que buscam experiências imersivas. Segundo dados do turismo local, houve um crescimento de 23% na emissão de vistos de turista comparado ao mesmo período do ano anterior. Operadoras de turismo em São Paulo e Rio de Janeiro já relatam esgotamento de pacotes para a temporada de julho.',
    cidade: 'Orlando',
    tipo: 'noticia',
    fonte_nome: 'Orlando Sentinel',
    fonte_url: 'https://www.orlandosentinel.com/2026/05/07/theme-parks-brazilian-visitors-record/',
    etapa: 'publicado',
    agente_atual: 'redacao.publisher',
    url_publicado: 'https://portal.facebrasil.com.br/artigos/parques-orlando-brasileiros-2026',
    created_by: USER_SYSTEM,
    created_at: '2026-05-07T08:00:00.000Z',
    updated_at: '2026-05-07T14:00:00.000Z',
    publicado_em: '2026-05-07T14:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa02',
    company_id: COMPANY_ALPHA,
    titulo: 'Mercado imobiliário em Miami se torna referência para investidores brasileiros',
    conteudo_pt: 'O mercado imobiliário de Miami continua atraindo investidores brasileiros em busca de oportunidades de diversificação. Condomínios de luxo em áreas como Brickell e Downtown Miami têm visto uma demanda crescente de compradores do Brasil. Especialistas do setor apontam que a combinação de taxas de juros atraentes e a possibilidade de obtenção do visto EB-5 têm impulsionado esse movimento. Corretores brasileiros com licença na Flórida relatam um aumento de 35% nas consultas desde o início do ano.',
    cidade: 'Miami',
    tipo: 'analise',
    fonte_nome: 'Miami Herald',
    fonte_url: 'https://www.miamiherald.com/2026/05/06/miami-real-estate-brazilian-investors/',
    etapa: 'publicado',
    agente_atual: 'redacao.publisher',
    url_publicado: 'https://portal.facebrasil.com.br/artigos/miami-imobiliario-investidores-brasileiros',
    created_by: USER_SYSTEM,
    created_at: '2026-05-06T10:00:00.000Z',
    updated_at: '2026-05-06T16:00:00.000Z',
    publicado_em: '2026-05-06T16:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa03',
    company_id: COMPANY_ALPHA,
    titulo: 'Mudanças na legislação de imigração em Boston impactam comunidade brasileira',
    conteudo_pt: 'Nova legislação aprovada em Massachusetts traz mudanças significativas para imigrantes brasileiros residentes em Boston e região metropolitana. As alterações incluem novos requisitos para renovação de work permits e expansão de programas de assistência legal gratuita. Advogados especializados em imigração alertam que os prazos para adequação são curtos e recomendam que os afetados procurem orientação jurídica o mais rápido possível. A comunidade brasileira, estimada em mais de 80 mil pessoas na região, se mobiliza através de associações locais para disseminar informações sobre os novos procedimentos.',
    cidade: 'Boston',
    tipo: 'noticia',
    fonte_nome: 'Boston.com',
    fonte_url: 'https://www.boston.com/2026/05/05/immigration-law-changes-brazilian-community/',
    etapa: 'publicado',
    agente_atual: 'redacao.publisher',
    url_publicado: 'https://portal.facebrasil.com.br/artigos/boston-imigracao-brasileiros-mudancas',
    created_by: USER_SYSTEM,
    created_at: '2026-05-05T09:00:00.000Z',
    updated_at: '2026-05-05T15:00:00.000Z',
    publicado_em: '2026-05-05T15:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa04',
    company_id: COMPANY_ALPHA,
    titulo: 'Análise: Novas regras para carteira de motorista na Flórida afetam imigrantes brasileiros',
    conteudo_pt: 'O Departamento de Segurança Veicular da Flórida implementou novas regras para a obtenção e renovação de carteiras de motorista que impactam diretamente a comunidade brasileira. As mudanças exigem documentação adicional para portadores de vistos de trabalho e estudantes. Esta análise detalha os novos requisitos, prazos e alternativas disponíveis, com base em entrevistas com advogados de imigração e representantes do DMV local em Miami e Orlando.',
    cidade: 'Miami',
    tipo: 'analise',
    fonte_nome: 'Miami Herald',
    fonte_url: 'https://www.miamiherald.com/2026/05/04/florida-drivers-license-new-rules/',
    etapa: 'editado',
    agente_atual: 'redacao.editor',
    created_by: USER_SYSTEM,
    created_at: '2026-05-04T11:00:00.000Z',
    updated_at: '2026-05-05T09:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa05',
    company_id: COMPANY_ALPHA,
    titulo: 'Tradução: Nova lei tributária americana e o impacto para residentes brasileiros nos EUA',
    conteudo_pt: 'O IRS publicou novas diretrizes tributárias que afetam cidadãos brasileiros residentes nos Estados Unidos. Entre as principais mudanças estão novas regras de declaração de rendimentos no exterior e atualizações nos tratados de dupla tributação entre Brasil e EUA. Esta tradução integral do documento oficial inclui anotações e esclarecimentos de contadores especializados em fiscalidade internacional, facilitando a compreensão para leitores brasileiros que precisam se adequar aos novos requisitos até o próximo período de declaração.',
    cidade: 'Boston',
    tipo: 'traducao',
    fonte_nome: 'Boston.com',
    fonte_url: 'https://www.boston.com/2026/05/03/new-tax-law-residents-foreign/',
    etapa: 'editado',
    agente_atual: 'redacao.editor',
    created_by: USER_SYSTEM,
    created_at: '2026-05-03T14:00:00.000Z',
    updated_at: '2026-05-04T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa06',
    company_id: COMPANY_ALPHA,
    titulo: 'Festival da comunidade brasileira em Newark reúne milhares de participantes',
    conteudo_pt: 'O Festival Anual da Comunidade Brasileira de Newark, realizado na Ironbound, atraiu mais de cinco mil participantes no último fim de semana. O evento contou com apresentações musicais, gastronomia típica de diversas regiões do Brasil e estandes de serviços para a comunidade imigrante. Autoridades locais compareceram ao evento e anunciaram novas medidas de apoio à integração de imigrantes lusófonos no distrito. A organização já planeja uma segunda edição para o feriado de Thanksgiving com foco em empreendedorismo.',
    cidade: 'Newark',
    tipo: 'noticia',
    fonte_nome: 'Newark Star-Ledger',
    fonte_url: 'https://www.nj.com/2026/05/05/brazilian-festival-newark-ironbound/',
    etapa: 'com_midia',
    agente_atual: 'redacao.midia',
    imagem_url: 'https://cdn.facebrasil.com.br/img/festival-newark-2026.jpg',
    created_by: USER_SYSTEM,
    created_at: '2026-05-05T16:00:00.000Z',
    updated_at: '2026-05-06T08:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa07',
    company_id: COMPANY_ALPHA,
    titulo: 'Oportunidades de negócios em Atlanta atraem empreendedores brasileiros',
    conteudo_pt: 'Atlanta tem se consolidado como um dos principais polos de atração de empreendedores brasileiros nos Estados Unidos. O ecossistema de startups da cidade, combinado com o custo de vida mais acessível em comparação a Nova York e San Francisco, tem impulsionado a abertura de novos negócios liderados por brasileiros. Incubadoras locais como o Advanced Technology Development Center já contam com participantes brasileiros em seus programas de aceleração. Setores como tecnologia da informação, alimentação e serviços de saúde são os mais procurados pelos novos empreendedores.',
    cidade: 'Atlanta',
    tipo: 'noticia',
    fonte_nome: 'Atlanta Journal',
    fonte_url: 'https://www.ajc.com/2026/05/04/brazilian-business-opportunities-atlanta/',
    etapa: 'com_midia',
    agente_atual: 'redacao.midia',
    imagem_url: 'https://cdn.facebrasil.com.br/img/atlanta-business-brazilian.jpg',
    created_by: USER_SYSTEM,
    created_at: '2026-05-04T13:00:00.000Z',
    updated_at: '2026-05-05T11:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa08',
    company_id: COMPANY_ALPHA,
    titulo: 'Restaurante brasileiro em Tampa conquista premiação culinária regional',
    conteudo_pt: 'O restaurante Sabor da Terra, localizado no bairro de Ybor City em Tampa, recebeu o prêmio de melhor restaurante latino da região no concurso anual da Tampa Bay Dining Association. O chef-owner, Marcos Ribeiro, chegou à Flórida há oito anos e transformou seu pequeno negócio em uma referência da gastronomia brasileira no centro da Flórida. O cardápio combina pratos tradicionais como feijoada e moqueca com ingredientes locais da costa do Golfo do México. A conquista tem gerado visibilidade para a crescente cena gastronômica brasileira na região de Tampa Bay.',
    cidade: 'Tampa',
    tipo: 'noticia',
    fonte_nome: 'Tampa Bay Times',
    fonte_url: 'https://www.tampabay.com/2026/05/03/brazilian-restaurant-ybor-city-award/',
    etapa: 'redigido',
    agente_atual: 'redacao.jornalista',
    created_by: USER_SYSTEM,
    created_at: '2026-05-03T15:00:00.000Z',
    updated_at: '2026-05-04T09:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa09',
    company_id: COMPANY_ALPHA,
    titulo: 'Festival cultural brasileiro em Fort Lauderdale celebra diversidade e tradições',
    conteudo_pt: 'O Festival Cultural Brasil Fort Lauderdale, realizado no Las Olas Boulevard, celebrou a diversidade da comunidade brasileira no sul da Flórida com três dias de apresentações artísticas, oficinas de artesanato e mostras de cinema independente brasileiro. O evento, organizado pela Brazilian Cultural Center of South Florida, contou com a participação de artistas de diversos estados brasileiros e atraiu visitantes de Miami-Dade, Broward e Palm Beach. A programação incluiu rodas de capoeira, exposição de arte contemporânea e um seminário sobre preservação cultural na diáspora.',
    cidade: 'Fort Lauderdale',
    tipo: 'noticia',
    fonte_nome: 'South Florida Sun-Sentinel',
    fonte_url: 'https://www.sun-sentinel.com/2026/05/02/brazilian-cultural-festival-fort-lauderdale/',
    etapa: 'redigido',
    agente_atual: 'redacao.jornalista',
    created_by: USER_SYSTEM,
    created_at: '2026-05-02T14:00:00.000Z',
    updated_at: '2026-05-03T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa10',
    company_id: COMPANY_ALPHA,
    titulo: 'Encontro da comunidade brasileira em Nova York reúne centenas de famílias',
    conteudo_pt: 'Centenas de famílias brasileiras se reuniram no Central Park para o Encontro Anual da Comunidade Brasileira de Nova York. O evento promovido pela Brazilian American Association incluiu atividades para crianças, música ao vivo e um painel com autoridades consulares sobre os novos serviços disponíveis no Consulado Geral do Brasil em Nova York. Os participantes também puderam se inscrever em programas de assistência jurídica e profissional oferecidos por organizações parceiras.',
    cidade: 'New York City',
    tipo: 'noticia',
    fonte_nome: 'NYC Daily News',
    fonte_url: 'https://www.nydailynews.com/2026/05/01/brazilian-community-gathering-central-park/',
    etapa: 'coletado',
    agente_atual: 'redacao.monitor',
    created_by: USER_SYSTEM,
    created_at: '2026-05-01T10:00:00.000Z',
    updated_at: '2026-05-01T10:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa11',
    company_id: COMPANY_ALPHA,
    titulo: 'Política de deportação nos EUA gera preocupação entre brasileiros indocumentados',
    conteudo_pt: 'Erro no processamento.',
    cidade: 'New York City',
    tipo: 'noticia',
    fonte_nome: 'NYC Daily News',
    fonte_url: 'https://www.nydailynews.com/2026/04/30/deportation-policy-brazilian-undocumented/',
    etapa: 'erro',
    agente_atual: 'redacao.jornalista',
    retry_count: 3,
    created_by: USER_SYSTEM,
    created_at: '2026-04-30T12:00:00.000Z',
    updated_at: '2026-05-01T06:00:00.000Z',
  },
  {
    id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa12',
    company_id: COMPANY_ALPHA,
    titulo: 'Breve nota sobre evento em Newark',
    conteudo_pt: 'Evento ocorreu.',
    cidade: 'Newark',
    tipo: 'noticia',
    fonte_nome: 'Newark Star-Ledger',
    fonte_url: 'https://www.nj.com/2026/04/29/brief-event-newark/',
    etapa: 'reprovado',
    agente_atual: 'redacao.gestor',
    created_by: USER_SYSTEM,
    created_at: '2026-04-29T16:00:00.000Z',
    updated_at: '2026-04-30T08:00:00.000Z',
  },
] as Artigo[];

const initialUGC = [
  {
    id: 'uuuu1111-uuuu-4uuu-8uuu-uuuuuuuuuuu1',
    company_id: COMPANY_ALPHA,
    submissor: 'Carlos Eduardo Silva',
    email: 'carlos.silva@email.com',
    cidade: 'Miami',
    descricao: 'Vi uma manifestação na frente do consulado brasileiro em Miami sobre os novos requisitos de visto. Tenho fotos e vídeos do evento que podem ser úteis para uma matéria sobre o impacto das novas políticas consulares.',
    status: 'pendente',
    score_confianca: 72,
    auto_aprovavel: true,
    created_at: '2026-05-07T14:30:00.000Z',
  },
  {
    id: 'uuuu1111-uuuu-4uuu-8uuu-uuuuuuuuuuu2',
    company_id: COMPANY_ALPHA,
    submissor: 'Ana Paula Ferreira',
    email: 'ana.ferreira@email.com',
    cidade: 'Boston',
    descricao: 'O Hospital Massachusetts General está oferecendo atendimento médico gratuito para imigrantes sem documentos de saúde. Isso pode interessar muitos brasileiros na região de Boston que não têm seguro de saúde.',
    status: 'pendente',
    score_confianca: 45,
    auto_aprovavel: false,
    created_at: '2026-05-06T09:00:00.000Z',
  },
  {
    id: 'uuuu1111-uuuu-4uuu-8uuu-uuuuuuuuuuu3',
    company_id: COMPANY_ALPHA,
    submissor: 'Roberto Almeida',
    email: 'roberto.almeida@email.com',
    cidade: 'Newark',
    descricao: 'Informação sobre a inauguração do novo centro comunitário brasileiro na Ferry Street em Newark. O evento contou com a presença do prefeito e do cônsul brasileiro. Mais de duzentas pessoas participaram da cerimônia de abertura.',
    status: 'aceito',
    artigo_id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa06',
    score_confianca: 88,
    auto_aprovavel: true,
    created_at: '2026-05-05T16:00:00.000Z',
    updated_at: '2026-05-05T18:00:00.000Z',
  },
  {
    id: 'uuuu1111-uuuu-4uuu-8uuu-uuuuuuuuuuu4',
    company_id: COMPANY_ALPHA,
    submissor: 'XYZ Marketing LLC',
    email: 'spam@fakepromotions.net',
    cidade: 'Atlanta',
    descricao: 'GANHE DINHEIRO RÁPIDO!!! CLIQUE AQUI E DESCUBRA O SEGREDO DOS MILIONÁRIOS BRASILEIROS NOS EUA!!! OFERTA LIMITADA!!! COMPRE AGORA E RECEBA UM BÔNUS EXCLUSIVO!!!',
    status: 'rejeitado',
    score_confianca: 15,
    auto_aprovavel: false,
    created_at: '2026-05-04T22:00:00.000Z',
    updated_at: '2026-05-05T06:00:00.000Z',
  },
  {
    id: 'uuuu1111-uuuu-4uuu-8uuu-uuuuuuuuuuu5',
    company_id: COMPANY_ALPHA,
    submissor: 'Fernanda Costa',
    email: 'fernanda.costa@email.com',
    cidade: 'Orlando',
    descricao: 'Uma escola bilíngue português-inglês acaba de abrir em Orlando perto do Disney World. A escola oferece bolsas de estudo para filhos de famílias brasileiras de baixa renda e está com matrículas abertas para o segundo semestre de 2026.',
    status: 'pendente',
    score_confianca: 55,
    auto_aprovavel: false,
    created_at: '2026-05-07T11:00:00.000Z',
  },
] as UGCSubmission[];

const initialAlertas: Alerta[] = [
  {
    id: 'allll1111-alll-4all-8all-allllllllll1',
    company_id: COMPANY_ALPHA,
    tipo: 'falha_agente',
    mensagem: 'Agente Jornalista falhou ao processar o artigo sobre política de deportação após 3 tentativas.',
    nivel: 'error',
    resolvido: false,
    artigo_id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa11',
    agente: 'redacao.jornalista',
    created_at: '2026-05-01T06:00:00.000Z',
  },
  {
    id: 'allll1111-alll-4all-8all-allllllllll2',
    company_id: COMPANY_ALPHA,
    tipo: 'fonte_indisponivel',
    mensagem: 'Feed RSS do NYC Daily News está inacessível há mais de 48 horas. Coleta pausada automaticamente.',
    nivel: 'warn',
    resolvido: false,
    agente: 'redacao.monitor',
    created_at: '2026-05-06T08:00:00.000Z',
  },
  {
    id: 'allll1111-alll-4all-8all-allllllllll3',
    company_id: COMPANY_ALPHA,
    tipo: 'conteudo_sensivel',
    mensagem: 'Artigo sobre deportação de imigrantes brasileiros detectado como conteúdo sensível. Revisão manual recomendada antes da publicação.',
    nivel: 'warn',
    resolvido: false,
    artigo_id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa11',
    created_at: '2026-04-30T13:00:00.000Z',
  },
  {
    id: 'allll1111-alll-4all-8all-allllllllll4',
    company_id: COMPANY_ALPHA,
    tipo: 'qualidade_baixa',
    mensagem: 'Artigo reprovado por conteúdo insuficiente. Menos de 50 caracteres no campo de conteúdo.',
    nivel: 'info',
    resolvido: true,
    artigo_id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa12',
    resolvido_por: USER_SYSTEM,
    resolvido_em: '2026-05-01T10:00:00.000Z',
    created_at: '2026-04-30T08:00:00.000Z',
  },
  {
    id: 'allll1111-alll-4all-8all-allllllllll5',
    company_id: COMPANY_ALPHA,
    tipo: 'imagem_nao_encontrada',
    mensagem: 'Imagem destacada não encontrada para o artigo sobre o festival brasileiro em Newark. URL retornou status 404.',
    nivel: 'info',
    resolvido: false,
    artigo_id: 'aaaa1111-aaaa-4aaa-8aaa-aaaaaaaaaa06',
    created_at: '2026-05-06T12:00:00.000Z',
  },
  {
    id: 'allll1111-alll-4all-8all-allllllllll6',
    company_id: COMPANY_ALPHA,
    tipo: 'limite_api_atingido',
    mensagem: 'Limite de requisições da API OpenAI atingido. Agentes dependentes de LLM foram pausados temporariamente.',
    nivel: 'error',
    resolvido: true,
    agente: 'redacao.jornalista',
    resolvido_por: USER_SYSTEM,
    resolvido_em: '2026-05-05T14:00:00.000Z',
    created_at: '2026-05-05T12:00:00.000Z',
  },
];

const initialAgentes = [
  { id: 'ag-red-01', nome: 'Coletor', descricao: 'Monitor', fila_celery: 'redacao.monitor', status: 'online', tasks_ativas: 2, processadas_24h: 48, fila: 3, llm_primario: 'ollama' },
  { id: 'ag-red-02', nome: 'Jornalista', descricao: 'Redator', fila_celery: 'redacao.jornalista', status: 'processando', tasks_ativas: 4, processadas_24h: 22, fila: 7, llm_primario: 'claude' },
  { id: 'ag-red-03', nome: 'Arte', descricao: 'Midia', fila_celery: 'redacao.midia', status: 'online', tasks_ativas: 1, processadas_24h: 18, fila: 2, llm_primario: 'ollama' },
  { id: 'ag-red-04', nome: 'Editor Regional', descricao: 'Editor', fila_celery: 'redacao.editor', status: 'online', tasks_ativas: 2, processadas_24h: 15, fila: 4, llm_primario: 'claude' },
  { id: 'ag-red-05', nome: 'Chefe de Redação', descricao: 'Publisher', fila_celery: 'redacao.publisher', status: 'online', tasks_ativas: 1, processadas_24h: 10, fila: 1, llm_primario: 'ollama' },
  { id: 'ag-red-06', nome: 'Moderador', descricao: 'Gestor', fila_celery: 'redacao.gestor', status: 'online', tasks_ativas: 3, processadas_24h: 35, fila: 5, llm_primario: 'ollama' },
] as RedacaoAgent[];

let artigos: Artigo[] = [];
let fontes: FonteRSS[] = [];
let ugcSubmissions: UGCSubmission[] = [];
let alertas: Alerta[] = [];
let agentes: RedacaoAgent[] = [];

export function resetRedacaoStoreForTests() {
  artigos = clone(initialArtigos);
  fontes = clone(initialFontes);
  ugcSubmissions = clone(initialUGC);
  alertas = clone(initialAlertas);
  agentes = clone(initialAgentes);
}

resetRedacaoStoreForTests();

export function getRedacaoTestCompanyIds() {
  return { alpha: COMPANY_ALPHA, user: USER_SYSTEM };
}

export function parseArtigosQuery(url: string): ArtigosQuery {
  const params = new URL(url).searchParams;
  const rawEtapa = params.getAll('etapa').flatMap((item) => item.split(',')).filter(Boolean);
  const rawTipo = params.getAll('tipo').flatMap((item) => item.split(',')).filter(Boolean);

  try {
    return ArtigosQuerySchema.parse({
      busca: params.get('busca') ?? undefined,
      etapa: rawEtapa.length > 0 ? rawEtapa : undefined,
      cidade: params.get('cidade') ?? undefined,
      tipo: rawTipo.length > 0 ? rawTipo : undefined,
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

export function listArtigos(context: RedacaoRequestContext, query: Partial<ArtigosQuery> = {}) {
  const parsed = ArtigosQuerySchema.parse(query);

  const filtered = artigos.filter((artigo) => {
    if (artigo.company_id !== context.companyId) return false;
    if (parsed.busca) {
      const busca = parsed.busca.toLowerCase();
      if (!artigo.titulo.toLowerCase().includes(busca)) return false;
    }
    if (parsed.etapa && !parsed.etapa.includes(artigo.etapa)) return false;
    if (parsed.cidade && artigo.cidade !== parsed.cidade) return false;
    if (parsed.tipo && !parsed.tipo.includes(artigo.tipo)) return false;
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

export function getArtigo(context: RedacaoRequestContext, id: string) {
  const artigo = artigos.find((a) => a.id === id && a.company_id === context.companyId);
  if (!artigo) throw new RedacaoValidationError('Artigo not found.', 404);
  return artigo;
}

export function createArtigo(context: RedacaoRequestContext, data: unknown) {
  const input = parseJsonObject(data);
  try {
    const validated = ArtigoSchema.parse({
      ...input,
      company_id: context.companyId,
      created_by: context.userId,
      created_at: now(),
      updated_at: now(),
      id: crypto.randomUUID(),
    });
    artigos.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function updateArtigo(context: RedacaoRequestContext, id: string, data: unknown) {
  const artigo = artigos.find((a) => a.id === id && a.company_id === context.companyId);
  if (!artigo) throw new RedacaoValidationError('Artigo not found.', 404);

  const input = parseJsonObject(data);
  try {
    const validated = ArtigoSchema.partial().parse(input);
    Object.assign(artigo, validated, { updated_at: now() });
    return artigo;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function forceArtigoEtapa(context: RedacaoRequestContext, id: string, etapa: Artigo['etapa']) {
  const artigo = artigos.find((item) => item.id === id && item.company_id === context.companyId);
  if (!artigo) throw new RedacaoValidationError('Artigo not found.', 404);

  const allowedTransitions: Record<Artigo['etapa'], Artigo['etapa'][]> = {
    coletado: ['redigido', 'erro', 'reprovado'],
    redigido: ['com_midia', 'editado', 'erro', 'reprovado'],
    com_midia: ['editado', 'erro', 'reprovado'],
    editado: ['publicado', 'erro', 'reprovado'],
    publicado: [],
    erro: ['coletado', 'redigido', 'reprovado'],
    reprovado: [],
  };

  if (!allowedTransitions[artigo.etapa].includes(etapa)) {
    throw new RedacaoValidationError(`Invalid stage transition from ${artigo.etapa} to ${etapa}.`, 400);
  }

  artigo.etapa = etapa;
  artigo.updated_at = now();
  artigo.agente_atual = etapa === 'publicado' ? 'redacao.publisher' : artigo.agente_atual;
  artigo.publicado_em = etapa === 'publicado' ? now() : artigo.publicado_em;
  return artigo;
}

export function listFontes(context: RedacaoRequestContext) {
  return fontes.filter((f) => f.company_id === context.companyId);
}

export function createFonte(context: RedacaoRequestContext, data: unknown) {
  const input = parseJsonObject(data);
  try {
    const validated = FonteRSSSchema.parse({
      ...input,
      company_id: context.companyId,
      created_at: now(),
      id: crypto.randomUUID(),
    });
    fontes.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function updateFonte(context: RedacaoRequestContext, id: string, data: unknown) {
  const fonte = fontes.find((f) => f.id === id && f.company_id === context.companyId);
  if (!fonte) throw new RedacaoValidationError('Fonte not found.', 404);

  const input = parseJsonObject(data);
  try {
    const validated = FonteRSSSchema.partial().parse(input);
    Object.assign(fonte, validated);
    return fonte;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function removeFonte(context: RedacaoRequestContext, id: string) {
  const index = fontes.findIndex((item) => item.id === id && item.company_id === context.companyId);
  if (index === -1) throw new RedacaoValidationError('Fonte not found.', 404);
  const [removed] = fontes.splice(index, 1);
  return removed;
}

export function listUGC(context: RedacaoRequestContext, status?: string) {
  const result = ugcSubmissions.filter((u) => u.company_id === context.companyId);
  if (status) return result.filter((u) => u.status === status);
  return result;
}

export function createUGC(context: RedacaoRequestContext, data: unknown) {
  const input = parseJsonObject(data);
  try {
    const validated = UGCSubmissionSchema.parse({
      ...input,
      company_id: context.companyId,
      created_at: now(),
      updated_at: now(),
      id: crypto.randomUUID(),
    });
    ugcSubmissions.push(validated);
    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) throw normalizeZodError(error);
    throw error;
  }
}

export function aceitarUGC(context: RedacaoRequestContext, id: string) {
  const ugc = ugcSubmissions.find((u) => u.id === id && u.company_id === context.companyId);
  if (!ugc) throw new RedacaoValidationError('UGC submission not found.', 404);
  if (ugc.status !== 'pendente') throw new RedacaoValidationError('Only pending submissions can be accepted.', 422);

  const artigoId = crypto.randomUUID();
  const artigo = ArtigoSchema.parse({
    id: artigoId,
    company_id: context.companyId,
    titulo: `UGC: ${ugc.cidade ?? 'Sem cidade'} - ${ugc.descricao.slice(0, 60)}`,
    conteudo_pt: ugc.descricao,
    cidade: ugc.cidade ?? '',
    tipo: 'noticia',
    etapa: 'coletado',
    agente_atual: 'redacao.monitor',
    created_by: context.userId,
    created_at: now(),
    updated_at: now(),
  });
  artigos.push(artigo);

  ugc.status = 'aceito';
  ugc.artigo_id = artigoId;
  ugc.updated_at = now();

  return { ugc, artigo };
}

export function rejeitarUGC(context: RedacaoRequestContext, id: string, motivo: string) {
  const ugc = ugcSubmissions.find((u) => u.id === id && u.company_id === context.companyId);
  if (!ugc) throw new RedacaoValidationError('UGC submission not found.', 404);
  if (ugc.status !== 'pendente') throw new RedacaoValidationError('Only pending submissions can be rejected.', 422);
  if (!motivo || motivo.trim().length === 0) throw new RedacaoValidationError('Rejection reason is required.', 400);

  ugc.status = 'rejeitado';
  ugc.updated_at = now();
  return ugc;
}

export function listAlertas(
  context: RedacaoRequestContext,
  filters?: { nivel?: string; tipo?: string; resolvido?: boolean },
) {
  return alertas.filter((a) => {
    if (a.company_id !== context.companyId) return false;
    if (filters?.nivel && a.nivel !== filters.nivel) return false;
    if (filters?.tipo && a.tipo !== filters.tipo) return false;
    if (filters?.resolvido !== undefined && a.resolvido !== filters.resolvido) return false;
    return true;
  });
}

export function resolveAlerta(context: RedacaoRequestContext, id: string) {
  const alerta = alertas.find((a) => a.id === id && a.company_id === context.companyId);
  if (!alerta) throw new RedacaoValidationError('Alerta not found.', 404);
  alerta.resolvido = true;
  alerta.resolvido_por = context.userId;
  alerta.resolvido_em = now();
  return alerta;
}

export function resolveAllAlertas(context: RedacaoRequestContext) {
  const companyAlertas = alertas.filter((a) => a.company_id === context.companyId && !a.resolvido);
  for (const alerta of companyAlertas) {
    alerta.resolvido = true;
    alerta.resolvido_por = context.userId;
    alerta.resolvido_em = now();
  }
  return companyAlertas.length;
}

export function listAgentes() {
  return agentes;
}

export function getDashboardKpis(context: RedacaoRequestContext): DashboardKpis {
  const companyArtigos = artigos.filter((a) => a.company_id === context.companyId);
  const companyUGC = ugcSubmissions.filter((u) => u.company_id === context.companyId);
  const companyAlertas = alertas.filter((a) => a.company_id === context.companyId);
  const companyFontes = fontes.filter((f) => f.company_id === context.companyId);

  const todayStr = today();
  const publicadosHoje = companyArtigos.filter((a) => a.etapa === 'publicado' && a.publicado_em?.startsWith(todayStr)).length;

  const emProducao = companyArtigos.filter(
    (a) => a.etapa === 'coletado' || a.etapa === 'redigido' || a.etapa === 'com_midia' || a.etapa === 'editado',
  ).length;

  const artigosPorEtapa = Object.entries(
    companyArtigos.reduce((acc, a) => {
      acc[a.etapa] = (acc[a.etapa] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  ).map(([etapa, count]) => ({ etapa, count }));

  const artigosPorCidade = Object.entries(
    companyArtigos.reduce((acc, a) => {
      const cidade = a.cidade ?? 'Sem cidade';
      acc[cidade] = (acc[cidade] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  ).map(([cidade, count]) => ({ cidade, count }));

  const artigosPorTipo = Object.entries(
    companyArtigos.reduce((acc, a) => {
      const tipo = a.tipo ?? 'Sem tipo';
      acc[tipo] = (acc[tipo] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  ).map(([tipo, count]) => ({ tipo, count }));

  const alertasPorNivel = Object.entries(
    companyAlertas.reduce((acc, a) => {
      const nivel = a.nivel ?? 'info';
      acc[nivel] = (acc[nivel] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  ).map(([nivel, count]) => ({ nivel, count }));

  return {
    total_artigos: companyArtigos.length,
    publicados_hoje: publicadosHoje,
    em_producao: emProducao,
    ugc_pendentes: companyUGC.filter((u) => u.status === 'pendente').length,
    alertas_ativos: companyAlertas.filter((a) => !a.resolvido).length,
    fontes_ativas: companyFontes.filter((f) => f.ativo).length,
    artigos_por_etapa: artigosPorEtapa,
    artigos_por_cidade: artigosPorCidade,
    artigos_por_tipo: artigosPorTipo,
    agentes: agentes,
    alertas_por_nivel: alertasPorNivel,
  };
}
