# RETRO — Jornada 2026-04-28 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos; MEDIA/BAJA para vivencia subjetiva — [inferido] donde aplique.
> Ground-truth: 6 PRs merged 2026-04-28. `gh pr list --search "merged:2026-04-28"`.

---

## 0. Resumen de la jornada

**Tema central**: respuesta post-incidente + blindaje definitivo del stack contra pérdida de datos.

Seis días después del incidente INC-001 (22-Apr-2026, `docker compose down -v` sin confirmación, pérdida de ~3 semanas de trazas), esta jornada cierra el ciclo de mitigación en tres ejes en paralelo: documentación formal del incidente y sus límites (ADR-008 + runbook), hardening técnico (hook PreToolUse + upgrade Langfuse), y consolidación de deuda de auditoría (PRs de audit post-Sprint 15).

| #   | PR                                                                                    | Tipo     | +/- LOC  | Archivos |
| --- | ------------------------------------------------------------------------------------- | -------- | -------- | -------- |
| #37 | `chore(langfuse)`: upgrade 3.167.4 → 3.171.0 + fix worker healthcheck + uid conflicts | infra    | +8/-7    | 2f       |
| #38 | `docs(adr-008)`: límites de recuperabilidad consistency + incidente 22-Apr-2026       | docs/ADR | +239/-9  | 4f       |
| #39 | `feat(guard)`: PreToolUse hook bloquea operaciones destructivas sobre datos Langfuse  | feature  | +220/-1  | 3f       |
| #40 | `docs(runbook)`: sección Incidentes + INC-001 (23-Apr-2026)                           | docs     | +82/-0   | 2f       |
| #30 | `audit(post-sprint-15)`: 7 findings HIGH/MEDIUM — deuda residual cero                 | audit    | +88/-40  | 8f       |
| #31 | `audit(cosmetic)`: LOW+NIT — .pop()!, labels I-N, docker worker, README, I-9          | audit    | +123/-66 | 16f      |

**Métricas brutas**: 6 PRs, +760/-123 LOC (bruto: 883 adiciones + 123 eliminaciones = **1006 LOC movidos**).

**Dos bloques temporales visibles en git**: madrugada (~05:23-05:24 CET, commits de audit y SDD scaffolding de la jornada previa prolongada) y tarde (~17:33-19:49 CET, bloque de respuesta al incidente).

---

## 1. Lo que ha ido bien

**Cierre de incidente en ciclo completo y bien ordenado.** El incidente INC-001 del 22-Apr no se archivó informalmente — recibió tratamiento de primera clase: ADR-008 con límite formal documentado (`min(cleanupPeriodDays × 24h, WINDOW_HOURS)`), entrada INC-001 en el runbook con plantilla canónica, y un restore drill ejecutado y verificado (mencionado en el body de ADR-008 como "verificado con restore drill 28-Apr-2026"). Eso convierte una pérdida de datos en un artefacto pedagógico permanente del repo.

**PreToolUse hook: mitigación técnica directa al modo de fallo.** El PR #39 ataja exactamente el vector que causó el incidente: un agente ejecutando `docker compose down -v` sin intervención humana. 21 tests (8 permitidos + 13 bloqueados), filtrado por prefijo para evitar falsos positivos en `git commit -m` o HEREDOCs. Diseño sólido desde el primer intento [inferido por ausencia de commits de corrección en el mismo PR].

**Upgrade Langfuse oportuno con 3 security fixes incluidos.** El PR #37 pasa de 3.167.4 a 3.171.0, incorporando 3 parches de seguridad upstream (v3.168.0, v3.170.0) y corrige dos bugs de infraestructura preexistentes: el healthcheck del worker apuntaba a loopback en lugar de `$(hostname -i)` (nunca habría pasado healthy), y los `user:` forzados de postgres/minio conflictuaban con los propietarios reales de los volúmenes. Estos bugs no eran bloqueantes pero acumulaban ruido en cada `docker compose up`.

**Deuda de auditoría post-Sprint 15 liquidada antes de avanzar.** Los PRs #30 y #31 cierran los 7 findings HIGH/MEDIUM y los LOW/NIT respectivamente, dejando el proyecto en deuda residual cero al inicio del bloque de respuesta al incidente. Patrón coherente con `feedback_clean_before_advance.md`.

---

## 2. Regresiones y grietas que no escondemos

