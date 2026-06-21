# Análisis de Evolución · atlax-langfuse-bridge

> Reconstruido post-hoc desde ground-truth (git/gh/Linear/handoffs + corpus de 16 retros),
> 2026-06-21. Cierra D7 (gobernanza) del intake brownfield. Disciplina: **corpus > gatherer**
> ante cifras en conflicto; sin variable económica.

---

## 0 · Ground-truth cuantitativo

| Métrica                          | Valor                                                                                 | Fuente                                                  |
| -------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| PRs mergeados                    | **108**                                                                               | `gh pr list --state merged`                             |
| Días activos                     | **16**                                                                                | `docs/metrics/langfuse-bridge-daily-metrics.csv`        |
| LOC bruto (add+del de PRs)       | **38.064**                                                                            | idem                                                    |
| Ventana                          | 2026-04-22 → 2026-06-21 (61 días naturales, 16 activos)                               | merge-date                                              |
| ADRs                             | 20 (ADR-001..020)                                                                     | `docs/adr/`                                             |
| Invariantes                      | 15 (I-1..I-15)                                                                        | `CLAUDE.md`                                             |
| Tests (suite real)               | **1062 pass / 0 fail**                                                                | `bun run check` (ground-truth, NO grep ×2.5)            |
| Retros (corpus)                  | 16 diarias                                                                            | `docs/RETRO-jornada-*.md`                               |
| Eventos cualitativos codificados | 67 (22 milestone, 17 debt, 14 rule-born, 7 fix-of-fix, 4 enroque, 2 incident, 1 gate) | `docs/metrics/langfuse-bridge-qualitative-timeline.csv` |

### Cadencia: ráfagas densas, no sostenida

| Día            | PRs    | LOC bruto | Eje dominante                                                 |
| -------------- | ------ | --------- | ------------------------------------------------------------- |
| 2026-04-22     | 4      | 2.562     | Fundación (reconciler + pricing SSoT + 68 tests + LiteLLM M1) |
| 2026-04-26     | 9      | 3.917     | Bootstrapping CI + 354 tests / 89% coverage                   |
| 2026-04-27     | 11     | 2.917     | Browser extension + hardening (pico de abril)                 |
| **2026-05-07** | **20** | **8.862** | **Roadmap S17-S24 completo en 1 día** (pico absoluto)         |
| 2026-05-10     | 15     | 3.366     | Cierre deploy PRO + LiteLLM Cloud Run                         |
| 2026-05-11     | 12     | 5.049     | Audit v1-final + upgrade Langfuse 3.173.0                     |
| 2026-06-21     | 5      | 1.127     | Intake brownfield + 3 PBIs técnicos                           |

El perfil es de **sprints de 1 día comprimidos** (tiradas AI-asistidas intensas), con valles de
inactividad entre ellos (29-abr→6-may: 7 días; 11-may→19-may: 8 días). No es desarrollo sostenido
día a día — es ráfaga + consolidación.

---

## 1 · Los tres actos del proyecto

### Acto I — Fundación y deuda de sprints (22-29 abr · ~37 PRs)

