# Finalização Repo-Wide por Prioridade

## Objetivo

Este documento consolida, em ordem de execução prioritária, **todos os recursos que ainda precisam ser desenvolvidos, fechados ou validados** para concluir o projeto FBR Portal em conformidade com os PRDs.

Ordem de execução definida:

1. `FBR-MKT`
2. `FBR-Leads`
3. `FBR-Click`
4. `FBR-Sales`
5. `FBR-Redação`
6. `FBR-Design`
7. `FBR-Social`
8. `FBR-Finance`

Fora deste plano:

- `Oráculo`: já está pronto funcionalmente; falta apenas integração final na UI do portal.
- `FBR-VideoFlow`: será tratado em um plano separado.

## Fontes oficiais

- [DOCUMENTO_GERAL.md](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/00_GERAL/DOCUMENTO_GERAL.md)
- [TASKLIST_GERAL.md](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/TASKLIST_GERAL.md)
- [FBR-MKT PRD/SPEC](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/05_MKT/PRD_SPEC_TASKLIST.md)
- [FBR-Leads PRD/SPEC](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/04_LEADS/PRD_SPEC_TASKLIST.md)
- [FBR-Click PRD](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/02_CLICK/PRD.md)
- [FBR-Click SPEC/TASKLIST](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/02_CLICK/SPEC_TASKLIST.md)
- [FBR-Sales PRD/SPEC](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/07_SALES/PRD_SPEC_TASKLIST.md)
- [FBR-Redação PRD/SPEC](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/06_REDACAO/PRD_SPEC_TASKLIST.md)
- [FBR-Design PRD/SPEC](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/10_DESIGN/PRD_SPEC_TASKLIST.md)
- [FBR-Social PRD/SPEC](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/08_SOCIAL/PRD_SPEC_TASKLIST.md)
- [FBR-Finance PRD/SPEC](C:/Projetos/1FBRPortal/fbrportal/fbr-portal-docs/03_FINANCE/PRD_SPEC_TASKLIST.md)

## Critério global de projeto finalizado

O projeto só pode ser considerado finalizado quando:

- `npm run lint` estiver verde
- `npm run typecheck` estiver verde
- `npm test` estiver verde
- cada módulo abaixo estiver funcionalmente alinhado ao seu PRD/SPEC
- integrações entre módulos estiverem válidas por contrato e fluxo real
- não houver placeholder crítico, hardcode operacional ou rota simulada nos fluxos principais
- existir evidência final por módulo de `feature -> código -> teste -> status`

## Dependência transversal obrigatória

### Portal UI / Oráculo

Mesmo fora da fila principal de módulos, este item precisa ser concluído antes do encerramento final do projeto:

- integrar o módulo Oráculo à shell do portal
- expor entrypoint claro na navegação principal
- validar estados de carregamento, vazio, erro e sessão
- garantir consistência visual com os demais módulos
- validar notificações, layout responsivo e integração com o contexto do portal

---

## 1. FBR-MKT

**Objetivo de fechamento:** entregar o fluxo completo de inteligência de marketing do intake até export e handoff para `Click`.

### Recursos a desenvolver / fechar

- fundação de dados, RLS, branding por empresa, papéis e isolamento multi-tenant
- intake wizard com upload `PDF/DOCX`, validação MIME/extensão/tamanho, storage real e status de processamento
- fluxo de progresso SSE do intake com etapas visuais consistentes
- worker de extração do documento com geração de SWOT, persona, UVP, score de viabilidade e justificativa
- tela de revisão/aprovação do diagnóstico
- geração da `Estratégia Master` com posicionamento, arquétipo, tom de voz, mix de canais, KPIs e campanhas
- versionamento da estratégia com snapshots imutáveis
- módulo de copywriting por campanha
- geração de `lead magnets`
- geração de `landing pages`
- geração de `5-7 nurture emails` por lead magnet
- calendário editorial de `90 dias`, distinguindo orgânico vs pago e destacando quick wins
- roadmap operacional `0-30d`, `30-60d`, `60-90d`
- chat contextual com histórico, sugestões, streaming e contexto combinado de diagnóstico + estratégia + copy + calendário + roadmap
- exportação real em `PDF`
- exportação real em `PPTX`
- histórico de exportações com download assinado
- bridge `strategy.exported` para `FBR-Click`
- notificações operacionais do módulo
- observabilidade de agentes, filas, jobs e falhas
- fechamento arquitetural de fila/SSE/rate-limit conforme o PRD

