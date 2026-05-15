# Revisao de conformidade PRDs - recursos de sistema

Data: 2026-05-14

Escopo: nova revisao pos-backlog implementado, com foco principal em recursos de sistema: persistencia real, RLS, storage, filas/jobs, workers, SSE/realtime, rate limit, webhooks, auditoria append-only, integracoes configuraveis e remocao de hardcodes/fixtures como runtime operacional.

Fontes de verdade usadas:

- `fbr-portal-docs/00_GERAL/DOCUMENTO_GERAL.md`
- `fbr-portal-docs/TASKLIST_GERAL.md`
- `fbr-portal-docs/02_CLICK/PRD.md`
- `fbr-portal-docs/03_FINANCE/PRD_SPEC_TASKLIST.md`
- `fbr-portal-docs/04_LEADS/PRD_SPEC_TASKLIST.md`
- `fbr-portal-docs/05_MKT/PRD_SPEC_TASKLIST.md`
- `fbr-portal-docs/06_REDACAO/PRD_SPEC_TASKLIST.md`
- `fbr-portal-docs/07_SALES/PRD_SPEC_TASKLIST.md`
- `fbr-portal-docs/08_SOCIAL/PRD_SPEC_TASKLIST.md`
- `fbr-portal-docs/09_VIDEOFLOW/PRD_SPEC_TASKLIST.md`
- `fbr-portal-docs/10_DESIGN/PRD_SPEC_TASKLIST.md`
- `docs/backlog-pendente-por-modulo-prds.md`
- `docs/stories/3.0.prd-backlog-execution-map.md`

## Veredito

Conformidade repo-wide ainda e parcial para recursos de sistema.

O FBR-MKT esta no melhor estado arquitetural do portal: usa Supabase para dados, jobs persistidos, rate limit persistente fail-closed, storage, SSE com polling persistido e bridge MKT -> Click testada. Ainda ha um bus SSE em memoria, mas ele nao e a unica fonte de estado observavel.

Os demais modulos receberam superficie funcional e algumas migrations, mas ainda ha divergencia importante entre PRD e runtime: varias rotas continuam usando stores em memoria, fixtures ou jobs locais para dados centrais. Isso impede marcar conformidade total mesmo quando existem stories, testes de rota e migrations.

## Achados bloqueantes

### P0 - Leads: source capture tem migration, mas a rota ainda usa store em memoria

Evidencia:

- `supabase/migrations/20260514000001_create_leads_source_capture_tables.sql` cria tabelas para leads, ICPs, dominios, runs e records.
- `apps/portal/src/app/api/proxy/leads/source-runs/route.ts:1` importa `captureLeadsFromSource`, `getSourceRun` e `listSourceRuns` de `@/lib/leads/store`.
- `apps/portal/src/lib/leads/store.ts:762`, `:770` e `:771` declaram `let leads`, `let sourceRuns` e `let sourceRecords` em memoria.
- `apps/portal/src/lib/leads/store.ts:935`, `:987` e `:1002` fazem `push` em arrays locais.

Impacto:

- O fluxo declarado como base de persistencia/source capture nao persiste no banco em runtime.
- Reinicio de processo perde runs e records.
- Nao ha RLS real aplicado ao caminho operacional.
- O proximo fluxo `captacao -> scoring -> ICP -> cadencia -> Click` fica sem fundacao confiavel.

Decisao de revisao:

- Story 3.1.1 tem evidencia funcional, mas a conformidade de sistema deve ser rebaixada para parcial ate a rota usar um store Supabase equivalente ao padrao do MKT.

Proxima story recomendada:

- Criar uma substory antes ou dentro de `docs/stories/3.1.2.fbr-leads-scoring-icp-pipeline.md`: "Leads runtime Supabase store para source capture e entidades core".

### P1 - Stores em memoria continuam sendo runtime core em quase todos os modulos fora MKT

Evidencia por arquivo:

- Click: `apps/portal/src/lib/click/store.ts:3` importa fixtures; `:14` a `:18` mantem deals, mensagens, tasks, agentes e historico em arrays locais.
- Sales: `apps/portal/src/lib/sales/store.ts:495` a `:501` mantem parceiros, eventos, espacos, receitas, anomalias, media kits e rate cards em arrays locais.
- Finance: `apps/portal/src/lib/finance/store.ts:99`, `:204` a `:208` mantem recebimentos, pagamentos, centros de custo, thresholds, itens e jobs de conciliacao em memoria.
- Redacao: `apps/portal/src/lib/redacao/store.ts:485` a `:489` mantem artigos, fontes, UGC, alertas e agentes em memoria.
- Design: `apps/portal/src/lib/design/store.ts:424` a `:426` mantem brand kits, jobs e templates em memoria, apesar de existirem migrations de Design.
- Social: `apps/portal/src/lib/social/store.ts:299` e `:300` mantem templates e jobs em memoria, apesar de existirem migrations de Social.
- VideoFlow: `apps/portal/src/lib/videoflow/store.ts:420` a `:423` mantem producoes, conceitos, agentes e templates em memoria.

