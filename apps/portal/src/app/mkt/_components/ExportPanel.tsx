'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { MktExport } from '@/lib/mkt/types';

export function ExportPanel() {
  const params = useParams();
  const id = params.id as string;
  const [exportsList, setExportsList] = useState<MktExport[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      const expRes = await fetch(`/api/proxy/mkt/estrategias/${id}/export`);
      if (expRes.ok) {
        const d = await expRes.json();
        setExportsList(d.exports ?? []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [id]);

  const handleGenerate = async (formato: 'pdf' | 'pptx') => {
    setGenerating(formato);
    try {
      const res = await fetch(`/api/proxy/mkt/estrategias/${id}/export`, {
        method: 'POST',
        body: JSON.stringify({ formato }),
      });
      if (res.ok) {
        const d = await res.json();
        setExportsList((prev) => [d.export, ...prev]);
      }
    } catch { /* ignore */ }
    finally { setGenerating(null); }
  };

  if (loading) return <main className="mkt-shell fbr-shared-theme"><p>Carregando...</p></main>;

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link><span>/</span>
        <Link href="/mkt">MKT</Link><span>/</span>
        <Link href={`/mkt/estrategias/${id}`}>Estrategia</Link><span>/</span>
        <span>Exportar</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Exportacao</h1>
          <span>Gere documentos PDF e PPTX com branding da empresa</span>
        </div>
      </section>

      <section className="mkt-section">
        <header><p>Gerar</p><h2>Novo Documento</h2></header>
        <div className="mkt-export-actions">
          <button
            className="mkt-export-btn"
            onClick={() => handleGenerate('pdf')}
            disabled={generating !== null}
          >
            {generating === 'pdf' ? 'Gerando PDF...' : '📄 Gerar PDF Executivo'}
          </button>
          <button
            className="mkt-export-btn"
            onClick={() => handleGenerate('pptx')}
            disabled={generating !== null}
          >
            {generating === 'pptx' ? 'Gerando PPTX...' : '📊 Gerar PPTX Apresentacao'}
          </button>
        </div>
      </section>

      <section className="mkt-section">
        <header><p>Historico</p><h2>Exportacoes</h2></header>
        {exportsList.length === 0 ? (
          <p>Nenhuma exportacao gerada ainda.</p>
        ) : (
          <div className="mkt-table-wrap">
            <table className="mkt-table">
              <thead>
                <tr>
                  <th>Formato</th><th>Versao</th><th>Status</th><th>Data</th><th>Acao</th>
                </tr>
              </thead>
              <tbody>
                {exportsList.map((exp) => (
                  <tr key={exp.id}>
                    <td><span className="mkt-badge mkt-badge--planejada">{exp.formato.toUpperCase()}</span></td>
                    <td>v{exp.versao}</td>
                    <td><span className={`mkt-badge mkt-badge--${exp.status === 'done' ? 'ativa' : exp.status === 'failed' ? 'rascunho' : 'pausada'}`}>{exp.status}</span></td>
                    <td>{new Date(exp.created_at ?? '').toLocaleDateString('pt-BR')}</td>
                    <td>
                      {exp.status === 'done' && exp.signed_url ? (
                        <a href={exp.signed_url} className="mkt-link-btn" download>Download</a>
                      ) : exp.status === 'failed' ? (
                        <span className="mkt-alert-text">Falhou</span>
                      ) : (
                        <span>Processando...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mkt-section">
        <header><p>Pacote</p><h2>Assets de Captacao</h2></header>
        <p>O pacote de captacao inclui todos os assets gerados: copywriting, lead magnets, landing pages e sequencias de email.</p>
        <div className="mkt-captacao-pack">
          <div className="mkt-captacao-item">
            <span>📝</span>
            <strong>Copywriting</strong>
            <small>Headlines, CTAs, body copy</small>
          </div>
          <div className="mkt-captacao-item">
            <span>🎯</span>
            <strong>Lead Magnets</strong>
            <small>5-10 iscas digitais</small>
          </div>
          <div className="mkt-captacao-item">
            <span>📧</span>
            <strong>Email Nurture</strong>
            <small>5-7 emails por lead magnet</small>
          </div>
          <div className="mkt-captacao-item">
            <span>🖥️</span>
            <strong>Landing Pages</strong>
            <small>Copy para cada lead magnet</small>
          </div>
        </div>
      </section>
    </main>
  );
}