### Integrações obrigatórias

- `MKT -> Click` via `strategy.exported`
- `Design -> MKT` para branding e assets exportáveis quando aplicável

### Evidência mínima de done

- upload -> diagnóstico -> aprovação -> estratégia -> copy -> calendário -> roadmap -> export -> click handoff funcionando
- testes de contrato e testes dos artefatos principais

### Evidência registrada em 2026-05-13

- `MKT -> Click`: contrato `strategy.exported` validado por teste ponta a ponta em memória, com bridge configurada retornando `sent` em vez de `skipped`.
- Chat contextual: prompt/fallback agora serializam diagnóstico, estratégia, copy/captação, calendário, roadmap, histórico recente, sugestões proativas e flags de inconsistência.
- Arquitetura operacional: `queue-status` agora é escopado por empresa, e a agregação de filas cobre `mkt:upload`, `mkt:estrategia`, `mkt:copy`, `mkt:calendario` e `mkt:export`.
- Campanhas MKT: rota legada `/api/proxy/mkt/campaigns` deixa de retornar vazio/`Not implemented` e passa a projetar campanhas geradas nos snapshots de estratégia.
- Gates: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test` e `npm.cmd run build` passaram na raiz.

### Evidência complementar registrada em 2026-05-13

- Bridge `strategy.exported`: recorte `src/lib/mkt/export.test.ts` + `src/app/api/proxy/click/click-routes.test.ts` passou com 11 testes, comprovando POST configurado para Click e audit cross-module.
- Chat/status MKT: testes de rota cobrem `GET/POST /chat` com sugestoes/flags, persistencia user+assistant e SSE; `GET /status` cobre polling e SSE com bootstrap persistido e headers de seguranca.
- Chat contextual: `GET /api/proxy/mkt/estrategias/{id}/chat` também expõe sugestões e flags contextuais para a sidebar; fallback local usa deltas incrementais no mesmo contrato SSE do stream LLM.
- Chat sidebar: componente agora cobre o atalho `Ctrl+K` previsto no PRD e tem teste de renderização de suggestions/flags e consumo de deltas SSE no contrato da UI.
- SSE/status MKT: `GET /api/proxy/mkt/estrategias/{id}/status` agora prefere estado derivado de jobs persistidos sobre evento live em memória quando o persistido for mais recente, e consulta jobs por empresa.
- Arquitetura operacional MKT: topologia de filas agora inclui `mkt:fbr_click`; a constraint da migration aceita `fbr_click_delivery`; o worker preserva export concluido e cria job retry separado quando o Click falha apos a geracao do artefato.
- Evidencia de teste: `npm.cmd --workspace @fbr/portal test -- src/lib/mkt/queue.test.ts src/app/api/proxy/mkt/worker/route.test.ts` passou com 4 testes, cobrindo topologia e retry downstream.
- Gates desta correcao: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd run test` e `npm.cmd run build` passaram.
- Build final: `/leads/campaigns` foi marcado como rota dinâmica para evitar prerender com consulta Supabase runtime de campanhas MKT sem schema local aplicado.
- Story agregadora `docs/stories/2.5.fbr-mkt-conformity-alignment.md` foi fechada como `Completed`; os próximos gaps formais ficam nos módulos seguintes da fila (`Leads`, `Click`, `Sales`, etc.).

### Evidência complementar registrada em 2026-05-14