Impacto:

- Os PRDs pedem Supabase/PostgreSQL com RLS, storage, audit log e workers/orquestracao. Stores locais podem servir para prototipo ou testes, mas nao para conformidade operacional.
- Testes de API passam, mas validam comportamento process-local, nao isolamento multiempresa, durabilidade, auditoria ou recuperacao de falha.

Decisao de revisao:

- Nenhum desses modulos deve ser marcado como totalmente conforme enquanto dados centrais dependerem de arrays locais.

### P1 - Finance: worker de conciliacao ainda nao atende arquitetura async do PRD

Evidencia:

- PRD Finance exige motor de conciliacao assincrono, BullMQ/worker, progresso consultavel, fila de revisao humana, timeout e retry.
- Runtime atual usa `apps/portal/src/lib/finance/store.ts:207` e `:208` para `reconciliationItems` e `reconciliationJobs` em memoria.

Impacto:

- Nao ha durabilidade de jobs, retry real, retomada pos-restart ou observabilidade confiavel.
- Stories Finance antigas registram conformidade parcial/bloqueada; o codigo ainda confirma esse estado.

Decisao de revisao:

- Finance continua parcial para recursos de sistema, mesmo com migrations de RLS/auditoria existentes.

### P1 - Click: CRM operacional sem persistencia e sem audit append-only real

Evidencia:

- `apps/portal/src/lib/click/store.ts` usa fixtures e arrays locais para deals, mensagens, tasks, agentes e historico.
- Existem contratos cross-module recentes, incluindo MKT -> Click e Leads -> Click, mas o dominio Click ainda nao tem uma camada Supabase/RLS equivalente ao MKT.

Impacto:

- Eventos recebidos podem ser testados, mas nao ficam auditaveis de forma persistente.
- Timeline append-only e export de auditoria ainda nao estao provados como recurso de sistema.

Decisao de revisao:

- Click deve ser o proximo grande fechamento apos Leads, porque e hub de eventos de MKT, Leads e Sales.

### P1 - Sales: integracoes existem, mas dominio e retries ainda sao locais/configuraveis

Evidencia:

- `apps/portal/src/lib/sales/store.ts:495` a `:501` usa arrays locais para o dominio comercial.
- `apps/portal/src/lib/sales/store.ts:1113` e `:1138` permitem `skipped` quando `SALES_FINANCE_INTAKE_URL` nao esta configurado.

Impacto:

- `Click -> Sales` e `Sales -> Finance` podem funcionar em recortes, mas ainda dependem de config/env e nao fecham persistencia, retry e audit log como sistema.
- O modo `skipped` e aceitavel como diagnostico quando nao configurado, mas precisa virar readiness check/gate de deploy para ambiente de conformidade.

Decisao de revisao:

- Sales segue parcial ate ter persistencia real do dominio, fila/retry configurada e readiness de integracoes obrigatorias.

### P2 - Rate limit generico ainda e process-local

Evidencia:

- MKT foi corrigido: `apps/portal/src/lib/mkt/security.ts:69` retorna `RATE_LIMIT_UNAVAILABLE` quando o RPC persistente nao responde.
- Fora do MKT, `apps/portal/src/lib/rate-limit.ts:12` mantem `buckets = new Map`.

Impacto:

- Se usado em rotas de producao, o limite reseta por processo e nao protege ambiente distribuido.
- Nao e blocker do MKT, mas e risco transversal para modulos restantes.

Decisao de revisao:

- Catalogar usos do rate limit generico e migrar rotas produtivas para Supabase/Redis ou fail-closed configuravel.

### P2 - MKT SSE usa memoria como canal vivo, mas possui fallback persistido

Evidencia:

- `apps/portal/src/lib/mkt/sse.ts:5` e `:6` mantem `channels` e `lastEvents` em memoria.
- `apps/portal/src/lib/mkt/sse.ts:9` aceita `persistedEventProvider`.
- `apps/portal/src/lib/mkt/sse.ts:134` a `:137` faz polling do evento persistido.

Impacto:

- Eventos ao vivo entre instancias ainda nao usam Redis/Supabase Realtime.
- Como o estado de jobs e persistido e o stream consulta provider persistido, o risco e aceitavel para a conformidade atual de MKT, mas nao deve ser copiado como unica arquitetura para outros modulos.

Decisao de revisao:

- MKT permanece conforme no estado atual; evolucao futura ideal e Redis/Supabase Realtime para fan-out multi-instancia.

## Matriz por modulo

