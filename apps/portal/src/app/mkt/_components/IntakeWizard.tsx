'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const ALLOWED_EXTENSIONS = ['.pdf', '.docx'];
const MAX_SIZE_MB = 20;

type IntakeMode = 'wizard' | 'upload';

interface WizardData {
  nome: string;
  nicho: string;
  descricao: string;
  objetivos: string;
}

export function IntakeWizard() {
  const router = useRouter();
  const [mode, setMode] = useState<IntakeMode>('wizard');
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [wizard, setWizard] = useState<WizardData>({ nome: '', nicho: '', descricao: '', objetivos: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateFile = useCallback((f: File): string | null => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) return `Tipo nao aceito. Use: ${ALLOWED_EXTENSIONS.join(', ')}`;
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `Arquivo muito grande (max. ${MAX_SIZE_MB}MB)`;
    return null;
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) {
      const err = validateFile(f);
      if (err) { setError(err); return; }
      setFile(f);
      setError(null);
    }
  }, [validateFile]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) {
      const err = validateFile(f);
      if (err) { setError(err); return; }
      setFile(f);
      setError(null);
    }
  }, [validateFile]);

  const canSubmit = mode === 'wizard'
    ? wizard.nome.length >= 3 && wizard.nicho.length > 0
    : file !== null;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);

    try {
      let bodyInit: BodyInit;
      let headersInit: Record<string, string> = {
        'x-user-id': '33333333-3333-4333-8333-333333333333',
        'x-company-id': '11111111-1111-4111-8111-111111111111',
      };

      if (mode === 'upload' && file) {
        const formData = new FormData();
        formData.append('nome', wizard.nome);
        formData.append('nicho', wizard.nicho);
        formData.append('file', file);
        bodyInit = formData;
      } else {
        headersInit['Content-Type'] = 'application/json';
        bodyInit = JSON.stringify({
          nome: wizard.nome,
          nicho: wizard.nicho,
          descricao: wizard.descricao,
          objetivos: wizard.objetivos,
        });
      }

      const res = await fetch('/api/proxy/mkt/estrategias', {
        method: 'POST',
        headers: headersInit,
        body: bodyInit,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message ?? 'Erro ao criar estrategia');
      }

      const data = await res.json();
      router.push(`/mkt/estrategias/${data.estrategia.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="mkt-shell fbr-shared-theme">
      <nav className="mkt-breadcrumb">
        <Link href="/">Portal</Link>
        <span>/</span>
        <Link href="/mkt">MKT</Link>
        <span>/</span>
        <span>Nova Estrategia</span>
      </nav>

      <section className="mkt-hero">
        <div>
          <p>FBR-MKT</p>
          <h1>Nova Estrategia</h1>
          <span>Descreva sua empresa ou faca upload de um documento de viabilidade.</span>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-intake-tabs">
          <button
            className={`mkt-tab ${mode === 'wizard' ? 'mkt-tab--active' : ''}`}
            onClick={() => setMode('wizard')}
          >
            Descricao da Empresa
          </button>
          <button
            className={`mkt-tab ${mode === 'upload' ? 'mkt-tab--active' : ''}`}
            onClick={() => setMode('upload')}
          >
            Upload de Documento
          </button>
        </div>

        <div className="mkt-intake-form">
          <div className="mkt-field">
            <label htmlFor="nome">Nome da Estrategia *</label>
            <input
              id="nome"
              type="text"
              placeholder="Ex: Crescimento Digital Q3 2026"
              value={wizard.nome}
              onChange={(e) => setWizard({ ...wizard, nome: e.target.value })}
              minLength={3}
              required
            />
          </div>

          <div className="mkt-field">
            <label htmlFor="nicho">Nicho de Mercado *</label>
            <input
              id="nicho"
              type="text"
              placeholder="Ex: Tecnologia B2B, E-commerce Moda"
              value={wizard.nicho}
              onChange={(e) => setWizard({ ...wizard, nicho: e.target.value })}
              required
            />
          </div>

          {mode === 'wizard' && (
            <>
              <div className="mkt-field">
                <label htmlFor="descricao">Descricao da Empresa</label>
                <textarea
                  id="descricao"
                  placeholder="Descreva sua empresa, produtos/servicos e mercado atendido..."
                  value={wizard.descricao}
                  onChange={(e) => setWizard({ ...wizard, descricao: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="mkt-field">
                <label htmlFor="objetivos">Objetivos de Marketing</label>
                <textarea
                  id="objetivos"
                  placeholder="Quais sao seus principais objetivos de marketing?"
                  value={wizard.objetivos}
                  onChange={(e) => setWizard({ ...wizard, objetivos: e.target.value })}
                  rows={3}
                />
              </div>
            </>
          )}

          {mode === 'upload' && (
            <div
              className={`mkt-dropzone ${dragActive ? 'mkt-dropzone--active' : ''} ${file ? 'mkt-dropzone--filled' : ''}`}
              onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="mkt-file-info">
                  <span className="mkt-file-icon">📄</span>
                  <strong>{file.name}</strong>
                  <small>{(file.size / 1024 / 1024).toFixed(1)}MB</small>
                  <button onClick={() => setFile(null)} className="mkt-link-btn">Remover</button>
                </div>
              ) : (
                <>
                  <p>Arraste um PDF ou DOCX aqui</p>
                  <small>Max. {MAX_SIZE_MB}MB</small>
                  <label className="mkt-upload-btn">
                    Selecionar Arquivo
                    <input
                      type="file"
                      accept=".pdf,.docx"
                      onChange={handleFileInput}
                      hidden
                    />
                  </label>
                </>
              )}
            </div>
          )}

          {error && <div className="mkt-alert mkt-alert--error">{error}</div>}

          <button
            className="mkt-submit-btn"
            disabled={!canSubmit || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Criando...' : 'Iniciar Analise'}
          </button>
        </div>
      </section>
    </main>
  );
}
