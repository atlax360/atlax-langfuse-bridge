# RETRO — Jornada 2026-04-23 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos técnicos; MEDIA/BAJA para vivencia subjetiva — [inferido] donde aplique.
> Ground-truth: 2 PRs merged 2026-04-23. `gh pr list --search "merged:2026-04-23"`.

---

## 0. Resumen de la jornada

| Campo             | Valor                                                                                  |
| ----------------- | -------------------------------------------------------------------------------------- |
| PRs mergeados     | 2 (PR #5 y PR #6)                                                                      |
| LOC bruto         | +559 / -8 (10 ficheros en total, 5+5)                                                  |
| Ejes              | LiteLLM M2 (callback Langfuse) + LiteLLM M3 (virtual keys + alertas)                   |
| Horario observado | PR #5 mergeado 07:39; PR #6 mergeado 09:09 (ventana ~90 min ambos)                     |
| Modelo si consta  | No consta en los commits (proyecto es infra/tooling, no sesión Claude Code registrada) |

Jornada de ritmo muy alto y compacto: dos milestones de LiteLLM cerrados en menos de dos horas de diferencia, con commits únicos limpios (un commit por PR). El stack LiteLLM pasó de operable con master key (M1, cerrado el 22 abr) a trazable en Langfuse (M2) y con virtual keys por workload + presupuestos + alertas Slack (M3).

---

## 1. Lo que ha ido bien

**Velocidad de iteración milestone a milestone**. M2 se mergea a las 07:39, M3 a las 09:09. Contexto preservado entre PRs — los cuerpos son precisos, sin redundancia, con referencias cruzadas explícitas a invariantes (I-4, I-6). Esto indica un estado mental en el que el plan previo (ADR-010 + roadmap de milestones) estaba bien interiorizado.

**Respeto a las invariantes del SDD**. Ambos PRs documentan conscientemente sus decisiones de diseño respecto a las invariantes del proyecto:

- PR #5 documenta que `LANGFUSE_HOST` se hardcodea al DNS interno de Docker (no configurable) — decisión correcta para evitar configuración derivada que siempre sería la misma.
- PR #6 documenta que el workload se identifica en `metadata.workload` (no en tags) para respetar I-4 (tags son UNION permanente en Langfuse, contaminan namespace si se usan para datos volátiles). Cero hand-waving; la razón está en el body del PR.
- La divergencia de pricing LiteLLM vs `shared/model-pricing.ts` (I-6) se acepta y documenta en lugar de crear un acoplamiento frágil.

**Calidad del provisioning script**. `scripts/provision-keys.ts` incluye: idempotencia verificada (keys existentes se skipean), DRY_RUN=1 para preview, escritura atómica de `~/.atlax-ai/virtual-keys.json`. Patrón operativamente correcto para un script que toca credenciales.

**68 tests/0 failures** — el cuerpo de PR #6 lo confirma y coincide con el `feat(litellm): M3` commit que los referencia. La suite no regresionó al añadir dos milestones.

---

## 2. Regresiones y grietas que no escondemos

**Smoke tests de M2 marcados como "Post-merge" — no verificados antes del merge**. El test plan de PR #5 tiene dos checks marcados `[ ]` con la nota `**Post-merge**`:

```
- [ ] **Post-merge**: docker compose --profile litellm up -d + bun run scripts/smoke-litellm-langfuse.ts
- [ ] **Post-merge**: Langfuse UI → filtrar source:litellm-gateway → trace visible
```

Esto significa que la trazabilidad end-to-end del callback Langfuse **no se verificó funcionalmente antes de cerrar el PR**. Solo se validó `bun test` (unit) y `docker compose config` (YAML sintáctico). El smoke real quedó pendiente de ejecución manual post-merge. [VERIFICADO en el cuerpo del PR — los checks están desmarcados]

**El ADR-010 (plan de milestones) se dató el 2026-05-07**, catorce días después de que se ejecutaron M2 y M3 (2026-04-23). Los milestones existían y se ejecutaron correctamente, pero la decisión formal llegó tard. [VERIFICADO: fecha del ADR vs fecha de los PRs]

**M3 test plan sin checks marcados** — el PR #6 lista 8 ítems de test plan, todos sin marcar (`- [ ]`). El único indicador de verde es la nota inline `✅` en el primero:

```
- [ ] `bun test` — 68 tests, 0 failures ✅
```

Es un anti-pattern de verificación: el check de bun test está incrustado como nota en el ítem, no como ítem marcado. Dificulta leer el estado real del test plan de un vistazo. [VERIFICADO en el cuerpo del PR]

---

## 3. Factor de contexto

[inferido] La ventana de dos PRs en ~90 minutos sugiere sesión matinal concentrada, sin bloqueos externos. Los commits tienen mensajes muy limpios y precisos (body multilínea con motivaciones explícitas), lo que indica bajo nivel de deuda cognitiva acumulada al escribirlos. No hay evidencia de retrabajo, force-push ni commits de corrección en la jornada. Contexto [inferido] favorable.

La jornada del 22-04 (día anterior) había cerrado M1 (`feat(litellm): M1 — gateway opt-in`) y el consolidation de 68 tests. La inercia de tener el contexto LiteLLM fresco explica la velocidad del 23-04.

---

## 4. Aprendizajes accionables

1. **El smoke E2E funcional es gate de merge, no tarea post-merge.**
   Trigger: cuando el test plan de un PR incluye ítems marcados `Post-merge` que verifican comportamiento funcional end-to-end, elevarlos a gate de merge (mover el CI check o añadir nota explícita de por qué se acepta diferir). En este caso, el callback de LiteLLM→Langfuse es el valor principal del PR — mergearlo sin haberlo visto funcionar en un trace real es aceptar riesgo silencioso.

2. **Los ADRs deben crearse simultáneamente a la implementación, no retroactivamente.**
   Trigger: al cerrar un PR que implementa una decisión arquitectónica de diseño (elección de tecnología, comportamiento del sistema, invariante nuevo), crear o actualizar el ADR correspondiente en el mismo PR o en el PR inmediatamente siguiente — no 14 días después.

3. **El cuerpo del PR como evidencia de verificación: marks explícitos, no notas inline.**
   Trigger: al escribir un test plan en el body de un PR, marcar los checks realmente ejecutados antes del merge con `[x]` y dejar los no ejecutados como `[ ]` sin mezclar notas `✅` dentro del ítem. La legibilidad del estado de verificación depende de la consistencia del formato.

---

## 5. Evolución vs regresión — balance neto

**Evolución clara**: El stack LiteLLM pasó de un gateway operable con una sola master key (M1) a un sistema con trazabilidad por workload en Langfuse (M2) y presupuestos por workload con alertas Slack (M3), en una sola jornada y sin regresiones en la suite de tests. Las decisiones de diseño (I-4, I-6) se respetaron y documentaron conscientemente. Velocidad alta con calidad estructural mantenida.

**Regresión sutil**: El patrón de diferir la verificación funcional "post-merge" es inconsistente con la regla de smoke test del baseline (global CLAUDE.md). En una jornada pequeña con PRs rápidos, la tentación de "lo verifico luego con el stack levantado" es alta — y esa deuda es la que hace que los smoke E2E se acumulen como pendientes.

**Balance neto**: Jornada positiva. Dos milestones cerrados con calidad técnica sólida, sin retrabajo visible. La grieta principal (smoke diferido) es real pero no catastrófica — el callback LiteLLM→Langfuse eventualmente funcionó (PRO activo con M1/M2 documentado en memorias del proyecto). El ADR tardío es deuda documental, no técnica.

---

## 6. Triage retro-as-action

Esta retro es post-hoc de una jornada de 2026-04-23. El trabajo está cerrado y en producción. Las acciones son sobre el proceso, no sobre el código de ese día.

| Item                                     | Categoría                    | Acción concreta                                                                                                                     |
| ---------------------------------------- | ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Patrón "Post-merge verify" en test plans | ⚫ deuda permanente aceptada | Documentado en el aprendizaje #1. Aplicar como checklist en PRs futuros de infraestructura. El código ya está en PRO y funcionando. |
| ADR-010 datado 14 días tarde             | ⚫ deuda permanente aceptada | El ADR existe. La lección es el aprendizaje #2: crear ADR en el mismo PR. No acción retroactiva necesaria.                          |
| Test plan con checks sin marcar (PR #6)  | ⚫ deuda permanente aceptada | Formato del body de ese PR ya es inmutable. El patrón se captura en aprendizaje #3 para PRs futuros.                                |

No hay items 🟢/🟡/🔴 — esta retro es arqueología de una jornada cerrada, sin deuda abierta que requiera acción inmediata. Los tres items son aprendizajes de proceso ya internalizados.

---

## Anexo — Ground-truth

| #PR | Título                                                                | +/- LOC | Ficheros | Mergeado                  |
| --- | --------------------------------------------------------------------- | ------- | -------- | ------------------------- |
| #5  | feat(litellm): M2 — callback Langfuse para trazabilidad gateway       | +192/-7 | 5        | 2026-04-23T07:39:31+02:00 |
| #6  | feat(litellm): M3 — virtual keys per-workload + soft budget + alertas | +367/-1 | 5        | 2026-04-23T09:09:42+02:00 |

**Total**: +559/-8, 10 ficheros (con solapamiento de 1-2 ficheros entre PRs — `config.yaml`, `docker-compose.yml`, `env.example`, `README.md` modificados en ambos).

**Verificación de ground-truth**:

```bash
gh pr list --state merged --search "merged:2026-04-23" --json number,title,mergedAt
# → [{number:5,...},{number:6,...}]
git log --oneline --after="2026-04-22T23:59:59" --before="2026-04-24T00:00:00"
# → f7efbb3 feat(litellm): M3...
# → 4d6225c feat(litellm): M2...
```
