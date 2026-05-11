# NOBULSHIT — Gap Analysis: PRD vs Implementation

> Generated: 2026-05-06
> Status: Every module needs a ground-up rewrite of types, stores, API routes, and UI.

---

## Executive Summary

All 7 modules (Leads, MKT, Redação, Sales, Social, VideoFlow, Design) were implemented with **generic mock data structures** that do not match their PRD specifications. The types, stores, API routes, and dashboard pages are functional but represent **a different product** from what the PRDs describe.

**Finance** is the only module properly aligned with its PRD and serves as the reference implementation.

---

## Module-by-Module Analysis

### 1. FBR-Leads — Coverage: ~5%

**PRD specifies:**
- 7-stage pipeline: `captado → email_validado → icp_matching → scoring → redacao → cadencia → sql_entregue`
- 6 agent teams (Guardiões, Garimpeiros, Analistas, Redatores, Cadenciadores, Coordenadores)
- ICP with full matching logic (setor, porte, cargo, região, keywords, exclusões)
- Scoring algorithm with 12 variables + bonus/penalty rules
- Domain health monitoring with bounce thresholds (saudável/atenção/crítico/bloqueado)
- Email warming schedule (5→10→20→35→50 over 30 days)
- 4-touch cadence (Day 0, 4, 9, 16) with timezone-aware scheduling
- Handoff payload to FBR-Click with full context
- 4 capture sources (LinkedIn, CNPJ.biz, Google Maps, Web Scraping) with specific field schemas

**Current implementation:**
- Lead statuses: `novo, qualificado, contato_inicial, em_engajamento, proposta, negociacao, convertido, descartado` — **completely wrong pipeline**
- ICP: basic schema with `segmentos, cargos_alvo, regioes` — **no matching logic, no keywords, no exclusions, no domínio_email_permitido**
- Campaign: generic campaign schema — **not in PRD** (PRD has cadência, not campaigns)
- HandoffPayload: minimal — **missing empresa_cnpj, dados_enriquecimento, cadencia timeline, deduplicacao info, prioridade**
- **Missing entirely:** Domain management, email templates, email warming, scoring algorithm, agent teams, capture source schemas, pipeline visualization

**What needs to change:** Types, store, all API routes, all UI pages. Keep nothing.

---

### 2. FBR-MKT — Coverage: ~0%

**PRD specifies:**
- Upload PDF/DOCX → async processing (BullMQ) → SWOT extraction → persona → UVP → score
- 6 agents (Extrator, Estrategista, Redator, Calendário, Exportador, Onboarding)
- Strategy Master with versioned snapshots (immutable versions in `estrategia_versoes`)
- Copywriting: headlines, CTAs, body copy, landing page, email sequences
- 90-day editorial calendar with organic vs paid distinction
- Chat AI assistant with context management
- PDF/PPTX export
- SSE progress stream (4 stages)
- Tables: `estrategias`, `diagnosticos`, `estrategia_versoes`, `chat_mkt`

**Current implementation:**
- Campaign schema (generic marketing campaign) — **not in PRD**
- Strategy schema (generic strategy with pilares) — **not in PRD**
- ContentCalendar (generic content calendar) — **not in PRD**
- AnalyticsSnapshot — **not in PRD**
- **Missing entirely:** Upload/processing, SWOT, persona, UVP, scoring, versioned snapshots, chat, PDF/PPTX export, SSE progress, BullMQ workers, all 6 agents

**What needs to change:** Everything. The current domain model is completely different from the PRD. The PRD is about document processing → strategy generation, not about managing campaigns and analytics.

---

### 3. FBR-Redação — Coverage: ~10%

