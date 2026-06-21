# ADR-019 · Todo logging del bridge en JSON estructurado a stderr

- **Status**: Accepted
- **Date**: 2026-06-21
- **Implements**: I-1 (hook siempre exit 0), D9 (observabilidad)
- **Scope**: langfuse-bridge

## Context

El gate global de Atlax (`cross-project-patterns.md` § "Structured Logging") exige logging
estructurado en servidor de producción: JSON con campos estables, mensaje estático + campos de
contexto, nunca `console.*` ni interpolación de variables en el mensaje (rompe el agrupado por
mensaje y oculta los campos a queries `jq`).

El bridge ya tiene un estándar **de facto**: `shared/degradation.ts` emite
`emitDegradation(source, err)` → JSON estructurado a stderr (`{ source, error, ... }`), y el
reconciler (`scripts/reconcile-traces.ts`) emite JSON-lines parseables por `journalctl | jq`.

El intake brownfield (2026-06-21) detectó una **inconsistencia**: el hook
(`hooks/langfuse-sync.ts`) mezcla ambos estilos —

```typescript
// JSON estructurado (correcto):
emitDegradation("source:invalid-id", new Error(...));
// pero también texto plano (inconsistente):
process.stderr.write("[langfuse-sync] <texto>\n");
```

Las líneas de texto plano no son parseables: al hacer `journalctl | jq` sobre los logs del hook,
las informativas se pierden o rompen el parseo JSON-lines.

## Observado (lo que el piloto hace)

- Tres superficies con logging: hook (mixto plano+JSON), reconciler (JSON-lines), `degradation.ts`
  (JSON, SSoT). No hay un contrato único escrito; el estándar JSON existe pero no está enunciado.
- El hook NUNCA puede romper Claude Code (I-1): todo error → stderr + `exit 0`. El logging debe
  respetar esto (no lanzar, no escribir a stdout que interfiere con otros hooks downstream).

## Decidido (lo que para producción hacemos y por qué)

**Todo logging del bridge se emite como JSON estructurado a stderr**, con estas reglas:

1. **Mensaje estático + campos**: `{ level, source, message, ...context }`. Nunca interpolar
   variables en `message` (`\`fallo: ${x}\`` prohibido) — las variables van en campos.
2. **Errores → `emitDegradation` / `serializeError`** (`shared/degradation.ts`, SSoT). Nunca
   `String(err)` directo ni stack multilínea (rompe JSON-lines en `jq`).
3. **Informativo → un `logInfo(message, context)`** análogo, también JSON a stderr. Reemplaza todo
   `process.stderr.write("[modulo] texto plano")`.
4. **Nunca `console.*`** (stdout interfiere con hooks downstream — ya en CLAUDE.md anti-patterns).
5. **Respeta I-1**: el logging jamás lanza ni bloquea; el hook siempre `exit 0`.

## Consequences

- **Positivo**: `journalctl -u atlax-langfuse-reconcile | jq` y los logs del hook quedan 100 %
  parseables; un agregador de logs agrupa por `message` estático y filtra por campos.
- **Positivo**: enuncia explícitamente un estándar que era implícito → deja de depender de que cada
  contribuidor "recuerde" usar `emitDegradation`.
- **Negativo / coste**: PBI de refactor en el hook (size S, blast LOW) — reemplazar los
  `process.stderr.write` planos por `logInfo`/`emitDegradation`. Sin cambio de comportamiento, solo
  formato de log.
- **PBI derivado**: añadir `logInfo()` a `shared/degradation.ts` (o módulo de logging) + migrar los
  call sites de texto plano en `hooks/langfuse-sync.ts` — `agent-task`, blast LOW.

## Alternatives considered

- **Dejarlo como convención implícita**: rechazado. La inconsistencia ya existe en prod; sin un
  contrato escrito, reaparece en cada módulo nuevo. El coste de enunciarlo es un ADR de 1 página.
- **Adoptar pino u otra lib de logging**: rechazado. Viola ADR-001 (cero deps de producción). El
  JSON estructurado a mano (`JSON.stringify` a stderr) es suficiente para el dominio edge-tooling.
