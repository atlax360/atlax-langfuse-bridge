# RETRO — Jornada 2026-05-08 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos; MEDIA/BAJA para vivencia subjetiva — [inferido] donde aplique.
> Ground-truth: 7 PRs merged 2026-05-08. `gh pr list --state merged --search "merged:2026-05-08"`.

---

## 0. Resumen de la jornada

**Tema central**: auditoría 360º pre-onboarding de 13 devs + corrección de bug crítico de reconciliación de costes + plan formal de despliegue PRO.

La jornada comenzó antes del amanecer (primer commit a las 04:52 CET) y cerró entrada la tarde (último commit a las 13:12 CET). El punto de partida fue el cierre de v1 de la noche anterior (2026-05-07) y la auditoría 360º con 4 agentes paralelos que arrojó 47 hallazgos. El grueso de la jornada ejecutó ese plan en 3 PRs secuenciales de auditoría + 1 fix crítico descubierto durante la validación funcional + 1 PR de plan PRO + 1 PR de recovery post-crash.

| #   | PR                                                                               | Tipo            | +/-LOC    | Archivos |
| --- | -------------------------------------------------------------------------------- | --------------- | --------- | -------- |
| #64 | `test(audit)`: post-v1 audit pass — reconciler pure functions + métricas sync    | test/docs       | +263/-6   | 4f       |
| #65 | `audit(pr1)`: bloqueantes pre-onboarding — 10 items B1-B10 + H4                  | audit/sec       | +361/-88  | 23f      |
| #66 | `audit(pr2)`: hardening + calidad — 22 items Nivel 2-3 + 11 tests nuevos         | audit/hardening | +448/-51  | 22f      |
| #67 | `audit(pr3)`: coherencia docs + reglas globales formalizadas                     | docs/rules      | +47/-12   | 7f       |
| #68 | `fix(reconcile)`: cost_report sin group_by=description silenciaba la divergencia | fix crítico     | +213/-7   | 7f       |
| #69 | `feat(pro)`: plan formal de despliegue Cloud Run + ADR-012 ClickHouse GCE        | docs/infra      | +1686/-45 | 8f       |
| #70 | `audit(post-recovery)`: script validación + fw-deny-rfc1918 + lección latencia   | audit/docs      | +377/-0   | 3f       |

**Métricas brutas**: 7 PRs, +3395/-209 LOC (bruto: **3604 LOC movidos**).

**Bloque temporal**: 04:52–13:12 CET (~8h20min de ventana de commits). [inferido] La densidad de commits (7 PRs en ~8h, con 5 de ellos entre 04:52 y 06:40) sugiere una sesión de madrugada continua que comenzó desde el cierre de la jornada del 07-May o madrugó directamente al 08. El PR #68 (bug crítico) se descubrió a mitad de la auditoría documentada — evidencia de que la validación funcional real cazó algo que el plan no anticipaba.

---

## 1. Lo que ha ido bien

### Ejecución disciplinada del plan de 3 PRs (VERIFICADO)

La auditoría 360º de la noche anterior había producido 47 hallazgos clasificados en 4 niveles de severidad y un plan de 3 PRs secuenciales. La ejecución fue exactamente esa secuencia: #64 (tests baseline) → #65 (bloqueantes) → #66 (hardening) → #67 (docs). Todos mergeados en la misma jornada. Sin desvíos de scope, sin PRs de "hotfix" que mezclen niveles.

### Elevación de calidad real: de 805 a 818+ tests, 0 violaciones I-12 (VERIFICADO)

