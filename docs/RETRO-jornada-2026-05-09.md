# RETRO — Jornada 2026-05-09 (reconstruida post-hoc)

> Reconstrucción post-hoc desde ground-truth (git/gh/docs/memories), NO desde memoria de sesión.
> Fiabilidad: ALTA para hechos objetivos (LOC, PR count, errores GCP literales); MEDIA/BAJA para
> vivencia subjetiva y secuencia exacta de decisiones — [inferido] donde aplique.
> Ground-truth: 9 PRs merged 2026-05-09 · 1164 LOC bruto (additions+deletions).

---

## 0. Resumen de la jornada

Día de arranque real del despliegue PRO GCP. El plan formal estaba mergeado desde el día anterior
(PR #69, 2026-05-08). La jornada empezó con preparación de requisitos (PRs #71-#73) y derivó en
ejecución real de F1 Provisioning, que produjo una cascada de tres fix-de-fix consecutivos en el
mismo archivo (`infra/provision-pro.sh`) al topar con comportamientos de la CLI de GCP no cubiertos
por la documentación oficial.

Al final del día el provisioning de F1 estaba avanzado pero incompleto: el gate organizacional de
billing bloqueó la ejecución plena del script. F2 (migración datos) y F3 (Cloud Run) no arrancaron
hasta el día siguiente (2026-05-10).

**Arco del día**: preparación sólida → ejecución real → 3 bugs infra en cadena → gate externo
(billing) → jornada cerrada con infra provisionada parcialmente pero sin Cloud Run activo aún.

| Métrica                  | Valor                                                      |
| ------------------------ | ---------------------------------------------------------- |
| PRs mergeados            | 9                                                          |
| LOC bruto                | 1164 (+1046 / -118)                                        |
| Ventana temporal         | 09:12 UTC → 22:54 UTC (~13h 42min abiertos)                |
| Fix-de-fix provision.sh  | 3 (PRs #79, #80, #81)                                      |
| Gate externo encontrado  | 1 (billing GCP — bloqueante organizacional)                |
| Smoke baseline ejecutado | VERIFICADO — 8/8 checks antes de F1 PRO (smoke-mcp-e2e.ts) |
| Tests al cierre del día  | 818 pass / 0 fail (pre-F3)                                 |

---

## 1. Lo que ha ido bien

### 1a. Preparación seria antes de ejecutar (PRs #71-#73, #75, #76)

VERIFICADO. Las primeras 11 horas de la jornada NO fueron ejecución directa: fueron preparación
estructurada. Se mergearon 5 PRs de groundwork antes del primer intento de provisioning real:

- **PR #71**: dominio (`atlax360.ai` vs `.com`), flag `--create-project`, folder GCP. Decisiones
  de naming congeladas antes de tocar infra.
- **PR #72**: re-dimensionado de F1 Minimum Viable ($145-180/mes) desde uso real observado en
  docker-compose (`docker stats` a 90 traces, 22h up). El plan original ($480-540/mes) estaba
  sobre-dimensionado x3 para el estado real del piloto. Decisión empírica, no estimada.
- **PR #73**: naming canónico GCP (`atlax360-ai-<purpose>-<env>`) adoptado _antes_ de F1, con
  guard de naming convention en tests (`tests/naming-convention.test.ts`). Renaming en frío es
  trivial; en caliente (recursos provisionados) habría sido costoso. Llamada correcta.
- **PR #75**: CI environment decoupling (3 tests rotos en ubuntu-latest, ci macos-latest) cerrado
  antes de F1. CI verde antes de tocar infra.
- **PR #76**: consolidation guard SDD links + naming convention. Estado de tests verificado como
  pre-condición documentada.

**Smoke baseline ejecutado antes de F1**: VERIFICADO (memoria `feedback_smoke_baseline_pre_pro.md`
confirma que `scripts/smoke-mcp-e2e.ts` pasó 8/8 checks contra Langfuse self-hosted antes de
arrancar F1 PRO). Esto materializó la regla cross-project "smoke test del baseline antes de
PRE/PRO" por primera vez en un despliegue Atlax — y generó la memoria que la instituyó como
invariante global.

### 1b. Tres bugs de infra detectados y corregidos en la misma sesión

VERIFICADO. Los 3 errores de `provision-pro.sh` se detectaron durante F1 real y se corrigieron
_sin salir de la jornada_:

- **PR #79** (CIDR): `10.20.100.0/20` → `10.20.96.0/20` — CIDR alignment en VPC peering. El
  error de GCP era explícito (`field 'resource.address'`); la corrección fue precisa.
- **PR #80** (Cloud SQL edition): GCP cambió su default a `ENTERPRISE_PLUS` en algún momento,
  que rechaza custom tiers. La implicación de presupuesto era severa ($200+/mes vs $50/mes). La
  fix (`--edition=ENTERPRISE` explícito) preservó F1 Minimum Viable.
- **PR #81** (HMAC): sintaxis posicional de `gcloud storage hmac create`. El error de GCP era
  igualmente explícito; la fix fue de 10 LOC.

Cada bug se corrigió con un PR atómico y mensaje forense útil. El trail de debugging es reproducible.

### 1c. Gate organizacional de billing documentado con precisión

VERIFICADO. El blocker de billing (`billing.resourceAssociations.create` faltante para
`jgcalvo@atlax360.com`) quedó documentado con los 5 usuarios autorizados, el comando exacto de
escalado, y el comportamiento idempotente del script (proyecto creado, billing pendiente, $0 en GCP
hasta el link). La memoria `feedback_gcp_billing_org_gate.md` incluye el check pre-flight que
previene repetir el ciclo en otros proyectos Atlax.

### 1d. LiteLLM healthcheck falso negativo capturado antes de F1 PRO (PR #78)

VERIFICADO. El `unhealthy` de LiteLLM era cosmético (servicio funcional, `start_period` insuficiente
para el bootstrap de ~70-90s). Detectado y corregido durante el smoke test del baseline _antes_ de
intentar F1. Si no se hubiera ejecutado el smoke, el falso negativo podría haber generado diagnósticos
incorrectos durante F3.

---

## 2. Regresiones y grietas que no escondemos

### 2a. Fix-de-fix x3 en el mismo archivo — `provision-pro.sh` no se probó contra entorno real antes

VERIFICADO. Los 3 bugs de infra (PRs #79, #80, #81) surgieron al ejecutar `provision-pro.sh`
por primera vez en el entorno GCP real. [inferido] El script se desarrolló en seco (dry-run) y
contra documentación de GCP, pero nunca contra un proyecto GCP real vacío antes del día de F1.

Esto es el patrón clásico de "infrastructure-as-code que solo se verifica en ejecución": el
dry-run valida la estructura del script pero no los comportamientos de la plataforma (CIDR
alignment, default edition, sintaxis posicional de comandos). La cascada de 3 bugs en el mismo
archivo en ~30 minutos (22:28-22:54 UTC) confirma que era un single point of failure.

**Señal forense**: los 3 PRs se abrieron y mergearon en menos de 30 minutos (22:28, 22:34, 22:54).
Esto es fix-de-fix sin pausa entre iteraciones. [inferido] No se aplicó la regla de "2 intentos →
test discriminante" — se remendó secuencialmente hasta que funcionó.

**Coste**: la jornada no pudo completar F1 en la ventana disponible, en parte porque la cascada de
fixes consumió tiempo que habría ido a F2/F3. Estos se completaron al día siguiente.

### 2b. Gate de billing no anticipado en el pre-flight checklist

VERIFICADO. El `provision-pro.sh` ejecutaba `gcloud billing projects link` asumiendo que el
usuario que ejecuta tiene permisos de billing. No había pre-flight check. El gate organizacional
(`billing.resourceAssociations.create` requiere `roles/billing.user` — concedido por Devoteam como
reseller) es completamente predecible en organizaciones con GCP managed por partner.

[inferido] Este check no se añadió al script ni al plan de F1 porque el error no era imaginable
sin haber tocado el billing de este tipo de cuenta antes. No fue negligencia — fue un unknow unknown.
Pero el coste fue real: la sesión se bloqueó en un gate organizacional que requería acción de
tercero (`frsalas@atlax360.com` u otro autorizado).

La memoria lo captura correctamente, incluyendo el comando de pre-flight para futuros proyectos.

### 2c. F1 incompleto al cierre de la jornada del 2026-05-09

VERIFICADO. La memoria `project_pro_deployment_plan.md` marca F1 como "COMPLETADO (2026-05-09)"
pero los commits de F2/F3 son todos del 2026-05-10 (PR #83 merged a las 07:07 UTC del día 10).
[inferido] F1 Provisioning estuvo avanzado pero el gate de billing impidió completar el ciclo
completo (APIs, VPC, SQL, Redis, GCE con NAT) dentro del día 9.

Esto no es un fracaso operativo — el gate era externo y se manejó correctamente. Pero la retro
honesta registra que el objetivo del día (F1 completo + F2 smoke validado) no se alcanzó en la
ventana del día 9.

### 2d. PR #78 LiteLLM healthcheck: fix cosmético que podría haberse anticipado

[inferido] El problema `start_period: 30s` insuficiente para un servicio con bootstrap de 70-90s
es el tipo de bug que aparece al medir el bootstrap real una sola vez. Si `provision-pro.sh` o la
documentación de configuración del docker-compose hubieran incluido el timing de bootstrap medido,
el 30s nunca habría sido el valor inicial. Pequeño pero evitable.

---

## 3. Factor de contexto

[inferido — evidencia indirecta en estructura de PRs y timestamps]

**Jornada de 13+ horas** (09:12 → 22:54 UTC, con probable trabajo previo de preparación). El
primer PR del día (PR #71, 09:12 UTC) sugiere arranque temprano; los últimos 3 fix-de-fix se
mergearon entre las 22:28 y las 22:54 UTC, cerca de medianoche hora local (UTC+2 = 00:28-00:54).

Los 3 fix-de-fix consecutivos en el mismo archivo a última hora de la jornada son una señal de
fatiga operacional: en condiciones óptimas se habría pausado tras el segundo bug para evaluar si
el script necesitaba una reescritura defensiva, no otro parche. [inferido] El hecho de que PR #82
(Cloud NAT + hardening default network) se mergeara al día siguiente (2026-05-10 07:26 UTC) sugiere
que quedó trabajo pendiente identificado pero diferido al cerrar la jornada.

**Gate externo no anticipado**: el billing blocker es un factor de contexto genuino — no fue error
técnico del equipo, fue un límite organizacional de Devoteam como reseller. Esto añadió incertidumbre
a la jornada que no depende de ninguna decisión de ingeniería.

**F1 como terreno desconocido**: esta era la primera vez que se ejecutaba un provisioning GCP en
cuenta con arquitectura Devoteam+billing_admin separados en el ecosistema Atlax 360. Los tres bugs
de la CLI de GCP, el gate de billing, el default network con SSH abierto — son todos unknowns
descubiertos en el primer recorrido real.

---

## 4. Aprendizajes accionables

**A1 — Pre-flight de billing antes de ejecutar provision-pro.sh** (ya aplicado en memoria como
regla cross-project)
_Trigger_: antes de ejecutar cualquier script de provisioning GCP en proyecto Atlax, verificar
`gcloud billing accounts get-iam-policy $BILLING | grep $USER`. Si falla, pedir a autorizado antes
de arrancar — no durante.

**A2 — Smoke test del baseline es bloqueante pre-F1** (ya institucionalizado como regla global
en CLAUDE.md a raíz de esta jornada)
_Trigger_: antes de cualquier despliegue a PRE/PRO, ejecutar `scripts/smoke-mcp-e2e.ts` (o
equivalente del proyecto) y documentar output en el PR. No basta healthcheck del compose.

**A3 — Scripts de provision validar contra entorno real vacío antes de F-day**
_Trigger_: en la próxima provisioning de otro proyecto Atlax (Kairos, Dashboard, Harvest), ejecutar
el script equivalente en un proyecto GCP de sandbox desechable antes del día de F1 real. El coste
de un sandbox GCP vacío es $0 hasta activar billing; la validación real de la CLI vale el tiempo.
Candidato directo: el día pre-F1 debería incluir un "dry-run real en sandbox" como paso obligatorio.

**A4 — Tres fix-de-fix → pausa de evaluación estructural**
_Trigger_: si el mismo archivo recibe un tercer fix en la misma sesión, parar y evaluar si el
problema es puntual (bug de la CLI) o estructural (el script necesita un enfoque diferente). En
este caso los 3 bugs eran genuinamente puntuales e independientes, por lo que la cascada fue
correcta. Pero la regla Regla 17 del centaur-parallelization applies: al tercer bug en cadena,
confirmar explícitamente con el usuario si continuar.

**A5 — Red default GCP: borrar en el mismo script de provisioning**
_Trigger_: todo `provision-pro.sh` o `provision-pre.sh` nuevo de cualquier proyecto Atlax debe
incluir como paso explícito la eliminación de la red `default` y sus firewall rules. Ya aplicado
en este repo (PR #82). Propagar como patrón canónico a los scripts de otros proyectos.

---

## 5. Evolución vs regresión — balance neto

### Evolución clara

- **Primera vez que el smoke test del baseline se ejecuta formalmente antes de un despliegue PRO
  en Atlax 360** — y de esa ejecución nació la regla cross-project que ahora aplica a todos los
  proyectos. Impacto compuesto alto.
- **Naming canónico GCP consolidado** (`atlax360-ai-<purpose>-<env>`) con guard automático en CI.
  No es retrabajo posible sobre esto.
- **F1 Minimum Viable documentado con base empírica** ($145-180/mes vs $480-540 plan original) —
  `docker stats` real, no estimación. El gap de x3 en sizing habría sido deuda costosa si no se
  hubiera corregido antes de provisionar.
- **Gate de billing documentado con precisión quirúrgica** — próximo proyecto Atlax que llegue a
  F1 PRO tiene el runbook exacto, los 5 usuarios autorizados, y el pre-flight check listo.
- **818 tests / 0 fail mantenidos** durante toda la jornada, incluyendo los 3 fix-de-fix.

### Regresión sutil

- **provision-pro.sh no se validó en entorno real antes de F-day**: 3 bugs de CLI descubiertos en
  ejecución real, en cascada, en las últimas horas de la jornada. No hay cobertura de tests para
  comportamientos de la CLI de GCP.
- [inferido] **Fatiga operacional visible en la ventana nocturna** (22:28-00:54 local): los últimos
  3 PRs son todos hotfixes, no features. La decisión de continuar hasta esa hora en vez de diferir
  a la mañana siguiente es comprensible dada la inercia del F1, pero los bugs a esa hora tienden
  a ser los más fáciles de cometer.

### Balance neto

**Positivo con deuda técnica conocida y controlada.** El objetivo del día (F1 completo) no se
alcanzó por un gate organizacional externo, no por un error técnico del equipo. Los 3 fix-de-fix
de provision.sh son deuda de validación en entorno real, no de diseño. El trabajo de preparación
(5 PRs de groundwork, smoke baseline, naming, sizing empírico) fue sólido y pagó dividendos
inmediatos. F2+F3 se completaron sin sorpresas mayores el día siguiente, en parte porque el
groundwork del día 9 estaba bien hecho.

La jornada dejó dos legados duraderos: la regla del smoke test del baseline (ahora global), y la
memoria del gate de billing GCP (ahora pre-flight estándar para todos los proyectos Atlax).

---

## 6. Triage retro-as-action

Esta retro es post-hoc de una jornada de hace semanas. Los items ya se ejecutaron; el triage es
retrospectivo para verificar que ninguno quedó pendiente.

| Item                                              | Estado real                                          | Triage  |
| ------------------------------------------------- | ---------------------------------------------------- | ------- |
| A1 Billing pre-flight en provision.sh             | Memoria escrita + aplicada en ADR                    | CERRADO |
| A2 Smoke baseline bloqueante                      | Regla en CLAUDE.md global (origen esta jornada)      | CERRADO |
| A3 Sandbox pre-F1 para próximos proyectos         | NO aplicado aún en otros proyectos (Kairos, Harvest) | BACKLOG |
| A4 Regla 3 bugs → pausa evaluación                | Ya existe como Regla 17 centaur-parallelization      | CERRADO |
| A5 Red default GCP en todos los provision scripts | Aplicado PR #82 en este repo; propagar a otros       | BACKLOG |
| Cloud NAT + hardening default network             | Completado PR #82 (2026-05-10)                       | CERRADO |
| F1 Provisioning bloqueado por billing             | Resuelto 2026-05-09/10 por frsalas/autorizado        | CERRADO |

**Items BACKLOG** (ninguno bloqueante para PRO activo):

- **A3**: sandbox pre-F1 validation para Kairos/Harvest — añadir a sus playbooks de provisioning
  cuando lleguen a fase PRO.
- **A5**: verificar que `provision-*.sh` de otros proyectos Atlax con GCP borran la red `default`.
  Tarea de audit, ~15 min.

---

## Anexo — Ground-truth

### PRs mergeados 2026-05-09 (cronológico)

| PR  | Hora (UTC) | Tipo      | Título                                                     | +/- LOC  |
| --- | ---------- | --------- | ---------------------------------------------------------- | -------- |
| #71 | 09:12      | prep      | dominio atlax360.ai + --create-project + folder atlax-ai   | +82/-23  |
| #72 | 13:11      | sizing    | minimum viable F1 — $145-180/mes (vs $480-540 target)      | +102/-42 |
| #73 | 20:28      | prep      | naming canónico atlax360-ai-<purpose>-<env> + BG-01..BG-03 | +573/-33 |
| #75 | 20:36      | fix(test) | CI environment decoupling — 3 tests entorno-dependientes   | +37/-7   |
| #76 | 20:49      | audit     | naming convention guard + SDD links Shared Platform v0.3   | +224/-7  |
| #78 | 21:59      | fix       | litellm healthcheck start_period 30s → 120s                | +8/-1    |
| #79 | 22:28      | fix       | VPC peering CIDR 10.20.100.0/20 → 10.20.96.0/20            | +8/-2    |
| #80 | 22:34      | fix       | force --edition=ENTERPRISE en Cloud SQL para F1 budget     | +5/-0    |
| #81 | 22:54      | fix       | gcloud storage hmac create usa SA positional               | +7/-3    |

**Total**: 9 PRs · 1046 additions · 118 deletions · 1164 LOC bruto.

### Memorias relevantes (ground-truth para inferencias)

- `feedback_gcp_billing_org_gate.md` — gate de billing documentado (VERIFICADO)
- `feedback_gcp_default_network_and_nat.md` — red default + NAT (detectados F1, corregidos PR #82 día siguiente)
- `feedback_smoke_baseline_pre_pro.md` — smoke test 8/8 ejecutado antes de F1 (VERIFICADO)
- `project_pro_deployment_plan.md` — F1 marcado COMPLETADO (2026-05-09), pero F3 PR #83 merged 2026-05-10 07:07 UTC
- `docs/audits/shared-platform-validation-2026-05-09.md` — audit Shared Platform v0.3 ejecutado ese día

### PRs del día siguiente directamente vinculados a work del 09

- PR #82 (Cloud NAT + red default — merge 2026-05-10 07:26 UTC): trabajo identificado el día 9, diferido al 10
- PR #83 (F3 Cloud Run fixes — merge 2026-05-10 07:07 UTC): bugs detectados en F3 real
