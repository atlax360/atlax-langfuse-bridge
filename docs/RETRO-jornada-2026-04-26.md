# RETRO — Jornada 2026-04-26 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos (PRs, LOC, orden, contenido de PR body); MEDIA/BAJA para vivencia subjetiva — `[inferido]` donde aplique.
> Ground-truth: 9 PRs merged 2026-04-26. `gh pr list --search "merged:2026-04-26"`.

---

## 0. Resumen de la jornada

**9 PRs mergeados** en una ventana de ~2h 45min (17:11 → 19:56 UTC). Sprint fundacional del repo: de estado brownfield sin CI ni typecheck a base productizable con suite de tests y deuda técnica liquidada.

| Eje                     | PRs | Descripción                                                 |
| ----------------------- | --- | ----------------------------------------------------------- |
| MCP smoke + README      | #10 | Smoke E2E real 9/9 checks + sección operativa               |
| CI + degradation shared | #11 | GitHub Actions, emitDegradation a shared/, wire smoke en CI |
| Browser extension       | #12 | Pricing canónico (I-6), degradation, ESM, timeouts          |
| Debt sprint 1           | #13 | 7 bugs C/H/M — I-8, setup, tiers, typecheck, CI cache       |
| Debt sprint 2           | #14 | 5 bugs M/N — entrypoint allowlist, manifest perms, backoff  |
| Test consolidación      | #15 | Sprint 3 — 294 tests / 544 assertions / coverage 78%→89%    |
| Test sprint 4           | #16 | C1/C2 critical fixes + H2/H3/H4/M4 coverage                 |
| Refactor shared         | #17 | COST_EPSILON, loadEnvFile, discoverRecentJsonls → shared/   |
| Debt sprint 6           | #18 | M7/M8/M9/N1/N2/N3 — smoke CI, healthcheck, catch warn, PII  |

**LOC bruto**: 3.917 líneas (suma additions + deletions de los 9 PRs):
+3.553 added / -364 deleted.

**Modelo**: no consta en los PR bodies. `[inferido]` Sonnet 4.x o equivalente por volumen y velocidad.

---

## 1. Lo que ha ido bien

### 1.1 Velocidad con calidad consistente

9 PRs en ~2h45min con typecheck y `bun test` verde en cada uno. El pacing es llamativo: PRs #13 y #14 se mergearon con 1 minuto de diferencia (18:58 y 18:59 UTC), demostrando ejecución muy fluida del bloque de deuda técnica. No hay revert ni fix-de-fix dentro de la misma jornada — todos los PRs llegan en estado "listo".

### 1.2 Liquidación completa de deuda técnica en cascada

Los PRs #13 y #14 resolvideron 12 items de deuda (C1/C2/M1/A1/A2/A3/M5 + M2/M3/M4/N1/N2) que arrastraban del backlog previo. El sprint 1 y sprint 2 de deuda cerraron en orden correcto pese a la dependencia entre ramas (cherry-pick + rebase), con la técnica documentada en memoria `project_debt_sprints.md`.

### 1.3 Cobertura de tests materialmente mejorada

Recorrido documentado en los PRs: 175 → 183 → 204 → 206 → 294 → 337 → 354 tests (0 fail en todos los puntos). Coverage 78% → 89% entre PR #15 y el cierre del día. PR #16 cerró dos bugs CRÍTICOS (C1: cross-validation pricing extension vs shared; C2: setup.sh no copiaba shared/ — fallo en runtime en fresh install) que no tenían cobertura previa.

### 1.4 Invariante I-6 materializada y verificable

PR #12 introduce `browser-extension/src/pricing.test.ts` como cross-validation entre el JS de extensión y `shared/model-pricing.ts` — el invariante I-6 ("MODEL_PRICING es única SSoT") pasa a ser **testeable en CI**. Sin ese test, un cambio de precios podía hacer divergir extensión y hook silenciosamente.

### 1.5 Técnica mock-response correcta identificada y documentada

PR #15 documenta explícitamente el bug "Body already used" (mockResolvedValue reutiliza instancia Response) y su solución (mockImplementation con factory). Este patrón quedó en memoria `feedback_mock_response_body.md` — señal de que el equipo/agente tomó tiempo para entender la causa raíz, no solo parchar.

---

## 2. Regresiones y grietas que no escondemos

### 2.1 Deuda acumulada en sprints anteriores — riesgo de que el burst de un día enmascare el origen

Los PRs #13 y #14 resuelven bugs que ya existían antes del 26-04: C-2 (setup.sh no copiaba shared/ → fresh install roto **desde el día que se creó shared/**), C-1 (I-8 violation en detect-tier, M-1 billing tiers mal referenciados). El hecho de que dos bugs CRITICAL sobre setup e invariantes lleguen al backlog en lugar de bloquearse en PR es una grieta del proceso: `[inferido]` el repo estuvo en estado "funciona en la máquina del dev, roto en fresh install" durante un período previo indeterminado.

### 2.2 CI no existía hasta PR #11 — CI tardío introduce riesgo de drift acumulado

