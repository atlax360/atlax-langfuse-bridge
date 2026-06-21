# Productization Plan · atlax-langfuse-bridge (brownfield-retrofit)

> **Fecha**: 2026-06-21 · Deriva de `INTAKE-ANALYSIS.md` (scorecard 81 %, gap = D7 gobernanza).
> Variante **brownfield-retrofit**: el sistema YA está en producción (v1.0.1). La "migración"
> es **mantener + gobernar**, no reescribir. El plan define los **ejes (épicas)** para poblar
> Linear y el **backlog real** (post-R26), no un árbol especulativo.

---

## 1 · Arquitectura objetivo

**No cambia** respecto a la actual — el stack ya es canónico Atlax:

- Bun + TS strict + ESM, cero deps de producción (ADR-001).
- Edge-tooling (hook/reconciler/scripts, I-13) + server-only (Langfuse v3 en GCP).
- Idempotencia por `traceId` (I-2), validación de input (I-15), logging estructurado (D9).

La productización aquí es **gobernanza retroactiva**: trazar lo construido como épicas Linear,
arrancar corpus de retros, y cerrar los 2 gaps técnicos menores (D2 float, D4 logging del hook).

## 2 · Estrategia de migración por componente

| Componente                                 | Estado                         | Estrategia                                                 |
| ------------------------------------------ | ------------------------------ | ---------------------------------------------------------- |
| Hook Stop (`hooks/`)                       | Prod, I-1/2/3/15               | **Mantener** + 1 PBI menor (logging JSON, D4)              |
| Reconciler (`scripts/reconcile-traces.ts`) | Prod, systemd 15 min           | **Mantener**                                               |
| Stack Langfuse v3 (`docker/`, `infra/`)    | PRO activo (Cloud Run+GCE+SQL) | **Mantener** + 1 PBI mejora (deploy automation, D6)        |
| LiteLLM gateway                            | PRO (M1-M3), opt-in            | **Mantener** + backlog operativo (multi-IDE/vendor)        |
| MCP server (`scripts/mcp-server.ts`)       | Funcional, cero SDK (ADR-005)  | **Mantener**                                               |
| Browser extension (`browser-extension/`)   | Funcional, no en Store         | **Mantener** (Store = decisión corporativa MDM, anti-item) |
| Shared lib (`shared/`)                     | SSoT, ~99 % cobertura          | **Mantener** + 1 PBI (ADR-018 float→redondeo display)      |
| Pricing/tier (`shared/model-pricing.ts`)   | I-6/7/8                        | **Mantener**                                               |

## 3 · Ejes funcionales (épicas Linear)

Derivados de la estructura real del repo (handoff §2 + mapa de arquitectura), **no inventados**.
9 épicas. Cada una agrupa su código + ADRs + invariantes.

| #   | Épica                             | Código                                       | ADRs / Invariantes   | Estado                           |
| --- | --------------------------------- | -------------------------------------------- | -------------------- | -------------------------------- |
| E1  | **Hook Stop de sync**             | `hooks/langfuse-sync.ts`                     | ADR-003 · I-1/2/3/15 | Done (prod) + 1 PBI abierto      |
| E2  | **Reconciler cron**               | `scripts/reconcile-traces.ts`                | ADR-006/008 · I-5/11 | Done (prod)                      |
| E3  | **Stack Langfuse v3 self-hosted** | `docker/`, `infra/`                          | ADR-012/13/14/17     | Done (PRO) + 1 PBI mejora        |
| E4  | **LiteLLM gateway**               | `docker/litellm/`                            | ADR-007/10/16        | Done (M1-M3) + backlog operativo |
| E5  | **MCP server**                    | `scripts/mcp-server.ts`, `shared/tools/`     | ADR-005 · I-10       | Done                             |
| E6  | **Browser extension**             | `browser-extension/`                         | —                    | Done (no en Store)               |
| E7  | **Tier detection + pricing**      | `shared/model-pricing.ts`, `detect-tier.ts`  | ADR-004/09 · I-6/7/8 | Done                             |
| E8  | **Backfill + historial**          | `scripts/backfill-historical-traces.ts`      | —                    | Done                             |
| E9  | **Backup PRO + operaciones GCP**  | `scripts/backup-*`, `infra/provision-pro.sh` | ADR-015              | Done + backlog (Cloud Scheduler) |
| E0  | **Core shared library**           | `shared/` (SSoT)                             | I-6/11/15            | Done + 1 PBI (ADR-018)           |

