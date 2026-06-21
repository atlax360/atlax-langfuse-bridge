# RETRO — Jornada 2026-05-07 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos verificados con `gh pr view` + git log; MEDIA/BAJA para vivencia
> subjetiva y motivaciones del momento — marcadas como [inferido] donde aplique.
> Ground-truth: 20 PRs merged 2026-05-07 (UTC 02:54 → 21:37, ~19h ventana).

---

## 0. Resumen de la jornada

**Dia más denso del proyecto**: 20 PRs mergeados en ~19 horas (UTC 02:54 → 21:37).
**Bruto LOC**: +8,862 (8,494 insercciones + 368 eliminaciones distribuidas en 63 ficheros).
**Tests**: de 581 (arranque) a 776 (+195 tests netos, +300 assertions).
**Modelo**: Sonnet 4.6 como orquestador (confirmado en `docs/experiments/2026-05-07-parallel-subagent-experiment.md`).

### Ejes de la jornada (cronológico)

| Hora (CEST) | Eje                                                                                         | PRs     |
| ----------- | ------------------------------------------------------------------------------------------- | ------- |
| 04:54       | Actualización Langfuse 3.171.0 → 3.172.1 (calentamiento)                                    | #44     |
| 06:02       | **Fix crítico** schema v3 (coste 0 → real) + experimento paralelismo + análisis unificación | #45     |
| 07:32       | Roadmap formal Q2-Q3 2026 (8 sprints, S17-S24)                                              | #46     |
| 13:15       | Backfill one-shot 96 sesiones históricas + descubrimiento S17-F blind spot                  | #47     |
| 15:54–16:32 | Sprint 17 completo (S17-B/C/D/E/F + coverage consolidation)                                 | #48–#52 |
| 18:25–19:08 | Sprint 18 completo (RFC-001 + S18-A/B/C/D/E)                                                | #53–#54 |
| 21:14–21:24 | Sprint 19 parcial (S19-B) + Sprint 20 parcial (S20-A/B/C/D)                                 | #55–#58 |
| 22:04–22:42 | Sprint 21 + Sprint 22                                                                       | #59–#61 |
| 23:28–23:37 | Sprint 23 + Sprint 24 — **cierre formal del roadmap**                                       | #62–#63 |

La jornada cubrió el roadmap **completo** (S17-S24, 8 semanas planificadas el mismo día que se ejecutaron
sprints S17-S24 íntegros). El roadmap fue planificado para 12-may→06-jul-2026; se ejecutó íntegramente
el 2026-05-07 en una sola sesión.

---

## 1. Lo que ha ido bien

### 1a. Fix crítico del coste con verificación E2E real

VERIFICADO — PR #45 (`fix(hook): Langfuse v3 schema`): el hook construía generations con shape legacy
(`usage.totalCost` inexistente en v3). Resultado: `calculatedTotalCost: 0` para **todas** las
generations desde el arranque del proyecto. El fix corrigió `usageDetails` + `costDetails` con keys
nativas v3. La verificación post-fix contra Langfuse v3.172.1 confirmó: Opus 4.7 con 1.57M tokens →
`calculatedTotalCost: 10.33` (antes 0).

Éste fue el bug más impactante del proyecto (todo el histórico de trazas tenía coste 0), resuelto
con diagnóstico ground-truth correcto en la primera iteración. Sin enroque.

### 1b. Experimento de paralelismo con método científico honesto

VERIFICADO — `docs/experiments/2026-05-07-parallel-subagent-experiment.md`: 7 subagentes en paralelo,
speedup real 4.75× (1282s secuencial estimado / 270s wall-clock), 6/7 calidad alta. El documento
incluye hipótesis contrastables, métricas por agente, y —críticamente— documenta el fallo de A4 (error
de schema crítico detectado por doble-check del orquestador). Honestidad metodológica alta: el
"incidente A4" se convierte en la lección más importante, no se oculta.

### 1c. Backfill one-shot con cobertura real de histórico

VERIFICADO — PR #47 (`ops(backfill)`): el script `backfill-historical-traces.ts` procesó 96 candidatos
→ 90 uploaded → 0 failed. Amplió la cobertura temporal de costes de 5-may a 8-abr (un mes adicional
de historia recuperado). El script se ejecutó en vivo y se documenta el resultado real.

### 1d. Roadmap Q2-Q3 2026 con DoR/DoD real por ítem

