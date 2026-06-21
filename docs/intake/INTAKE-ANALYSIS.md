# Intake Analysis · atlax-langfuse-bridge (brownfield-retrofit)

> **Fecha**: 2026-06-21 · **Variante**: `brownfield-retrofit` · **Entidad**: Atlax 360
> (Linear `Atlax360`, team ATL · git `jgcalvo@atlax360.com` · remote `atlax360`).
> **Origen**: `/atlax-intake ~/work/atlax-langfuse-bridge --brownfield`. 2º intake intra-Atlax360
> tras Harvest (governance-retrofit) y el dry-run del dashboard.
> **Disciplina**: todo derivado de **artefactos (ground-truth)** — grep, lectura, `bun run check`,
> `gh pr list`, git log. Nunca de memoria.

---

## 0 · Clasificación (Fase 1)

| Eje                           | Valor                                                                                                                                               |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Tipo de input**             | Repo on-stack, en **producción** (v1.0.1, `https://langfuse.atlax360.ai` activo)                                                                    |
| **Variante**                  | `brownfield-retrofit` — ya en stack/prod, sin gobernanza Linear ni corpus de retros                                                                 |
| **Propiedad / IP**            | Atlax 360 (`git@github.com:atlax360/atlax-langfuse-bridge.git`) → workspace `Atlax360`                                                              |
| **Gate G0 IP**                | ⚪ n/a (Atlax-owned, no es piloto de tercero). El input SÍ contiene el producto (≈56 archivos de test, hook+reconciler+stack+MCP+extension reales). |
| **Categoría Shared Platform** | Dual: `edge-tooling` (hook/reconciler/scripts en laptop dev) + `server-only` (stack Langfuse v3 en GCP)                                             |

### Qué es

Torre de observabilidad **FinOps** del uso de Claude Code en Atlax360. Tres piezas coordinadas:

1. **Hook `Stop`** (`hooks/langfuse-sync.ts`, 503 L) — síncrono, agrega usage del JSONL al cerrar
   sesión y lo envía a Langfuse vía ingestion API. **Cero deps de producción** (solo built-ins).
2. **Reconciler cron** (`scripts/reconcile-traces.ts`, 707 L) — asíncrono (systemd cada 15 min),
   detecta drift local↔Langfuse y re-ejecuta el hook con payload sintético.
3. **Stack Langfuse v3 self-hosted** (`docker/`, 8 servicios) — destino de las trazas. En PRO:
   Cloud Run (web/worker/litellm) + Cloud SQL + ClickHouse GCE + Memorystore Redis + GCS.

### Superficies

| Superficie                 | Implementación                                                                         | Notas                                                                    |
| -------------------------- | -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| **Hook** (event-driven)    | `hooks/langfuse-sync.ts`                                                               | Stop event de Claude Code. Stdin JSON, stderr degradation.               |
| **Batch/cron**             | `scripts/reconcile-traces.ts`                                                          | systemd timer 15 min. Stdout JSON-lines.                                 |
| **Batch/one-shot**         | `scripts/backfill-historical-traces.ts`                                                | Re-upload tras cambios de schema.                                        |
| **CLI utilitario**         | `detect-tier.ts`, `validate-traces.ts`, `provision-keys.ts`, `validate-consistency.ts` | Operación/diagnóstico.                                                   |
| **MCP stdio**              | `scripts/mcp-server.ts` (273 L)                                                        | JSON-RPC 2.0, cero SDK. Agent types coordinator/trace-analyst/annotator. |
| **UI** (Browser Extension) | `browser-extension/` (MV3)                                                             | Traza `claude.ai` web. Funcional, no publicada en Store.                 |
| **API** (LiteLLM)          | `litellm.atlax360.ai`                                                                  | Gateway LLM, callback Langfuse. Opt-in.                                  |
| **Smoke tests**            | `smoke-litellm-*.ts`, `smoke-mcp-e2e.ts`                                               | Verificación post-deploy.                                                |

### Stack real (ground-truth `package.json`)

- **Runtime**: Bun ≥ 1.3.0 (`engines.bun`). `"type": "module"` (ESM puro). Versión `1.0.1`.
- **Deps de producción**: **CERO** (sin campo `dependencies`). Built-ins de Bun/Node + `fetch`/`AbortSignal`.
- **devDeps**: `bun-types ^1.3.14`, `typescript ^5.9.3`, `zod ^4.4.3` (solo en `zod-adapter.ts`).
- **Scripts**: `bun test`, `tsc --noEmit`, `bun run check` (= `tsc --noEmit && bun test`).

### Core shared library (`shared/`, SSoT)