**El incidente ocurrió 6 días antes y las mitigaciones llegan ahora.** [inferido] Entre el 22-Apr y el 28-Apr no hay PRs de mitigación técnica (solo el backup systemd activado el 24-Apr según ADR-008). El hook PreToolUse tardó 6 días en existir. Si hubiera existido el 22-Apr, el incidente no habría ocurrido. No hay forma de saber si hubo bloqueo técnico o simplemente priorización distinta, pero el gap existe.

**ADR-008 documenta el incidente pero no audita cómo el agente interpretó "contexto ambiguo" como instrucción de destrucción.** El ADR describe "instrucción de usuario ambigua → agente interpretó contexto como destruir el stack completo sin solicitar confirmación" pero no propone mejoras en el protocolo de confirmación más allá del hook técnico. La raíz cognitiva (¿qué prompt exactamente llevó al agente a ejecutar `-v`?) queda sin documentar. [VERIFICADO: no hay análisis de causa raíz conversacional en ninguno de los 4 archivos del PR #38]

**El SDD scaffolding (commits ~05:23 CET) está en el git log del 28-Apr pero sus PRs no aparecen en `merged:2026-04-28`.** Los commits `c4ba73a` (SDD canonical scaffolding, +1169/-1), `979504a` (ADR-001..007 retroactivo), `c5c756d` (migration docs), `a10e34e` (SDD enforcement tests) forman parte del historial del día pero sus PRs (#32-#35 o similar) se mergearon con otra fecha o fueron squashes directos. Esta retro no puede verificar la trazabilidad PR↔commit de ese bloque. [inferido: el volumen y la naturaleza sugieren una sesión madrugada previa que se extendió]

---

## 3. Factor de contexto

**Sesión de respuesta post-incidente con presión de deadline implícito.** [inferido] El piloto con 37 devs adicionales se menciona en ADR-008 como contexto de urgencia ("para que no se repita en el piloto con 37 devs adicionales"). Esto sugiere presión para cerrar los gaps de seguridad antes de enrolar usuarios reales, lo que explica la densidad de la jornada.

**Dos sesiones independientes en el mismo día.** El bloque madrugada (~05:23-05:24, audit + SDD) y el bloque tarde (~17:33-19:49, post-incidente) son claramente sesiones separadas. La jornada tiene dos centros de gravedad distintos.

**Restore drill ejecutado y verificado el mismo día.** Según ADR-008, el drill de restore de backup fue verificado el 28-Apr. Esto añade valor operativo real a la jornada más allá de los PRs — un artefacto de confianza en el sistema de backups activado 4 días antes.

---

## 4. Aprendizajes accionables

**1. Incident response sin análisis de causa raíz conversacional es incompleto.**
El ADR-008 documenta el "qué" y el "cuánto se perdió" pero no el "cómo el agente llegó a ejecutar `-v`". Para incidentes futuros causados por interpretación errónea del agente: documentar el prompt o contexto aproximado que desencadenó la acción destructiva.
Trigger: al escribir un INC-N en el runbook, si la causa raíz involucra "agente interpretó X como Y", añadir un apartado "Prompt aproximado / contexto conversacional" aunque sea reconstruido.

**2. Mitigaciones técnicas post-incidente deben tener SLA implícito: ≤48h.**
El gap de 6 días entre incidente (22-Apr) y hook PreToolUse (28-Apr) es demasiado amplio si el vector de ataque sigue activo. El hook era conocido como mitigación desde el día del incidente (mencionado en las 4 mitigaciones de ADR-008).
Trigger: al documentar un incidente con una mitigación técnica pendiente, añadir en el runbook un campo "Mitigación pendiente antes de: YYYY-MM-DD" con fecha ≤T+2 días.

**3. El bloque SDD madrugada es trabajo invisible si los PRs no tienen fecha verificable.**
El scaffolding +1169 LOC en un bloque de commits comprimidos en 4 minutos (~05:23-05:24) sugiere squash o rebase de trabajo previo. Esta densidad hace imposible la reconstrucción de retro sin los PRs correspondientes.
Trigger: sprints con >500 LOC en commits de madrugada verificar que los PRs tienen título descriptivo y fecha de merge visible antes de cerrar la sesión.

**4. Validar `user:` en docker-compose contra volúmenes existentes antes de pinear UID.**
El PR #37 revierte `user: "999:999"` / `user: "1000:1000"` porque conflictuaban con los propietarios reales de los volúmenes. Este bug era silencioso (arrancaba pero con warnings o comportamiento inesperado).
Trigger: al añadir `user:` en `docker-compose.yml` para un servicio con volumen montado, verificar `docker run --rm -v <vol>:/ alpine stat /` para confirmar el UID real del propietario.

---

## 5. Evolución vs regresión — balance neto

**Evolución clara:**

- El stack tiene ahora un guard técnico contra su principal modo de fallo catastrófico (hook PreToolUse, PR #39).
- El incidente INC-001 está documentado formalmente con límites matemáticos (ADR-008), no solo como nota operativa.
- Langfuse actualizado a 3.171.0 con 3 security fixes y dos bugs de infraestructura corregidos.
- Deuda de auditoría post-Sprint 15 liquidada.

**Regresión sutil:**

- El análisis de causa raíz conversacional del incidente no quedó documentado. Si el mismo tipo de prompt vuelve a aparecer, no hay referencia para reconocerlo.
- El gap de 6 días entre incidente y mitigación técnica no tiene protocolo establecido para que no se repita.

**Balance neto:** Jornada positiva. Las entregas son directamente proporcionales a la gravedad del incidente que las motivó. La grieta más importante es que la causa raíz cognitiva (no técnica) del incidente quedó sin documentar — y eso es exactamente lo que puede repetirse.

---

## 6. Triage retro-as-action

**🟢 30-min HOY** — nada identificado. La jornada cerró todos sus gaps inmediatos.

**🟡 Handoff primera acción próxima sesión:**

- Añadir campo "Mitigación pendiente antes de:" a la plantilla de INC-N en el runbook, con SLA ≤T+2 días. (~15 min, impacto en gobernanza de incidentes futuros).

**🔴 Backlog:**

- Reconstruir y documentar el contexto conversacional aproximado del INC-001 (qué prompt/contexto llevó al agente a ejecutar `-v`) como lección de prompt safety. Coste: 45-60 min, requiere acceso al JSONL de la sesión `34816887` si aún existe.

**⚫ Deuda aceptada permanente:**

- El gap de 6 días entre INC-001 y el hook es historia — no se puede retroactivamente comprimir. Aceptado como aprendizaje institucionalizado en ADR-008 + I-13 + hook activo.

---

## Anexo — Ground-truth

| # PR | Título                                                                                | Adiciones/Eliminaciones | Archivos | Merged at (CET) |
| ---- | ------------------------------------------------------------------------------------- | ----------------------- | -------- | --------------- |
| #37  | `chore(langfuse)`: upgrade 3.167.4 → 3.171.0 + fix worker healthcheck + uid conflicts | +8/-7                   | 2f       | 19:33           |
| #38  | `docs(adr-008)`: límites de recuperabilidad consistency + incidente 22-Apr-2026       | +239/-9                 | 4f       | 19:36           |
| #39  | `feat(guard)`: PreToolUse hook bloquea operaciones destructivas sobre datos Langfuse  | +220/-1                 | 3f       | 19:46           |
| #40  | `docs(runbook)`: seccion Incidentes + INC-001 (23-Apr-2026)                           | +82/-0                  | 2f       | 19:49           |
| #30  | `audit(post-sprint-15)`: 7 findings HIGH/MEDIUM — deuda residual cero                 | +88/-40                 | 8f       | 03:23           |
| #31  | `audit(cosmetic)`: LOW+NIT — .pop()!, labels I-N, docker worker, README, I-9          | +123/-66                | 16f      | 03:23           |

**Suma bruta**: +760 adiciones / -123 eliminaciones = 883 LOC netos añadidos.

Commits del 28-Apr no asociados a los 6 PRs anteriores (visibles en `git log`):

- `c4ba73a` docs(structure): SDD canonical scaffolding + semver retroactiva v0.5.4 [Fase A]
- `979504a` docs(adr): contenido completo retroactivo ADR-001 a ADR-007 [Fase C]
- `c5c756d` docs(migration): mover contenido arquitectónico a SDD; runbook separado
- `a10e34e` test(sdd): enforcement automático contra drift documental [Fase D]

Estos commits (~1169 LOC) están en el historial del 28-Apr pero sus PRs no aparecen en `gh pr list --search "merged:2026-04-28"`. Traza incompleta — no incluidos en métricas de PR.

> Fuentes verificadas: `git log --after="2026-04-27T23:59:59" --before="2026-04-29T00:00:00"`, `gh pr list --state merged --search "merged:2026-04-28"`, `docs/adr/ADR-008-consistency-bounds.md`.