## 4 · Backlog real (post-R26) — qué se puebla en Linear

> **R26 verificado contra git/docs**: el roadmap S17-S24 está 31/33 DONE; post-v1 3/11 DONE
> (PV1-A1 #96, PV1-C1 #99-101, PV1-D1 #102). Lo que sigue es el **backlog GENUINO pendiente**.

### 4.1 · PBIs técnicos abiertos (derivados del scorecard — trabajo de código real)

| PBI                                                                                                        | Origen       | Épica | Size | Blast | Label        |
| ---------------------------------------------------------------------------------------------------------- | ------------ | ----- | ---- | ----- | ------------ |
| Redondeo defensivo de coste al serializar (`Math.round(c*100)/100`)                                        | ADR-018 / D2 | E0/E1 | S    | LOW   | `agent-task` |
| Unificar logging del hook a JSON estructurado (`process.stderr.write` plano → `emitDegradation`/`logInfo`) | D4           | E1    | S    | LOW   | `agent-task` |
| Deploy automation `workflow_run` + smoke post-deploy automatizado                                          | D6           | E3    | M    | LOW   | `agent-task` |

### 4.2 · Backlog operativo / coordinación (post-v1 abierto, NO bloqueado por código)

| PBI                                            | ID origen      | Épica | Bloqueo                               | Label             |
| ---------------------------------------------- | -------------- | ----- | ------------------------------------- | ----------------- |
| Distribuir hook a los 13 devs con seat Premium | PV1-A2         | E1    | Coordinación equipo                   | `centaur-blocked` |
| Onboarding LiteLLM de ≥3 devs piloto           | PV1-A3         | E4    | Voluntarios (dep PV1-A2)              | `centaur-blocked` |
| Multi-IDE adoption (Cline, Continue, Cursor)   | PV1-B1 / S21-B | E4    | Dep piloto activo                     | `human-review`    |
| Multi-vendor routing (OpenAI, Vertex, Bedrock) | PV1-B2         | E4    | Dep piloto mono-vendor validado       | `human-review`    |
| `cost-source:api-real` para devs con API-key   | PV1-B4         | E2/E7 | Dep ≥1 dev con `ANTHROPIC_API_KEY`    | `centaur-blocked` |
| Multi-perfil tracking (PMs, QA, ops)           | PV1-C2         | E6    | Dep hook estable (PV1-A2)             | `human-review`    |
| Scope review mensual automatizado              | PV1-C3         | E0    | —                                     | `agent-task`      |
| Dashboard → Langfuse API drill-down            | PV1-B3 / CP-4  | E3    | Coord. owner dashboard (repo hermano) | `human-review`    |
| Cross-validación pricing en CI del dashboard   | PV1-C4 / CP-1  | E7    | Coord. owner dashboard                | `human-review`    |
| Cloud Scheduler para `clickhouse-backup-s3.sh` | E9 backlog     | E9    | —                                     | `agent-task`      |

### 4.3 · Trabajo DONE a registrar con evidencia (trazabilidad, NO trabajo fantasma)

Las 9 épicas se crean **completas** (estado refleja prod) con punteros a su código/ADRs. Los
ítems post-v1 ya cerrados (PV1-A1/C1/D1) se anotan en la descripción de su épica con el PR, **no**
se crean como issues abiertos (evita el doble trabajo "abrir → descubrir resuelto → cerrar").

## 5 · Orden de dependencia (para el /goal)

1. **Esqueleto**: crear las 9 épicas (E1-E9 + E0) con descripción + punteros ground-truth.
2. **PBIs técnicos** (4.1): los 3 son independientes, blast LOW → paralelizables, `agent-task`.
3. **Backlog operativo** (4.2): mayoría `centaur-blocked`/`human-review` → NO se ejecutan en
   tiradas autónomas; quedan documentados para cuando se desbloquee la dependencia humana.
4. **Retros**: arrancar `retro-review` para el corpus (cierra D7 completamente).

## 6 · Qué NO entra (anti-items, del roadmap §11)

- Migrar hook/reconciler a Cloud Run (viola I-13/ADR-002).
- Unificación monorepo bridge+dashboard (I-13 + cadencias incompatibles).
- LiteLLM para tráfico OAuth de seats (ADR-007: SPOF+latencia).
- Browser extension → Chrome Web Store (decisión MDM corporativa).
- Migración coste a cents enteros **ahora** (ADR-018: over-engineering al volumen actual).