**PRD specifies:**
- 6 editorial agents (Monitor, Jornalista, Mídia, Editor, Publisher, Gestor)
- 5 cities covered: Fort Lauderdale, Miami, Orlando, NYC, Boston
- Pipeline: `coletado → redigido → com_midia → editado → publicado`
- RSS feed monitoring with configurable intervals
- WordPress REST API publishing
- UGC "Eu Repórter" with credit system (+10 aceitar, +20 publicar)
- Full-text search in pt_BR (PostgreSQL GIN index)
- 8 alert types: `falha_agente, fonte_indisponivel, conteudo_sensivel, queda_performance, qualidade_baixa, imagem_nao_encontrada, limite_api_atingido, ugc_spam_detectado`
- Celery workers with separate queues per agent
- Confidence scoring for UGC submissions

**Current implementation:**
- Etapa values: `rascunho, coletado, em_revisao, aprovado, publicado` — **wrong** (PRD has `coletado, redigido, com_midia, editado, publicado`)
- UGC statuses: `pendente, em_analise, aprovado, rejeitado` — **wrong** (PRD has `pendente, aceito, rejeitado`)
- Alert types: `breaking, trending, deadline, fact_check, duplicate` — **completely wrong** (PRD has agent-specific types)
- **Missing entirely:** Agent dashboard (6 agents), WordPress integration, credit system, UGC confidence scoring, full-text search, Celery worker architecture, n8n workflows

**What needs to change:** Types (etapa, alert, UGC), store, API routes, UI. Add agent tracking, UGC credits, confidence scoring.

---

### 4. FBR-Sales — Coverage: ~5%

**PRD specifies:**
- 4 sub-modules: Partnership Management, Ad Network API, Financial Control, Media Kit Generator
- 9 agents led by "Maia Mendes" (Gerente Comercial Virtual)
- Partnership pipeline state machine: `PROSPECT → NEGOTIATION → CONTRACT → ONBOARDING → ACTIVE ⇄ PAUSED`
- Reconciliation algorithm with tolerance thresholds (5% default)
- 6 anomaly types with severity scoring
- Audit log (immutable events for every state transition)
- Rate card management
- Ad network integration (AdSense, Taboola, Outbrain, etc.)

**Current implementation:**
- Deal stages: `prospeccao, qualificacao, proposta, negociacao, fechado_ganho, fechado_perdido` — **wrong** (PRD has partnership stages)
- Partner: basic with `agencia, anunciante, produtor_conteudo` types — **wrong** (PRD has ad networks)
- Revenue: basic schema — **missing reconciliation, anomaly detection**
- MediaKit: basic price list — **PRD describes auto-generation with real audience data**
- **Missing entirely:** State machine, reconciliation algorithm, anomaly detection, audit events, agent team (Maia Mendes + 8), ad network API, rate cards

**What needs to change:** Everything. The current model treats Sales as a CRM. The PRD treats Sales as a commercial operations platform for managing ad network partnerships.

---

### 5. FBR-Social — Coverage: ~5%

**PRD specifies:**
- 8 networks (Instagram, Facebook, LinkedIn, TikTok, Twitter/X, YouTube, Pinterest, WhatsApp) × 30+ formats
- Each format has **exact pixel dimensions, aspect ratio, safe zone, and file size limits**
- Quality checks: dimensions ±2px, WCAG AA contrast, safe zone compliance
- Brand kit consumption from FBR-Design via API
- Template JSON with layers (background, image, text, cta)
- Pipeline: Briefing → Brand Kit → Composição HTML/CSS → Render → Quality Check → Storage
- ZIP download with manifest.json
- HTMLCSStoImage API (primary) / Bannerbear (fallback)

**Current implementation:**
- 6 platforms (missing Pinterest, WhatsApp)
- 5 generic format types (`feed_post, story, reels, carousel, shorts`) — **no dimensions, no safe zones**
- QualityCheck schema exists but has no actual dimension/safe zone values
- Template has `dimensoes` as a string — **should be structured with width/height**
- **Missing entirely:** 30+ format definitions with exact dimensions, safe zone enforcement, brand kit API consumption, HTML/CSS composition pipeline, ZIP export, render engine integration

