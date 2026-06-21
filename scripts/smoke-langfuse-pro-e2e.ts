#!/usr/bin/env bun
/**
 * smoke-langfuse-pro-e2e.ts — Smoke post-deploy del stack Langfuse v3 PRO.
 *
 * ADR-020: el deploy del stack server-only PRO es manual; este smoke es el GATE
 * obligatorio post-deploy. Verifica https://langfuse.atlax360.ai con un
 * ROUND-TRIP DE INGESTIÓN REAL (no solo /health):
 *
 *   1. GET  /api/public/health → 200 (liveness del stack web)
 *   2. POST /api/public/ingestion → un trace sintético cc-smoke-<ts>
 *   3. Poll GET del trace hasta que el worker async lo procese y sea visible
 *      (Langfuse v3 ingestion es asíncrono: API→Redis→Worker→ClickHouse, ~12-15s)
 *   4. Round-trip: el trace leído tiene el name esperado (confirma persistencia E2E)
 *
 * Por qué round-trip y no solo /health: un 200 en /health no prueba que el
 * pipeline async (worker→ClickHouse) funcione. La regla Smoke Test del Baseline
 * exige verificar side-effects observables, no solo el ack del primer hop.
 *
 * Skip-graceful: si faltan LANGFUSE_PRO_PK / LANGFUSE_PRO_SK, exit 0 (no rompe
 * CI sin credenciales). Lee de ~/.atlax-ai/reconcile.env si no están set.
 *
 * Usage:
 *   bun run scripts/smoke-langfuse-pro-e2e.ts
 * Exit codes: 0 OK (o skip sin creds), 1 algún check falló.
 */

import { loadEnvFile } from "../shared/env-loader";

interface CheckResult {
  name: string;
  ok: boolean;
  detail: string;
}

const CONFIG = {
  healthTimeoutMs: 15_000,
  ingestTimeoutMs: 15_000,
  pollDeadlineMs: 40_000,
  pollBaseDelayMs: 1_000,
  pollMaxDelayMs: 10_000,
} as const;

export async function run(): Promise<CheckResult[]> {
  loadEnvFile();

  const base = (
    process.env["LANGFUSE_PRO_BASE_URL"] ?? "https://langfuse.atlax360.ai"
  ).replace(/\/$/, "");
  const pk = process.env["LANGFUSE_PRO_PK"];
  const sk = process.env["LANGFUSE_PRO_SK"];

  if (!pk || !sk) {
    process.stderr.write(
      "[smoke-langfuse-pro] LANGFUSE_PRO_PK / LANGFUSE_PRO_SK no configuradas — SKIP\n",
    );
    return [];
  }

  const auth = Buffer.from(`${pk}:${sk}`).toString("base64");
  const results: CheckResult[] = [];
  // ID determinista por ejecución (no Date.now en hot path de ingest, pero el
  // smoke es one-shot manual): timestamp ISO → sufijo único del trace.
  const stamp = new Date().toISOString().replace(/[^0-9]/g, "");
  const traceId = `cc-smoke-${stamp}`;
  const traceName = "bridge-smoke-post-deploy";

  // ── Check 1: health del stack web ──────────────────────────────────────────
  process.stderr.write(
    `[smoke-langfuse-pro] [1/3] GET ${base}/api/public/health\n`,
  );
  try {
    const res = await fetch(`${base}/api/public/health`, {
      signal: AbortSignal.timeout(CONFIG.healthTimeoutMs),
    });
    results.push({
      name: "health",
      ok: res.ok,
      detail: `HTTP ${res.status}`,
    });
  } catch (err) {
    results.push({ name: "health", ok: false, detail: (err as Error).message });
  }

  // ── Check 2: ingest de un trace sintético ──────────────────────────────────
  process.stderr.write(
    `[smoke-langfuse-pro] [2/3] POST ingestion trace=${traceId}\n`,
  );
  let ingestOk = false;
  try {
    const batch = {
      batch: [
        {
          id: traceId,
          type: "trace-create",
          timestamp: new Date().toISOString(),
          body: {
            id: traceId,
            name: traceName,
            tags: ["smoke:post-deploy"],
            metadata: { source: "smoke-langfuse-pro-e2e" },
          },
        },
      ],
    };
    const res = await fetch(`${base}/api/public/ingestion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(batch),
      signal: AbortSignal.timeout(CONFIG.ingestTimeoutMs),
    });
    // Langfuse ingestion devuelve 207 (multi-status) o 200/201 en éxito.
    ingestOk = res.ok || res.status === 207;
    results.push({
      name: "ingest",
      ok: ingestOk,
      detail: `HTTP ${res.status}`,
    });
  } catch (err) {
    results.push({ name: "ingest", ok: false, detail: (err as Error).message });
  }

  // ── Check 3: round-trip — el trace es visible tras el worker async ─────────
  process.stderr.write(
    `[smoke-langfuse-pro] [3/3] poll round-trip (deadline ${CONFIG.pollDeadlineMs / 1000}s)\n`,
  );
  if (!ingestOk) {
    results.push({
      name: "round-trip",
      ok: false,
      detail: "no aplicable (ingest falló)",
    });
  } else {
    let found = false;
    let delayMs: number = CONFIG.pollBaseDelayMs;
    const deadline = Date.now() + CONFIG.pollDeadlineMs;
    while (Date.now() < deadline) {
      try {
        const res = await fetch(
          `${base}/api/public/traces/${encodeURIComponent(traceId)}`,
          {
            headers: { Authorization: `Basic ${auth}` },
            signal: AbortSignal.timeout(10_000),
          },
        );
        if (res.ok) {
          const trace = (await res.json()) as { id?: string; name?: string };
          if (trace.id === traceId && trace.name === traceName) {
            found = true;
            break;
          }
        }
      } catch {
        // sigue polling — el worker async puede tardar 12-15s
      }
      await new Promise((r) => setTimeout(r, delayMs));
      delayMs = Math.min(delayMs * 2, CONFIG.pollMaxDelayMs);
    }
    results.push({
      name: "round-trip",
      ok: found,
      detail: found
        ? `trace ${traceId} visible (ingest→worker→ClickHouse OK)`
        : `trace no visible tras ${CONFIG.pollDeadlineMs / 1000}s`,
    });
  }

  return results;
}

function printResults(results: CheckResult[]): void {
  process.stderr.write("\n=== Smoke Langfuse PRO E2E (post-deploy) ===\n");
  for (const r of results) {
    process.stderr.write(`  ${r.ok ? "✓" : "✗"} ${r.name} — ${r.detail}\n`);
  }
  const passed = results.filter((r) => r.ok).length;
  process.stderr.write(`\n${passed}/${results.length} checks passed\n`);
}

if (import.meta.main) {
  run()
    .then((results) => {
      if (results.length === 0) process.exit(0); // skip-graceful sin creds
      printResults(results);
      process.exit(results.every((r) => r.ok) ? 0 : 1);
    })
    .catch((err: Error) => {
      process.stderr.write(`[smoke-langfuse-pro] error: ${err.message}\n`);
      process.exit(1);
    });
}