`aggregate.ts` (JSONL→AggregateResult, I-3) · `model-pricing.ts` (tabla MODEL_PRICING, I-6) ·
`langfuse-client.ts` (REST + SSRF guard `isSafeHost`) · `anthropic-admin-client.ts` (cost_report) ·
`drift.ts` (`classifyDrift`, I-11) · `validation.ts` (`SAFE_SID_RE` + `safeFilePath`, I-15) ·
`degradation.ts` (`emitDegradation` JSON a stderr) · `jsonl-discovery.ts` (`Promise.allSettled`) ·
`env-loader.ts` · `constants.ts` (`COST_EPSILON`) · `hash-cache.ts` (TTL 24h, LRU 10K) ·
`processing-tiers.ts` · `tools/*` (registry + adapters MCP/Zod + sandbox).

### Tamaño (ground-truth git, 2026-06-21)

| Material         | Cantidad                                    | Fuente                                                |
| ---------------- | ------------------------------------------- | ----------------------------------------------------- |
| PRs mergeados    | **104**                                     | `gh pr list --state merged --json number --jq length` |
| ADRs             | **17** (ADR-001..017, todos Accepted)       | `ls docs/adr/ADR-*.md`                                |
| Invariantes      | **15** (I-1..I-15, cobertura mapeada)       | `CLAUDE.md` + `ARCHITECTURE.md §10`                   |
| Tests            | **1054 pass / 0 fail** (verificado runtime) | `bun run check`                                       |
| Archivos de test | ≈56 (`.test.ts`)                            | grep                                                  |
| Roadmap maestro  | S17-S24, 31/33 ítems DONE                   | `docs/roadmap/2026-Q2-Q3-*.md`                        |
| Backlog post-v1  | PV1-A1..C4 (3 DONE)                         | `docs/roadmap/post-v1-backlog.md`                     |

> **Nota corpus vs gatherer**: el `pilot-report-v1.md` (curado, 2026-05-07) reporta 816 tests / 62 PRs
> al cierre del roadmap S24. El git actual: **104 PRs / 1054 tests** (≈42 PRs post-roadmap: S25 coverage,
> audit final v1, upgrade Langfuse, alineación deps). Para métricas de **estado actual** gana el git
> (ground-truth); para narrativa del **roadmap** gana el corpus. Ambos consistentes: el roadmap se cerró
> al S24 y el repo siguió evolucionando hasta v1.0.1.

---

## 1 · Scorecard de production-readiness (Fase 2)

> Rúbrica `reference/readiness-rubric.md` (D1-D10). Cada ítem con evidencia (comando/`file:line`).
> Niveles: ✅ cumple · 🟡 parcial · 🔴 ausente · ⚪ n/a (anotado, no cuenta en el score).

