# Backlog pendente por modulo contra PRDs

## Objetivo

Este documento lista, modulo por modulo, o que ainda falta fazer para concluir a conformidade do FBR Portal com os PRDs/SPECs. Ele deriva do estado registrado em `docs/finalizacao-repo-prioridades.md`, das stories de conformidade e da memoria da automacao `fechar-conformidade-prds-fbrportal`.

Nao marcar um item como concluido sem:

- codigo implementado no repo;
- teste ou contrato cobrindo o comportamento;
- evidencia registrada em story/checklist;
- gates minimos verdes: `npm run lint`, `npm run typecheck`, `npm test`.

## Resumo executivo

| Modulo | Status atual | Proximo foco objetivo |
|---|---|---|
| FBR-MKT | Concluido no estado atual da automacao | Revalidar apenas se houver regressao ou mudanca de contrato |
| FBR-Leads | Parcial | Scoring/ICP, cadencia, deliverability e handoff E2E |
| FBR-Click | Parcial | Revisao final de agentes, message hub, documentos/archive e matriz de conformidade |
| FBR-Sales | Parcial com blocker de fonte | Resolver conflito `onboarding` vs `prospect`; fechar lifecycle e media kits |
| FBR-Redacao | Pendente/parcial | Pipeline editorial real, WordPress, RSS/UGC, SSE e alertas |
| FBR-Design | Pendente/parcial | Brand kits reais, jobs, render, aprovacoes e integracoes |
| FBR-Social | Pendente/parcial | Pipeline de producao/render, ZIP, quality checks e Design -> Social |
| FBR-Finance | Parcial/bloqueado por stories | Recebimentos/pagamentos completos, conciliacao, forecast, auditoria e alertas |
| Portal UI / Oraculo | Transversal pendente | Integrar Oraculo na shell do portal |
| FBR-VideoFlow | Fora da fila principal atual | Tratar em plano separado |

## Stories executaveis geradas

O backlog deste documento foi transformado no pacote de stories `3.x`, com mapa de execucao em `docs/stories/3.0.prd-backlog-execution-map.md`.

A revisao de recursos de sistema de 2026-05-14 gerou tambem o pacote `4.x`, com mapa de execucao em `docs/stories/4.0.system-resources-conformity-execution-map.md`. Esse pacote deve ser priorizado antes de marcar qualquer modulo como conforme, porque detalha o que precisa ser implementado, mudado ou refeito para remover stores em memoria, fixtures operacionais, jobs locais e readiness incompleto.

Proxima story executavel recomendada: `docs/stories/4.1.fbr-leads-runtime-supabase-source-capture.md`.

Stories 4.x criadas:

- `docs/stories/4.1.fbr-leads-runtime-supabase-source-capture.md`
- `docs/stories/4.2.fbr-leads-scoring-cadence-operational-runtime.md`
- `docs/stories/4.3.fbr-click-persistent-crm-audit-runtime.md`
- `docs/stories/4.4.fbr-sales-persistent-revenue-readiness-runtime.md`
- `docs/stories/4.5.fbr-finance-persistent-reconciliation-runtime.md`
- `docs/stories/4.6.fbr-redacao-persistent-editorial-workers.md`
- `docs/stories/4.7.fbr-design-persistent-render-storage-runtime.md`
- `docs/stories/4.8.fbr-social-persistent-render-zip-runtime.md`
- `docs/stories/4.9.portal-oraculo-persistent-shell-index-runtime.md`
- `docs/stories/4.10.videoflow-persistent-runtime-conformity-plan.md`
- `docs/stories/4.11.cross-module-rate-limit-sse-readiness-hardening.md`

---

## 1. FBR-MKT

### Status

Concluido no estado atual conhecido. A automacao fechou MKT com gates verdes e evidencia em `docs/stories/2.5.fbr-mkt-conformity-alignment.md`.

### Itens pendentes

- Nenhum gap funcional novo conhecido no MKT no estado atual.
- Manter somente revalidacao se outro modulo alterar contratos compartilhados, especialmente:
  - `MKT -> Click` via `strategy.exported`;
  - export PDF/PPTX;
  - fila/jobs/SSE/rate-limit;
  - chat contextual.

### Evidencia atual

- Bridge `strategy.exported` validada sem modo `skipped` quando configurada.
- Chat contextual validado com diagnostico, estrategia, copy/captacao, calendario e roadmap.
- Worker MKT filtra `next_attempt_at` antes do batch limit e persiste timestamps terminais de jobs para SSE/status.
- Gates globais verdes no ultimo fechamento MKT.

---

## 2. FBR-Leads

### Status