- Bridge `strategy.exported`: recorte `src/lib/mkt/export.test.ts` + `src/app/api/proxy/mkt/worker/route.test.ts` + `src/app/api/proxy/click/click-routes.test.ts` passou com 14 testes, revalidando delivery configurado para Click sem `skipped`.
- Chat contextual: recorte `src/lib/mkt/chat.test.ts` + `src/app/api/proxy/mkt/estrategias/[id]/chat/route.test.ts` + `src/app/mkt/_components/ChatSidebar.test.tsx` passou com 16 testes, revalidando contexto diagnóstico + estratégia + copy/captação + calendário + roadmap e SSE `delta/done`.
- Arquitetura operacional MKT: worker agora faz claim persistente condicional `pending -> processing` com filtro `id + status`, evitando processamento duplicado em execuções concorrentes.
- Evidência de teste: `npm.cmd --workspace @fbr/portal test -- src/app/api/proxy/mkt/worker/route.test.ts src/lib/mkt/queue.test.ts src/lib/mkt/sse.test.ts src/lib/mkt/security.test.ts` passou com 11 testes.
- Gates desta execução: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` passaram.

### Evidencia complementar registrada em 2026-05-14 - execucao atual

- Bridge `strategy.exported`: recorte `src/lib/mkt/export.test.ts` + `src/app/api/proxy/mkt/worker/route.test.ts` + `src/app/api/proxy/click/click-routes.test.ts` passou com 15 testes, comprovando novamente delivery configurado para Click sem `skipped`.
- Chat contextual: SSE do chat agora serializa todos os chunks como deltas de um caractere, tanto no fallback local quanto no caminho LLM text-stream, mantendo reconstrucao correta na sidebar.
- Arquitetura operacional MKT: jobs persistidos `fbr_click_delivery` agora derivam estado SSE como trabalho do `exportador_bot`, com progresso 95 em processamento e mensagem explicita de envio ao FBR-Click.
- Evidencia de teste: recorte de chat passou com 19 testes; recorte operacional `sse/queue/status/worker` passou com 12 testes.
- Gates desta execucao: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` passaram.

### Evidencia complementar registrada em 2026-05-14 - execucao atual 2

- Bridge `strategy.exported`: recorte `src/lib/mkt/export.test.ts` + `src/app/api/proxy/mkt/worker/route.test.ts` + `src/app/api/proxy/click/click-routes.test.ts` passou com 16 testes, revalidando delivery configurado para Click sem `skipped`.
- Chat contextual: recorte `src/lib/mkt/chat.test.ts` + `src/app/api/proxy/mkt/estrategias/[id]/chat/route.test.ts` + `src/app/mkt/_components/ChatSidebar.test.tsx` passou com 20 testes, revalidando contexto de diagnostico + estrategia + copy/captacao + calendario + roadmap e streaming SSE consistente.
- Arquitetura operacional MKT: `GET /api/proxy/mkt/estrategias/{id}/status` agora continua consultando jobs persistidos durante o stream SSE, alem do bootstrap inicial, reduzindo dependencia de eventos em memoria.
- Evidencia de teste: recorte operacional `src/lib/mkt/sse.test.ts` + `src/app/api/proxy/mkt/estrategias/[id]/status/route.test.ts` + `src/lib/mkt/queue.test.ts` + `src/lib/mkt/security.test.ts` passou com 14 testes.
- Gates desta execucao: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` passaram.

### Evidencia complementar registrada em 2026-05-14 - execucao atual 3

- Arquitetura operacional MKT: o worker agora filtra jobs `pending` por `next_attempt_at IS NULL OR next_attempt_at <= now` antes de `order/limit`, impedindo que linhas antigas ainda em backoff ocupem todo o lote e bloqueiem jobs prontos.
- Evidencia de teste: `npm.cmd --workspace @fbr/portal test -- src/app/api/proxy/mkt/worker/route.test.ts` passou com 4 testes, incluindo assercao do filtro persistido de elegibilidade antes do batch.
- Revisao repo-wide curta: a varredura por `TODO`, `Not implemented`, `skipped`, `mock`, `placeholder` e `hardcode` encontrou proximos gaps relevantes fora do MKT em stories/modulos ainda parciais ou bloqueados, especialmente Leads/Click/Sales e stories Finance/Redacao em `Draft/NO-GO`; nada foi marcado como concluido sem codigo + teste.
- Gates desta execucao: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` passaram.