| Dim                                | Nivel | Evidencia (ground-truth)                                                                                                                                                                                                                                                                                                                                                                 | Gap → artefacto                                                        |
| ---------------------------------- | ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **D1 · Seguridad API & secretos**  | ✅    | `SAFE_SID_RE` + `safeFilePath()` en `shared/validation.ts` (I-15); `isSafeHost()` SSRF guard en `langfuse-client.ts`; outbound `fetch` con `AbortSignal.any/timeout`; nunca parsea `.credentials.json` (I-8); `gitleaks`/`bun audit` en CI. **Auth HTTP ⚪ n/a** (no hay servidor propio; MCP es stdio).                                                                                 | —                                                                      |
| **D2 · Integridad de datos**       | 🟡    | No hay BD propia (escribe a Langfuse vía API → mayoría ⚪). Idempotencia por `traceId=cc-${sid}` (I-2). **PERO**: coste en **float IEEE-754** (`tokens × precio / 1e6`, acumulado con `+=` en `aggregate.ts`), no cents enteros. CLAUDE.md global prohíbe float para dinero.                                                                                                             | **ADR-018** (modelo de coste: float aceptado vs cents) + PBI hardening |
| **D3 · Stack & arquitectura**      | ✅    | Bun (no npm/yarn); TS strict; ESM puro; cero deps prod (ADR-001). On-stack → ✅, sin migración.                                                                                                                                                                                                                                                                                          | —                                                                      |
| **D4 · Patrones de código**        | 🟡    | Errores tipados + `serializeError` (`degradation.ts`); `Promise.allSettled` en discovery (`jsonl-discovery.ts`); constantes SSoT (`constants.ts`, `model-pricing.ts`); caches acotadas (`hash-cache.ts` TTL/LRU). **PERO**: el hook usa `process.stderr.write("[langfuse-sync] texto plano")` mientras reconciler+`degradation.ts` emiten JSON estructurado → inconsistencia de logging. | PBI: unificar logging del hook a JSON estructurado                     |
| **D5 · Tests (pirámide)**          | ✅    | `bun run check` → **1054 pass / 0 fail**, typecheck verde (runtime). Unit + E2E (`e2e-pipeline.test.ts`) + funcional (idempotencia, round-trip, `cross-validation.test.ts`) + SDD enforcement (`sdd-invariants.test.ts`, `sdd-links.test.ts`).                                                                                                                                           | —                                                                      |
| **D6 · CI/CD & deploy**            | ✅    | `.github/workflows`: CI en `push:[main]`, Bun pinned, `--frozen-lockfile`, **`bun audit --audit-level=high`** (PR #110). Deploy PRO vía `infra/provision-pro.sh` idempotente + `infra/cloud-run.yaml`. Smoke E2E (`smoke-*-e2e.ts`).                                                                                                                                                     | — (mejora menor: deploy automation `workflow_run`)                     |
| **D7 · Gobernanza & trazabilidad** | 🟡    | **17 ADRs** Michael Nygard (Status/Date/Scope) ✅; `CLAUDE.md` de proyecto con 15 invariantes ✅; conventional commits + branch protection ✅; handoffs en `docs/handoffs/`. **PERO**: **cero proyecto Linear** (este intake lo crea), **cero corpus de retros estructurado** (`retro-review`).                                                                                          | **El corazón del intake**: poblar Linear + arrancar retros             |
| **D8 · Frontend / PWA**            | ⚪    | Sin UI propia (la UI es Langfuse self-hosted, no código nuestro). La browser-extension es MV3 mínima, no PWA.                                                                                                                                                                                                                                                                            | n/a                                                                    |
| **D9 · Observabilidad**            | ✅    | Logs JSON estructurados (`degradation.ts`, reconciler JSON-lines); `bridge-health` trace automático con `status:ok/degraded` (S22-B, PR #57); health endpoint = el del propio stack Langfuse.                                                                                                                                                                                            | — (el gap de D4 toca solo el hook)                                     |
| **D10 · Seguridad legal / IP**     | ⚪    | Atlax-owned. Sin gate humano de IP. `gitleaks` + `bun audit` en CI cubren supply-chain.                                                                                                                                                                                                                                                                                                  | n/a                                                                    |

### Production-Readiness Score

Aplicables (no ⚪): **D1, D2, D3, D4, D5, D6, D7, D9** = 8 dimensiones.

- ✅ cumple: D1, D3, D5, D6, D9 = **5**
- 🟡 parcial: D2, D4, D7 = **3**
- 🔴 ausente: **0**

**Score = 5/8 = 62,5 %** (✅ sobre aplicables). Con 🟡 valorados a 0,5: (5 + 1,5)/8 = **81 %**.

> **Perfil brownfield clásico**: técnico fuerte (D1/D3/D5/D6/D9 ✅, v1.0.1 en prod, 1054 tests),
> gobernanza el gap (D7 🟡 — ADRs sí, Linear/retros no). Es el espejo del dry-run del dashboard
> (≈67 %) pero con el eje técnico **más maduro** (más ADRs, más tests, ya en PRO).

---

## 2 · Gaps priorizados → artefactos

| #   | Gap (dim)                               | Severidad | → Artefacto                                                                                        |
| --- | --------------------------------------- | --------- | -------------------------------------------------------------------------------------------------- |
| 1   | **Sin gobernanza Linear** (D7)          | ALTA      | **Proyecto Linear "Langfuse Bridge" poblado** (épicas + PBIs /goal-ready) — núcleo del intake      |
| 2   | **Coste en float, no cents** (D2)       | MEDIA     | **ADR-018** (modelo de coste: float aceptado con `COST_EPSILON` vs migración a microdólares) + PBI |
| 3   | **Logging del hook inconsistente** (D4) | BAJA      | **ADR-019** (logging estándar JSON del bridge) + PBI: unificar `process.stderr.write` → `logInfo`  |
| 4   | **Sin corpus de retros** (D7)           | MEDIA     | Arrancar `retro-review` (handoff a `atlax-project-state`)                                          |
| 5   | **Deploy automation manual** (D6)       | BAJA      | PBI (mejora): `workflow_run` + smoke post-deploy automatizado                                      |

> **R26 aplicado** (Fase 6): el roadmap S17-S24 está **íntegramente ejecutado** (31/33 DONE; los 2
> restantes son bloqueo humano/no-aplica). Del post-v1, **3/11 DONE** (PV1-A1 PR #96, PV1-C1 PRs #99-101,
> PV1-D1 PR #102). Los 8 abiertos son **operativos/coordinación** (distribuir hook a 13 devs, reclutar
> piloto, multi-IDE, multi-vendor), no implementación bloqueada por código. → El poblado de Linear
> reconstruye la **historia gobernada** (épicas DONE con evidencia) + el **backlog real** (los 8 abiertos
>
> - 2 gaps técnicos), sin crear trabajo fantasma.