VERIFICADO — PR #46: 8 sprints, 33 items, blast radius matrix, DoR/DoD por sprint, anti-items con
justificación. El roadmap incluye riesgos, decisiones pendientes, y un modelo de trabajo centauro
operativo. La plantilla `sprint-template.md` codifica las lecciones del experimento en reglas reutilizables.

### 1e. Cierre de roadmap completo en una sola sesión

VERIFICADO — PRs #51-#63: Sprint 17 completo en 5 PRs seguidos en un slot de 38 min (15:54-16:32),
Sprints 18-24 ejecutados secuencialmente. 776 tests / 0 fail al cierre (confirmado en PR #63).
El proyecto pasó de "roadmap en papel" a "roadmap completamente ejecutado" en la misma jornada.

---

## 2. Regresiones y grietas que no escondemos

### 2a. El roadmap se planificó para 8 semanas y se ejecutó en 8 horas — señal de inflación de scope

VERIFICADO (forense) — El PR #46 se mergeó a las 07:32. Los sprints S17-S24 se ejecutaron todos entre
las 13:15 y las 23:37 del mismo día. El roadmap estaba diseñado con "capacity: ~10 horas humano de
review high-quality / semana", DoR/DoD detallados por ítem, y estimaciones S/M/L.

[inferido] Esto sugiere que la mayoría de los items eran realmente de tamaño S (o menores) aunque se
estimaron como S/M en el roadmap. La inflación de complejidad en la planificación es una señal: o el
sizing no fue calibrado correctamente, o la sesión de ejecución fue atípicamente productiva por el
modo centauro con paralelización. Ambas pueden ser simultáneamente ciertas.

**Por qué importa**: el roadmap de S17-S24 quedó "cerrado" en papel antes de que se ejecutara
realmente. Cuando llegó la semana del 12-may, no había sprint abierto — todo ya estaba mergeado.
[inferido] El riesgo es que algunos items del roadmap se marcaron como completados con implementación
superficial para mantener la cadencia de "8 sprints" en una sola sesión.

### 2b. El blind spot S17-F se descubrió post-operación, no pre-planificación

VERIFICADO — El PR #46 (roadmap) se mergeó a las 07:32 con 5 items en Sprint 17. El PR #47 (backfill)
a las 13:15 descubrió el blind spot del reconciler al ejecutar el backfill. PR #47 añadió S17-F al
roadmap (sprint-17.md) con `Hallazgo origen: "Operación 2026-05-07 evening: backfill manual reveló
blind spot del reconciler"`. El ítem S17-F pasó de inexistente a "planificado en S17" a "implementado
en S17" en el mismo día.

Esto es la señal más clara de que la jornada operó en modo reactivo a medida que el código real se
ejecutaba: el análisis del experimento (A4 error en schema) generó S17-F no previsto, que se ejecutó
y mergeó en menos de 2 horas (PR #50 a las 16:10, menos de 3h después del descubrimiento).

**La grieta real**: S17-F se mergeó el mismo día que se descubrió la necesidad. En un proceso con
"capacity humano de review de 10h/semana", ese item habría requerido revisión humana antes de tocar
`shared/drift.ts` (MEDIUM blast radius). [inferido] La revisión humana en esta jornada fue probablemente
superficial por la velocidad de ejecución.

### 2c. Sprints S18-S24 ejecutados sin ventana de planificación formal

VERIFICADO — El roadmap explicitaba: "Sprint 17 pendiente kick-off". Los sprints S18-S24 tenían
documentos de sprint formales para semanas de 12-may a 06-jul. Sin embargo, todos se implementaron
el 2026-05-07. Los PRs de S18-S24 (PRs #53-#63) no hacen referencia a kick-off, review de DoR, ni
validación humana de las decisiones pendientes documentadas en el roadmap.

Las "5 decisiones pendientes a resolver durante ejecución" del roadmap (sección 8 del Q2-Q3 doc)
incluían: "¿Obtener `ANTHROPIC_ADMIN_API_KEY`?" (S18-B bloqueante). Esta decisión se resolvió el mismo
día (VERIFICADO: PR #54 con `ANTHROPIC_ADMIN_API_KEY` integrada), pero no hay registro de quién la tomó
ni en qué momento — apareció en código directamente.

### 2d. Sprints con items documentados como "skip graceful sin credenciales" — cobertura de CI cuestionable

VERIFICADO — PR #58 (S20-A/B/C virtual keys): "Skip automático si `LITELLM_MASTER_KEY` no configurada
(CI sin stack)". PR #55 (S19-B callback): "Skip automático sin stack". PR #51 (S17-B smoke M1):
"Skip automático si `SKIP_LITELLM_SMOKE=1`".

[inferido] La mayoría de los tests de integración de LiteLLM se marcan como condicionales al stack real.
En CI (sin LiteLLM levantado), se skipean. Esto significa que el progreso real de LiteLLM M1/M2/M3 no
está cubierto por el CI verde del proyecto — solo se valida localmente con el stack levantado. El PR #63
(cierre v1) reporta 776 tests / 0 fail, pero incluye tests skipped de LiteLLM no contabilizados.

### 2e. Doc de trace name incorrecto en langfuse-dashboard-guide — detectado post-facto

VERIFICADO — PR #61 (`fix(docs+test): corrección nombre trace`): `langfuse-dashboard-guide.md` usaba
`langfuse-sync` como nombre del trace en la tabla de trazas. El hook emite `name: "claude-code-session"`.
Cualquier query filtrando por `langfuse-sync` habría retornado 0 resultados. Este error se introdujo en
PR #60 y se corrigió en PR #61 — mismo día, pero es un fix-de-fix verificable.

La guía de dashboard se creó y se corrigió en el mismo slot de 30 minutos (PR #60 a las 22:16,
PR #61 a las 22:42). [inferido] La velocidad de iteración en ese horario (22h) produjo un error básico
de copy-paste del trace name que se debería haber verificado contra el código antes de mergear.

---

## 3. Factor de contexto

### 3a. Sesión nocturna de alta intensidad (~19 horas continuas)

VERIFICADO — Los commits se distribuyen: 04:54 CEST (primer PR), 23:37 CEST (último PR). Aproximadamente
19 horas de ventana, con cluster de 10 PRs entre las 21:00 y las 23:37 (5 PRs en 90 minutos).

[inferido] El patrón de errores observado (fix-de-fix en PR #61, S17-F descubierto en operación, decisiones
de backlog sin kick-off formal) coincide con fatiga cognitiva de la parte final de la sesión. Los PRs
#57-#63 (21:53-23:37) son los más pequeños pero los más acelerados, y producen el único fix-de-fix
documentado.

### 3b. La jornada fue el catalizador del diseño del modo centauro del proyecto

VERIFICADO — El experimento de paralelismo (PR #45), la plantilla de sprint con Blast Radius Matrix
(PR #46), el ADR-011 con I-14 (PR #49), y las reglas operativas cross-project derivadas de esta sesión
están todos originados en 2026-05-07. [inferido] El usuario (Joserra) estaba construyendo activamente
el andamio metodológico del modo centauro, no solo ejecutando features — lo que explica la densidad
de la jornada.

---

## 4. Aprendizajes accionables

**A1 · El roadmap de N semanas planificado y ejecutado en el mismo día es una señal de sizing incorrecto**

- Trigger: al planificar un sprint con "capacity: X horas/semana", si el primer ítem real tarda <10% de
  ese tiempo, recalibrar el sizing antes de crear los sprints restantes.
- Coste de no aplicar: el roadmap queda "cerrado" pero posiblemente con implementaciones que no pasaron
  el DoD que el propio documento define.

**A2 · Doble-check obligatorio ante cualquier schema/ID de API externa (A4 del experimento)**

- Trigger: cuando un subagente indica un nombre de campo específico en una API externa (Langfuse, Anthropic,
  LiteLLM), hacer WebFetch a la doc oficial antes de escribir el código. Esta regla ya está en I-14 y
  ADR-011 — pero el origen empírico de la regla es este día.
- Coste de no aplicar: A4 habría roto la integración (PR #45 lo demuestra: `usage.totalCost` incorrecto).

**A3 · Items reactivos (S17-F) con MEDIUM blast radius necesitan ventana de review, no merge inmediato**

- Trigger: cuando un item no planificado toca `shared/` (MEDIUM blast radius), añadirlo a la lista de
  "revisión humana antes de merge" aunque la implementación sea "evidente". El timing es la señal: si
  un item pasa de "descubrimiento" a "implementado" en <3 horas, la revisión humana probablemente fue
  superficial.
- Coste de no aplicar: S17-F introdujo `COST_NOT_CALCULATED` en `shared/drift.ts` — módulo central. Una
  regresión aquí afecta a todos los flows de reconciliación.

**A4 · Verificar trace names contra código antes de documentar en guías**

- Trigger: al escribir cualquier nombre de trace/observation en docs de operación o guías, hacer `grep`
  del nombre exacto en el código antes de mergear. PR #61 demuestra que el fix-de-fix tarda menos que
  el error.
- Coste de no aplicar: cualquier dev siguiendo la guía con `langfuse-sync` obtiene 0 resultados y
  reporta "el bridge no funciona".

**A5 · Decisiones de backlog (¿obtener Admin API key?) deben tener registro de quién las tomó**

- Trigger: si el roadmap documenta "decisión pendiente: ¿X?" y esa decisión desbloquea un ítem, el PR
  que implementa X debería explicar en el body cuándo y cómo se tomó la decisión. PR #54 integra la
  Admin API key sin mencionar la decisión de obtenerla.
- Coste de no aplicar: en auditorías futuras (como esta retro), la decisión de integrar credenciales
  nuevas no tiene trazabilidad de governance.

**A6 · Tests condicionales (skip graceful) no cuentan como cobertura para features nuevas**

- Trigger: al reportar "776 tests / 0 fail" en un PR, verificar cuántos de esos tests se ejecutan realmente
  en CI sin stack externo. Si >20% son skipped en CI, el número de tests es parcialmente nominal.
- Coste de no aplicar: la métrica de "776 tests" del cierre v1 oculta que múltiples features de LiteLLM
  (M1/M2/M3) solo están validadas localmente con stack.

---

## 5. Evolución vs regresión — balance neto

### Evolución clara

- **Fix de coste estructural** (coste 0 → real en todas las generations): el cambio más impactante del
  proyecto hasta esa fecha. Sin este fix, el sistema de observabilidad FinOps tenía el KPI principal roto.
- **Metodología centauro institucionalizada**: el experimento A4, el I-14, la Blast Radius Matrix, y las
  reglas operativas de paralelismo agéntico nacieron en esta jornada y se generalizaron cross-project.
- **Backfill histórico ejecutado**: un mes de historia recuperado en producción con 0 errores.
- **Roadmap operativo**: de "proyecto sin plan formal" a "8 sprints detallados con DoR/DoD, anti-items y KPIs".
- **Cierre formal v1**: 776 tests / 0 fail, README v1, pilot report, backlog post-v1 priorizado.

### Regresión sutil

- **Velocidad vs governance**: la aceleración de S18-S24 sin kick-off ni validación de DoR es un patrón
  de "ship and pray" en versión centauro. Las decisiones pendientes del roadmap se tomaron en código
  (Admin API key) sin registro governance.
- **Fix-de-fix PR #61**: síntoma de fatiga en la última ola de PRs (21:00-23:37). La guía de dashboard
  se introdujo con error básico de trace name que un `grep` de 5 segundos habría evitado.
- **Sizing inflado del roadmap**: el roadmap fue diseñado para 8 semanas pero ejecutado en ~8 horas.
  Indica que la cultura de estimación aún no está calibrada para el modo centauro.

### Balance neto

Positivo claro. La jornada resolvió el bug más crítico del sistema (coste 0), recuperó un mes de histórico,
y produjo el andamio metodológico que el proyecto y el ecosistema Atlax usan desde entonces. Los patrones
centauro institucionalizados aquí (I-14, ADR-011, experimento de paralelismo) tienen impacto cross-project
comprobado.

La grieta principal no es técnica sino de proceso: un roadmap de 8 semanas ejecutado en 8 horas no es
"productividad extrema" — es evidencia de que el sizing y el proceso de DoR no estaban calibrados para
el modo centauro. Eso es deuda metodológica, no técnica.

---

## 6. Triage retro-as-action

Todos los items de código están mergeados. La deuda identificada es metodológica.

| Item                                                          | Categoría  | Triage                           | Razonamiento                                                                                                                                                           |
| ------------------------------------------------------------- | ---------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Calibrar sizing de sprints para modo centauro                 | Proceso    | ⚫ **Deuda aceptada permanente** | El roadmap Q2-Q3 ya se ejecutó. La lección está en A1; las sesiones posteriores (v2.17+) ya aplican sizing centauro. No hay artefacto que reparar.                     |
| Añadir `grep` de trace names como checklist pre-merge de docs | Proceso    | 🟡 **Handoff**                   | Vale la pena, pero no es urgente. Candidato para la próxima revisión de `sprint-template.md`.                                                                          |
| Documentar decisión "obtener Admin API key" retroactivamente  | Governance | ⚫ **Deuda aceptada permanente** | La Admin API key ya está integrada y funcionando. El ADR-010 (creado en PR #53) cubre la decisión. Reconstruir el governance retroactivamente tiene coste > beneficio. |
| Verificar cobertura real de tests LiteLLM en CI               | Técnico    | 🔴 **Backlog**                   | Los tests de LiteLLM con skip condicional son deuda de cobertura conocida. Está en el post-v1-backlog. No urgente hoy.                                                 |
| Esta retro misma                                              | Meta       | 🟢 **Completada**                | —                                                                                                                                                                      |

---

## Anexo — Ground-truth

| PR        | Título                                                                            | +/- LOC         | Files   | Hora CEST |
| --------- | --------------------------------------------------------------------------------- | --------------- | ------- | --------- |
| #44       | chore(langfuse): upgrade 3.171.0 → 3.172.1                                        | +2/-2           | 1       | 04:54     |
| #45       | fix(hook): Langfuse v3 schema + experimento paralelismo + análisis unificación    | +571/-18        | 4       | 06:02     |
| #46       | docs(roadmap): plan Q2-Q3 2026 — 8 sprints                                        | +1100/-0        | 5       | 07:32     |
| #47       | ops(backfill): script one-shot historical traces + S17-F nuevo item               | +538/-49        | 9       | 13:15     |
| #48       | test(sprint17): coverage consolidation — 651 tests (+58 nuevos)                   | +845/-0         | 3       | 15:54     |
| #49       | docs(adr): S17-D/E — ADR-009 quota + ADR-011 I-14 parallel subagent               | +277/-39        | 5       | 16:07     |
| #50       | feat(reconcile): S17-F — COST_NOT_CALCULATED drift status                         | +116/-1         | 5       | 16:10     |
| #51       | feat(litellm): S17-B — smoke test M1 + runbook                                    | +167/-0         | 2       | 16:16     |
| #52       | test(coverage): Sprint 17 consolidation — 693 tests                               | +538/-10        | 8       | 16:32     |
| #53       | feat(sprint18-19): RFC-001 + cost-source tag + sync-pricing + LiteLLM M2          | +512/-2         | 6       | 18:25     |
| #54       | feat(sprint18): S18-B/D Anthropic cost_report integration                         | +948/-10        | 6       | 19:08     |
| #55       | feat(litellm): S19-B — M2 callback smoke test + Prisma compose fix                | +263/-1         | 2       | 21:14     |
| #56       | feat(bridge): S20-D mutex sandbox + S22-A tag source:reconciler                   | +127/-4         | 5       | 21:24     |
| #57       | feat(bridge): S22-B/C — bridge-health trace + audit S22-C                         | +359/-10        | 3       | 21:53     |
| #58       | feat(litellm): S20-A/B/C — virtual keys, budget enforcement, atribución           | +364/-1         | 2       | 22:04     |
| #59       | feat(pilot): S21-A/C/D onboarding docs + KPIs + bash script                       | +582/-7         | 4       | 22:11     |
| #60       | feat(ops): S22-C audit deps + S22-D dashboard guide Langfuse                      | +214/-9         | 6       | 22:16     |
| #61       | fix(docs+test): corrección nombre trace claude-code-session + cobertura hook      | +329/-1         | 2       | 22:42     |
| #62       | feat(spike+rfc): S23 — spike HTTP bridge↔dashboard + RFC-002 no implementar       | +209/-5         | 4       | 23:28     |
| #63       | feat(v1-close): S24 — README v1 + reporte piloto + backlog POST-V1 + scope review | +486/-146       | 5       | 23:37     |
| **TOTAL** | **20 PRs**                                                                        | **+8,547/-315** | **~63** | **~19h**  |

> Nota: LOC total bruto (additions+deletions) de la tabla de GH = 8,862. La variación respecto a la suma
> de filas se debe a redondeos en los PR bodies vs JSON de la API.