| Modulo | Persistencia/RLS | Jobs/workers | SSE/realtime | Rate limit | Integracoes | Status de sistema |
|---|---|---|---|---|---|---|
| FBR-MKT | Conforme no runtime atual via Supabase/migrations/RLS | Conforme via `mkt_processing_jobs` e worker | Conforme com ressalva: live bus em memoria + polling persistido | Conforme: RPC persistente fail-closed | Conforme para MKT -> Click quando configurado | Conforme com ressalva menor |
| FBR-Leads | Parcial: migration existe, runtime source-runs usa memoria | Parcial/pendente: captacao externa e cadencias sem scheduler real | Pendente para agentes/logs ao vivo | Pendente/transversal | Leads -> Click parcial | Nao conforme para sistema |
| FBR-Click | Pendente: dominio em fixtures/arrays | Pendente | Pendente/parcial | Pendente/transversal | Recebe eventos em recortes | Nao conforme para sistema |
| FBR-Sales | Pendente: dominio em arrays | Pendente: retries/cron/media kit async nao comprovados | Pendente | Pendente/transversal | Click -> Sales e Sales -> Finance parciais | Nao conforme para sistema |
| FBR-Finance | Parcial: migrations existem, runtime store local | Pendente: conciliacao em memoria | Pendente/polling local | Pendente/transversal | Sales -> Finance parcial | Nao conforme para sistema |
| FBR-Redacao | Pendente: store local | Pendente: Celery/n8n/WordPress nao comprovados | Pendente | Pendente/transversal | WordPress/portal pendentes | Nao conforme para sistema |
| FBR-Design | Parcial: migrations existem, runtime store local | Pendente: render/jobs reais nao comprovados | Pendente | Pendente/transversal | Design -> Sales/Social/MKT pendentes | Nao conforme para sistema |
| FBR-Social | Parcial: migrations existem, runtime store local | Pendente: render/ZIP/quality real nao comprovado | Parcial: endpoint SSE existe, base local | Pendente/transversal | Design -> Social pendente | Nao conforme para sistema |
| Portal UI / Oraculo | Parcial: cache local `SOURCE_CACHE` e historico Supabase a revalidar | Pendente: indexacao/webhook/pgvector a revalidar | N/A | Pendente/transversal | Shell transversal pendente | Parcial |
| FBR-VideoFlow | Pendente: store local | Pendente | Pendente | Pendente/transversal | Plano separado | Nao conforme para sistema |

## Ordem objetiva de fechamento

1. Leads runtime Supabase store: conectar `source-runs`, leads, ICPs, dominios, records e deduplicacao a tabelas reais; manter testes atuais e adicionar contrato que falhe se a rota importar store em memoria.
2. Leads scoring/ICP/cadencia: implementar scoring PRD com 12 variaveis, persistencia de resultados, health de dominios e handoff Click E2E.
3. Click data foundation: criar migrations/RLS/audit para deals, eventos, mensagens, tasks, agentes e historico; trocar `click/store.ts` por runtime persistido.
4. Sales data foundation e readiness: persistir parceiros/receitas/media kits/eventos; transformar `SALES_FINANCE_INTAKE_URL` em readiness check para ambiente conforme; adicionar retry/backoff real.
5. Finance runtime persistido: alinhar stores as tabelas Finance existentes e substituir reconciliacao em memoria por job persistente com status/retry/review queue.
6. Redacao pipeline real: RSS/UGC persistidos, pipeline editorial, WordPress REST, logs/SSE e alertas.
7. Design/Social runtime Supabase: usar migrations existentes como base real de brand kits/jobs/templates/artefatos; fechar storage, render, ZIP e webhooks.
8. Portal UI/Oraculo: revalidar pgvector/historico/shell e remover cache local como fonte de verdade se estiver cobrindo estado de usuario.
9. VideoFlow: manter plano dedicado, pois hoje e store local e nao deve entrar como "conforme" por tabela de backlog.

## Evidencia desta revisao

Comandos e leituras executadas:

- `git status --short`
- `rg --files` em `apps/portal/src/app/api/proxy`, `apps/portal/src/lib`, `supabase/migrations` e `docs/stories`
- `rg` de requisitos de sistema nos PRDs (`Supabase`, `RLS`, `Redis`, `fila`, `worker`, `SSE`, `rate limit`, `audit`, `n8n`, `storage`)
- `Select-String` para stores em memoria, `skipped`, `new Map`, filas e cache local
- leitura de `docs/backlog-pendente-por-modulo-prds.md`

Gates executados nesta revisao:

- `npm.cmd run lint` - PASS
- `npm.cmd run typecheck` - PASS
- `npm.cmd test` - PASS (`@fbr/portal`: 45 arquivos, 160 testes)

Observacao: permanece o warning conhecido de React `act(...)` no teste `src/app/click/_components/click-components.test.tsx`; ele nao bloqueou o gate, mas continua como ruido de teste a limpar em uma passada de qualidade.

## Conclusao

O backlog implementado melhorou bastante a cobertura funcional, especialmente em MKT e nas pontes cross-module. Para conformidade com PRDs no nivel de recursos de sistema, o principal gap agora e arquitetural: tirar os modulos restantes de fixtures/stores em memoria e conectar runtime, jobs, auditoria, SSE e rate limit a infraestrutura persistente.

A prioridade mais objetiva e Leads, porque a propria Story 3.1.1 criou migration de base, mas a rota operacional continua apontando para store local. Esse e o primeiro ajuste que transforma o backlog de "funcional em teste" para "aderente ao PRD em sistema".
