# RETRO — Jornada 2026-04-22 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos; MEDIA/BAJA para vivencia subjetiva — [inferido] donde aplique.
> Ground-truth: 4 PRs merged 2026-04-22. `gh pr list --search "merged:2026-04-22"`.

---

## 0. Resumen de la jornada

**Tema dominante**: fundación completa del proyecto `atlax-langfuse-bridge` — de cero a sistema funcional con tests en un único día.

**PRs mergeados**: 4 (secuencial, sin overlap de ficheros evidente)
**LOC bruto** (suma additions + deletions): +2375 / -187 = 2562 líneas totales en movimiento
**Ejes de trabajo**:

- Eje A (mañana, 12:41-12:50): infraestructura core — reconciler, tier, cwd fix + centralización pricing
- Eje B (noche, 21:43-21:45): consolidación tests 68/126 + gateway LiteLLM M1

**Modelo**: [inferido] Sonnet 4.6 / Opus 4.7 según convención del equipo Atlax en esa época (roadmap posterior confirma ese pairing)

---

## 1. Lo que ha ido bien

**Fundación limpia en un solo día.** Los 4 PRs construyen una pila coherente en orden correcto: PR#1 (core reconciler) → PR#2 (deuda I-6 pricing) → PR#4 (test consolidation) → PR#3 (LiteLLM M1). El orden respeta dependencias: PR#2 se mergeó 9 minutos después de PR#1 precisamente para cerrar deuda I-6 antes de que LiteLLM apareciese como 4º consumidor de `MODEL_PRICING`. Señal de planificación proactiva, no reactiva.

**Invariantes documentadas desde el commit 1.** PR#1 aterrizó con 6 invariantes (I-1 a I-6) en `CLAUDE.md`. El proyecto nació gobernable. Ninguna regla fue retrofitteada semanas después — eran parte del entregable inicial.

**Test coverage real, no cosmético.** PR#4 entregó 68 tests / 126 assertions cubriendo unit + cross-validation + E2E estructural. La cross-validation (I-2 idempotencia: `calcCost ↔ aggregateLines` producen costes idénticos) es evidencia de que los contratos se verificaron, no solo se afirmaron.

**Deuda técnica atacada antes de crecer.** PR#2 eliminó ~18 líneas duplicadas de `MODEL_PRICING` en 3 sitios ANTES de añadir LiteLLM como 4º consumidor. Patrón correcto: reducir deuda de SSoT en el mismo día que la deuda iba a empeorar.

**LiteLLM M1 clean con decisiones documentadas.** PR#3 documenta explícitamente 5 decisiones arquitecturales (profiles opt-in, BD dedicada vs schema, port 4001:4000, master key ≠ Anthropic key, healthcheck Python). No es solo código — es código con razonamiento.

---

## 2. Regresiones y grietas que no escondemos

**Invariante I-6 llegó rota desde el commit inicial.** PR#1 documentó I-6 como "MODEL_PRICING duplicado en 3 sitios → actualizar sincronizado", admitiendo que el estado inicial ya era deuda técnica. PR#2 la resolvió 9 minutos después, pero la secuencia revela que PR#1 se mergeó con una invariante violada por diseño. [VERIFICADO: el body de PR#2 dice explícitamente "Cierra deuda técnica I-6 antes de introducir LiteLLM como 4º consumidor"].

**Los milestones LiteLLM M2-M4 quedaron fuera de scope el mismo día que se declaró M1.** El body de PR#3 lista explícitamente "M2 — callback Langfuse, M3 — virtual keys, M4 — script pricing" como "out of scope". Correcto deferirlos, pero la arquitectura del día asumía una continuación que no vino en este mismo día (M2 y M3 se mergearon el día siguiente, 2026-04-23). [VERIFICADO: git log muestra commits M2 y M3 a las 07:39 y 11:09 de 2026-04-23].

**Systemd timer quedó pendiente en el mismo PR que lo introdujo.** PR#1 tiene dos checkboxes explícitos sin marcar: `[ ] Instalación manual del timer systemd` y `[ ] Statusline integrado en ~/.claude/settings.json`. Patrón "ship the code, defer the operation" — el feature llegó sin estar operativo end-to-end. [VERIFICADO: body PR#1, sección Test plan].

**68 tests con 0 evidencia de CI verde en ese momento.** Los test plans tienen `[x] bun test — 68 pass, 0 fail` pero no hay evidencia de CI pipeline configurado en ese commit. [inferido] Los tests pasaban localmente; la disciplina de CI no estaba establecida el 22-04 (el roadmap posterior de Q2-Q3, que cita "581 tests / 979 expects en verde" como estado del 07-05, confirma que CI se institucionalizó semanas después, no el día 0).

---

## 3. Factor de contexto

**Día 0 del proyecto.** El commit más antiguo en el repo es `1850048` del 22-04-2026 a las 14:41 UTC+2. Esta fue la jornada de fundación — 4 PRs, 4 commits, sin historial previo. Contexto relevante: las decisiones tomadas el día 0 son las más costosas de reversar. Los invariantes I-1/I-2/I-3 (exit 0, idempotencia, cwd fix) son arquitectura fundamental.

**Cadencia inusual: 4 PRs en un día de fundación.** [inferido] El ritmo sugiere sesión extendida con AI co-pilot. El patrón mañana (PRs 1+2, ~9 min de separación) / noche (PRs 3+4, ~2 min de separación entre la consolidación de tests y M1) es consistente con dos bloques de trabajo intensos. Los 2 minutos entre PR#4 y PR#3 indican que ambos estaban preparados simultáneamente y se mergearon en rápida sucesión.

