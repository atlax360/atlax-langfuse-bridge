# RETRO — Jornada 2026-04-24 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos; MEDIA/BAJA para vivencia subjetiva — [inferido] donde aplique.
> Ground-truth: 3 PRs merged 2026-04-24. `gh pr list --search "merged:2026-04-24"`.

---

## 0. Resumen de la jornada

Jornada de cierre del backlog Orvian Fase 5.6 identificado el 2026-04-18. Se cerraron los 6 items
pendientes en dos PRs secuenciales (modelos diferentes: Sonnet 4.6 y Opus 4.7), y en la misma
tarde se cerró también el backlog futuro inmediato generado por el PR #8 con un tercer PR.

| PR  | Título                                                               | Additions | Deletions | Archivos | Mergeado  |
| --- | -------------------------------------------------------------------- | --------- | --------- | -------- | --------- |
| #7  | backlog Sonnet 4.6 — degradation spec + tier cache SHA256            | +319      | -10       | 5        | 16:14 UTC |
| #8  | backlog Opus 4.7 — AgentTool adapter + tier taxonomy                 | +1023     | 0         | 11       | 16:21 UTC |
| #9  | post-backlog — MCP server + Zod adapter + sandbox modes + hash-cache | +1455     | -221      | 14       | 22:31 UTC |

**LOC bruto**: +2797 additions / -231 deletions. 30 archivos modificados en total.
**Tests**: 68 baseline previo → 129 tras #7-#8 → 175 tras #9. (+107 tests en la jornada.)

---

## 1. Lo que ha ido bien

**Backlog cerrado 6/6 con selección de modelo consciente.** PR #7 con Sonnet 4.6 (degradation
spec + tier cache, baja complejidad) y PR #8 con Opus 4.7 (AgentTool adapter + tier taxonomy,
alta complejidad arquitectónica). La selección fue explícita y correcta: Sonnet en lo mecánico,
Opus en lo que requería diseño de contratos.

**El PR #8 generó un backlog futuro bien delimitado y accionable.** Los 4 items post-backlog
(MCP server, Zod adapter, sandbox modes, rename hash-cache) quedaron documentados en la memoria
del proyecto antes de ejecutarse. Cuando se ejecutaron en el PR #9 en la misma tarde, la
planificación ya estaba hecha. Sin esa documentación intermedia, el PR #9 habría salido menos
estructurado [inferido].

**Velocidad de cierre: 3 PRs en ~6 horas.** Contexto fresco del backlog Orvian + planificación
previa de la semana anterior = bajo overhead de arranque. La memoria `orvian_backlog_pointer.md`
documenta que los 6 items estaban identificados desde el 2026-04-18 — seis días de maduración
antes de la ejecución.

**Arquitectura `shared/tools/` correctamente aislada.** El contrato `AgentTool<TInput, TOutput>`
con registry + access control por `allowedAgentTypes` evitó acoplamientos directos. La decisión
"cero deps runtime para inputSchema" (validación manual, Zod como peer-dep opcional en el adapter
externo) preservó el invariante I-1 (no bloquear el hook).

**Tests: +107 en una jornada con cobertura real.** Las aserciones subieron de 126 a 307 (+181).
Los smoke tests E2E del PR #9 (`initialize` + `tools/list` + `tools/call` con sandbox) verificaron
el protocolo MCP completo en condiciones sin red.

---

## 2. Regresiones y grietas que no escondemos

**El tier cache en PR #7 no se integró en el hook en esa misma jornada.** El test plan de PR #7
documenta explícitamente: "módulo importable pero no integrado aún en el hook — uso previsto
por el reconciler en iteración posterior". Se implementó sin consumidor activo. [VERIFICADO: body
PR #7 sección "Test plan"]. Esto es deuda conocida y documentada, pero habría sido más limpio
no mergearlo hasta que hubiera un consumidor real o al menos el reconciler listo.

**PR #8: zero deletions (+1023/-0).** Un sprint que añade 1023 líneas sin borrar nada merece
escrutinio. [inferido] En un proyecto pequeño con 9 PRs totales, cero refactor de lo previo
sugiere que la arquitectura `shared/tools/` es expansión pura. La pregunta legítima es si algún
módulo previo quedó obsoleto o semi-duplicado por la nueva capa de tools. No hay evidencia de
deuda aquí, pero el patrón es un flag a monitorizar.

**El rename `tier-cache → hash-cache` se decidió en PR #8 y se ejecutó en PR #9 el mismo día.**
[inferido] Esto sugiere que la decisión de naming en PR #8 fue apresurada o incompleta: si al
terminar PR #8 ya era obvio que el módulo necesitaba renombrarse para ser genérico, habría sido
más limpio hacerlo en PR #8 directamente. Que aterrizara en PR #9 como primer item del "post-backlog"
apunta a que la decisión cristalizó tarde.

**2 items del backlog Orvian clasificados como "no aplica" (partial index + audit partitioning).**
Estos dos items llevaban en el backlog desde 2026-04-18 con contexto de BD local (patrón Orvian).
El análisis correcto era descartarlos inmediatamente al abrir la Fase 5.6, no llevarlos hasta PR #8.
[inferido] Si se arrastraron 6 días sin analizar, el coste fue bajo pero el patrón "backlog
con items irrelevantes al contexto" es ruido que acumula.

---

## 3. Factor de contexto

[inferido desde timing y estructura de PRs]