Parcial. O handoff `Leads -> Click` foi validado e a Story 3.1.1 fechou a base de source capture/persistencia, mas o modulo ainda nao esta completo contra o PRD.

### Falta fazer

- Dashboard operacional de leads com KPIs e funil visual completo.
- CRUD completo de ICPs.
- Pipeline visual de leads em 7 etapas.
- Gestao de dominios de envio.
- Templates de email.
- Cadencia de email com 4 toques.
- Painel de agentes do modulo.
- Modelo de dados completo para leads, ICPs, dominios e cadencias: base de persistencia/RLS criada em `supabase/migrations/20260514000001_create_leads_source_capture_tables.sql`; ainda falta conectar todos os fluxos operacionais a persistencia real.
- Ingestao de leads a partir das fontes previstas: source runs e normalizacao para LinkedIn, CNPJ.biz, Google Maps e sites entregues na Story 3.1.1; ainda falta worker/scheduler real para coleta externa automatizada.
- Algoritmo de scoring com 12 variaveis, bonus e penalidades.
- Logica completa de matching com ICP.
- Monitoramento de saude de dominios, bounce, aquecimento e pausas automaticas.
- Times/agentes OpenClaw do modulo com responsabilidades reais.
- Workflows de monitoramento, captacao e cadencia via n8n, ou equivalente aprovado no repo.
- Persistencia/worker real para fluxo de captacao e cadencia.
- Revisao de RLS/proxy para evitar bypass e vazamento cross-company.
- Relatorios operacionais do modulo.

### Evidencia fechada em 2026-05-14

- `POST /api/proxy/leads/source-runs` cria source runs auditaveis para `linkedin`, `cnpj_biz`, `google_maps` e `site`.
- Cada source record preserva payload bruto, chave de origem, timestamp, lead normalizado e status de duplicidade.
- Deduplicacao impede leads ativos duplicados por empresa usando email, CNPJ, site ou chave de origem.
- Runs com blocker externo usam `fail_reason` e ficam em estado terminal `failed`.
- Gates verdes: lint, typecheck, testes completos e build.

### Integracao pendente ou a revalidar

- `Leads -> Click` via `lead.qualified` ja tem contrato parcial validado, mas precisa ser revalidado no fluxo ponta a ponta real:
  - lead captado;
  - score calculado;
  - ICP match;
  - cadencia executada;
  - lead qualificado;
  - handoff para Click.

### Criterio de fechamento

- Fluxo completo `captacao -> scoring -> ICP match -> cadencia -> qualificacao -> Click` funcionando com teste de contrato.
- Gates verdes e evidencia na story `docs/stories/2.4.fbr-leads-conformity-alignment.md`.

---

## 3. FBR-Click

### Status

Parcial. Integracoes `MKT -> Click`, `Leads -> Click` e `Click -> Sales` possuem evidencias parciais, mas o modulo ainda precisa revisao final contra PRD.

### Falta fazer

- Revisar pipeline visual de deals contra as etapas oficiais do PRD.
- Validar criacao manual de deal.
- Validar criacao automatica de deal via `lead.qualified` em fluxo real.
- Completar ficha do deal.
- Garantir timeline de eventos append-only.
- Completar mensagens do deal.
- Completar tarefas do deal.
- Validar transicao de estagio com regras e rastreabilidade.
- Revisar painel de agentes OpenClaw.
- Implementar ou validar trigger e status de agentes.
- Revisar KPIs comerciais do modulo.
- Fechar audit log e export de auditoria.
- Garantir superficies para eventos cross-module recebidos:
  - `lead.qualified`;
  - `strategy.exported`;
  - `deal.closed`.
- Revisar restricoes por papel, especialmente controles administrativos.
- Fechar coesao entre UI, schema e historico de eventos.
- Revisar message hub.
- Revisar documentos/archive.
- Produzir matriz final de conformidade Click.

### Integracoes pendentes ou a revalidar

- `Leads -> Click`: validar ponta a ponta com lead real do modulo Leads.
- `MKT -> Click`: manter contrato `strategy.exported` ja validado.
- `Click -> Sales`: contrato `deal.closed` ja validado em recorte, mas precisa entrar na matriz final.

### Criterio de fechamento

- Lead qualificado cria deal.
- Deal evolui por estagios.
- Mensagens, tarefas e auditoria funcionam.
- Evento vindo do MKT aparece como evento cross-module valido.
- Deal fechado gera entrada correta em Sales.
- Gates verdes e evidencia na story `docs/stories/2.2.fbr-click-conformity-alignment.md`.

---

## 4. FBR-Sales

### Status