---

## 4. Aprendizajes accionables

1. **Invariantes violadas en el commit de creación son deuda disfrazada de documentación.** I-6 se declaró sabiendo que estaba rota. La corrección vino 9 minutos después, pero podría haber venido semanas después. **Trigger**: si al escribir un invariante I-N en CLAUDE.md su estado actual NO cumple la regla, no mergearlo hasta aplicar el fix — o crear el fix como primer commit y el invariante como segundo.

2. **"Out of scope (próximos PRs)" en el body de un PR es un handoff explícito que debe tener issue o ticket.** M2-M4 quedaron bien descritos pero sin trazabilidad. En este proyecto llegaron al día siguiente de forma orgánica, pero ese ritmo no es garantizable. **Trigger**: cada "out of scope" en PR body que representa trabajo real → crear issue/ticket en el mismo momento de mergear.

3. **Operaciones de infraestructura (systemd, settings.json) deben tener checklist de post-deploy verificado antes de cerrar PR.** Los dos checkboxes vacíos en PR#1 son señal de que el feature llegó a main sin estar operativo. **Trigger**: si un PR introduce una pieza operacional que requiere setup manual, el `[ ] Setup completado` debe estar marcado antes de mergear, o documentar explícitamente "configurar en próxima sesión operacional".

4. **Cross-validation entre módulos (I-2 idempotencia) es la prueba más valiosa del día.** El test que verifica `calcCost ↔ aggregateLines` produce resultados idénticos captura contratos de sistema, no solo unidades. **Trigger**: al introducir un módulo `shared/` con contratos hacia múltiples consumers, añadir siempre un test de cross-validación que compruebe que todos los consumers producen resultados coherentes entre sí.

---

## 5. Evolución vs regresión — balance neto

**Evolución clara**: el proyecto pasó de no existir a tener infraestructura core funcional (reconciler, tier, cwd fix), pricing centralizado (I-6 resuelta), test suite de 68/126, gateway LiteLLM M1 operativo, y 6 invariantes documentadas. Fundación sólida en un día.

**Regresión sutil**: la I-6 mergeada como "pendiente de resolución" y los checkboxes operacionales vacíos establecen un patrón de "documentar la deuda en el mismo commit que la introduce". Correcto para visibilidad, pero puede normalizarse como práctica si no se actúa rápido (en este caso, 9 minutos — bien; systemd — [inferido] días o semanas).

**Balance neto**: positivo con reservas. El día 0 de un proyecto es el momento de mayor leverage para sentar patrones correctos. Los patrones de invariantes, cross-validation y decisiones documentadas son muy buenos. La deuda I-6 embebida en PR#1 y los operacionales pendientes son las grietas reales de la jornada — no bloqueantes, pero visibles.

---

## 6. Triage retro-as-action

Esta retro es **post-hoc de una jornada cerrada hace ~2 meses**. El trabajo de esa jornada está en main y en producción. El triage aplica a lecciones que informan sesiones futuras, no a trabajo pendiente de esa jornada.

| Marca | Item                                              | Acción                                                                                                                            |
| ----- | ------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| ⚫    | Deuda I-6 embebida en PR#1                        | Resuelta 9 min después (PR#2). Cerrada permanentemente.                                                                           |
| ⚫    | Checkboxes systemd/statusline vacíos en PR#1      | [inferido] Resueltos en sesiones posteriores (roadmap Q2-Q3 cita el reconciler como operativo en 07-05). Cerrada permanentemente. |
| ⚫    | M2-M4 LiteLLM sin issue/ticket                    | Resueltos orgánicamente el 23-04-2026. Cerrada permanentemente.                                                                   |
| 🟢    | Aprendizaje #1 (invariantes violadas ≠ mergeable) | Añadir a `CLAUDE.md` como regla operativa: "invariante I-N se declara solo cuando el código ya la cumple". ~10 min.               |
| 🟡    | Aprendizaje #2 (out-of-scope → issue automático)  | Revisar si el workflow actual ya captura esto vía Linear. Si no, añadir al template de PR body. Próxima sesión de mantenimiento.  |

---

## Anexo — Ground-truth

| # PR | Título                                                            | Additions / Deletions | Archivos | Merged at (UTC+2) |
| ---- | ----------------------------------------------------------------- | --------------------- | -------- | ----------------- |
| #1   | feat(phase-0): reconciler cron + tier.json + cwd fix              | +1107 / -7            | 11       | 2026-04-22 14:41  |
| #2   | refactor(pricing): centralizar MODEL_PRICING en shared/           | +100 / -61            | 6        | 2026-04-22 14:50  |
| #4   | test(consolidation): 68 tests, 126 assertions — unit + xval + E2E | +1018 / -117          | 11       | 2026-04-22 23:43  |
| #3   | feat(litellm): M1 — gateway opt-in con 1 modelo Sonnet 4.6        | +150 / -2             | 4        | 2026-04-22 23:45  |

**LOC bruto total**: +2375 additions / -187 deletions = 2562 líneas en movimiento
**Commits en main ese día**: 4 (correspondencia 1:1 con PRs)
**Señal forense**: PR#4 (tests) mergeado 2 min antes de PR#3 (M1) — ambos preparados en paralelo, mergeados en ráfaga final de la jornada.