El audit de inicio de jornada (#64) estableció baseline en 805/1450 expects/50f. Al cerrar (#67): 816/1470/51. Más importante que el número: las 14 violaciones de I-12 (`process.env = {...origEnv}`) en 7 ficheros existentes quedaron a cero gracias al helper `tests/helpers/env.ts`. Las 4 ocurrencias de `require()` en módulos ESM también a cero. El estado pre-onboarding pasó de "7.5/10 auditores estimados" a estado donde el README Quick Start funciona literalmente.

### Descubrimiento y cierre del bug crítico de reconciliación de costes (VERIFICADO)

El bug de PR #68 es el hallazgo más valioso de la jornada. `getCostReport()` se llamaba sin `groupBy: ["description"]` → Anthropic devolvía rows con `model: null` → `sumCostByModel()` ruteaba todo a `"__non_token__"` → el reconciler lo filtraba → la comparación de divergencia quedaba vacía silenciosamente. Los logs decían `cost-comparison-seat-only` cuando había $14.788 USD/semana de Sonnet 4.6 que el bridge nunca verificaba. Esto no estaba en los 47 hallazgos del audit previo — lo encontró la validación funcional real contra la API. Una sola línea de fix (`groupBy: ["description"]`) + tests anti-regresión.

### Hardening de seguridad pre-onboarding completo (VERIFICADO)

PR #65 cerró los dos hallazgos de seguridad más graves: path traversal en `transcript_path` del hook (que podía leer cualquier fichero del filesystem con un Stop event manipulado) y puertos Docker en `0.0.0.0` expuestos a la LAN (`langfuse-web:3000` y `litellm:4001`). Ambos son vectores reales en un contexto de 13 devs con laptops en redes corporativas compartidas.

### Reglas globales cross-project formalizadas y aplicadas (VERIFICADO)

PR #67 no solo cerró drift documental: formalizó 12 reglas en `~/.claude/rules/` (`security.md`, `testing.md`, `cross-project-patterns.md`) derivadas directamente de los hallazgos del audit. Estas reglas no son internas al bridge — aplican a TODOS los proyectos Atlax. El pattern de "audit → regla cross-project" es uno de los outputs de mayor valor compuesto de esta jornada.

---

## 2. Regresiones y grietas que no escondemos

### El bug crítico de PR #68 llevaba tiempo en producción (VERIFICADO)

El bug de `cost_report` sin `group_by=description` no era un bug nuevo de la jornada: estaba en el código del reconciler desde su implementación. Los logs de producción llevaban reportando `cost-comparison-seat-only` silenciosamente mientras $14.788 USD/semana de API costs no se verificaban. La auditoría 360º con 4 agentes paralelos lo había pasado por alto — estaba en el código del reconciler pero no en el scope de ninguno de los 4 agentes. [inferido] Esto sugiere un gap en la cobertura de los agentes de auditoría: revisaron el código de los módulos pero no ejecutaron el path funcional real contra la API de Anthropic.

**Coste real**: semanas (duración desconocida, al menos desde implementación de S18-B) con una función crítica de reconciliación de costes que producía silencio en vez de alertas. El bridge reportaba health ok cuando el gap era del 98.7% en Sonnet 4.6.

### Sesión de madrugada — 5 PRs antes de las 07:00 CET [inferido]

Los timestamps muestran PR #64 a las 04:52, PR #65 a las 05:51, PR #66 a las 06:11, PR #67 a las 06:22, PR #68 a las 06:40. Cinco PRs en menos de dos horas antes de las 07:00. [inferido] Esta cadencia bajo fatiga de madrugada es un factor de riesgo. La jornada del 07-May había cerrado a las ~23:37 CET — si fue sesión continua, la ventana de trabajo supera las 7 horas sin descanso antes del primer commit del 08.

La grieta no es que los PRs estén mal — los tests verifican que son correctos. La grieta es que no hay checkpoint de descanso documentado y el patrón "sprint nocturno → auditoría de madrugada" es frágil.

### PR #69 (plan PRO, +1686/-45) es el PR más grande de la jornada y es documentación (VERIFICADO)

El 49% del LOC bruto de la jornada corresponde a un PR de documentación del plan de despliegue PRO y ADR-012. Eso es legítimo — era documentación necesaria y un ADR formal. Pero un PR de +1686 LOC en documentación merece nota: si el ratio en jornadas futuras se inclina hacia documentación vs código funcional, puede ser señal de planificación excesiva antes de ejecución.

### Post-recovery de crash de Claude Code no documentado formalmente [inferido]

PR #70 menciona "post-recovery del crash de CC" — hubo un crash de Claude Code durante la jornada que perdió el script `validate-consistency.ts` que vivía en `/tmp/atlax-validation/`. El PR lo recrea (270 líneas vs 700 del original — el crash forzó una versión más concisa). No hay evidencia de un postmortem o issue sobre el crash. [inferido] Es un gap: los crashes del harness que producen pérdida de trabajo deben documentarse aunque sea brevemente, para saber si el patrón se repite y para registrar qué se perdió.

---

## 3. Factor de contexto

**Contexto de la jornada** [inferido desde timestamps y docs]:

La jornada del 07-May había cerrado v1 del bridge (PR #63, feat v1-close: S24) a las 23:37 CET, justo después de un sprint intenso. La auditoría 360º con 4 agentes se realizó en esa sesión o al inicio del 08-May — el primer commit del 08 es a las 04:52 CET, lo que sugiere continuación nocturna o madrugada muy temprana.

El contexto operativo era de **presión pre-onboarding**: los 13 devs del piloto esperaban que el bridge estuviera listo. Esa presión explica la densidad de trabajo pero también es el factor de riesgo principal para decisiones apresuradas (ninguna identificada, pero el riesgo existía).

**Un crash real de Claude Code** (mencionado en PR #70) interrumpió la jornada. La pérdida fue un script de validación de 700 líneas en `/tmp`. El impacto fue contenido pero el evento en sí marca un riesgo del workflow "scripts temporales en /tmp".

---

## 4. Aprendizajes accionables

**A-1: Auditoría funcional real es obligatoria, no opcional**
El bug crítico de PR #68 no lo encontraron los 4 agentes del audit 360º — lo encontró la validación funcional contra la API real. Trigger: toda auditoría pre-onboarding incluye una fase de validación funcional E2E contra los endpoints reales, no solo revisión estática de código.

**A-2: Scripts críticos no viven en /tmp — van al repo desde el primer commit**
El script `validate-consistency.ts` se perdió en el crash porque vivía en `/tmp/atlax-validation/`. Regla operativa: cualquier script que se use más de una vez o que sea resultado de trabajo centauro va al repo (`scripts/`) en el mismo commit en que se escribe. `/tmp` es para artefactos genuinamente efímeros (salida de comandos, archivos intermedios de un pipeline).

**A-3: El bug de silencio es peor que el bug de ruido**
`cost_report` sin `groupBy` producía logs de salud normal (`cost-comparison-seat-only`) cuando la reconciliación real no ocurría. Este tipo de bug — donde el sistema falla silenciosamente en vez de lanzar error — es el más peligroso. Trigger: al implementar funciones de reconciliación/verificación, añadir un test que simule el caso donde la comparación devuelve vacío y afirmar que eso produce un warning/error, no silencio.

**A-4: Reglas cross-project deben derivarse de hallazgos concretos (patrón validado)**
El PR #67 formalizó 12 reglas cross-project desde hallazgos reales del audit. Ese patrón funcionó — las reglas tienen raíces concretas y son verificables. Continuar: cada auditoría importante termina con una sección "¿qué regla cross-project se puede extraer?" antes de cerrar.

**A-5: Los agentes de audit deben incluir ejecución, no solo lectura estática**
El gap que permitió que el bug de PR #68 sobreviviera 4 agentes de audit: todos revisaron código pero ninguno ejecutó el path funcional. Trigger: en prompts de audit, incluir explícitamente "ejecuta el path X contra un mock de la API y verifica que el output no sea silencio vacío".

---

## 5. Evolución vs regresión — balance neto

**Evolución clara**:

- El bridge pasó de estado "pre-onboarding con bloqueos" a estado listo para 13 devs: README Quick Start funciona, puertos seguros, tests a 816/0.
- Un bug crítico de reconciliación de costes que llevaba semanas silenciado quedó detectado y corregido con cobertura anti-regresión.
- 12 reglas cross-project formalizadas con raíces concretas — valor compuesto alto para todos los proyectos Atlax.
- El plan formal PRO (ADR-012 + cloud-run-deployment-plan.md) documenta la arquitectura ClickHouse en GCE con criterios de decisión verificables.

**Regresión sutil**:

- Workflow de "scripts importantes en /tmp" generó pérdida real de trabajo cuando ocurrió un crash. No es una regresión nueva, pero el crash la materializó.
- La cobertura real vs reportada del bridge (~80% real vs ~25-36% en coverage tool) es deuda de tooling que sigue sin resolverse — el aprendizaje está documentado pero la métrica de CI sigue siendo engañosa.

**Balance neto**: jornada positiva con output concreto y verificable. El ratio de valor / riesgo es alto. La grieta más seria — el bug de reconciliación silenciosa — se descubrió y cerró en la misma jornada, lo que es la mejor forma posible de materializar ese tipo de deuda. El riesgo que no se gestionó es el workflow de sesión nocturna continua sin checkpoints de descanso documentados.

---

## 6. Triage retro-as-action

**Estado al reconstruir (2026-06-21)**: los PRs de esta jornada están todos mergeados y el bridge está en PRO activo. El triage es de aprendizajes, no de deuda técnica pendiente.

| Item                                                    | Clasificación                               | Acción                                                                                                                 |
| ------------------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| A-2: scripts críticos no en /tmp                        | 🟢 **Regla ya en práctica**                 | Verificar en la próxima sesión que `scripts/` tiene todo lo que se usa más de una vez                                  |
| A-3: bug de silencio — test de cobertura vacío          | 🟡 **Handoff para próximo sprint de tests** | Al añadir nueva función de reconciliación, incluir test donde la respuesta es vacío y verificar que produce warning    |
| A-5: agentes de audit con ejecución, no solo lectura    | 🟡 **Incorporar en próxima auditoría**      | Al redactar prompt de audit, añadir fase de ejecución funcional explícita                                              |
| A-4: extraer regla cross-project al cierre de auditoría | 🟢 **Patrón validado, ya en práctica**      | Verificar que el cierre de próximas auditorías incluye la sección de reglas cross-project                              |
| Crash de CC + pérdida de work en /tmp                   | 🔴 **Backlog — low priority**               | Documentar brevemente cuando ocurra un crash futuro. No retroceder a documentar el de esta jornada (coste > beneficio) |
| Sesión nocturna sin checkpoint de descanso              | ⚫ **Deuda aceptada permanente**            | No hay mecanismo técnico para enforcar esto. La regla queda a juicio del usuario.                                      |

---

## Anexo — Ground-truth

### PRs merged 2026-05-08 (7 total)

```
PR#64  test(audit): post-v1 audit pass — reconciler pure functions + métricas sync
       +263/-6 LOC | 4 ficheros | merged 2026-05-08T04:52:40+02:00

PR#65  audit(pr1): bloqueantes pre-onboarding — 10 items B1-B10 + H4
       +361/-88 LOC | 23 ficheros | merged 2026-05-08T05:51:03+02:00

PR#66  audit(pr2): hardening + calidad — 22 items Nivel 2-3 + 11 tests nuevos
       +448/-51 LOC | 22 ficheros | merged 2026-05-08T06:11:53+02:00

PR#67  audit(pr3): coherencia docs + reglas globales formalizadas
       +47/-12 LOC | 7 ficheros | merged 2026-05-08T06:22:05+02:00

PR#68  fix(reconcile): cost_report sin group_by=description silenciaba la divergencia
       +213/-7 LOC | 7 ficheros | merged 2026-05-08T06:40:03+02:00

PR#69  feat(pro): plan formal de despliegue Cloud Run + ADR-012 ClickHouse GCE
       +1686/-45 LOC | 8 ficheros | merged 2026-05-08T12:53:22+02:00

PR#70  audit(post-recovery): script validación + fw-deny-rfc1918 + lección latencia
       +377/-0 LOC | 3 ficheros | merged 2026-05-08T13:12:18+02:00
```

**LOC bruto total**: +3395/-209 = **3604 LOC movidos**

### Fuentes consultadas

- `gh pr list --state merged --search "merged:2026-05-08"` — listado y bodies de 7 PRs
- `git log --format="%h %ai %s" --since="2026-05-07T20:00:00" --until="2026-05-09T00:00:00"` — timestamps exactos
- `~/.claude/projects/-Users-jgcalvo-work-atlax-langfuse-bridge/memory/project_audit_2026-05-08.md` — auditoría 360º con 47 hallazgos, estado pre/post, reglas formalizadas

### Métricas de tests (VERIFICADO desde PR bodies)

| Punto                                   | Tests | Expects | Ficheros | Fails |
| --------------------------------------- | ----- | ------- | -------- | ----- |
| Pre-audit (baseline PR #64)             | 805   | 1450    | 50       | 0     |
| Post-audit (PR #66)                     | 816   | 1470    | 51       | 0     |
| Post-fix PR #68 (estimado desde PR #70) | 818+  | ~1475   | 51       | 0     |