Parcial com blocker de fonte. O webhook `deal.closed` e o repasse `Sales -> Finance` possuem evidencia, mas ainda existe conflito documentado entre `DOCUMENTO_GERAL.md` e `TASK-SA18` sobre estado inicial.

### Falta fazer

- Resolver decisao de produto/arquitetura:
  - estado inicial atual: `onboarding`;
  - `TASK-SA18` exige: `prospect`.
- Fechar lifecycle de parceiros comerciais.
- Completar regras de aprovacao e revisao de cadastros quando exigido.
- Completar gestao de espacos/produtos comerciais.
- Completar media kits.
- Completar cards e tabelas de receita.
- Revisar dashboard comercial com KPIs.
- Completar fluxo de onboarding/ativacao comercial apos fechamento.
- Implementar cobertura de anomalias comerciais.
- Completar superficies de agentes do modulo.
- Completar observabilidade de eventos comerciais.
- Fechar integracao `Design -> Sales` para aprovacao/uso de criativos e media kits.
- Revalidar gates globais depois do fechamento.

### Integracoes pendentes ou a revalidar

- `Click -> Sales`: webhook ja implementado, precisa entrar no fluxo final do modulo.
- `Sales -> Finance`: recorte validado, mas precisa compor fechamento total.
- `Design -> Sales`: pendente.

### Criterio de fechamento

- Deal fechado no Click entra corretamente no Sales.
- Parceiro/receita refletem o estado comercial correto.
- Evento financeiro segue para Finance sem quebra de contrato.
- Conflito `onboarding` vs `prospect` resolvido e registrado.
- Gates verdes e evidencia na story `docs/stories/2.7.fbr-sales-conformity-alignment.md`.

---

## 5. FBR-Redacao

### Status

Pendente/parcial. Existem stories indicando superficies mockadas ou incompletas; nao marcar como conforme ate haver pipeline editorial real.

### Falta fazer

- Mural `Em Producao`.
- Mural de `Publicados`.
- Dashboard de agentes editoriais.
- Fila `Eu Reporter / UGC`.
- Central de alertas.
- Configuracoes do modulo.
- CRUD de fontes RSS.
- Pipeline editorial completo:
  - Monitor;
  - Jornalista;
  - Midia;
  - Editor;
  - Publisher.
- Markdowns/configuracao dos agentes editoriais.
- Workflows n8n, ou equivalente aprovado no repo:
  - coleta RSS;
  - pipeline editorial;
  - retry automatico.
- Integracao com WordPress REST API.
- Upload de midia.
- Categorias/editorial mapping.
- Moderacao de UGC.
- Busca full-text em portugues.
- SSE de log ao vivo.
- Envio de alertas criticos ao portal.
- Substituir superficies mockadas por persistencia/execucao aderente ao PRD.

### Integracoes pendentes

- WordPress.
- Notificacoes do portal.

### Criterio de fechamento

- Conteudo entra por RSS/UGC.
- Conteudo percorre pipeline editorial.
- Conteudo publica no WordPress.
- Conteudo aparece em `Publicados`.
- Logs/SSE/alertas observaveis.
- Gates verdes e evidencia na story `docs/stories/2.6.fbr-redacao-conformity-alignment.md`.

---

## 6. FBR-Design

### Status

Pendente/parcial. O modulo precisa fechar agente de design, brand kits, jobs, composicao, revisao, galeria, templates e integracoes.

### Falta fazer

- Cadastro de clientes.
- CRUD completo de brand kits.
- Upload de logos para storage.
- Preview ao vivo de brand kit.
- Fila de jobs.
- Galeria de artes.
- Selecao de variantes por job.
- Pipeline de producao:
  - briefing;
  - lookup do brand kit;
  - asset finder;
  - composicao;
  - auto-review;
  - render;
  - entrega.
- Painel de agentes.
- Integracao com APIs de assets externas.
- Composicao de artes com aplicacao do brand kit.
- Templates com preview dinamico.
- Endpoint de aprovacao de criativo para Sales.
- Webhook de atualizacao de brand kit para Social.
- Export de `PDF/PPTX` para uso do ecossistema, inclusive MKT quando aplicavel.
- Evidencia de artefatos reais em storage/galeria.

### Integracoes pendentes

- `Design -> Sales`.
- `Design -> Social`.
- `Design -> MKT`.

### Criterio de fechamento

- Cliente + brand kit + job + composicao + aprovacao + entrega funcionando com artefatos reais.
- Gates verdes e evidencia na story `docs/stories/2.10.fbr-design-conformity-alignment.md`.

---

## 7. FBR-Social

### Status

Pendente/parcial. O modulo precisa fechar producao social com catalogo, pipeline de render, galeria, templates, ZIP e integracao operacional com Design.

### Falta fazer