La jornada fue un sprint de cierre planificado, no reactivo. La cadencia PR #7 (16:14) → PR #8
(16:21, 7 minutos después) sugiere ejecución en paralelo o pre-preparada, no iterativa. El PR #9
se mergeó 6 horas más tarde (22:31 UTC), indicando una pausa entre la jornada principal y la
extensión nocturna para cerrar el backlog futuro generado.

El hecho de que el PR #9 se ejecutara el mismo día que el #7 y #8 — cuando el backlog futuro
acababa de definirse — sugiere presión o inercia de cierre limpio ("ya que estamos"). No hay
evidencia de que esto produjo errores, pero es el tipo de decision que en retrospectiva merece
la pregunta "¿era necesario el mismo día?".

---

## 4. Aprendizajes accionables

1. **No mergear un módulo sin consumidor activo.** `shared/tier-cache.ts` (PR #7) se mergeó sin
   integrarse en el hook ni en el reconciler. Regla: si el módulo no tiene consumidor en ese mismo
   PR o en un PR inmediatamente encadenado en la misma jornada, esperar. Trigger: test plan que
   dice "uso previsto en iteración posterior" = señal de merge prematuro.

2. **Items "no aplica" del backlog se descartan al inicio de la jornada que los toca, no al final.**
   Los items #5 y #6 del backlog Orvian se marcaron "no aplica" dentro del PR #8. Si se hubiera
   hecho el análisis al abrir Fase 5.6 (2026-04-18), 6 días antes, el scope del PR #8 habría
   sido más claro desde el principio. Trigger: al arrancar un sprint de backlog, primer paso es
   filtrar items que no aplican al contexto actual antes de planificar bloques.

3. **El post-backlog del mismo día es una señal de que el sprint original estaba subestimado.**
   PR #9 existió porque PR #8 generó nuevos items que se ejecutaron el mismo día. Si esos items
   eran predecibles al planificar PR #8 (y la memoria sugiere que sí lo eran — el renaming
   hash-cache estaba ya identificado), deberían haber estado en el scope original o diferidos
   explícitamente a una sesión separada.

---

## 5. Evolución vs regresión — balance neto

**Evolución clara:**

- Arquitectura `shared/tools/` con AgentTool + registry + access control: base sólida para el
  MCP server y cualquier adapter futuro (Zod, función nativa Claude API, etc.)
- MCP stdio funcional con protocolo JSON-RPC 2.0 completo en un solo PR
- Sandbox modes (echo/fixture/degradation) heredados de Orvian agentic-coordinator: operabilidad
  sin red desde el día 1
- Test baseline duplicado en la jornada: 68 → 175 (+107 tests, +181 assertions)
- Degradation spec: los 6 catch blocks silenciosos del hook ahora emiten JSON estructurado a stderr

**Regresión sutil:**

- Módulo `tier-cache` mergeado sin consumidor activo en esa jornada (deuda conocida, documentada)
- Naming inconsistente (`tier-cache` → `hash-cache`) resuelto en PR inmediatamente posterior en
  vez de en el PR original

**Balance neto:** Jornada positiva con ratio output/deuda alto. Las grietas son pequeñas y
documentadas, no silenciosas. El cierre del backlog Orvian Fase 5.6 (6/6 items) con base MCP
funcional y 175 tests deja el proyecto en estado significativamente más capaz que al inicio.
La deuda introducida (tier-cache sin consumidor) es visible y acotada.

---

## 6. Triage retro-as-action

Esta retro se escribe post-hoc el 2026-06-21 (58 días después). El contexto fresco de la jornada
no existe. Triage:

| Item                                     | Marca                                       | Notas                                                                                                                                                            |
| ---------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tier-cache sin consumidor (PR #7)        | ⚫ Deuda aceptada permanente                | El módulo lleva 2 meses en el repo; si no se integró en 58 días, o ya se integró en PRs posteriores o el patrón cambió. Verificar estado actual antes de actuar. |
| Regla "no mergear módulo sin consumidor" | 🟢 Registrar en CLAUDE.md o regla operativa | Aprendizaje reproducible y accionable en futuras sesiones. Costo: añadir al punto 4 de anti-patterns en CLAUDE.md.                                               |
| Items "no aplica" descartados tarde      | ⚫ Deuda aceptada permanente                | Incidente puntual de 2026-04-18. El backlog Orvian está cerrado; no hay acción pendiente.                                                                        |

---

## Anexo — Ground-truth

```
Fuentes verificadas:
- gh pr view 7 --json title,body,additions,deletions,changedFiles,mergedAt
  → mergedAt: 2026-04-24T16:14:47Z | +319/-10 | 5 archivos
- gh pr view 8 --json title,body,additions,deletions,changedFiles,mergedAt
  → mergedAt: 2026-04-24T16:21:36Z | +1023/-0 | 11 archivos
- gh pr view 9 --json title,body,additions,deletions,changedFiles,mergedAt
  → mergedAt: 2026-04-24T22:31:10Z | +1455/-221 | 14 archivos
- git log --oneline --after="2026-04-23T23:59:59" --before="2026-04-25T00:00:00"
  → 2 commits (2277b01, d5854d6); PR #9 commit (2393b8d) con fecha 2026-04-25 00:31 CEST = 2026-04-24 22:31 UTC
- ~/.claude/projects/-Users-jgcalvo-work-atlax-langfuse-bridge/memory/orvian_backlog_pointer.md
  → Tabla de 6 items con estado verificado
- PR bodies de #7, #8, #9 (smoke tests ejecutados, test counts declarados)
```
