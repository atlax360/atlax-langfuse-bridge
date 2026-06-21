# ADR-018 · Coste estimado en `number` (float), no en cents enteros

- **Status**: Accepted
- **Date**: 2026-06-21
- **Implements**: I-6 (modelo de pricing central)
- **Scope**: langfuse-bridge

## Context

El gate global de Atlax (`CLAUDE.md` Data Integrity · `cross-project-patterns.md`
§ "Financial Arithmetic") prohíbe acumular **importes monetarios en `number` float**:
IEEE-754 produce drift (`0.1 + 0.2 = 0.30000000000000004`) que se hace observable al
cuadrar contra un extracto bancario en conciliación financiera con N cargos.

El intake brownfield (2026-06-21) detectó que `shared/aggregate.ts` calcula y acumula coste
en float:

```typescript
// shared/aggregate.ts:92-99
const cost =
  (inputTokens * p.input +
    cacheCreation * p.cacheWrite +
    cacheRead * p.cacheRead +
    outputTokens * p.output) /
  1_000_000;
totalCost += cost; // float
existing.cost += cost; // float
```

La pregunta del intake: **¿es esto un gap a remediar (migrar a microdólares enteros) o un
trade-off aceptable que solo faltaba documentar?**

## Observado (lo que el piloto hace)

- El coste es **estimado**, derivado de `tokens × precio-por-MTok / 1e6` con `MODEL_PRICING`
  (`shared/model-pricing.ts`, I-6). No es un importe transaccional ni cuadra contra ningún
  extracto bancario.
- El consumidor final es **Langfuse**, que almacena `calculatedTotalCost` como número de coma
  flotante (no NUMERIC). Convertir a cents enteros internamente y volver a float al serializar
  no aumentaría la precisión observable aguas abajo.
- El reconciler ya compara con **tolerancia**, no con igualdad: `COST_EPSILON = 0.01` USD
  (`shared/constants.ts`), usado por `classifyDrift` (`shared/drift.ts`, I-11). El drift de coste
  solo se marca si `|local − remoto| > COST_EPSILON` — el ruido IEEE-754 (≈1e-15) queda muy por
  debajo del umbral.
- Volumen actual: ~90 sesiones/semana de 1 dev (`pilot-report-v1.md`). Incluso a escala de 13-200
  devs, el coste se agrega **por sesión** (decenas de turns), no en un único acumulador de millones
  de filas.

## Decidido (lo que para producción hacemos y por qué)

**Mantener el coste estimado en `number` (float)** en `aggregate.ts` y el resto del bridge, con
estas condiciones explícitas:

1. **El float es aceptable porque el coste es estimado y tolerante**: el dominio del bridge es
   observabilidad FinOps, no contabilidad transaccional. La fuente de verdad de "cuánto se pagó de
   verdad" es la Anthropic Admin API (`cost_report`), reconciliada post-hoc, no el acumulador local.
2. **`COST_EPSILON` es el contrato de tolerancia**: cualquier comparación de coste va por
   `|a − b| > COST_EPSILON`, nunca `===` (ya implementado en `drift.ts`). Esto absorbe el drift
   IEEE-754 por construcción.
3. **Defensa mínima al serializar**: para display/reporte, redondear a `Math.round(c * 100) / 100`
   antes de formatear (centavos de USD). No introduce cents enteros internos, solo evita exponer
   ruido de coma flotante en outputs humanos.

### Cuándo se revisa esta decisión (path de upgrade)

Migrar a **microdólares enteros** (`Math.round(cost * 1e6)` acumulado como entero, dividir solo al
serializar) si se cumple **cualquiera** de:

- El bridge pasa a agregar coste en un **único acumulador sobre >10⁵ filas/día** (p.ej. un job que
  suma todo el tráfico org en un solo total) — ahí el drift acumulado puede acercarse a `COST_EPSILON`.
- El coste deja de ser estimado y pasa a alimentar **facturación interna real** (chargeback por equipo
  con importe vinculante).
- Langfuse expone columnas de coste `NUMERIC` y el round-trip exige precisión exacta.

## Consequences

- **Positivo**: cero churn de código sobre un sistema en producción (v1.0.1, 1054 tests verdes); la
  decisión queda trazada y deja de ser un "alguien usó float y nadie sabe si es seguro".
- **Positivo**: alinea el gate global con el dominio real — el gate prohíbe float para _dinero
  transaccional acumulado_; aquí es _coste estimado tolerante_, un caso distinto explícitamente acotado.
- **Negativo / riesgo residual**: si el path de upgrade se cruza sin que nadie revise este ADR, el
  drift podría superar `COST_EPSILON` en un acumulador masivo. Mitigado por los triggers de revisión
  arriba y por el scope review mensual (regla global de Scope Tagging).
- **PBI derivado**: añadir el redondeo defensivo `Math.round(c*100)/100` en los puntos de
  display/reporte (no en el acumulador) — `agent-task`, blast LOW.

## Alternatives considered

- **Migrar a microdólares enteros ahora**: rechazado. Coste de cambio sobre código en prod sin
  beneficio observable al volumen actual (el consumidor Langfuse es float, `COST_EPSILON` ya absorbe
  el ruido). Sería over-engineering — viola "no over-engineer, solo cambios directamente requeridos".
- **Postgres `NUMERIC`**: n/a — el bridge no tiene BD propia; escribe a Langfuse vía API.