- Fila de jobs/briefings.
- Catalogo completo de redes e formatos.
- Regras de dimensao e safe zones.
- Pipeline de producao/renderizacao.
- Galeria de entregaveis.
- Templates e versionamento de templates.
- Sincronizacao de brand kit via proxy do `Design`.
- Painel do agente.
- Geracao de package ZIP com manifest.
- Convencao de nomes e estrutura de pastas.
- Quality checks antes da entrega:
  - dimensoes;
  - safe zone;
  - tamanho de arquivo;
  - cores;
  - logo;
  - checklist final.
- Webhook de atualizacao de brand kit.
- Integracao operacional com Design.

### Integracao pendente

- `Design -> Social`.

### Criterio de fechamento

- Brief gera pacote social completo.
- Formatos corretos.
- Manifest valido.
- ZIP entregavel.
- Quality checks registrados.
- Gates verdes e evidencia na story `docs/stories/2.8.fbr-social-conformity-alignment.md`.

---

## 8. FBR-Finance

### Status

Parcial/bloqueado por stories. O intake `Sales -> Finance` tem recorte validado, mas o backbone financeiro ainda nao esta totalmente conforme.

### Falta fazer

- Gestao completa de recebimentos.
- Dashboard com KPIs financeiros.
- Tabela de recebimentos com filtros, paginacao e cadastro.
- Conciliacao de recebimentos com regras de divergencia.
- Gestao completa de pagamentos.
- Workflow multinivel de aprovacao de pagamentos.
- Centros de custo.
- P&L por empresa.
- Motor assincrono de conciliacao.
- Fila de pendencias de conciliacao com intervencao humana.
- Forecast `30/60/90 dias`.
- Graficos e calendario financeiro.
- Audit log financeiro.
- Relatorios e exports `CSV/PDF`.
- Alertas de anomalia.
- Notificacoes criticas no portal.
- RLS, auditoria append-only e rastreabilidade completa.
- Resolver stories Finance em `Draft/NO-GO` antes de marcar conformidade total.

### Integracao pendente ou a revalidar

- `Sales -> Finance` tem recorte validado por `POST /api/proxy/finance/recebimentos/sales-intake`, mas precisa compor o fluxo financeiro completo.

### Criterio de fechamento

- Evento comercial gera reflexo financeiro.
- Recebimentos, pagamentos, auditoria, conciliacao e forecast funcionam com dados reais.
- RLS/auditoria append-only validados.
- Gates verdes e evidencia na story `docs/stories/2.3.fbr-finance-conformity-alignment.md`.

---

## 9. Portal UI / Oraculo

### Status

Dependencia transversal obrigatoria fora da fila principal. O Oraculo esta funcionalmente pronto segundo o plano, mas falta integracao final na UI do portal.

### Falta fazer

- Integrar o modulo Oraculo a shell do portal.
- Expor entrypoint claro na navegacao principal.
- Validar estados de carregamento, vazio, erro e sessao.
- Garantir consistencia visual com os demais modulos.
- Validar notificacoes, layout responsivo e integracao com o contexto do portal.

### Criterio de fechamento

- Usuario acessa Oraculo pela navegacao principal do portal.
- Estados principais cobertos.
- Comportamento integrado a sessao/contexto do portal.
- Gates verdes e evidencia na story `docs/stories/2.12.portal-oraculo-global-shell.md`.

---

## 10. FBR-VideoFlow

### Status

Fora da fila principal atual. Deve ser tratado em plano separado, conforme `docs/finalizacao-repo-prioridades.md`.

### Falta fazer

- Criar ou atualizar plano proprio de conformidade do VideoFlow.
- Revisar PRD/SPEC especifico.
- Definir matriz `feature -> codigo -> teste -> evidencia`.
- Executar fechamento em thread/plano dedicado.

### Criterio de fechamento

- Plano especifico aprovado.
- Implementacao e testes alinhados ao PRD/SPEC de VideoFlow.
- Gates verdes e evidencia na story `docs/stories/2.9.videoflow-conformity-alignment.md`.

---

## Ordem recomendada de execucao

1. FBR-Leads, a partir de `docs/stories/3.1.2.fbr-leads-scoring-icp-pipeline.md`.
2. FBR-Click.
3. FBR-Sales.
4. FBR-Redacao.
5. FBR-Design.
6. FBR-Social.
7. FBR-Finance.
8. Portal UI / Oraculo.
9. FBR-VideoFlow em plano separado.

## Observacao final

O MKT nao deve ser reaberto sem regressao concreta. A fila produtiva segue em FBR-Leads, agora no scoring/ICP/cadencia depois do fechamento da Story 3.1.1.
