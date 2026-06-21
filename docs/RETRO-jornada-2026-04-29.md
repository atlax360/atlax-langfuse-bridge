# RETRO — Jornada 2026-04-29 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos; MEDIA/BAJA para vivencia subjetiva — [inferido] donde aplique.
> Ground-truth: 2 PRs merged 2026-04-29.

---

## 0. Resumen de la jornada

**Tema central**: entrega de los dos artefactos de productización de Sprint 16 — el script de onboarding del piloto y la consolidación de coverage.

Jornada corta y bien acotada. Solo 2 PRs, ambos mergeados antes de las 08:15 CET. El contexto es el día siguiente a la respuesta post-incidente (28-Apr): el hardening ya está en main, y esta jornada avanza dos frentes de calidad pendientes antes del enrolamiento de los 37 devs del piloto.

| #   | PR                                                                             | Tipo            | +/- LOC | Archivos | Merged at (CET) |
| --- | ------------------------------------------------------------------------------ | --------------- | ------- | -------- | --------------- |
| #41 | `feat(setup)`: pilot-onboarding.sh — script standalone para 37 devs del piloto | feature/tooling | +276/-0 | 2f       | 06:31           |
| #42 | `test(sprint-16)`: coverage gap consolidation — 581 tests / 981 assertions     | tests           | +711/-0 | 2f       | 08:13           |

**Métricas brutas**: 2 PRs, +987/-0 LOC (bruto: 987 adiciones, 0 eliminaciones). Todo adición pura, sin eliminaciones — consistente con añadir artefactos nuevos en ficheros aislados.

**Bloque temporal comprimido**: ambos commits están entre las 06:31 y 08:13 CET. Sesión de madrugada/mañana temprana de ~1h40min efectiva entre los dos merges.

---

## 1. Lo que ha ido bien

**El script de onboarding elimina la fricción de 37 instalaciones manuales.** El PR #41 entrega `setup/pilot-onboarding.sh`: se invoca con `curl -fsSL <url> | bash -s -- <HOST> <PK> <SK>`, descarga el hook + 5 módulos `shared/` desde GitHub raw, registra el hook Stop en `~/.claude/settings.json` (idempotente), escribe credenciales en `~/.atlax-ai/reconcile.env` con `chmod 600`, y establece `cleanupPeriodDays: 90` (prerequisito ADR-008). Es la pieza que hace el piloto operativo sin que cada dev tenga que clonar el repo o leer la documentación completa.

**La idempotencia del script es explícita y pensada.** El body del PR especifica "no duplica si ya existe" en `settings.json`. Esto evita el problema clásico de los scripts de onboarding que, al re-ejecutarse, producen entradas duplicadas en configuración. Diseño correcto desde el primer intento [VERIFICADO: single commit, sin correcciones dentro del PR].

**Cobertura de `langfuse-client.ts` pasa de 94,9% a 98,0% líneas en un único PR.** Los 37 tests del PR #42 cubren 4 módulos con rutas de error que el instrumentador de cobertura no puede medir vía importación normal: tests con subprocess para `readTierFile` y `sendToLangfuse` (os.homedir() cacheado al inicio del proceso — exactamente el patrón documentado en `feedback_bun_os_homedir_immutable.md`). La técnica es correcta y el PR la documenta explícitamente.

**Los 37 tests añadidos no introducen ninguna regresión.** 544 tests previos → 581 tests, 0 fail [VERIFICADO: `bun test` → 581 pass / 0 fail en el PR body, check verde].

**Jornada cohesionada con la estrategia del sprint.** Los dos PRs son complementarios: el onboarding sirve para enrolar devs, la cobertura asegura calidad antes de hacerlo. El orden (primero feat, luego test) coincide con lo que produce menos riesgo de regresión.

---

## 2. Regresiones y grietas que no escondemos

**El test plan del PR #41 tiene items sin marcar.** Los checkboxes del PR body de `pilot-onboarding.sh` están todos en `[ ]` (sin marcar), incluyendo "Verificar en máquina limpia" e "Re-ejecución idempotente". Solo "Syntax check: `bash -n setup/pilot-onboarding.sh` → OK" está marcado implícitamente en el texto. [VERIFICADO: el JSON del PR muestra exactamente esto]. Esto significa que el script se mergeó sin verificación funcional en máquina limpia. Para un script que va a ejecutarse con `curl | bash` en las máquinas de 37 devs, este es el vector de fallo más obvio: `eval` de credenciales escapado incorrecto, diferencias de bash/zsh en macOS, rutas `~` que no expanden igual.

**GAP-P01 en macOS documentado pero no resuelto.** El script documenta que en macOS no verifica systemd user (muestra advertencia y no falla), pero el piloto tiene devs en macOS. La ruta happy path está sin probar en el contexto de uso más probable [inferido: dado que el dev trabaja en Mac M-series según el global CLAUDE.md].

**Jornada sin commits anteriores a las 06:31 CET.** El día no tiene actividad de planificación visible — los commits arrancan directamente en la implementación. [inferido] O bien la planificación fue en sesión de la jornada previa (28-Apr, que cerró a las 19:49 CET con deuda clara en handoff), o bien fue una sesión corta y enfocada sin overhead de planning. La retro de la jornada previa identificaba como 🟡 handoff la adición del campo SLA al template INC-N — eso NO aparece en esta jornada. Item caído.

