export interface DegradationEntry {
  type: "degradation";
  source: string;
  error: string;
  ts: string;
}

/**
 * Serializa un error desconocido a string de forma defensiva.
 *
 * - `Error` → `err.message` (contrato compatible con consumers que parsean JSON línea-a-línea)
 * - `string` → tal cual (algunos call sites pasan strings directos)
 * - cualquier otro → `String(err)` (objetos `{toString}`, números, null)
 *
 * Helper centralizado para evitar duplicación del check `err instanceof Error`
 * en cada call site. NOTA: usa `err.message`, no stack, porque los logs JSON se
 * parsean línea-a-línea con `jq` en producción y una stack multilínea rompería
 * el parseo. Si en el futuro se necesita stack en logs, crear
 * `serializeErrorWithStack()` separado en lugar de cambiar este.
 */
export function serializeError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return String(err);
}

export function emitDegradation(source: string, err: unknown): void {
  const entry: DegradationEntry = {
    type: "degradation",
    source,
    error: serializeError(err),
    ts: new Date().toISOString(),
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}

export interface InfoEntry {
  type: "info";
  source: string;
  message: string;
  ts: string;
  [key: string]: unknown;
}

/**
 * Emite un log informativo estructurado (JSON línea-a-línea) a stderr.
 *
 * ADR-019: todo logging del bridge es JSON estructurado. El `message` es
 * estático (sin interpolación de variables — van en `context`) para que un
 * agregador agrupe por mensaje y `jq` filtre por campos. Nunca lanza ni escribe
 * a stdout (interferiría con hooks downstream); respeta I-1.
 */
export function logInfo(
  source: string,
  message: string,
  context?: Record<string, unknown>,
): void {
  const entry: InfoEntry = {
    type: "info",
    source,
    message,
    ...context,
    ts: new Date().toISOString(),
  };
  process.stderr.write(JSON.stringify(entry) + "\n");
}
