import { describe, expect, it } from 'vitest';
import { buildCalendarAndRoadmapArtifacts, buildCopyAndLeadMagnetArtifacts } from './artifacts';

const estrategiaId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

function generatedCopy() {
  return {
    variants: [
      { canal: 'linkedin', tipo: 'headline', campanha_nome: 'Diagnostico', conteudo: 'Headline', tom: 'consultivo' },
      { canal: 'linkedin', tipo: 'cta', campanha_nome: 'Diagnostico', conteudo: 'CTA', tom: 'consultivo' },
      { canal: 'email', tipo: 'body', campanha_nome: 'Diagnostico', conteudo: 'Body', tom: 'consultivo' },
      { canal: 'landing page', tipo: 'landing_page', campanha_nome: 'Diagnostico', conteudo: 'Landing', tom: 'consultivo' },
      { canal: 'email', tipo: 'email', campanha_nome: 'Diagnostico', conteudo: 'Email', tom: 'consultivo' },
    ],
    lead_magnets: Array.from({ length: 5 }, (_, index) => ({
      nome: `Lead Magnet ${index + 1}`,
      persona_alvo: 'Diretor Comercial',
      funil_estagio: index < 2 ? 'topo' : index < 4 ? 'meio' : 'fundo',
      landing_page: {
        hero: `Hero ${index + 1}`,
        beneficios: ['Clareza', 'Priorizacao'],
        social_proof: 'Usado por times B2B.',
        cta: 'Baixar material',
      },
      nurture_emails: Array.from({ length: 5 }, (_, emailIndex) => ({
        assunto: `Email ${emailIndex + 1}`,
        corpo: `Conteudo ${emailIndex + 1}`,
        dia_envio: emailIndex * 2,
      })),
    })),
  };
}

function generatedCalendar() {
  return {
    tarefas: Array.from({ length: 90 }, (_, day) => ({
      dias_a_frente: day,
      canal: day % 2 === 0 ? 'linkedin' : 'google ads',
      tipo: day % 3 === 0 ? 'pago' : 'organico',
      tema: `Pauta ${day + 1}`,
      copy_resumo: `Resumo ${day + 1}`,
      is_quick_win: day < 10,
    })),
    roadmap_tasks: [
      {
        fase: '0-30d',
        item: 'Publicar quick wins',
        responsavel: 'Marketing',
        ferramenta: 'LinkedIn',
        status: 'pendente',
        alerta_prazo: '2026-05-20',
      },
      {
        fase: '30-60d',
        item: 'Escalar campanha paga',
        responsavel: 'Performance',
        ferramenta: 'Google Ads',
        status: 'pendente',
        alerta_prazo: '2026-06-20',
      },
      {
        fase: '60-90d',
        item: 'Otimizar funil',
        responsavel: 'Growth',
        ferramenta: 'CRM',
        status: 'pendente',
        alerta_prazo: '2026-07-20',
      },
    ],
  };
}

describe('MKT tactical artifact contracts', () => {
  it('builds the PRD-required lead magnets with landing pages and nurture emails', () => {
    const result = buildCopyAndLeadMagnetArtifacts(generatedCopy(), estrategiaId, 3);

    expect(result.variants.map((item) => item.tipo)).toEqual(expect.arrayContaining(['headline', 'cta', 'body', 'landing_page', 'email']));
    expect(result.leadMagnets).toHaveLength(5);
    expect(result.leadMagnets.every((magnet) => magnet.versao === 3)).toBe(true);
    expect(result.leadMagnets.every((magnet) => magnet.landing_page.hero && magnet.landing_page.cta)).toBe(true);
    expect(result.leadMagnets.every((magnet) => magnet.nurture_emails.length >= 5 && magnet.nurture_emails.length <= 7)).toBe(true);
  });

  it('requires a 90-day calendar and quick wins inside the first 30 days', () => {
    const result = buildCalendarAndRoadmapArtifacts(
      generatedCalendar(),
      estrategiaId,
      4,
      new Date('2026-05-13T00:00:00.000Z'),
    );

    expect(result.calendario).toHaveLength(90);
    expect(result.calendario[0]).toMatchObject({ data: '2026-05-13', is_quick_win: true, versao: 4 });
    expect(result.calendario[89]).toMatchObject({ data: '2026-08-10', is_quick_win: false });
    expect(result.calendario.filter((item) => item.is_quick_win).every((item) => item.data <= '2026-06-11')).toBe(true);
  });

  it('builds roadmap tasks for all PRD execution phases with alert metadata', () => {
    const result = buildCalendarAndRoadmapArtifacts(generatedCalendar(), estrategiaId, 4);

    expect(result.roadmap.map((task) => task.fase)).toEqual(['0-30d', '30-60d', '60-90d']);
    expect(result.roadmap.every((task) => task.responsavel && task.ferramenta && task.alerta_prazo)).toBe(true);
  });
});
