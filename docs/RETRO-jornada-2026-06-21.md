# RETRO — Jornada 2026-06-21 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs). Fiabilidad ALTA para hechos.
> Ground-truth: 5 PRs merged 2026-06-21 (`#111` → `#115`), 5 commits en main.
> Baseline tests: 1054 → 1062 pass / 0 fail / 5 skip.

---

## 0. Resumen de la jornada

**Temas**: gobernanza Linear (intake brownfield) + 3 PBIs técnicos de calidad (coste, logging, deploy).

| Eje                             | Valor                                           |
| ------------------------------- | ----------------------------------------------- |
| PRs merged                      | 5 (#111 → #115)                                 |
| LOC bruto (additions+deletions) | +1116 / -11 = **1127 LOC**                      |
| Tests delta                     | +8 tests nuevos (1054 → 1062 pass)              |
| ADRs nuevos                     | 3 (ADR-018, ADR-019, ADR-020)                   |
| Issues Linear creados           | 23 (proyecto "Langfuse Bridge", team ATL)       |
| Scorecard readiness             | **81 %** (D1-D10, variante brownfield-retrofit) |

**Ejes de trabajo**:

1. **Intake brownfield** (`/atlax-intake --brownfield`): análisis de ground-truth → scorecard → ADR-018/019 → plan de productización → handoff `/goal` → 23 issues Linear. PR #111 (arranque) + PR #112 (artefactos).
2. **ATL-377** — Redondeo defensivo de coste en display (`roundCostDisplay`). PR #113 (+50/-3). ADR-018 clarifica por qué float es correcto y el redondeo es solo display.
3. **ATL-378** — Logging JSON estructurado del hook: `logInfo()` a `shared/degradation.ts`, migración de 2 `process.stderr.write` planos. PR #114 (+95/-8). ADR-019.
4. **ATL-379** — ADR-020 (deploy PRO manual deliberado) + `smoke-langfuse-pro-e2e.ts` (round-trip real contra `langfuse.atlax360.ai`). PR #115 (+319/-0).

---

## 1. Lo que ha ido bien

- **Intake brownfield derivado 100% de artefactos** [VERIFICADO: INTAKE-ANALYSIS.md §0 declara "nunca de memoria"]. El análisis partió de `gh pr list` (110 PRs), `git log`, `bun run check` y lectura de los 17 ADRs existentes — no de la memoria del modelo sobre el proyecto.

- **Scorecard 81 % con sólo 2 gaps bloqueantes** [VERIFICADO: PR #112 body, tabla D1-D10]. D1 (seguridad), D3 (stack), D5 (tests), D6 (CI/CD), D9 (observabilidad) todos en verde sin retrabajo. El proyecto tenía solidez técnica real antes de la sesión de gobernanza.

- **ADR-018 tomó la decisión honesta sobre float** [VERIFICADO: `docs/adr/ADR-018-coste-estimado-en-float.md`]. El gate global `cross-project-patterns.md` prohibe float para dinero financiero; ADR-018 documenta explícitamente por qué el coste estimado no es un importe transaccional (tolerancia `COST_EPSILON`, display-only) y acepta el float con redondeo defensivo. Es exactamente el uso correcto de un ADR: _observado vs decidido_, no mecánica de cumplimiento.

- **Pipeline /goal ejecutó 3 PBIs limpios sin enroque** [VERIFICADO: 5 commits en main, 0 branches huérfanas, tests verde en cada PR]. Cada PBI cerró con su propio PR y tests asociados antes de mergear el siguiente.

- **23 issues Linear creados sin ruido** [VERIFICADO: PR #112 body "23 issues"]. El gate de creación masiva (`linear-mcp.md`: "crea los issues que hagan falta SIN pedir confirmación cuando derivan de análisis verificado contra ground-truth") se aplicó correctamente tras R26 del intake.

- **Smoke test funcional real, no sólo `/health`** [VERIFICADO: `scripts/smoke-langfuse-pro-e2e.ts` +193 LOC, PR #115]. El smoke cubre: POST trace → poll Worker async → visibilidad en ClickHouse → round-trip. Es el patrón canónico "smoke test del baseline antes de PRE/PRO" del CLAUDE.md global.

- **Tests delta limpio** [VERIFICADO: 1054 → 1062 pass, +8 tests, 0 fail]. Los PBIs añadieron coverage sin romper la suite. Cada PR cerró con `bun run check` verde antes de merge.

---

## 2. Regresiones y grietas que no escondemos

- **Conflicto de merge entre ATL-377 y ATL-378** [VERIFICADO: ambos PRs modifican `hooks/langfuse-sync.ts`; el orden de merge PR #113 → PR #114 lo resolvió con rebase, pero el conflicto era predecible desde el plan]. Los dos PBIs coincidían en el mismo archivo (`hooks/langfuse-sync.ts`). Un blast-radius check pre-ejecución (Regla I-14 §"Blast Radius Matrix") hubiera detectado la colisión y serializado el trabajo desde el inicio — en lugar de descubrirlo al abrir la segunda PR. En un worktree paralelo esto habría costado más recuperación; aquí se resolvió con rebase secuencial, coste bajo, pero el patrón es señal.

- **ADR-020 documenta deploy manual sin automatización** [VERIFICADO: `docs/adr/ADR-020-deploy-pro-manual-con-smoke-gate.md`; la excepción de `deploy-automation-cross-project.md` aplica]. La excepción es justificada (infra stateful, frecuencia baja, SA privilegiada en CI), pero introduce dependencia en memoria del operador. El smoke post-deploy mitiga parcialmente, pero el "último kilómetro" sigue siendo manual. No es una regresión respecto a ayer (antes no había ni smoke), pero la deuda operativa persiste a largo plazo.

- **Gap D7 (gobernanza Linear) existía desde v1.0.0** [INFERIDO: el proyecto alcanzó producción sin proyecto Linear ni corpus de retros; la sesión cierra ese gap 21 días después del lanzamiento PRO]. El intake detectó 0 retros en `docs/` antes de hoy. No es un error de esta jornada, pero sí una grieta del ciclo anterior que llega al intake por acumulación.

- **23 issues Linear representan backlog no priorizado** [VERIFICADO: PR #112 crea las épicas pero la priorización dentro del proyecto Linear queda como tarea post-intake]. El `/goal` que cerró los 3 PBIs técnicos ejecutó el backlog inmediato (D2, D4, D6), pero los 20 issues restantes no tienen sprint asignado aún. No es un fallo de hoy, pero es deuda visible de la siguiente sesión.

---

## 3. Factor de contexto

- **Tirada con `/goal` modo auto en Mac M5 Max** [VERIFICADO: hardware tier Mac M5 Max (hardware-tier-centaur.md); `CLAUDE_CODE_USE_VERTEX` no activo en esta sesión]. Sin restricciones de memoria (128 GB). Los 3 PBIs técnicos son secuenciales simples (1 archivo + tests cada uno), no paralelizables — la capacidad del hardware no fue el factor limitante.

- **Intake brownfield como primera pieza** [VERIFICADO: PR #111 de arranque + PR #112 de artefactos preceden los PBIs técnicos]. El intake generó los ADRs 018/019 que los PBIs necesitaban como referencia: la secuencia fue correcta (análisis → decisión → implementación), no al revés.

- **Proyecto ya en producción v1.0.1** [VERIFICADO: INTAKE-ANALYSIS.md §0 "repo on-stack, en producción"]. El contexto de brownfield-retrofit implica que cualquier cambio a `hooks/langfuse-sync.ts` afecta al hook activo de 38 devs. Las invariantes I-1 (exit 0) e I-2 (idempotencia) no se tocaron — buen signo de disciplina en el scope de los PBIs.

---

## 4. Aprendizajes accionables

1. **Pre-check blast-radius antes de planificar PBIs que tocan el mismo archivo**. Trigger operativo: al descomponer un backlog en PBIs técnicos, ejecutar `grep -rn "hooks/langfuse-sync.ts" <PBI-list>` para detectar colisiones antes de abrir las primeras ramas. Si dos PBIs comparten el archivo, serializar explícitamente y documentarlo en el plan (no descubrirlo al rebase).

2. **El smoke post-deploy es el artefacto de evidencia del PR, no sólo el control mitigante**. Trigger operativo: en PRs de deploy o infra, incluir el output completo del smoke en el body del PR (no solo "smoke skip-graceful sin creds → exit 0"). El deploy real es la primera ejecución con creds — el PR debería tener la plantilla del output esperado para comparar al ejecutarlo.

3. **Los gaps de gobernanza (D7: Linear) se acumulan rápidamente en proyectos en producción**. Trigger operativo: al lanzar cualquier proyecto a PRO (merge a main + deploy), crear el proyecto Linear y la primera retro en la misma sesión de lanzamiento, no diferirlos. El coste en frío (21 días después) es significativamente mayor que en caliente.

4. **ADR "observado vs decidido" es más valioso que "cumplimiento mecánico"**. Trigger operativo: cuando un gate global parezca aplicar mecánicamente a un caso que tiene matices (como float para coste estimado vs float para dinero transaccional), escribir el ADR antes de implementar — y que el ADR justifique la excepción o el cumplimiento, nunca asumir.

5. **23 issues creados sin sprint = backlog invisible**. Trigger operativo: tras cualquier intake que cree >10 issues, el handoff a `/goal` debe incluir una primera acción de priorización ("¿cuáles van al próximo sprint vs backlog?") antes de ejecutar más PBIs.

---

## 5. Evolución vs regresión — balance neto

**Evolución clara**:

- De 0 gobernanza Linear a proyecto "Langfuse Bridge" con 23 issues, 3 ADRs y scorecard formal.
- De logging mixto (JSON + text plano en el mismo hook) a logging 100% JSON estructurado en `shared/degradation.ts`.
- De deploy PRO sin smoke a smoke funcional real con round-trip async completo.
- Suite de tests creció de 1054 a 1062 pass, 0 regresiones.

**Regresión sutil**:

- El conflicto de merge ATL-377/ATL-378 era predecible y no se pre-detectó. El protocolo Blast Radius (I-14) existe pero no se aplicó preventivamente al planificar los PBIs — se detectó al ejecutar, no al planificar.
- Los 20 issues restantes del backlog quedan sin priorización explícita.

**Balance neto**: jornada positiva con entregables verificables. El ratio evolución/regresión es favorable. La grieta del conflicto de merge es baja severidad (resuelto en el momento con coste mínimo), pero indica un gap de proceso al planificar PBIs con solapamiento de archivos. La deuda de backlog sin priorizar es la tarea más concreta pendiente.

---

## 6. Triage retro-as-action

| Ítem                                                                          | Clasificación                    | Razón                                                                                         |
| ----------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| Priorizar sprint 1 de los 23 issues Linear (siguiente 30 min en sesión nueva) | 🟡 **Handoff primera acción**    | Requiere revisión humana del backlog para decidir prioridad; no es trabajo autónomo           |
| Añadir blast-radius check al plan de PBIs en el skill `/goal`                 | 🔴 **Backlog v.N+1**             | Requiere modificar el skill; coste >2h, dependencia de scope nuevo                            |
| Ejecutar smoke PRO con creds reales para verificar round-trip                 | 🟡 **Handoff primera acción**    | Requiere creds PRO del operador; primer deploy real confirma el smoke                         |
| 20 issues restantes del backlog sin sprint asignado                           | 🟡 **Handoff primera acción**    | Dependencia de decisión humana de priorización                                                |
| Retro corpus del proyecto (0 retros previas) — reconstruir desde git          | 🔴 **Backlog v.N+1**             | Coste >3h; valor decreciente (historial de sprints 1-24 en PRs/CHANGELOGs)                    |
| Deploy manual del stack PRO (si hay cambios pendientes)                       | ⚫ **Deuda aceptada permanente** | ADR-020 documenta que el deploy es deliberadamente manual; es el diseño, no una deuda técnica |

**Recomendación primera acción próxima sesión**:

1. Revisar los 23 issues Linear del proyecto "Langfuse Bridge" y asignar prioridad al sprint 1 (máx. 5-7 issues).
2. Ejecutar `bun run scripts/smoke-langfuse-pro-e2e.ts` con creds PRO para verificar el round-trip real documentado en ADR-020.

---

## Anexo — Ground-truth

| # PR      | Título                                                                            | Additions | Deletions | Files  | Merged     |
| --------- | --------------------------------------------------------------------------------- | --------- | --------- | ------ | ---------- |
| #111      | `docs(handoffs): arranque /atlax-intake brownfield langfuse-bridge`               | +152      | -0        | 1      | 2026-06-21 |
| #112      | `docs(intake): brownfield-retrofit — ADRs 018/019 + scorecard + 23 issues Linear` | +500      | -0        | 5      | 2026-06-21 |
| #113      | `feat(ATL-377): redondeo defensivo de coste en display (ADR-018)`                 | +50       | -3        | 3      | 2026-06-21 |
| #114      | `feat(ATL-378): logging JSON estructurado en el hook (ADR-019)`                   | +95       | -8        | 3      | 2026-06-21 |
| #115      | `feat(ATL-379): ADR-020 deploy PRO manual + smoke post-deploy (D6)`               | +319      | -0        | 3      | 2026-06-21 |
| **Total** |                                                                                   | **+1116** | **-11**   | **15** |            |

**Test baseline**: 1054 pass / 0 fail (inicio de jornada, PR #112 body) → 1062 pass / 0 fail (cierre, `bun run check` verificado post-PR #115).

**ADRs creados**: ADR-018 (coste float aceptado) · ADR-019 (logging JSON bridge) · ADR-020 (deploy PRO manual con smoke-gate).

**Artefactos intake**: `docs/intake/INTAKE-ANALYSIS.md` (15.5K) · `docs/intake/PRODUCTIZATION-PLAN.md` (8.7K) · `docs/intake/HANDOFF-intake.md` (7.2K).