PR #11 crea `.github/workflows/ci.yml`. Todos los PRs anteriores a ese día (incluyendo el propio PR #10 del mismo día) carecían de CI que ejecutara typecheck o tests automáticamente. El cuerpo del PR #11 confirma: "Sin lockfile ni caché de deps porque el proyecto no tiene `package.json`". PR #13 (mismo día, 1h después) tiene que **crear** `tsconfig.json` y `package.json`. El orden correcto habría sido crear la estructura base antes de escribir código. `[inferido]` la secuencia fue: implementar funcionalidad → añadir CI → reparar lo que CI reveló, todo en un solo día de explosión de PRs.

### 2.3 PR #11 test plan con checkboxes no marcados — señal de merge con verificación parcial

PR #11 lleva en su test plan:

```
- [ ] CI job `test` ejecuta `bun test` en cada PR
- [ ] CI job `smoke-e2e` corre skip-graceful sin secrets
```

Ambos sin marcar al merge. Lo mismo en PR #12 (3 de 5 checkboxes abiertos en "Test plan"). `[inferido]` el agente/dev mergeó aceptando que la validación manual no estaba 100% completada — cobertura práctica era alta pero el proceso de sign-off estaba incompleto.

### 2.4 Dependencia entre PR #13 y #14 requirió cherry-pick manual — señal de planificación deficiente de ramas

Memoria `project_debt_sprints.md` documenta: "Sprint-2 se bifurcó de main antes de que sprint-1 se mergeara. Solución: cherry-pick de los 2 commits de sprint-1 en sprint-2, luego rebase." El cherry-pick manual es procedimiento de recuperación, no proceso planificado. La lección se documentó — pero la causa raíz (abrir ramas dependientes sin que el padre esté mergeado) se conoce como anti-pattern y aquí se materializó.

### 2.5 PR #16 revela que C1/C2 eran bugs críticos sin cobertura desde el origen

C1 (extensión podía divergir de hook en pricing sin detección) y C2 (fresh install roto por setup.sh) son bugs CRÍTICOS que solo se descubrieron **durante el sprint de tests de PR #16**, no antes. El sistema llegó a 89% coverage con dos brechas críticas que habrían pasado inadvertidas sin la consolidación de tests. Señal: los sprints de funcionalidad no incluían test de invariantes de manera sistemática.

---

## 3. Factor de contexto

`[inferido]` — sin memoria de sesión directa, contexto reconstruido desde patrones forenses.

**Jornada de fundación/bootstrapping intensivo**: los 9 PRs en 2h45 con la secuencia smoke→CI→extension→debt1→debt2→tests1→tests2→refactor→debt3 sugieren una sesión centauro de alta intensidad con el objetivo de llevar el repo de "brownfield funcional" a "base productizable". El orden no es feature-driven sino infrastructure-driven: primero los cimientos (CI, typecheck, shared/), luego los tests, luego la limpieza.