**What needs to change:** Types (add all format definitions), store, API routes. This module needs a complete format catalog and a rendering pipeline.

---

### 6. FBR-VideoFlow — Coverage: ~0%

**PRD specifies:**
- DA (Direção de Arte) vector system: 35+ parameters in 6 groups (Narrativa, Visual, Sonoro, Formato, Marca, Meta)
- Light theme (unique — only module with white background)
- 6 agents with specific AI models
- Concept bank with vector similarity (pgvector)
- Handoff envelope with SHA-256 integrity
- Cost tracking ($0.04/min target)
- Instrument Serif/Sans fonts
- 12-page SPA architecture

**Current implementation:**
- Generic Project schema with `tipo: institucional, comercial, conteudo, evento`
- Generic RenderJob schema
- Generic Template schema
- **Missing entirely:** DA vector (the core concept), concept bank, handoff envelope, agent stack, light theme, cost tracking, font system, 12-page structure

**What needs to change:** Everything. The DA vector is the entire point of this module and it doesn't exist.

---

### 7. FBR-Design — Coverage: ~15%

**PRD specifies:**
- Brand Kit as full JSON schema: cores (primary, secondary, accent, bg, text), fontes (heading, body with weights), logo (claro, escuro, favicon), guidelines, restricoes
- 26+ format definitions with exact dimensions (same as Social + Digital Ads IAB + Identity + Documents)
- 8 auto-review rules: no_links, no_spam_words, correct_proportions, safe_zone, brand_colors (ΔE < 30), logo_visibility, text_legibility, spam_ratio
- Asset cascade: Unsplash → Pexels → Pixabay → MidJourney (with timeouts and caching)
- Integration APIs for FBR-Social and FBR-Sales
- Pipeline: Briefing → Brand Kit Lookup → Asset Finder → Composição → Auto-Review → Render → Deliver

**Current implementation:**
- BrandKit: `cores: string[], fontes: string[], logo_url: string` — **extremely simplified** (PRD has structured colors, dual logos, guidelines, restrictions)
- DesignJob: basic — **missing format taxonomy, auto-review integration**
- DesignAsset: basic file reference
- DesignReview: has `regras_aprovadas/reprovadas` as string arrays — **should have the 8 specific rules with results**
- **Missing entirely:** Format taxonomy (26+ formats), auto-review engine (ΔE calculation, spam detection, safe zone checks), asset cascade pipeline, FBR-Social/FBR-Sales integration endpoints

**What needs to change:** BrandKit type (full schema), add format catalog, implement auto-review rules, add asset cascade, add integration endpoints.

---

## Priority Order for Re-implementation

1. **Design** — Brand kits are consumed by Social. Must be done first.
2. **Leads** — Self-contained, high business value.
3. **Social** — Depends on Design brand kits.
4. **Sales** — Complex but self-contained.
5. **MKT** — Complex async processing, but self-contained.
6. **Redação** — Complex worker architecture.
7. **VideoFlow** — Most unique architecture (DA vector), least dependencies.

---

## What Can Be Salvaged

- **Portal shell:** Layout, navigation, auth — all good.
- **Finance module:** Complete and PRD-aligned. Reference implementation.
- **Click module:** Implemented (not analyzed here).
- **Homepage:** Navigation cards — good.
- **Design system/UI components:** Reusable across rewrites.

## What Must Be Rewritten Per Module

For each module:
1. `apps/portal/src/lib/{module}/types.ts` — Complete rewrite
2. `apps/portal/src/lib/{module}/store.ts` — Complete rewrite
3. `apps/portal/src/app/api/proxy/{module}/dashboard/route.ts` — Rewrite with PRD metrics
4. `apps/portal/src/app/{module}/page.tsx` — Rewrite with PRD UI spec
5. Additional API routes and pages per PRD sprint plan
