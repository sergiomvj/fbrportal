'use client';

import Link from 'next/link';

type ContentTipo = 'organic' | 'paid' | 'quickwin';

interface CalItem {
  semana: string;
  conteudo: string;
  tipo: ContentTipo;
  canal: string;
  status: 'planejado' | 'publicado' | 'pendente';
}

const tipoLabels: Record<ContentTipo, string> = { organic: 'Organico', paid: 'Pago', quickwin: 'Quick Win' };

const calendario: CalItem[] = [
  { semana: 'Semana 1', conteudo: 'Post lancamento produto', tipo: 'organic', canal: 'Instagram', status: 'publicado' },
  { semana: 'Semana 1', conteudo: 'Stories bastidores', tipo: 'organic', canal: 'Instagram', status: 'publicado' },
  { semana: 'Semana 2', conteudo: 'Anuncio campanha awareness', tipo: 'paid', canal: 'Meta Ads', status: 'publicado' },
  { semana: 'Semana 2', conteudo: 'Blog post SEO', tipo: 'organic', canal: 'Blog', status: 'publicado' },
  { semana: 'Semana 3', conteudo: 'Email nurturing sequence', tipo: 'organic', canal: 'Email', status: 'publicado' },
  { semana: 'Semana 3', conteudo: 'Quick win: CTA otimizado', tipo: 'quickwin', canal: 'Landing Page', status: 'publicado' },
  { semana: 'Semana 4', conteudo: 'Video testimonial', tipo: 'organic', canal: 'YouTube', status: 'planejado' },
  { semana: 'Semana 4', conteudo: 'Retargeting visitantes', tipo: 'paid', canal: 'Google Ads', status: 'planejado' },
  { semana: 'Semana 5', conteudo: 'Carrossel educativo', tipo: 'organic', canal: 'LinkedIn', status: 'planejado' },
  { semana: 'Semana 6', conteudo: 'Webinar conversao', tipo: 'organic', canal: 'Zoom', status: 'pendente' },
  { semana: 'Semana 7', conteudo: 'Campanha lead magnet', tipo: 'paid', canal: 'Meta Ads', status: 'pendente' },
  { semana: 'Semana 8', conteudo: 'Case study PDF', tipo: 'organic', canal: 'Blog', status: 'pendente' },
  { semana: 'Semana 9', conteudo: 'Quick win: headline test', tipo: 'quickwin', canal: 'Landing Page', status: 'pendente' },
  { semana: 'Semana 10', conteudo: 'Podcast entrevista', tipo: 'organic', canal: 'Spotify', status: 'pendente' },
  { semana: 'Semana 11', conteudo: 'Anuncio conversao', tipo: 'paid', canal: 'Google Ads', status: 'pendente' },
  { semana: 'Semana 12', conteudo: 'Relatorio trimestral', tipo: 'organic', canal: 'Email', status: 'pendente' },
];

export function CalendarioShell() {
  const semanas = [...new Set(calendario.map((item) => item.semana))];

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <Link href="/mkt">MKT</Link>
        <span>/</span>
        <span>Calendario 90 dias</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Calendario 90 Dias</h1>
          <span>Grade editorial com distribuicao organica, paga e quick wins.</span>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-table-wrap">
          <table className="mkt-table">
            <thead>
              <tr>
                <th scope="col">Semana</th>
                <th scope="col">Conteudo</th>
                <th scope="col">Tipo</th>
                <th scope="col">Canal</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {semanas.map((semana) =>
                calendario
                  .filter((item) => item.semana === semana)
                  .map((item, idx) => (
                    <tr key={`${item.semana}-${idx}`}>
                      <td>{item.semana}</td>
                      <th scope="row">{item.conteudo}</th>
                      <td>
                        <span className={`mkt-badge ${item.tipo === 'paid' ? 'mkt-badge--planejada' : item.tipo === 'quickwin' ? 'mkt-badge--pausada' : 'mkt-badge--ativa'}`}>
                          {tipoLabels[item.tipo]}
                        </span>
                      </td>
                      <td>{item.canal}</td>
                      <td>
                        <span className={`mkt-badge ${item.status === 'publicado' ? 'mkt-badge--ativa' : item.status === 'planejado' ? 'mkt-badge--planejada' : 'mkt-badge--rascunho'}`}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  )),
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
