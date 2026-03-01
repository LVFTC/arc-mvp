/**
 * server/pdfClient.ts
 *
 * FASE A fix: retry/backoff no health, erros sem URL interna, timeout por tentativa.
 */

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL ?? "http://127.0.0.1:8001";

const RENDER_TIMEOUT_MS = 30_000;
const HEALTH_TIMEOUT_MS = 3_000;
const HEALTH_RETRIES = 3;
const HEALTH_BACKOFF_MS = [0, 800, 1600]; // delay antes de cada tentativa

// ── Erros tipados ─────────────────────────────────────────────────────────────

export class PdfServiceOfflineError extends Error {
  constructor() {
    super("Serviço de PDF temporariamente indisponível. Tente novamente em instantes.");
    this.name = "PdfServiceOfflineError";
  }
}

export class PdfServiceTimeoutError extends Error {
  constructor() {
    super("A geração do PDF demorou mais do que o esperado. Tente novamente.");
    this.name = "PdfServiceTimeoutError";
  }
}

export class PdfRenderError extends Error {
  constructor(public status: number, public detail: string) {
    super("Ocorreu um erro ao montar o PDF. Tente novamente.");
    this.name = "PdfRenderError";
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isConnectionError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("econnrefused") ||
    msg.includes("fetch failed") ||
    msg.includes("enotfound") ||
    msg.includes("failed to fetch") ||
    msg.includes("networkerror") ||
    msg.includes("connect")
  );
}

async function delay(ms: number) {
  return new Promise(r => setTimeout(r, ms));
}

// ── checkPdfServiceHealth: 3 tentativas com backoff ──────────────────────────

export async function checkPdfServiceHealth(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  let lastReason = "serviço indisponível";

  for (let attempt = 0; attempt < HEALTH_RETRIES; attempt++) {
    if (HEALTH_BACKOFF_MS[attempt] > 0) {
      await delay(HEALTH_BACKOFF_MS[attempt]);
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

    try {
      const res = await fetch(`${PDF_SERVICE_URL}/health`, {
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (res.ok) return { ok: true };
      lastReason = "PDF indisponível no momento";
    } catch (err) {
      clearTimeout(timer);
      if ((err as Error)?.name === "AbortError") {
        lastReason = "PDF indisponível no momento";
      } else if (isConnectionError(err)) {
        lastReason = "PDF indisponível no momento";
      } else {
        lastReason = "PDF indisponível no momento";
      }
      // Continua para próxima tentativa
    }
  }

  return { ok: false, reason: lastReason };
}

// ── callPdfService ────────────────────────────────────────────────────────────

export async function callPdfService(payload: unknown): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RENDER_TIMEOUT_MS);

  let res: Response;
  try {
    res = await fetch(`${PDF_SERVICE_URL}/render`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error)?.name === "AbortError") throw new PdfServiceTimeoutError();
    if (isConnectionError(err)) throw new PdfServiceOfflineError();
    throw err;
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new PdfRenderError(res.status, detail);
  }

  return Buffer.from(await res.arrayBuffer());
}
