import { createSupabaseServerClient } from '../supabase-admin';
import { MktRequestContext, createEstrategia, saveDiagnostico } from './store';
import type { MktDiagnostico } from './types';

export interface ProjectMarketingData {
  marketing_strategy: {
    value_proposition: string | { content: string };
    target_audience: {
      primary: string;
      secondary: string;
    };
    approach_strategy: string;
    channels: Array<{ name: string; description: string; priority: string }>;
    tactics: Array<{ tactic: string; description: string; timeline: string }>;
  };
  lead_generation_strategy: {
    lead_magnets: Array<{ name: string; description: string }>;
    conversion_tactics: Array<{ tactic: string; description: string }>;
  };
}

export async function importProjectToMarketing(projectId: string, context: MktRequestContext) {
  const supabase = createSupabaseServerClient();
  
  // 1. Buscar dados do projeto
  const { data: project, error: pError } = await supabase
    .from('projects')
    .select('name, metadata')
    .eq('id', projectId)
    .single();

  if (pError || !project) {
    throw new Error(`Projeto não encontrado: ${pError?.message}`);
  }

  const metadata = project.metadata as unknown as ProjectMarketingData;
  if (!metadata.marketing_strategy) {
    throw new Error('O projeto selecionado não possui dados de estratégia de marketing no metadata.');
  }

  // 2. Criar a Estratégia no módulo de Marketing
  const estrategia = await createEstrategia(context, {
    nome: `Estratégia: ${project.name}`,
    nicho: 'Importado do Builder',
    status: 'revisao' // Começa em revisão para o usuário validar o diagnóstico
  });

  // 3. Mapear para o formato de Diagnóstico do Marketing
  const uvp = typeof metadata.marketing_strategy.value_proposition === 'string' 
    ? metadata.marketing_strategy.value_proposition 
    : metadata.marketing_strategy.value_proposition.content;

  const diagnostico: Omit<MktDiagnostico, 'id' | 'created_at'> = {
    estrategia_id: estrategia.id!,
    uvp,
    persona: {
      nome: 'Persona Primária',
      idade: 'N/A',
      profissao: metadata.marketing_strategy.target_audience.primary,
      dores: ['Dores identificadas no projeto'],
      desejos: ['Objetivos do projeto'],
      comportamento_digital: 'Foco nos canais selecionados',
      canais_preferidos: metadata.marketing_strategy.channels.map(c => c.name),
    },
    swot: {
      forcas: ['Proposta de valor clara'],
      fraquezas: ['Fase inicial'],
      oportunidades: metadata.marketing_strategy.channels.map(c => `Crescimento via ${c.name}`),
      ameacas: ['Competição de mercado'],
    },
    score_viab: 85,
    justificativa: metadata.marketing_strategy.approach_strategy,
    aprovado: false
  };

  await saveDiagnostico(diagnostico);

  return { estrategiaId: estrategia.id, status: 'success' };
}
