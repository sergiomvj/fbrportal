---
task: attackRemainingStories()
responsável: Orion (Orchestrator)
responsavel_type: Agente
atomic_layer: Organism

**Entrada:**
- campo: from
  tipo: string
  origem: User Input
  obrigatório: false
  descrição: "Story number to start from (e.g. 1.2)"

- campo: to
  tipo: string
  origem: User Input
  obrigatório: false
  descrição: "Story number to end at (e.g. 1.14)"

- campo: allow_dirty
  tipo: boolean
  origem: User Input
  obrigatório: false
  descrição: "Allow running with uncommitted changes"

**Saída:**
- campo: execution_report
  tipo: string
  destino: docs/story-runs/gemini-attack-{timestamp}.md

---

# Attack Remaining Stories Task

## Purpose
Automate the end-to-end implementation of all pending stories in `docs/stories/`, performing PO validation, Dev implementation, and QA review in a continuous loop.

## SEQUENTIAL Task Execution

### 1. Identify Pending Stories
- Scan `docs/stories/*.md`
- Filter stories with status NOT in ["Done", "Deployed"]
- If `from` or `to` parameters are provided, filter the range.
- Sort by story number.

### 2. Implementation Loop
For each pending story:

#### 2.1 PO Validation (if status == "Draft")
- Invoke `@po *validate-story-draft {story_path}`
- If fails, attempt 1 rework or skip to next story.

#### 2.2 Dev Implementation (if status == "Ready")
- Invoke `@dev *develop {story_path}`
- Run Quality Gates: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`
- If gates fail, attempt 1 fix or report failure.

#### 2.3 QA Review (if status == "Ready for Review")
- Invoke `@qa *review {story_path}`
- If QA Gate is FAIL, attempt 1 fix via `@dev *fix-qa {story_path}` and re-review.

#### 2.4 Status Update
- Ensure story status is updated in the file.
- Log progress in the execution report.

### 3. Final Report
- Generate a summary of completed, failed, and skipped stories.
- Save to `docs/story-runs/gemini-attack-{timestamp}.md`.

## Metadata
```yaml
version: 1.0.0
tags: [automation, stories, orchestration]
```
