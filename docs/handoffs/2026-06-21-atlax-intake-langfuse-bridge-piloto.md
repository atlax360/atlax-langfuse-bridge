# Handoff — `/atlax-intake` brownfield-retrofit · atlax-langfuse-bridge (Atlax360)

> **Creado**: 2026-06-21 · **Destino**: sesión con perfil Linear **Atlax360** (`linear-atlax`
> conectado, `linear-semantia` AUSENTE — gotcha dedup de tools).
> **Origen**: sesión de validación harness local (Mac M5 Max). 2º intake intra-Atlax360 tras el
> piloto **Harvest** (cerrado 2026-06-21, 9 PRs #398-#406, gobernanza Linear 2→28 issues).
> **Mejoras del cockpit aplicadas** (destiladas del piloto Harvest): predicados `/goal` verificados
> empíricamente (§3.5 de `autonomous-execution-goal-standard`), umbral de volumen DESPUÉS de R26
> (§3.6), R26 sobre cada finding antes de poblar (atlax-intake SKILL Fase 6).

---

## 0 · Objetivo

Ejecutar **`/atlax-intake ~/work/atlax-langfuse-bridge --brownfield`** end-to-end: análisis
ground-truth → scorecard → ADRs (observado vs decidido) → plan → gates G1/G2 → poblar Linear
Atlax360 (proyecto destino: ver §1 nota) → handoff a `/goal`. Llevar langfuse-bridge al nivel de
gobernanza Linear de Kairos/Harvest.

**Dificultad estimada: media** — ground-truth muy estructurado (roadmap S17-S24 + post-v1 backlog
ya con sizing/blast/DoR/DoD), pero el repo arrancó en S22 (S17-S21 viven en docs, no en git). La
reconstrucción es mapeo S{NN}-{X}/PV1-{X} → ATL-N.

---

## 1 · PRECONDICIONES — verificar ANTES de arrancar (R26)

```bash
# 1. Perfil Linear: la sesión ve Atlax360 (key ATL), NO Semantia. SOLO linear-atlax activo.
#    (gotcha dedup: si ambos servers presentes, solo uno invocable. Ver linear-mcp.md.)
#    Verificación: list_teams → team key ATL.

# 2. Estado git (ground-truth al crear handoff):
cd ~/work/atlax-langfuse-bridge
git branch --show-current              # main
git log -1 --format='%h %s'            # 6d2a6d5 ci: add bun audit --audit-level=high step (#110)
git status --short                     # limpio (0 files)
git remote get-url origin              # git@github.com:atlax360/... (entidad Atlax360 ✅)
git config user.email                  # jgcalvo@atlax360.com

# 3. Proyecto Linear destino: ¿existe ya "atlax-langfuse-bridge" o "Langfuse Bridge" en team ATL?
#    list_projects → si NO existe, crearlo (save_project). La regla linear-mcp lo ubica en
#    "Infra & Cockpit" NO está claro — langfuse-bridge es producto propio, NO infra del cockpit.
#    DECISIÓN DE PRODUCTO (gate humano): ¿proyecto propio "Langfuse Bridge" o dentro de otro?
#    PREGUNTAR a Joserra antes de poblar (la regla linear-mcp NO mapea este repo a un proyecto).

# 4. No duplicar: list_issues del proyecto destino antes de poblar (por si hubo intake parcial).
```

**Si alguna precondición falla → parar y resolver.** Especial atención al punto 3: el mapping
carpeta→proyecto de `linear-mcp.md` NO incluye `atlax-langfuse-bridge` explícitamente → es una
decisión de producto que debe confirmar Joserra (gate G0/G1).

---

## 2 · Ground-truth (dimensionado, verificado 2026-06-21)

| Material                        | Cantidad                                          | Path                                                       |
| ------------------------------- | ------------------------------------------------- | ---------------------------------------------------------- |
| PRs mergeados                   | **110** (último #110)                             | `gh pr list --state merged`                                |
| Commits                         | 111 (13 días densos, arrancó en S22)              | `git log --oneline`                                        |
| ADRs                            | **17** (ADR-001..017, todos Accepted)             | `docs/adr/` — formato real `ADR-NNN-slug.md`               |
| Invariantes                     | **15** (I-1..I-15, con cobertura de test mapeada) | `CLAUDE.md` + `ARCHITECTURE.md §10`                        |
| Roadmap maestro                 | S17-S24, 33 ítems con sizing/blast/deps           | `docs/roadmap/2026-Q2-Q3-bridge-dashboard-coordination.md` |
| Backlog post-v1                 | PV1-A1..C4, ítems DONE marcados                   | `docs/roadmap/post-v1-backlog.md`                          |
| Sprint detail (ejemplo DoR/DoD) | S17                                               | `docs/roadmap/sprint-17.md`                                |
| Pilot report (métricas reales)  | 816 tests, 62 PRs al S24, KPIs                    | `docs/operations/pilot-report-v1.md`                       |
| SDD canónico                    | §1-§14, fases v0.1→v1.0                           | `ARCHITECTURE.md`                                          |
| RFCs / Spikes / Experimentos    | 2 / 1 / 1                                         | `docs/rfcs/`, `docs/spikes/`, `docs/experiments/`          |
| CHANGELOG semver                | v0.1.0→v1.0.1 + Unreleased                        | `CHANGELOG.md`                                             |

### Épicas candidatas (9 — mapear desde la estructura, no inventar)

1. Hook Stop de sync (`hooks/langfuse-sync.ts`, I-1/2/3/15) · 2. Reconciler cron (`scripts/reconcile-traces.ts`, I-5/11) ·
2. Stack Langfuse v3 self-hosted (`docker/`, ADR-012..017, `infra/`) · 4. LiteLLM gateway (`docker/litellm/`, ADR-007/10/16) ·
3. MCP server (`scripts/mcp-server.ts`, ADR-005, I-10) · 6. Browser extension (`browser-extension/`) ·
4. Tier detection + pricing (`shared/model-pricing.ts`, ADR-004, I-6/7/8) · 8. Backfill + historial (`scripts/backfill-*`) ·
5. Backup PRO / operaciones GCP (`scripts/backup-*`, ADR-015) · (+ posible "Core shared library" `shared/`).

### Convención de ID actual (normalizar bajo ATL-N)

- **Sin Linear ni Jira** (cero referencias). Interno: `S{NN}-{X}` (sprint items), `PV1-{X}` (post-v1),
  `ADR-NNN`, `I-N`, `RFC-NNN`, `#N` (PRs).

---

## 3 · Flujo, gates y disciplinas (el skill conduce)

Variante **brownfield-retrofit** (en stack/prod, sin gobernanza Linear). Gates: G0 (IP/frontera +
**decisión de proyecto Linear destino**, §1.3) · G1 (batch decisiones) · G2 (aprobar poblado).

Disciplinas (del piloto Harvest + reglas):

- **Todo de artefactos (ground-truth)**, nunca de memoria.
- **R26 sobre cada finding ANTES de poblar** (mejora cockpit): los ítems S17-S21 viven en docs pero
  no en git — verificar cuáles están ya DONE (post-v1 backlog ya marca algunos) para no crear issues
  de trabajo ya hecho. Mismo error que casi comete Harvest.
- **ADR slug limpio**, próximo libre **ADR-018** (formato `ADR-018-slug.md`, verificado).
- **Sin variable económica** en artefactos.
- **corpus > gatherer**: `pilot-report-v1.md` (curado) gana al conteo crudo de git para métricas.

---

## 4 · Criterio de cierre numerable (predicados VERIFICADOS — §3.5)

El intake está cerrado cuando, por output en conversación:

1. ADRs nuevos: `ls docs/adr/ADR-0[2-9][0-9]-*.md docs/adr/ADR-018-*.md docs/adr/ADR-019-*.md 2>/dev/null | wc -l` → ≥1.
   (Formato REAL `ADR-NNN-slug.md` — verificado; NO usar `0NN-*.md`.)
2. Scorecard de readiness escrito: `ls docs/intake/*EADINESS* docs/intake/*scorecard* 2>/dev/null` → ≥1.
3. Proyecto Linear destino tiene épicas+PBIs poblados: `list_issues project="<destino>"` → N nuevas vs baseline.
4. Handoff a `/goal` en `docs/`.
5. `git status` limpio, artefactos en rama `ATL-N-...` con PR.

> **Umbral de volumen DESPUÉS de R26** (§3.6): NO fijar "≥N PRs de implementación" hasta correr R26
> sobre el backlog y contar PBIs con trabajo GENUINO pendiente. El intake en sí es docs+Linear
> (poblado), no implementación — el `/goal` cierra en el poblado, no en N PRs de código.

---

## 5 · Condición `/goal` lista para pegar (sesión Atlax360, modo auto)

```
/goal Intake brownfield de langfuse-bridge completo: `ls docs/adr/ADR-018-*.md docs/adr/ADR-019-*.md 2>/dev/null | wc -l` ≥1 con ADR nuevo, existe scorecard en docs/intake/, el proyecto destino en Linear Atlax360 tiene épicas+PBIs poblados (mostrar list_issues), y hay handoff a /goal en docs/ — o para tras 35 turnos
```

---

## 6 · Prompt de arranque (pegar ANTES del /goal)

```
Lee docs/handoffs/2026-06-21-atlax-intake-langfuse-bridge-piloto.md y aplica sus precondiciones
(§1) antes de tocar nada: verifica que ves el team Atlax360 (key ATL) en Linear —NO Semantia—,
git main limpio en ~/work/atlax-langfuse-bridge, remote atlax360, identidad jgcalvo@atlax360.com.
CRÍTICO §1.3: el proyecto Linear destino para langfuse-bridge NO está mapeado en linear-mcp.md —
pregúntame qué proyecto usar (propio "Langfuse Bridge" o dentro de otro) ANTES de poblar.
Confirmado, ejecuta /atlax-intake ~/work/atlax-langfuse-bridge --brownfield. Para en cada gate
(G0/G1/G2) y pregúntame. Deriva TODO de artefactos (ground-truth), nunca de memoria. Aplica R26
sobre cada finding antes de poblar (S17-S21 están en docs, no en git — verifica qué ya está DONE).
```

---

## 7 · Riesgos

- **Proyecto Linear destino sin mapear** (§1.3) — decisión de producto, gate humano. NO asumir.
- **Gotcha dedup Linear** — solo `linear-atlax` activo en esa sesión.
- **S17-S21 fuera de git** — el roadmap los describe pero el repo arrancó en S22. R26 antes de
  crear issues de sprints que quizá ya estén DONE (post-v1 backlog marca algunos).
- **Branch protection** — rama `ATL-N-...` + PR, nunca commit directo a main.

```

```