**El script descarga desde `github.com/atlax360/atlax-langfuse-bridge/main` sin SRI ni hash verification.** `curl -fsSL <url> | bash` es el patrón que la guía HTML-SEC-05 señala como inseguro para scripts (SRI hashes en CDN), y que en el contexto de un script bash se traduce en "confiar en que GitHub raw sirve el contenido esperado sin verificación criptográfica del lado del cliente". Para un script interno de Atlax 360, el riesgo es bajo, pero la ausencia de comentario que justifique esta decisión es una deuda de documentación.

---

## 3. Factor de contexto

**Sesión de madrugada aislada, sin evidencia de bloqueos.** [inferido] La sesión transcurre entre las 04:31 UTC (commit #41) y las 06:13 UTC (commit #42), lo que equivale a 06:31–08:13 CET. Ambos commits en ventana de ~1h40min. Patrón habitual en este proyecto: sesiones madrugada previas a la jornada laboral para artefactos bien acotados.

**Jornada con presión implícita del piloto.** El script de onboarding es el último artefacto operacional antes de enrolar 37 devs. [inferido] Esto explicaría la priorización de "funciona" sobre "probado en máquina limpia".

**Bloque de hardening completado ayer.** Esta jornada hereda el proyecto con el PreToolUse hook activo, ADR-008 mergeado, y deuda de auditoría cero. Es un buen punto de partida que permite avanzar sin desvíos de urgencia.

---

## 4. Aprendizajes accionables

1. **Scripts `curl | bash` para onboarding requieren test en máquina limpia ANTES del merge.** Trigger: cualquier PR con `#!/usr/bin/env bash` cuyo destino sea ejecutarse en máquinas de terceros. Acción: añadir a la checklist del PR "testeado en máquina limpia (VM efímera o `docker run ubuntu`)". El test plan del PR #41 lo pide pero no se ejecutó.

2. **Los items 🟡 del triage de la jornada anterior deben aparecer en el PRIMER commit de la siguiente jornada, o documentar explícitamente por qué se difieren.** El item del campo SLA en INC-N template (🟡 del 28-Apr) no aparece en esta jornada. Si fue diferido, el handoff 28-Apr→29-Apr no lo recoge.

3. **GAP-P01 macOS en scripts de piloto merece issue Linear**, no solo comentario en el PR. Cuando el entorno objetivo tiene devs en macOS y el happy path macOS no está probado, el gap debe ser trazable. Trigger: checklist "¿el script tiene ramas de SO distintas que no están testeadas?".

---

## 5. Evolución vs regresión — balance neto

**Evolución clara**: el artefacto más práctico del Sprint 16 (el script de onboarding) existe y es funcional para el caso base Linux/WSL. La suite de tests crece de 544 a 581 con cobertura real de error paths, no de paths triviales. El proyecto entra en el día 30-Apr con los bloqueantes del piloto resueltos.

**Regresión sutil**: el script se mergeó con test plan incompleto para el target de uso más frecuente (macOS, máquina limpia). El item 🟡 del triage previo desapareció silenciosamente.

**Balance neto**: jornada positiva y bien acotada — los dos entregables son sustanciales y correctos en su núcleo. La grieta es de calidad de proceso (test plan sin ejecutar), no de calidad de código. Para una jornada de 2 PRs en ventana de <2h, el output es sólido.

---

## 6. Triage retro-as-action

**🟢 30-min HOY** — nada identificado. Los 2 PRs cerraron sus objetivos y no hay deuda urgente nueva que no pueda esperar.

**🟡 Handoff primera acción próxima sesión:**

- Testar `setup/pilot-onboarding.sh` en macOS limpio (VM efímera o `docker run`) y marcar los checkboxes del PR #41 pendientes (o abrir PR de corrección si se encuentran bugs). (~20-30 min, bloqueante antes del primer enrolamiento macOS).
- Añadir campo "Mitigación pendiente antes de:" al template INC-N en el runbook (heredado del 🟡 del 28-Apr — lleva dos jornadas en handoff). (~15 min).

**🔴 Backlog:**

- Issue Linear para GAP-P01 macOS: systemd user equivalente en launchd, o documentación explícita del flujo manual macOS end-to-end para devs del piloto.

**⚫ Deuda aceptada permanente:**

- `curl | bash` sin SRI client-side es aceptable para script interno Atlax 360 con repo privado en GitHub. La mitigación es la autenticación de GitHub, no SRI. Decisión aceptada sin ADR formal (el riesgo es bajo para un script corporativo).

---

## Anexo — Ground-truth

| # PR | Título                                                                         | Adiciones/Eliminaciones | Archivos | Merged at (CET) |
| ---- | ------------------------------------------------------------------------------ | ----------------------- | -------- | --------------- |
| #41  | `feat(setup)`: pilot-onboarding.sh — script standalone para 37 devs del piloto | +276/-0                 | 2f       | 06:31           |
| #42  | `test(sprint-16)`: coverage gap consolidation — 581 tests / 981 assertions     | +711/-0                 | 2f       | 08:13           |

**Suma bruta**: +987 adiciones / -0 eliminaciones = 987 LOC añadidos.

Commits verificados:

- `275b563` — 2026-04-29T06:31:43+02:00 — feat(setup): pilot-onboarding.sh
- `e63c87a` — 2026-04-29T08:13:26+02:00 — test(sprint-16): coverage gap consolidation

Fuente: `gh pr list --state merged --search "merged:2026-04-29"` + `git log --after="2026-04-28T23:59:59" --before="2026-04-30T00:00:00"`.