La ventana horaria (17:11-19:56 UTC = 18:11-20:56 hora española en verano) sugiere una tarde de sesión concentrada, posiblemente con handoff claro hacia la fase de audit de seguridad que se ejecutó días después (PRs #19-24, mergeados 2026-04-27 según memoria `project_audit_sprint_7_12.md`).

No hay señales forenses de enroque (ningún issue repetido dentro del día), ni fix-de-fix (ningún PR que revierta o parchee otro del mismo día). La cadencia es lineal.

---

## 4. Aprendizajes accionables

**A-1 — Crear tsconfig + package.json + CI antes del primer commit de código**
Trigger: al iniciar cualquier repo TS en Atlax, el primer PR debe contener estructura base (tsconfig strict, package.json con devDeps, CI workflow con typecheck + bun test). No al séptimo PR cuando ya hay 10 archivos.

**A-2 — No abrir rama B hasta que rama A esté mergeada si B depende de A**
Trigger: si en la fase de planning ves que dos ramas de deuda comparten código base, bloquear la segunda hasta que la primera esté en main. El cherry-pick es recuperación, no proceso. Documentado en `project_debt_sprints.md` — ahora operativo como regla.

**A-3 — Checkboxes de test plan son bloqueantes para merge, no decorativos**
Trigger: antes de mergear, todos los `[ ]` del test plan deben estar marcados o documentar explícitamente la excepción ("se verifica en CI de siguiente PR"). Un PR mergeado con checkboxes vacíos no tiene sign-off real.

**A-4 — Incluir invariant-tests desde el primer sprint de funcionalidad**
Trigger: al escribir una nueva invariante en CLAUDE.md (I-N), en el mismo PR o en el siguiente inmediato, escribir el test que la verifica. C1 (pricing drift) y C2 (setup.sh) eran bugs de invariante que sobrevivieron sprints completos sin test.

**A-5 — Cross-validation tests para SSoT duplicado (JS/TS) desde el primer momento**
Trigger: si una SSoT (model-pricing.ts) tiene un espejo en otro lenguaje/formato (pricing.js), el test de cross-validation se escribe en el mismo PR que crea el espejo. No en un sprint de consolidación posterior.

---

## 5. Evolución vs regresión — balance neto

### Evolución clara

- De 0 tests + sin CI a 354 tests / 640 assertions / CI verde en una sola jornada. Saltando de "repositorio sin estructura de calidad" a "base testeable y productizable".
- Deuda técnica de 12 items (C/H/M/N) liquidada completamente.
- Invariante I-6 convertida en verificable en CI (antes era solo texto en CLAUDE.md).
- Módulo `shared/` consolidado: COST_EPSILON, loadEnvFile, discoverRecentJsonls, emitDegradation todos en SSoT.
- Foundation completa para la fase de security audit (PRs #19-24 del día siguiente) — sin esta jornada, el audit no habría tenido base sólida sobre la que trabajar.

### Regresión sutil

- La secuencia "funcionalidad → CI → reparar lo que CI encontró" es el anti-pattern de bootstrap. El bootstrapping correcto invierte el orden. Este patrón no se documentó como aprendizaje en las memorias de la jornada (la lección cherry-pick sí, pero no el orden CI-primero).
- PR bodies con checkboxes sin marcar al merge se normalizaron en esta jornada. Sin corrección, se convierte en debt cultural que escala con el equipo.

### Balance neto

**Jornada positiva neta**, fundacional para el proyecto. El volumen (3.917 LOC en 2h45) y la calidad (0 reverts, 0 regresiones de tests detectadas) son métricas sólidas. Las grietas son de proceso (CI tardío, checkboxes, orden de branches) no de producto — no introdujeron bugs en runtime. La estructura que se sentó ese día sostuvo el resto del desarrollo hasta v1.0.0.

---

## 6. Triage retro-as-action

Retro reconstruida post-hoc (~60 días después). El trabajo ya está resuelto; el triage aplica a aprendizajes como reglas.

| Item                                     | Clasificación                                            | Acción                                                                                                                                                                                                                                            |
| ---------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A-1 (tsconfig + CI en primer PR)         | ⚫ **Deuda permanente aceptada**                         | Ya aplica a proyectos nuevos vía CLAUDE.md. Este repo ya tiene CI. No hay trabajo pendiente.                                                                                                                                                      |
| A-2 (no abrir ramas dependientes)        | ⚫ **Deuda permanente aceptada**                         | Documentado en memoria `project_debt_sprints.md`. No hay código pendiente.                                                                                                                                                                        |
| A-3 (checkboxes bloqueantes)             | 🟡 **Handoff primera acción si se abre PR en este repo** | En la próxima sesión con PR activo: revisar si el patrón "checkboxes decorativos" persiste en los templates. Si hay `.github/PULL_REQUEST_TEMPLATE.md`, verificar que los checkboxes de test plan sean explícitamente requeridos. Coste: ~10 min. |
| A-4 (invariant-tests desde sprint 1)     | ⚫ **Deuda permanente aceptada**                         | I-15 añadida en v1.0.0 final con su test. El patrón está activo en CLAUDE.md. No hay trabajo pendiente para esta retro.                                                                                                                           |
| A-5 (cross-validation JS/TS en mismo PR) | ⚫ **Deuda permanente aceptada**                         | Patrón aplicado desde PR #16. Activo en invariante I-6.                                                                                                                                                                                           |

---

## Anexo — Ground-truth

| # PR      | Título                                                                                                        | Additions  | Deletions | Files  | Mergeado UTC |
| --------- | ------------------------------------------------------------------------------------------------------------- | ---------- | --------- | ------ | ------------ |
| #10       | feat(mcp): smoke E2E + sección operativa README                                                               | +438       | 0         | 2      | 17:11        |
| #11       | ci+quality: GitHub Actions, degradation shared, smoke E2E wire, Layer 2 tests                                 | +181       | -28       | 6      | 18:06        |
| #12       | feat(extension): modernización claude.ai — pricing canónico, degradation, tests                               | +428       | -43       | 7      | 18:19        |
| #13       | fix(debt-sprint-1): 7 bugs críticos/altos/medios — I-8, setup, tiers, getTrace, TierFile, typecheck, CI cache | +199       | -64       | 16     | 18:58        |
| #14       | fix(debt-sprint-2): entrypoint allowlist, manifest perms, backoff, README, tier tags                          | +65        | -10       | 5      | 18:59        |
| #15       | test(consolidation): Sprint 3 — 294 tests, 544 assertions, coverage 78%→89%                                   | +1.260     | -1        | 8      | 19:13        |
| #16       | test(sprint-4): C1/C2 critical fixes + H2/H3/H4/M4 coverage                                                   | +598       | -58       | 9      | 19:41        |
| #17       | refactor(shared): extraer COST_EPSILON, loadEnvFile y discoverRecentJsonls a shared/                          | +311       | -145      | 11     | 19:53        |
| #18       | fix(debt): sprint 6 — M7/M8/M9/N1/N2/N3                                                                       | +73        | -15       | 5      | 19:56        |
| **Total** | —                                                                                                             | **+3.553** | **-364**  | **69** | **2h 45min** |

Fuente: `gh pr list --state merged --search "merged:2026-04-26" --json number,title,additions,deletions,changedFiles,mergedAt`.