### Evidencia complementar registrada em 2026-05-14 - execucao atual 4

- Arquitetura operacional MKT: o rate limit das rotas MKT deixou de usar fallback em memoria por processo; `checkPersistentRateLimit` agora depende do RPC Supabase `mkt_consume_rate_limit` e falha fechado com resposta observavel `RATE_LIMIT_UNAVAILABLE`/503 quando a infraestrutura persistente nao esta disponivel.
- Evidencia de teste: `npm.cmd --workspace @fbr/portal test -- src/lib/mkt/security.test.ts src/lib/mkt/queue.test.ts src/lib/mkt/sse.test.ts` passou com 12 testes, cobrindo RPC persistido, falha fechada e contratos operacionais adjacentes.
- Gates desta execucao: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` passaram.

### Evidencia complementar registrada em 2026-05-14 - execucao atual 5

- Bridge `strategy.exported`: recorte `src/lib/mkt/export.test.ts` + `src/app/api/proxy/mkt/worker/route.test.ts` + `src/app/api/proxy/click/click-routes.test.ts` passou com 16 testes, revalidando delivery configurado para Click sem `skipped`.
- Chat contextual: recorte `src/lib/mkt/chat.test.ts` + `src/app/api/proxy/mkt/estrategias/[id]/chat/route.test.ts` + `src/app/mkt/_components/ChatSidebar.test.tsx` passou com 23 testes, revalidando contexto de diagnostico + estrategia + copy/captacao + calendario + roadmap e streaming SSE consistente.
- Arquitetura operacional MKT: o worker agora persiste `updated_at` ao finalizar jobs, e o status SSE ordena jobs pelo timestamp de ciclo de vida mais recente (`completed_at`, `failed_at`, `updated_at`, `started_at`, `created_at`) para evitar observabilidade stale.
- Evidencia de teste: `npm.cmd --workspace @fbr/portal test -- src/lib/mkt/sse.test.ts src/app/api/proxy/mkt/worker/route.test.ts src/lib/mkt/queue.test.ts src/lib/mkt/security.test.ts src/app/api/proxy/mkt/estrategias/[id]/status/route.test.ts` passou com 20 testes.
- Gates desta execucao: `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` passaram; `npm.cmd test` executou 45 arquivos/161 testes no portal.
- Revisao repo-wide curta: o backlog formal continua apontando o proximo foco para FBR-Leads `docs/stories/3.1.2.fbr-leads-scoring-icp-pipeline.md`; FBR-MKT nao tem gap funcional novo conhecido apos esta correcao.

---

## 2. FBR-Leads

**Objetivo de fechamento:** entregar o motor completo de captação outbound até handoff qualificado para `Click`.

### Recursos a desenvolver / fechar

- dashboard operacional de leads com KPIs e funil visual
- CRUD completo de ICPs
- pipeline visual de leads em 7 etapas
- gestão de domínios de envio
- templates de email
- cadência de email com 4 toques
- painel de agentes
- modelo de dados completo para leads, ICPs, domínios e cadências
- ingestão de leads a partir das fontes previstas:
  - LinkedIn
  - CNPJ.biz
  - Google Maps
  - sites/web scraping
- algoritmo de scoring com 12 variáveis e bônus/penalidades
- lógica completa de matching com ICP
- monitoramento de saúde de domínios, bounce, aquecimento e pausas automáticas
- times/agentes OpenClaw do módulo com responsabilidades reais
- workflows de monitoramento, captação e cadência via n8n
- handoff completo para `FBR-Click` com payload conforme SPEC
- relatórios operacionais do módulo

### Integrações obrigatórias

- `Leads -> Click` via `lead.qualified`

### Evidência mínima de done

- lead captado -> score calculado -> ICP match -> cadência -> qualificação -> handoff para Click funcionando ponta a ponta

### Evidencia registrada em 2026-05-13

- `Leads -> Click`: `POST /api/proxy/leads/handoff` agora monta payload `lead.qualified` completo conforme o SPEC de Leads, com `timestamp`, `module_source: fbr-leads`, identificacao, contato, qualificacao, enriquecimento, cadencia, historico, deduplicacao, prioridade e sugestao de acao.
- `Click`: `POST /api/proxy/click/deals/from-lead` continua aceitando o envelope global menor, mas preserva o payload completo recebido em evento auditavel `lead_received` e mantem idempotencia por `lead_id`.
- Evidencia de teste: `npm.cmd --workspace @fbr/portal test -- src/lib/leads/store.test.ts src/app/api/proxy/leads/handoff/route.test.ts src/app/api/proxy/click/click-routes.test.ts` passou com 13 testes; `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` passaram.
- Parcial: esta execucao fecha apenas o contrato SQL handoff. Ainda restam gaps de Leads em captura de fontes, validacao/scoring, cadencia/deliverability, persistencia/worker e revisao RLS/proxy antes de marcar o modulo como concluido.

### Evidencia registrada em 2026-05-14

- `Leads source capture`: `POST /api/proxy/leads/source-runs` cria runs auditaveis para LinkedIn, CNPJ.biz, Google Maps e sites, preservando payload bruto, chave de origem, timestamp, lead normalizado e status de duplicidade.
- `Persistencia/RLS`: `supabase/migrations/20260514000001_create_leads_source_capture_tables.sql` define contratos para `leads_leads`, `leads_icps`, `leads_domains`, `leads_source_runs`, `leads_source_records`, `leads_email_templates` e `leads_email_cadencias`, com policies de isolamento por empresa.
- `Deduplicacao`: captura nao cria leads ativos duplicados dentro da mesma empresa quando email, CNPJ, site ou source key ja existem.
- `Blockers externos`: runs podem terminar como `failed` via `fail_reason`, sem fingir scraper/API live em ambiente nao configurado.
- Evidencia de teste: `npm.cmd --workspace @fbr/portal test -- src/lib/leads/store.test.ts src/app/api/proxy/leads/source-runs/route.test.ts` passou com 11 testes; `npm.cmd run lint`, `npm.cmd run typecheck`, `npm.cmd test` e `npm.cmd run build` passaram.
- Parcial: Story 3.1.1 esta pronta para review. Ainda restam scoring/ICP real, cadencia/deliverability, worker/scheduler e handoff E2E completo antes de marcar FBR-Leads como concluido.

---

## 3. FBR-Click

**Objetivo de fechamento:** entregar o CRM comercial com pipeline, ficha do deal, agentes, KPIs e audit log em conformidade com o PRD.

### Recursos a desenvolver / fechar

- pipeline visual de deals com as etapas oficiais do PRD
- criação manual de deal
- criação automática de deal via `lead.qualified`
- ficha completa do deal
- timeline de eventos append-only
- mensagens do deal
- tarefas do deal
- transição de estágio com regras e rastreabilidade
- painel de agentes OpenClaw
- trigger e status de agentes
- KPIs comerciais do módulo
- audit log
- superfícies para eventos cross-module recebidos
- restrições por papel, especialmente controles administrativos
- coesão entre UI, schema e histórico de eventos

### Integrações obrigatórias

- `Leads -> Click`
- `MKT -> Click`
- `Click -> Sales` para deals fechados

### Evidência mínima de done

- lead qualificado cria deal
- deal evolui por estágios
- mensagens/tarefas/audit funcionam
- evento vindo do MKT aparece como evento cross-module válido

### Evidência registrada em 2026-05-14

- `Click -> Sales`: um deal criado no Click, movido para `fechamento`, gera payload `deal.closed` com `deal_id`, empresa, contato, valor em BRL, produto fechado, histórico resumido e dados do cliente.
- O contrato foi validado contra o endpoint oficial `POST /api/proxy/sales/webhooks/fbr-click/deal-closed`, com assinatura HMAC e rejeição de assinatura inválida.
- Evidência de teste: `npm.cmd --workspace @fbr/portal test -- src/app/api/proxy/click/click-routes.test.ts` passou com 7 testes.
- Parcial: Click ainda precisa de revisão completa de agentes, message hub, documentos/archive e matriz final de conformidade antes de concluir o módulo.

---

## 4. FBR-Sales

**Objetivo de fechamento:** entregar o departamento comercial digital com intake de deals fechados, parceiros, mídia, receitas e repasse para Finance.

### Recursos a desenvolver / fechar

- intake de `deal.closed` vindo de `Click`
- lifecycle de parceiros comerciais
- gestão de espaços/produtos comerciais
- media kits
- cards e tabelas de receita
- dashboard comercial com KPIs
- fluxo de onboarding/ativação comercial após fechamento
- controle de anomalias comerciais
- workflow de aprovação e revisão de cadastros quando exigido
- superfícies de agentes do módulo
- observabilidade de eventos comerciais
- repasse correto de eventos financeiros para `Finance`

### Integrações obrigatórias

- `Click -> Sales`
- `Sales -> Finance`
- `Design -> Sales` para aprovação/uso de criativos e media kits quando aplicável

### Evidência mínima de done

- deal fechado no Click entra corretamente no Sales
- parceiro/receita se refletem no módulo
- evento financeiro segue para Finance sem quebra de contrato

### Evidência registrada em 2026-05-14

- `deal.closed` agora entra por webhook dedicado `POST /api/proxy/sales/webhooks/fbr-click/deal-closed`, validado por `SALES_FBR_CLICK_WEBHOOK_SECRET` e `x-webhook-signature`.
- `Sales -> Finance`: `POST /api/proxy/sales/receitas?action=forward_finance` agora envia o evento `payment.received` por REST para o endpoint configurado `SALES_FINANCE_INTAKE_URL` ou para `/api/proxy/finance/recebimentos/sales-intake` via base URL do portal.
- Evidencia de teste: `npm.cmd --workspace @fbr/portal test -- src/app/api/proxy/sales/receitas/route.test.ts` passou, cobrindo entrega real para Finance, headers `X-Module-Source: fbr-sales`, criacao de recebimento pendente e idempotencia na segunda entrega.
- O webhook chama o intake Sales existente, cria parceiro com dados vindos do Click, preserva idempotência por parceiro/empresa e registra a entrada auditável em eventos do parceiro.
- Parcial/blocker: o estado inicial continua `onboarding`, conforme `DOCUMENTO_GERAL.md`; `TASK-SA18` exige `prospect`. Esse conflito de fonte precisa de decisão antes de marcar Sales como totalmente conforme.
- Ainda faltam lifecycle/regras de aprovacao, Design/Sales, cobertura de anomalias/media kits e gates globais desta etapa.

---

## 5. FBR-Redação

**Objetivo de fechamento:** entregar a redação automatizada com mural editorial, UGC, alertas, RSS, agentes e integração com WordPress.

### Recursos a desenvolver / fechar

- mural `Em Produção`
- mural de `Publicados`
- dashboard de agentes editoriais
- fila `Eu Repórter / UGC`
- central de alertas
- configurações do módulo
- CRUD de fontes RSS
- pipeline editorial completo:
  - Monitor
  - Jornalista
  - Mídia
  - Editor
  - Publisher
- markdowns/configuração dos agentes editoriais
- workflows n8n:
  - coleta RSS
  - pipeline editorial
  - retry automático
- integração com WordPress REST API
- upload de mídia
- categorias/editorial mapping
- moderação de UGC
- busca full-text em português
- SSE de log ao vivo
- envio de alertas críticos ao portal

### Integrações obrigatórias

- WordPress
- notificações do portal

### Evidência mínima de done

- conteúdo entra por RSS/UGC, percorre pipeline editorial, publica e aparece em `Publicados`

---

## 6. FBR-Design

**Objetivo de fechamento:** entregar o agente de design com brand kits, jobs, composição, revisão, galeria, templates e integrações com Sales, Social e MKT.

### Recursos a desenvolver / fechar

- cadastro de clientes
- CRUD completo de brand kits
- upload de logos para storage
- preview ao vivo de brand kit
- fila de jobs
- galeria de artes
- seleção de variantes por job
- pipeline de produção:
  - briefing
  - lookup do brand kit
  - asset finder
  - composição
  - auto-review
  - render
  - entrega
- painel de agentes
- integração com APIs de assets externas
- composição de artes com aplicação do brand kit
- templates com preview dinâmico
- endpoint de aprovação de criativo para Sales
- webhook de atualização de brand kit para Social
- export de `PDF/PPTX` para uso do ecossistema, inclusive MKT quando aplicável

### Integrações obrigatórias

- `Design -> Sales`
- `Design -> Social`
- `Design -> MKT`

### Evidência mínima de done

- cliente + brand kit + job + composição + aprovação + entrega funcionando com artefatos reais

---

## 7. FBR-Social

**Objetivo de fechamento:** entregar a produção social com catálogo de formatos, pipeline de render, galeria, templates, package ZIP e integração com Design.

### Recursos a desenvolver / fechar

- fila de jobs/briefings
- catálogo completo de redes e formatos
- regras de dimensão e safe zones
- pipeline de produção/renderização
- galeria de entregáveis
- templates e versionamento de templates
- sincronização de brand kit via proxy do `Design`
- painel do agente
- geração de package ZIP com manifest
- convenção de nomes e estrutura de pastas
- quality checks antes da entrega:
  - dimensões
  - safe zone
  - tamanho de arquivo
  - cores
  - logo
  - checklist final
- webhook de atualização de brand kit
- integração operacional com Design

### Integrações obrigatórias

- `Design -> Social`

### Evidência mínima de done

- brief gera pacote social completo com formatos corretos, manifest válido e ZIP entregável

---

## 8. FBR-Finance

**Objetivo de fechamento:** entregar o backbone financeiro com recebimentos, pagamentos, centros de custo, conciliação, forecast, auditoria, relatórios e alertas.

### Recursos a desenvolver / fechar

- gestão completa de recebimentos
- dashboard com KPIs financeiros
- tabela de recebimentos com filtros, paginação e cadastro
- conciliação de recebimentos com regras de divergência
- gestão completa de pagamentos
- workflow multinível de aprovação de pagamentos
- centros de custo
- P&L por empresa
- motor assíncrono de conciliação
- fila de pendências de conciliação com intervenção humana
- forecast `30/60/90 dias`
- gráficos e calendário financeiro
- audit log financeiro
- relatórios e exports `CSV/PDF`
- alertas de anomalia
- notificações críticas no portal
- RLS, auditoria append-only e rastreabilidade completa

### Integrações obrigatórias

- `Sales -> Finance`

### Evidência mínima de done

- evento comercial gera reflexo financeiro
- Evidencia registrada em 2026-05-14: Finance recebeu `payment.received` vindo de Sales pelo proxy documentado `POST /api/proxy/finance/recebimentos/sales-intake`; o teste cross-module verificou recebimento pendente e idempotencia sem leitura direta de banco entre modulos.
- recebimentos/pagamentos/auditoria/reconciliação/forecast funcionam com dados reais

---

## Sequência operacional recomendada

### Fase 1 — Fechamento de aquisição e estratégia

- `FBR-MKT`
- `FBR-Leads`
- `FBR-Click`

### Fase 2 — Fechamento comercial e editorial

- `FBR-Sales`
- `FBR-Redação`

### Fase 3 — Fechamento criativo

- `FBR-Design`
- `FBR-Social`

### Fase 4 — Fechamento financeiro

- `FBR-Finance`

### Fase 5 — Encerramento global

- integração do `Oráculo` na UI
- revisão repo-wide de conformidade
- matriz final `módulo -> features -> status -> evidência`

## Definição prática de encerramento hoje

Para encerrar o projeto hoje, a execução deve seguir este padrão para cada módulo:

1. listar features do módulo ainda não fechadas
2. implementar backend, frontend e integrações faltantes
3. validar contratos cross-module
4. rodar `lint`, `typecheck` e `test`
5. registrar evidência de conformidade
6. só então avançar para o próximo módulo

## Resultado esperado

Ao final desta fila, o portal terá:

- todos os módulos prioritários funcionais
- integrações obrigatórias do ecossistema operando
- UI do Oráculo conectada ao portal
- `VideoFlow` isolado para execução posterior, sem bloquear o fechamento do restante do produto