De brownfield sin CI a base con 354 tests / 89% coverage en una semana. Hitos: reconciler + hook +
pricing SSoT (I-6), LiteLLM M1-M3, browser extension, SDD scaffolding + ADR-001..007 retroactivos.
**Bootstrapping invertido** (grieta recurrente): CI y tsconfig llegaron _después_ del código
funcional (PRs #11/#13 del 26-abr) — el repo vivió en "funciona en mi máquina" un tiempo.

**INC-001** (22-abr): un `docker compose down -v` destruyó ~3 semanas de trazas históricas
(1-9 abr, irrecuperables). Respuesta el 28-abr: hook PreToolUse que bloquea patrones destructivos +
ADR-008 (consistency bounds) + restore drill. La causa raíz **conversacional** (qué prompt llevó a
"destruir el stack sin confirmar") nunca se documentó — grieta de proceso abierta.

### Acto II — Roadmap a producción (6-11 may · ~64 PRs)

El grueso. Un roadmap planificado a 8 semanas (S17→S24, 12-may→6-jul) se **ejecutó íntegro el
7-may en ~8 horas** (20 PRs). Despliegue PRO completo en GCP (Cloud Run + Cloud SQL + ClickHouse GCE

- Memorystore + GCS), LiteLLM gateway en Cloud Run, audit 360º (47 hallazgos), upgrade Langfuse,
  y el audit v1-final (I-15 + ADR-017). Estado final: **v1.0.1 en `https://langfuse.atlax360.ai`**.

### Acto III — Mantenimiento + gobernanza (19-may → 21-jun · ~7 PRs)

Audit bisemanal (CI `bun audit`), alineación de deps, y el **intake brownfield (21-jun)** que cerró
el gap de gobernanza: ADRs 018/019/020, scorecard 81%, proyecto Linear "Langfuse Bridge" (23 issues),
3 PBIs técnicos implementados, y este corpus de retros.

---

## 2 · La ley incidente → regla → inmunidad

El patrón más sano del proyecto: cada incidente engendró una regla que lo hizo irrepetible. 14
reglas/ADRs nacieron de fricción real (no de teoría):

| Incidente / fricción                                                     | Regla / inmunidad generada                                                           |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `docker down -v` borró trazas (INC-001)                                  | Hook PreToolUse anti-destructivo + ADR-008 + I-1 (hook nunca bloquea)                |
| Bug silencioso `cost_report` sin `group_by` ($14.788/sem no verificados) | Smoke baseline funcional obligatorio (regla cross-project)                           |
| `provision-pro.sh` nunca probado contra GCP vacío → fix-de-fix ×3        | Smoke E2E 8/8 antes de PRO → regla "smoke baseline antes de PRE/PRO" (cross-project) |
| Gate billing GCP (Devoteam reseller) bloqueó F1                          | Pre-flight check de `billing.resourceAssociations.create` documentado                |
| TLS verification a Memorystore privada                                   | ADR-017 (flag con ADR formal obligatorio)                                            |
| IDs de input externo sin validar                                         | I-15 + `SAFE_SID_RE`                                                                 |
| Coste en float                                                           | ADR-018 (float aceptado con `COST_EPSILON` + redondeo display)                       |
| Logging plano del hook                                                   | ADR-019 (todo logging JSON estructurado)                                             |
| Deploy PRO manual sin gate                                               | ADR-020 (manual deliberado + smoke post-deploy obligatorio)                          |

**22 milestones / 14 reglas / 7 fix-of-fix** = el ratio cuenta una historia: proyecto que avanza
rápido (milestones), aprende de su fricción (reglas), pero con un coste de retrabajo real (fix-of-fix).

---

## 3 · Los dos techos visibles

### Techo 1 — Velocidad sin ventana de revisión

El día pico (7-may) mergeó 20 PRs con create→merge de **5-13 segundos** (cero review humano). Funcionó
porque las ramas estaban pre-preparadas y los tests verdes, pero produjo el patrón recurrente:

- **fix-de-fix** (7 ocurrencias): `optional_host_permissions` quitada y re-añadida el mismo día
  (27-abr, 1h46min); tautología C1 introducida y corregida (PR #101→#105); errores TS en tests
  parcheados en el PR siguiente (#97→#99).
- **Violaciones de DoR**: S17-F (blast MEDIUM en `shared/drift.ts`) pasó de "descubierto" a
  "mergeado" en <3h sin la ventana de revisión que el propio roadmap exigía.

La causa: la velocidad AI-asistida comprime el tiempo de ejecución pero **no el de razonamiento de
dependencias**. Un fix-de-fix es casi siempre una dependencia no vista antes del batch.

### Techo 2 — Documentación y operación que llegan tarde

- **ADRs post-hoc**: ADR-010 (milestones LiteLLM) datado 14 días _después_ de ejecutar M2/M3.
  ADR-001..007 retroactivos. La decisión se toma en código; el ADR la alcanza luego.
- **Checkboxes de test plan decorativos**: PRs mergeados con validación manual sin marcar (#11, #12,
  #41 con 4/5 sin marcar — el script de onboarding sin probar en el macOS target del piloto).
- **"Ship code, defer operation"**: features a main sin estar operativos E2E (systemd timer +
  statusline el 22-abr; `ingress: all` en prod ~6h el 10-may).
- **Gap CI audit**: `bun audit` faltó ~10 días post-PRO, detectado por audit externo, no interno.

---

## 4 · Evolución del modo centauro

- **Abril**: tiradas individuales, fix-de-fix por dependencias no vistas. El humano como revisor
  post-merge (cuando lo había).
- **Mayo**: roadmap comprimido, paralelización implícita (ramas pre-preparadas). Aparece la
  disciplina de smoke baseline tras el susto del `cost_report`.
- **Junio (intake)**: el modo maduro — `/atlax-intake` con gates G0/G1/G2 explícitos, R26 sobre cada
  finding (evitó re-arreglar 31/33 ítems de roadmap ya hechos), `/goal` con predicados verificados
  empíricamente, subagentes en olas con guard de hardware. Pero **el mismo techo persiste**: el
  conflicto de merge ATL-377/378 del 21-jun era predecible con un blast-radius check (I-14) que no
  se hizo — la latencia entre "conocer la regla" y "aplicarla a tiempo" sigue siendo el techo
  cognitivo.

---

## 5 · Conclusiones y deuda de mayor ROI

**Evolución clara**: de brownfield sin CI (22-abr) a v1.0.1 en prod + gobernanza Linear plena
(21-jun) en 16 días activos. La ley incidente→regla→inmunidad funcionó: 14 reglas vivas, ningún
incidente se repitió.

**Regresión sutil persistente**: el techo de "velocidad sin ventana de revisión" (fix-de-fix) y el
de "operación/docs tardías" siguen activos en junio — el conflicto de merge de hoy lo prueba. No es
un fallo de capacidad, es de **secuenciación**: el blast-radius check existe como regla (I-14) pero
no se dispara a tiempo bajo la inercia de la velocidad.

**Deuda de mayor ROI** (lo que más valor compuesto daría):

1. **Blast-radius check pre-batch como hábito, no como regla pasiva**: antes de lanzar N PBIs que
   tocan ficheros solapados, listar los ficheros y detectar el solape (habría evitado el conflicto
   ATL-377/378). Coste: 2 min. ROI: evita rebases.
2. **Documentar la causa raíz conversacional de INC-001**: sigue abierta desde abril. Si el patrón
   de prompt reaparece, no hay referencia para reconocerlo.
3. **Cerrar el backlog operativo desbloqueable** (ATL-380/381): distribuir el hook a los 13 devs es
   el mayor multiplicador de valor del producto (de 1 dev a 13 con visibilidad FinOps) y está
   bloqueado solo por coordinación, no por técnica.

---

## Anexo · Fuentes

- Cuantitativo: `docs/metrics/langfuse-bridge-daily-metrics.csv` (16 filas, determinista desde `gh`).
- Cualitativo: `docs/metrics/langfuse-bridge-qualitative-timeline.csv` (67 eventos codificados).
- Narrativa: `docs/RETRO-jornada-*.md` (16 retros reconstruidas post-hoc).
- Gobernanza: `docs/adr/` (20 ADRs), `docs/intake/` (scorecard + plan), Linear "Langfuse Bridge" (23 issues).
