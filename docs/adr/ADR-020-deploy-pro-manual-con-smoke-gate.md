# ADR-020 · Deploy del stack server-only PRO se mantiene manual con smoke post-deploy como gate

- **Status**: Accepted
- **Date**: 2026-06-21
- **Implements**: D6 (CI/CD & deploy) — ATL-379
- **Scope**: langfuse-bridge

## Context

La regla cross-project `deploy-automation-cross-project.md` exige, para proyectos con deploy
productivo, un workflow auto-deploy (`workflow_run` tras CI verde en main, o integración nativa del
PaaS) + smoke post-deploy funcional. El gap D6 del intake (ATL-379) pregunta: ¿automatizamos el
deploy del stack Langfuse v3 PRO, o lo mantenemos manual?

El stack server-only (categoría `server-only` del patrón Shared Platform) es:
`langfuse-web` + `langfuse-worker` + `litellm` en **Cloud Run**, sobre **Cloud SQL** (Postgres con
PITR), **ClickHouse en GCE** (VM con disco persistente, ADR-012), **Memorystore Redis** y **GCS**.
El deploy hoy es manual: `infra/provision-pro.sh` (idempotente, `--dry-run`) + `gcloud run services
replace infra/cloud-run.yaml`.

La parte `edge-tooling` (hook, reconciler, scripts) **no se despliega** — vive en la laptop del dev
(I-13/ADR-002). Por tanto este ADR solo aplica al componente server-only.

## Decisión

**El deploy del stack server-only PRO se mantiene MANUAL deliberadamente**, con un **smoke
post-deploy funcional como gate obligatorio** (no un workflow `workflow_run` de auto-deploy).

Razones (la propia regla `deploy-automation-cross-project.md` contempla la excepción "hosting
manual no automatizable → documentar el proceso"):

1. **Infra con estado, no stateless**: a diferencia de un frontend Vercel (stateless, redeploy
   barato e idempotente), este stack tiene Cloud SQL con PITR y una VM GCE de ClickHouse con disco.
   Un auto-deploy ciego tras cada merge a main puede arrastrar cambios de `cloud-run.yaml` que
   tocan recursos con estado sin la supervisión que esos cambios requieren.
2. **Un merge a main NO debe redesplegar el stack**: la mayoría de merges (docs, tests, cambios en
   el edge-tooling) NO tocan el stack PRO. Un `workflow_run` tras CI verde redesplegaría el stack de
   observabilidad en cada merge — riesgo desproporcionado al beneficio (el stack cambia raras veces:
   solo en upgrades de versión Langfuse, p.ej. PR #106 3.172.1→3.173.0).
3. **El deploy requiere `gcloud` con SA privilegiada**: automatizarlo exige `GCP_SA_KEY` en GitHub
   con permisos de Cloud Run + Cloud SQL + GCE — superficie de ataque que un stack de tooling
   interno no justifica frente al control manual supervisado.
4. **Cadencia baja**: el stack se toca pocas veces al mes; el `provision-pro.sh` idempotente +
   `gcloud run services replace` es suficiente y trazable.

### Controles mitigantes (lo que SÍ exige este ADR)

- **Smoke post-deploy funcional obligatorio**: `scripts/smoke-langfuse-pro-e2e.ts` (nuevo, ver
  ATL-379) verifica `https://langfuse.atlax360.ai` con un **round-trip de ingestión real**
  (no solo `/health`): POST de un trace → espera al worker async → GET confirma visibilidad.
  Complementa el `smoke-litellm-pro-e2e.ts` existente (gateway). Se ejecuta **tras cada deploy
  manual** y su output se pega en el PR/issue del deploy (regla Smoke Test del Baseline).
- **Runbook**: `docs/operations/runbook.md` documenta el procedimiento de deploy manual + el smoke
  como paso final obligatorio.
- **Reminder de verificación**: el audit bisemanal Atlax (`atlax-biweekly-audit.md` §4.5) ya
  incluye verificar que el endpoint PRO responde con datos frescos — cubre el "deploy gap" silencioso.

### Cuándo se revisa esta decisión (path de upgrade)

Automatizar con `workflow_run` + `gcloud` en CI si:

- La cadencia de cambios al stack pasa a ser semanal o mayor (el manual se vuelve cuello de botella).
- Se separa el `cloud-run.yaml` de los recursos con estado (deploy de servicios stateless aislado
  del provisioning de Cloud SQL/GCE) → el auto-deploy del servicio stateless deja de ser arriesgado.
- Se adopta una herramienta IaC con plan/apply revisable (Terraform) que haga el auto-deploy auditable.

## Consequences

- **Positivo**: cero riesgo de redeploy accidental del stack de observabilidad en prod tras merges
  no relacionados; sin SA privilegiada en GitHub; decisión trazada (deja de ser "nadie automatizó esto").
- **Positivo**: el smoke post-deploy funcional pasa a ser un artefacto ejecutable y obligatorio,
  cerrando el gap real (verificar datos frescos, no solo /health) — que era el riesgo de fondo de D6.
- **Negativo / riesgo residual**: el deploy manual depende de que el operador ejecute el smoke. El
  audit bisemanal + el reminder lo cubren, pero un deploy sin smoke seguiría siendo posible. Mitigado
  porque el runbook lo marca como paso obligatorio y el audit detecta el gap a posteriori.

## Alternatives considered

- **`deploy.yml` con `workflow_run` tras CI verde**: rechazado por las razones 1-3 — auto-redesplegar
  un stack con estado tras cada merge es más arriesgado que el control manual para este perfil de
  cadencia baja + infra stateful.
- **Integración nativa del PaaS**: n/a — Cloud Run/GCE no tienen una "GitHub integration" nativa
  equivalente a Vercel que haga el deploy seguro sin SA en CI.
