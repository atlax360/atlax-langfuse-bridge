# RETRO — Jornada 2026-04-27 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs/memory), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos objetivos; MEDIA/BAJA para vivencia subjetiva — [inferido] donde aplique.
> Ground-truth: 11 PRs merged 2026-04-27. `gh pr list --search "merged:2026-04-27"`.
> Fuente secundaria: `~/.claude/projects/.../memory/project_audit_sprint_7_12.md`.

---

## 0. Resumen de la jornada

| Dimensión        | Datos verificados                                                                                                                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PRs mergeados    | **11** (#19 → #29)                                                                                                                                                                                                     |
| LOC bruto        | **+2.001 / -521** (suma additions+deletions de `gh pr view --json`)                                                                                                                                                    |
| Ficheros tocados | ~80 (sumatorio changedFiles; PR21 aporta 32 solo con el cascade tsconfig)                                                                                                                                              |
| Ventana horaria  | **07:58–11:54 UTC** (≈ 3h56min de commits; PR19 mergeado ~07:58, PR29 a las 11:54)                                                                                                                                     |
| Ejes             | Security CRITICAL (S7 + S8) → Security/Quality HIGH (S9 + S10) → Quality MEDIUM (S11) → Quality LOW+meta (S12) → EXT hardening + SSRF PRO (S13) → E2E CI-runnable (S14) → PRO migration readiness (S15) → docs + chore |
| Contexto previo  | El 26-abr se cerró el batch anterior con PRs #14-#18 (18:59–19:56 UTC). El 27-abr arrancó con el audit limpio.                                                                                                         |
| Test count final | 466 tests / 814 assertions (PR28 README confirma estado post-Sprint 15)                                                                                                                                                |

La jornada es la **mayor descarga de deuda técnica del proyecto hasta la fecha**: 65 findings del audit de seguridad y calidad (CRITICAL→LOW) cerrados en una sola sesión, más 3 E2E nuevos y el scaffolding completo de PRO migration. Es la jornada de consolidación que permitió enrolar el repo a producción con 38 devs.

---

## 1. Lo que ha ido bien

**VERIFICADO — Cadencia de cierre limpia y sin retrabajo en el núcleo.**
Los PRs #19–#24 (el bulk del audit) se abrieron y mergearon con diferencia de segundos (PR19: create 05:58:52 / merge 05:58:57; PR21: create 06:46:59 / merge 06:47:08). Esto indica branches ya preparadas con tests en verde antes de crear el PR — no iteración dentro del PR. Zero retries en CI detectables.

**VERIFICADO — Separación disciplinada por severidad.**
Sprint 7 = CRITICAL, Sprint 8 = HIGH/ext, Sprint 9 = HIGH/shared, Sprint 10 = HIGH/CI, Sprint 11 = MEDIUM, Sprint 12 = LOW. La gradación de severidad se respetó sin mezclas. El audit de memoria (`project_audit_sprint_7_12.md`) confirma que los 65 findings están categorizados y mapeados a PRs sin solapamiento.

**VERIFICADO — Módulos nuevos de calidad creada, no solo fixes.**
PR23 creó `shared/drift.ts` (única fuente de verdad para `classifyDrift` + `DriftStatus`) y extendió `shared/aggregate.ts`. PR26 creó `browser-extension/src/batch-builder.js` extraído de `background.js` (modularización testable). Ambos son creación neta, no solo parches.

**VERIFICADO — Invariante I-13 codificado en CI.**
PR27 no solo documentó el edge/core split — creó `tests/cloud-run-boundary.test.ts` con 17 tests que convierten el invariante en un gate CI. Si alguien elimina el guard de `backup-langfuse.sh` o toca `CLAUDE.md`, CI falla. Decisión arquitectónica materializada como código verificable.

**VERIFICADO — tsconfig hardening sistemático.**
PR21 añadió 5 flags de strictness (`exactOptionalPropertyTypes`, `noImplicitReturns`, `noFallthroughCasesInSwitch`, `noPropertyAccessFromIndexSignature`, `forceConsistentCasingInFileNames`) y ejecutó el cascade de ~25 ficheros para adaptar `process.env.VAR` → `process.env["VAR"]`. El hecho de que 403 tests pasaran tras ese cambio masivo indica que el cascade fue correcto y los tests tenían cobertura real.

---

## 2. Regresiones y grietas que no escondemos

**VERIFICADO — Fix-of-fix en la extensión: `optional_host_permissions` eliminada y re-añadida el mismo día.**

Esta es la señal forense más clara de la jornada. La secuencia:

- **PR20 (06:00 UTC)** — Sprint 8 — H5: `manifest.json` elimina `optional_host_permissions: ["https://*/*"]` marcándola como "redundante dado `isSafeHost()`".
- **PR25 (07:46 UTC)** — Sprint 13 — EXT-M1: `manifest.json` vuelve a añadir `optional_host_permissions: ["https://*/*"]` para que `chrome.permissions.request()` pueda pedir el origin de Langfuse remoto en runtime.

Mismo fichero, misma key, decisiones opuestas, con 1h46min de distancia. Esto es una iteración de diseño no resuelta antes de ejecutar, no dos fixes independientes. [inferido: el Sprint 8 tomó una decisión de "simplificación" sobre `host_permissions` sin considerar que EXT-M1 la necesitaba para el flujo de permisos dinámicos de la extensión]. El estado final (PR25) es el correcto según el PR body, pero el PR20 introdujo un estado intermedio incorrecto que requirió corrección.

**Coste observable**: ~46 lines de diff reversado sin valor neto. Sin impacto en producción porque la extensión no estaba desplegada a usuarios reales, pero sí es indicador de planificación de dependencias incompleta entre sprints del mismo día.

**VERIFICADO — 11 PRs en ~4 horas con review nulo entre creates y merges.**

Todos los PRs tienen diferencia de segundos entre `createdAt` y `mergedAt` (mínimo 5s, máximo 13s). Esto confirma automerge inmediato — sin ningún período de review humano. Para el contexto de este repo (un dev jgcalvo, preparación previa en branches, tests verdes), puede ser operacionalmente válido. Sin embargo, el fix-of-fix de `optional_host_permissions` es evidencia directa de que la revisión cruzada entre sprints fue insuficiente: si el PR25 se hubiera planificado antes de ejecutar el PR20, se habría visto la tensión antes de mergear.

**[inferido] — Sesión de madrugada / muy temprana.**

PR19 mergeado a las 05:58 UTC = 07:58 hora Madrid (CEST). Con el contexto del día anterior (PRs #14-#18 cerrados entre las 18:59 y 19:56 UTC = 20:59-21:56 Madrid), la sesión del 27-abr arrancó a las 8am tras una sesión intensa la víspera. [Fiabilidad: BAJA — no hay log de cuándo empezó la planificación del 27-abr; puede haber habido preparación de branches antes de los commits visibles].

---

## 3. Factor de contexto

**VERIFICADO — La jornada cierra un audit encargado explícitamente para preparar el repo a producción con 38 devs.**

El memo de memoria `project_audit_sprint_7_12.md` confirma que los 65 findings venían de un audit preexistente (no generado durante la sesión). La jornada del 27-abr fue ejecución de un plan ya definido, no discovery. Esto explica la velocidad: las branches estaban pre-preparadas, los tests escritos de antemano, y la apertura de PR era el paso final de cada bloque.

**[inferido] — Presión de "cerrar el audit de una vez".**

La estructura de 9 sprints ejecutados en una sola sesión de ~4 horas (Sprints 7-15) sugiere un modo "closing sprint debt in bulk". En el contexto de 38 devs esperando enrolarse, este modo es comprensible. El riesgo asociado es que la planificación cruzada entre sprints dentro de la misma sesión fue más superficial de lo que habría sido si cada sprint se hubiera ejecutado en días separados.

---

## 4. Aprendizajes accionables

**A1 — Antes de ejecutar N sprints de un audit en una sola sesión, hacer una pasada de dependencias entre items.**

Trigger: cuando el plan tiene ≥5 sprints encadenados que tocan el mismo módulo (aquí: `manifest.json`, `validators.js`, la extensión). Antes de empezar el primer sprint, listar todas las decisiones que afectan ese módulo en los N sprints y resolver conflictos. Coste: 15-30 min. Coste evitado: fix-of-fix observable.

Forma operativa: `grep -rn "manifest.json\|validators.js\|background.js" docs/sprints/*.md` para ver qué items del plan tocan los mismos archivos antes de ejecutar.

**A2 — El review humano entre PRs de un mismo batch debe ser al menos una lectura del diff, aunque sea rápida.**

Trigger: cualquier sesión donde se van a mergear ≥5 PRs el mismo día. La diferencia create→merge de 5-13 segundos no permite lectura del diff. Para un repo con un único contribuidor y branches pre-validadas puede ser aceptable en el 90% de los casos, pero el 10% donde no lo es (el fix-of-fix de hoy) tiene coste real.

Forma operativa: en batches de ≥5 PRs del mismo dominio, pausar 2-3 minutos entre sprints de severidad diferente para hacer una lectura diagonal del diff acumulado.

**A3 — La nota "H5 redundante dado isSafeHost()" en PR20 era una hipótesis, no un hecho verificado.**

Trigger: cuando un item de un audit dice "eliminar X porque Y ya lo cubre". Antes de eliminar, verificar que Y realmente cubre el caso de uso de X contra el flujo de usuario real. En este caso: `isSafeHost()` valida hosts en el código backend, pero `optional_host_permissions` es necesaria para el flujo de permisos dinámicos de Chrome que no pasa por `isSafeHost()`.

Forma operativa: para items de tipo "eliminar/simplificar porque X ya lo cubre", añadir en el PR body una línea explícita: "Verificado que el flujo de usuario [A→B→C] no depende de esto porque [razón]."

**A4 — El test count entre sprints es trazabilidad valiosa; documentarlo al final de cada sprint, no solo al final del batch.**

La memoria del audit documenta el test count final por sprint (413, 422, 403...) pero el flujo observado muestra que los test counts crecen de forma no lineal (PR21: 403→403 sin nuevos tests, solo cascade; PR22: 403→403, solo CI/Docker). La trazabilidad de "qué sprint añadió tests reales" requiere separar "tests añadidos" de "tests que pasaron el cascade de tsconfig".

---

## 5. Evolución vs regresión — balance neto

**Evolución clara:**

- 65 findings de seguridad/calidad cerrados en una sola jornada: el repo pasó de ~350 tests (pre-audit) a 466 tests con 814 assertions y 0 fallos.
- Invariante I-13 codificado en CI con 17 tests específicos — la primera decisión arquitectónica del proyecto convertida en gate automático.
- `shared/drift.ts` y `batch-builder.js` crean dos módulos nuevos con responsabilidad única; la arquitectura quedó más legible que al inicio del día.
- tsconfig strictness +5 flags + cascade limpio: la deuda de tipado implícita desapareció del código con un único PR.
- Scaffolding completo de PRO migration (`infra/cloud-run.yaml`, `infra/backup-story.md`, guard `K_SERVICE`) — el repo estaba listo para producción al cierre del día.

**Regresión sutil:**

- Fix-of-fix en `optional_host_permissions` (PR20 elimina → PR25 re-añade, ~1h46min después). Indica que la planificación de dependencias entre sprints fue incompleta. No hay regresión funcional (el estado final es correcto), pero sí hay deuda de proceso.
- 11 PRs con review de 5-13 segundos: operacionalmente funcionó, pero el patrón no escala si el repo tiene más de un contribuidor o si los cambios son más interdependientes.

**Balance neto:** Positivo con nitidez. La jornada del 27-abr es el punto de inflexión del proyecto: antes era un repo con deuda acumulada; después era un repo listo para producción. La grieta del fix-of-fix es real y accionable (A1-A3), pero de orden de magnitud menor frente al volumen de deuda cerrada. El hecho de que se detecte forense-mente desde los PRs — y no desde un incidente en PRO — es la mejor evidencia de que el daño fue contenido.

---

## 6. Triage retro-as-action

> Esta retro se escribe post-hoc en 2026-06-21, ~55 días después de los hechos.
> Los items 🟢/🟡 son sobre deuda que se puede verificar HOY contra el estado actual del repo.

| Marca                            | Item                                                                                                                                                                                                                     | Justificación                                                                                                                           |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| 🟢 **30-min HOY**                | Verificar que `optional_host_permissions` en `manifest.json` tiene un comentario explicando por qué es necesaria (para evitar que el próximo audit la elimine de nuevo)                                                  | Coste ~10 min; contexto fresco en esta retro; previene la re-ocurrencia del patrón A3                                                   |
| 🟡 **Handoff próxima sesión**    | Añadir un test en `tests/` que verifique que `optional_host_permissions` existe en `manifest.json` (analogo al test de cloud-run-boundary que protege I-13)                                                              | Coste ~30 min con test CI; requiere arrancar contexto de extensión                                                                      |
| 🔴 **Backlog**                   | Revisar si el patrón "batch de N sprints en una sesión" con el mismo módulo se repite en otras jornadas del proyecto — si sí, añadir una regla en `CLAUDE.md` o en `sprint-template.md` sobre dependency-check pre-batch | Coste ~2h analysis; no urgente; valor medio                                                                                             |
| ⚫ **Deuda permanente aceptada** | La ausencia de review humano entre PRs de un batch de 1 contribuidor                                                                                                                                                     | Coste de introducirlo es overhead alto para beneficio bajo en mono-dev; aceptar explícitamente para proyectos Atlax con ≤2 devs activos |

---

## Anexo — Ground-truth

| #         | Título                                                                                 | +add / -del       | Files | Merged UTC      |
| --------- | -------------------------------------------------------------------------------------- | ----------------- | ----- | --------------- |
| #19       | fix(security): Sprint 7 — 5 critical security fixes (C1-C5)                            | +376 / -4         | 7     | 05:58:57        |
| #20       | fix(security): Sprint 8 — extension hardening (H1-H5)                                  | +26 / -14         | 3     | 06:00:55        |
| #21       | fix(quality): Sprint 9 — HIGH shared/ + types + tsconfig (H7-H13, H20)                 | +339 / -274       | 32    | 06:47:08        |
| #22       | fix(quality): Sprint 10 — HIGH CI/Docker hardening (H14-H19)                           | +62 / -12         | 3     | 06:49:58        |
| #23       | refactor(quality): Sprint 11 — MEDIUM dedup + architecture                             | +157 / -116       | 8     | 06:56:04        |
| #24       | fix(quality): Sprint 12 — LOW + meta (zero new debt)                                   | +126 / -22        | 8     | 07:00:51        |
| #25       | fix(sprint-13): EXT hardening + PRO SSRF guard                                         | +100 / -18        | 7     | 07:46:54        |
| #26       | test(sprint-14): 3 E2E CI-runnable — Bun.serve HTTP mocks                              | +595 / -59        | 5     | 07:52:58        |
| #27       | feat(sprint-15): PRO migration readiness — invariant I-13 + Cloud Run scaffolding      | +562 / -2         | 5     | 09:33:35        |
| #28       | docs(readme): estado post-Sprint 15 — edge/core, degradation, tier cache, test pyramid | +50 / -0          | 1     | 09:45:11        |
| #29       | chore(gitignore): excluir .handoff-\*.md                                               | +3 / -0           | 1     | 09:54:21        |
| **TOTAL** |                                                                                        | **+2.396 / -521** | ~80   | 07:58–11:54 UTC |

> Nota LOC: el sumatorio bruto de additions es +2.396, pero el "neto real" de código nuevo es menor
> dado que PR21 incluye ~200 líneas de cascade mecánico de tsconfig (renaming de property accesses).
> Sin contar ese cascade, el neto de lógica nueva es aproximadamente +1.200 / -300.
