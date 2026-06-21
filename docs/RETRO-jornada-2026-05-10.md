# RETRO — Jornada 2026-05-10 (reconstruida post-hoc)

> ⚠️ Reconstrucción post-hoc desde ground-truth (git/gh/docs/memorias operativas), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos de PRs y tiempos (gh API); MEDIA para secuencia de decisiones intra-PR;
> BAJA/[inferido] para vivencia subjetiva y carga cognitiva.
> Ground-truth: **15 PRs merged 2026-05-10** (PR #82–#96), ventana 05:26–20:49 UTC (~15h23m).

---

## 0. Resumen de la jornada

**Día de cierre PRO + arranque del gateway LiteLLM.** La jornada completó las Fases F3–F5 del roadmap PRO de Langfuse v3 y añadió de forma emergente el despliegue de LiteLLM en Cloud Run (M1 piloto).

| Eje                                           | PRs                | LOC bruto (+add/-del)             |
| --------------------------------------------- | ------------------ | --------------------------------- |
| Infra Cloud Run / GCP (fixes + provisioning)  | #82, #83, #84      | +270/-23                          |
| Onboarding PRO (script + docs)                | #85, #95           | +485/-63                          |
| Backups PRO (hardening + drill)               | #86                | +848/-53                          |
| Reconciler / pricing (fixes de calidad)       | #87, #88           | +208/-0                           |
| ADRs + arquitectura (formalización)           | #89, #90           | +429/-49                          |
| LiteLLM Cloud Run PRO (feature + tests + ops) | #91, #92, #93, #96 | +866/-60                          |
| Shared Platform docs                          | #94                | +6/-6                             |
| **TOTAL**                                     | **15**             | **+3112 / -254 = 3366 LOC bruto** |

**Ejes narrativos**: (1) completar el cutover PRO Langfuse que había arrancado el día 9; (2) desplegar LiteLLM M1 como componente no planificado originalmente para hoy; (3) cerrar deuda de calidad (tests, ADRs, docs) antes del piloto con 13 devs al día siguiente.

---

## 1. Lo que ha ido bien

**Ritmo sostenido en un día de maratón.** 15 PRs en 15h23m (~1 PR/hora) sin commits directos a main. Toda la jornada mantuvo la disciplina de rama + PR + merge, incluso en fases de alta presión.

**El smoke test del baseline funcionó como red de seguridad.** PR #83 es la evidencia más clara: Redis TLS port incorrecto (6379→6378), usuario ClickHouse (`default`→`langfuse`) y TLS bypass fueron detectados y corregidos antes del primer PR de tests de consolidación (#84). El patrón "arreglar → smoke → commit → siguiente" fue consistente.

**Backups verificados el mismo día del cutover (PR #86).** El drill de 3 checks (Cloud SQL PITR clone, snapshot ClickHouse, BACKUP TO S3) se ejecutó contra PRO real y documentó resultados concretos (179 archivos, 1.8MB, ~6min para clone). Esto es raro y valioso: la infraestructura de recuperación se verificó el día 0, no semanas después.

**Decisiones de infra GCP formalizadas en ADRs antes de que se enfríe el contexto (PR #89).** ADR-013 (Serverless NEG + allUsers), ADR-014 (Cloud SQL private-only + IAP), ADR-015 (backups PRO) se crearon el mismo día en que se descubrieron los patrones. El triaje explícito de qué iba a ADR vs qué se quedaba en runbook/memoria es señal de buena disciplina.

**LiteLLM funcional con alertas, budget GCP y virtual keys en la misma jornada.** Del deploy inicial (#91) al upgrade (#96) con el fix de `user_api_key_user_id` correctamente atribuido, todo acabó resuelto antes del piloto del día 11. El PR #93 añadió alertas Google Chat, runbook ops y budget 230 EUR/mes — cobertura operativa completa.

---

## 2. Regresiones y grietas que no escondemos

**LiteLLM tardó 3 deploys fallidos consecutivos antes de funcionar. [VERIFICADO]**

La secuencia forense desde `feedback_cloud_run_litellm_quirks.md`:

1. Deploy con imagen `ghcr.io` → rechazado por Cloud Run (solo acepta AR/GCR/Docker Hub).
2. Deploy con imagen en AR + `subPath` en secret volume → fallo con `Secret volumes cannot have sub_path set`.
3. Deploy con volumen correcto + 1Gi RAM → OOM silencioso en startup (síntoma: "Creating Revision..." con cientos de puntos, sin log informativo).

Solo el cuarto intento (2Gi RAM + dir-mount + config en `args`) funcionó. Esto es un enroque de infra de ~45 min estimados de iteración ciega. Señal de que el conocimiento de las limitaciones de Cloud Run para imágenes de tercero no estaba disponible antes de empezar.

**La corrección de `ingress: all → internal-and-cloud-load-balancing` llegó 7h tarde.** PR #83 (07:07 UTC) corrigió Redis/ClickHouse pero NO corrigió el ingress. PR #84 (12:51 UTC) lo corrigió junto con los tests de consolidación. El `cloud-run.yaml` estuvo 7h en producción con `ingress: all`, exponiendo el endpoint `.run.app` directamente. [VERIFICADO por body de PR #84: "Corrección dominio + ingress fix"].

**Cloud NAT fue postponed originalmente y tuvo que meterse de forma urgente (PR #82, primer PR del día, 05:26 UTC).** La memoria `feedback_gcp_default_network_and_nat.md` describe que se descubrió durante el F1 PRO real del día 9 que Docker Hub estaba bloqueado desde la VM ClickHouse. El fix llegó en el primer PR del día 10, lo que indica que el trabajo del día anterior quedó incompleto en este punto y que el día 10 arrancó resolviendo deuda de infra del 9.

**La red `default` de GCP no se eliminó en la fase de provisioning inicial.** PR #82 la borra en el mismo PR que activa Cloud NAT. [VERIFICADO: "GCP la crea automáticamente con SSH/RDP abierto a 0.0.0.0/0 — hallazgo en F1 PRO real 2026-05-09"]. Esto significa que entre el momento en que se creó el proyecto GCP y PR #82 (05:26 del día 10), el proyecto tenía la red default activa con SSH a `0.0.0.0/0`.

**El upgrade LiteLLM v1.83.7 → v1.83.10 (PR #96, último de la jornada, 20:49 UTC) sugiere que el deploy inicial se hizo con una versión con bug conocido.** PV1-A1 era un bug de `user_api_key_user_id` que impedía atribución correcta de costes por dev en Langfuse. [inferido: posiblemente se conocía el bug en el backlog pero se optó por desplegar v1.83.7 para no bloquear M1 y corregir después — pattern arriesgado si el piloto empieza con datos de atribución incorrectos].

---

## 3. Factor de contexto

[inferido] La jornada fue de cierre forzado: el piloto con 13 devs debía arrancar el día 11. Esto explica:

- El scope expandido: LiteLLM M1 probablemente no estaba planeado para el día 10 (no hay PR de planificación previo a #91), pero se ejecutó igual para tener el gateway listo.
- La densidad de 15 PRs en ~15h: el ritmo no es sostenible semanas seguidas pero era necesario para llegar al día del piloto con todo funcional.
- Los fixes de infra en los primeros PRs del día (82, 83): el equipo arrancó la jornada resolviendo deuda del día anterior antes de poder avanzar.

[VERIFICADO] La primera actividad del día (PR #82, 05:26 UTC) era un fix de infra (Cloud NAT), no feature work. La última (PR #96, 20:49 UTC) era un upgrade de versión. La curva fue: fix infra → feature core → tests → docs → feature nueva → tests → ops → docs → fix hotfix.

---

## 4. Aprendizajes accionables

1. **Cloud Run con imagen de tercero: checklist de 3 puntos antes del primer deploy.**
   - Verificar que la imagen está en AR/GCR/Docker Hub (no ghcr.io/quay.io).
   - Montar secrets como directorio (no subPath).
   - RAM ≥ 2Gi para imágenes Python con ML deps.
     Trigger: antes de escribir cualquier Cloud Run manifest con `image:` de tercero, ejecutar el checklist. [VERIFICADO: documentado en `feedback_cloud_run_litellm_quirks.md`]

2. **Serverless NEG requiere `allUsers + ingress: internal-and-cloud-load-balancing` siempre juntos.**
   El NEG no pasa IAM tokens: intentar restringir con IAM invoker produce 403. La seguridad la da el ingress, no el IAM check.
   Trigger: al añadir un servicio Cloud Run detrás de un LB con NEG, aplicar el par en el mismo commit. [VERIFICADO: ADR-013]

3. **Cloud NAT y borrado de red default van en el `provision-pro.sh` desde el día 0, no como paso separado.**
   La provisión que no incluya estos dos pasos produce una ventana de riesgo de seguridad (red default SSH abierto) y un bloqueo funcional (VM sin acceso a Docker Hub).
   Trigger: cualquier nuevo proyecto GCP Atlax ejecuta `provision-pro.sh` como primer acto antes de crear ningún recurso de aplicación. [VERIFICADO: PR #82 + `feedback_gcp_default_network_and_nat.md`]

4. **Los fixes de infra Cloud Run que van a producción se consolidan en un PR de tests antes de que pasen 4h.**
   PR #83 corrigió Redis/ClickHouse pero no ingress — el test de consolidación (PR #84) tardó ~6h en llegar y fue el que formalizó el estado correcto.
   Trigger: tras cualquier fix hot de `cloud-run.yaml`, abrir inmediatamente el test de consolidación que valide los valores exactos del manifest. [inferido de la secuencia temporal]

5. **No desplegar a PRO una versión con bug de atribución conocido aunque sea temporal.**
   Desplegar v1.83.7 con el bug PV1-A1 significa que el primer día del piloto M1 genera datos incorrectos de atribución de coste. Aunque el upgrade llega el mismo día, hay una ventana.
   Trigger: si existe un bug conocido en la versión candidata que afecta a observabilidad/billing, esperar a la versión corregida o documentar explícitamente en el handoff que los datos de ese período son inválidos. [inferido]

---

## 5. Evolución vs regresión — balance neto

**Evolución clara:**

- PRO funcional el día prometido con backups verificados, gateway LiteLLM activo, alertas, budget GCP y onboarding self-service para 13 devs. Compromiso cumplido.
- 3 ADRs generados el mismo día de los hallazgos (ADR-013, 014, 015) — conocimiento de infra GCP preservado en el repo, no solo en memoria del agente.
- Suite de tests: 818 → 924 en el día, 0 fail. El aumento neto de +106 tests refleja trabajo real.

**Regresión sutil:**

- Patrón de "cloud-run.yaml en producción con valor incorrecto durante horas" se repitió dos veces (ingress en PR #84, y el upgrade de imagen en PR #96 sugiere que #91 se deployó con versión con bug). La causa es que el manifest de producción y los tests de consolidación viajaron en PRs separados con horas de diferencia, creando ventanas de inconsistencia.
- La jornada arrancó con deuda del día anterior (NAT, red default). Señal de que el cierre del día 9 no hizo smoke completo de infra antes de declarar "F1 completo".

**Balance neto:** Positivo con reservas. El objetivo se cumplió — PRO en producción, piloto listo. El coste fue alto: ~45 min de enroque en LiteLLM Cloud Run, una ventana de seguridad con la red default abierta y un deploy inicial con bug de atribución. En un día de maratón bajo presión de deadline, estos son costes razonables — pero deben documentarse para que el próximo despliegue GCP los evite, no los repita.

---

## 6. Triage retro-as-action

Los items identificados en esta retro son todos de tipo "aprendizaje incorporado" — ya están reflejados en memorias operativas (`feedback_cloud_run_litellm_quirks.md`, `feedback_serverless_neg_allusers_ingress.md`, `feedback_gcp_default_network_and_nat.md`) y ADRs (#89). No hay items 🟢 accionables HOY porque la retro es post-hoc de una jornada pasada.

**Items de seguimiento:**

| Item                                                                                                | Estado                                                                        | Categoría                                                    |
| --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Verificar que `ingress: all` nunca reaparece en `cloud-run.yaml` (test de regresión)                | Test guard ya en `cloud-run-boundary.test.ts` (PR #84) — ⚫ cerrado           | ⚫ Deuda aceptada resuelta                                   |
| Limpiar datos de atribución LiteLLM del período v1.83.7 (si piloto arrancó antes del upgrade)       | Requiere verificar si hubo actividad M1 entre PR #91 (18:13) y PR #96 (20:49) | 🔴 Backlog — verificar en próxima sesión operativa           |
| Checklist Cloud Run para nuevo servicio de tercero → integrar en `provision-pro.sh` o doc canonical | Ya en `feedback_cloud_run_litellm_quirks.md` + ADR-013 — comunicar al equipo  | 🟡 Handoff: primera acción de onboarding al segundo operador |
| Validar que red `default` está borrada en `atlax360-ai-langfuse-pro`                                | Aplicado en PR #82 — marcar como cerrado si ya verificado                     | ⚫ Deuda aceptada (aplicado)                                 |

---

## Anexo — Ground-truth

| PR  | Título                                                                                     | +add/-del                 | Files   | Merged UTC         |
| --- | ------------------------------------------------------------------------------------------ | ------------------------- | ------- | ------------------ |
| #82 | feat(provision): Cloud NAT + hardening red default eliminada                               | +45/-14                   | 1f      | 05:26              |
| #83 | fix(cloud-run): Redis TLS port + cert bypass + ClickHouse user (F3 PRO)                    | +14/-4                    | 1f      | 07:07              |
| #84 | test(consolidation): F3/F4/F5 learnings — 864 tests, ingress fix                           | +211/-5                   | 3f      | 12:51              |
| #85 | feat(onboarding): cutover PRO — script --pro + doc self-service 13 devs                    | +294/-11                  | 4f      | 13:02              |
| #86 | feat(backups): hardening PRO — retention 7d + BACKUP TO S3 + drill ejecutado               | +848/-53                  | 6f      | 13:33              |
| #87 | fix(reconciler): false-alarm cost-divergence-detected when bridge covers <1 dev of org     | +202/-0                   | 3f      | 13:49              |
| #88 | test(pricing): cobertura claude-sonnet-4-5 y claude-opus-4-7 — Sprint 17 close             | +6/-0                     | 2f      | 14:46              |
| #89 | docs(adr): formalizar aprendizajes F4/F5 PRO en ADR-013/014/015                            | +383/-14                  | 4f      | 17:07              |
| #90 | docs(architecture): SDD actualizado — PRO activo desde 2026-05-10                          | +46/-35                   | 1f      | 17:12              |
| #91 | feat(infra): LiteLLM gateway en Cloud Run PRO para piloto M1                               | +105/-0                   | 1f      | 18:13              |
| #92 | test(litellm-pro): consolidation sprint — cobertura 3 capas (924 tests)                    | +545/-14                  | 5f      | 18:42              |
| #93 | feat(pilot): pilot-readiness-day0 — alertas Google Chat + runbook ops PRO + Vertex backlog | +206/-31                  | 4f      | 20:14              |
| #94 | [shared-platform] docs: actualizar referencias al repo dedicado ai-suite-platform          | +6/-6                     | 2f      | 20:29              |
| #95 | feat(onboarding): pilot-onboarding.sh --litellm integra gateway PRO                        | +191/-52                  | 4f      | 20:39              |
| #96 | fix(litellm): upgrade v1.83.7 → v1.83.10-stable — user_api_key_user_id fix (PV1-A1)        | +10/-15                   | 4f      | 20:49              |
|     | **TOTAL**                                                                                  | **+3112/-254 = 3366 LOC** | **49f** | **15h23m ventana** |

> Fuente: `gh pr list --state merged --search "merged:2026-05-10"` + `gh pr view` por PR. Verificado 2026-06-21.
