# Handoff — Intake brownfield completado → ejecución `/goal` · atlax-langfuse-bridge

> **Fecha**: 2026-06-21 · **De**: `/atlax-intake --brownfield` · **A**: `/goal` (modo auto) + `atlax-project-state`.
> **Entidad**: Atlax 360 · Linear `Atlax360` (team ATL) · proyecto **Langfuse Bridge**
> (`b31dbf56-dfcb-49a1-bce9-f811b257eef2`, https://linear.app/atlax360/project/langfuse-bridge-357b8f2d3c0e).

---

## 0 · Qué se hizo (intake completo)

El intake brownfield-retrofit dejó langfuse-bridge **gobernable + ejecutable por /goal**:

| Artefacto                                              | Estado                                                                                   |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------- |
| `docs/intake/INTAKE-ANALYSIS.md`                       | Mapa de arquitectura (Fase 1) + **scorecard readiness 81 %** (Fase 2) + gaps priorizados |
| `docs/adr/ADR-018-coste-estimado-en-float.md`          | Coste en float aceptado (gap D2) — observado vs decidido                                 |
| `docs/adr/ADR-019-logging-estructurado-json-bridge.md` | Logging JSON estándar del bridge (gap D4)                                                |
| `docs/intake/PRODUCTIZATION-PLAN.md`                   | Arquitectura objetivo + migración por componente (mantener+gobernar) + backlog post-R26  |
| Proyecto Linear "Langfuse Bridge"                      | **23 issues**: 10 épicas (Done) + 3 PBIs técnicos (Todo) + 10 operativos (Backlog)       |

**Scorecard**: técnico fuerte (D1/D3/D5/D6/D9 ✅, v1.0.1 en prod, 1054 tests), gobernanza era el gap
(D7 🟡 → este intake lo cierra). Gaps técnicos menores: D2 (float → ADR-018 + ATL-377), D4 (logging →
ADR-019 + ATL-378), D6 (deploy automation → ATL-379).

**R26 aplicado** (verificado contra git/docs): roadmap S17-S24 **31/33 DONE** (historia, no backlog);
post-v1 **3/11 DONE** (PV1-A1 #96, PV1-C1 #99-101, PV1-D1 #102). Cero trabajo fantasma creado.

## 1 · Mapa de issues Linear (Atlax360, team ATL)

**Épicas (Done, con evidencia ground-truth)**:
ATL-367 E1 Hook · ATL-368 E2 Reconciler · ATL-369 E3 Stack v3 · ATL-370 E4 LiteLLM ·
ATL-371 E5 MCP · ATL-372 E6 Extension · ATL-373 E7 Tier/pricing · ATL-374 E8 Backfill ·
ATL-375 E9 Backup PRO · ATL-376 E0 Shared lib.

**PBIs técnicos (Todo, `agent-task` — el /goal IMPLEMENTA estos 3, decisión G1 de Joserra)**:

| PBI         | Padre | Qué                                                                                              | DoD                                                              |
| ----------- | ----- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| **ATL-377** | E0    | Redondeo defensivo de coste al serializar (`Math.round(c*100)/100`) — ADR-018                    | test ≤2 decimales en display + `bun run check` verde             |
| **ATL-378** | E1    | Unificar logging del hook a JSON (`logInfo` + reemplazar `process.stderr.write` plano) — ADR-019 | 0 `stderr.write` plano en `hooks/` + test JSON válido + verde    |
| **ATL-379** | E3    | Deploy automation `workflow_run` + smoke post-deploy (gap D6)                                    | workflow verde O ADR de deploy manual + smoke ejecutable + verde |

**PBIs operativos (Backlog, `centaur-blocked`/`human-review` — NO ejecutar en tirada autónoma)**:
ATL-380 distribuir hook 13 devs · ATL-381 onboarding piloto · ATL-382 multi-IDE · ATL-383 multi-vendor ·
ATL-384 cost-source:api-real · ATL-385 multi-perfil · ATL-386 scope review (agent-task) ·
ATL-387 dashboard drill-down · ATL-388 cross-validación CI · ATL-389 Cloud Scheduler (agent-task).

## 2 · Verificación previa obligatoria (R26) antes de tocar código

```bash
cd ~/work/atlax-langfuse-bridge
git log -1 main                         # SHA base actual
bun run check 2>&1 | tail -5            # baseline verde (esperado: 1054 pass / 0 fail)
ls docs/adr/ADR-*.md | tail -1          # próximo ADR libre = ADR-020 (018/019 ya creados)
grep -n "process.stderr.write" hooks/langfuse-sync.ts | wc -l   # nº de call sites a migrar (ATL-378)
grep -n "1_000_000\|+=" shared/aggregate.ts                     # puntos de coste (ATL-377)
```

Si el baseline no es verde → NO planificar bloques; corregir primero (regla Smoke Test del Baseline).

## 3 · Reglas de la tirada (centauro)

- **Branch protection**: rama `ATL-N-<desc>` por PBI (auto-link Linear), PR siempre, nunca commit directo a main.
- **Commit incremental** desde el 1er archivo (Regla 7/11). Verde nivel-1 §7.6 antes de reportar.
- **R25**: si un subagente reporta "ya fallaba en main", verificar contra main puro antes de mergear.
- **Smoke baseline** antes de tocar el deploy (ATL-379 toca CI/CD de prod).
- Los PBIs son blast LOW (377/378) y LOW size M (379) → secuencial o N≤2 paralelos (sobra para 3 PBIs).

## 4 · Criterio de cierre del intake (numerable, predicados VERIFICADOS §3.5)

1. ADRs nuevos: `ls docs/adr/ADR-018-*.md docs/adr/ADR-019-*.md 2>/dev/null | wc -l` → **2** (verificado ✅).
2. Scorecard: `ls docs/intake/INTAKE-ANALYSIS.md` → existe (el scorecard está EN ese fichero, no en `*scorecard*`).
3. Proyecto Linear poblado: `list_issues project="Langfuse Bridge"` → **23 issues** (verificado ✅).
4. Handoff: este fichero `docs/intake/HANDOFF-intake.md` ✅.
5. PRs de los 3 PBIs técnicos (decisión G1): los 3 mergeados con verde.
   `gh pr list --state merged --json title --jq '[.[]|select(.title|test("ATL-(377|378|379)"))]|length'` → 3.

> **Umbral de PRs (§3.6, post-R26)**: 3 PBIs con trabajo GENUINO verificado (no inflado). El `/goal`
> cierra en: 2 ADRs (ya hechos) + scorecard (ya hecho) + 23 issues poblados (ya hecho) + **3 PRs de
> ATL-377/378/379 mergeados**. El intake docs+Linear YA está cerrado; lo pendiente es la implementación
> de los 3 PBIs.

## 5 · Condición `/goal` lista para pegar (sesión Atlax360, modo auto)

```
/goal Los 3 PBIs técnicos del intake langfuse-bridge están implementados y mergeados: `gh pr list --state merged --json title --jq '[.[]|select(.title|test("ATL-(377|378|379)"))]|length'` da 3, `grep -rc "process.stderr.write(\"\\[" hooks/langfuse-sync.ts` da 0 (ATL-378), existe test que verifica redondeo de coste ≤2 decimales (ATL-377), y `bun run check` sale verde (1054+ pass / 0 fail) — o para tras 35 turnos
```

> Branch naming `ATL-377-...`, `ATL-378-...`, `ATL-379-...` para auto-link. Verifica con `git log -1 main`
> el SHA base antes de arrancar (R26). El predicado usa jq local con `test(...)` (GitHub FTS no hace
> prefix-match de ATL-N).

## 6 · Después del /goal (pulso)

- `retro-review` para arrancar el corpus de retros (cierra D7 al 100 %).
- `atlax-project-state` para el deck de evolución + métricas (back del embudo).
- PBIs operativos (ATL-380..389) se desbloquean cuando llegue su dependencia humana/coordinación.

## 7 · Estado git al cerrar el intake

- Rama: `ATL-intake-brownfield-langfuse-bridge` (4 commits: Fase 1-2, Fase 3-4, G1 ADR-019, handoff).
- Artefactos: `docs/intake/{INTAKE-ANALYSIS,PRODUCTIZATION-PLAN,HANDOFF-intake}.md` + `docs/adr/ADR-018,019`.
- PR del intake: abrir contra main al cerrar esta sesión.
