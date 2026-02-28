/**
 * server/pdfClient.ts
 *
 * PATCH fix/pdf-service-offline
 *
 * Root-cause do bug:
 *   O try/finally original não tinha catch — quando o uvicorn não está rodando,
 *   fetch() lança ECONNREFUSED que subia como erro raw "fetch failed" sem contexto.
 *   O router.generate também não tinha try/catch, então o tRPC serializava o erro
 *   cru e o cliente recebia apenas "fetch failed".
 *
 * Fix:
 *   1. Erros tipados (PdfServiceOfflineError, PdfServiceTimeoutError, PdfRenderError)
 *   2. try/catch explícito com classificação de erro
 *   3. checkPdfServiceHealth() exposto para o router report.health
 */

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL ?? "http://127.0.0.1:8001";
const PDF_RENDER_TIMEOUT_MS = 30_000;
const HEALTH_TIMEOUT_MS = 4_000;

// ── Erros tipados ─────────────────────────────────────────────────────────────

export class PdfServiceOfflineError extends Error {
  constructor() {
    super(`PDF service offline — não foi possível conectar em ${PDF_SERVICE_URL}`);
    this.name = "PdfServiceOfflineError";
  }
}

export class PdfServiceTimeoutError extends Error {
  constructor() {
    super(`PDF service timeout após ${PDF_RENDER_TIMEOUT_MS}ms`);
    this.name = "PdfServiceTimeoutError";
  }
}

export class PdfRenderError extends Error {
  constructor(public status: number, public detail: string) {
    super(`PDF render falhou (HTTP ${status}): ${detail}`);
    this.name = "PdfRenderError";
  }
}

// ── Helper: detecta "connection refused" cross-platform ──────────────────────

function isConnectionRefused(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const msg = err.message.toLowerCase();
  return (
    msg.includes("econnrefused") ||
    msg.includes("fetch failed") ||
    msg.includes("enotfound") ||
    msg.includes("failed to fetch") ||
    msg.includes("network") ||
    msg.includes("connect")
  );
}

// ── callPdfService ────────────────────────────────────────────────────────────

export async function callPdfService(payload: unknown): Promise<Buffer> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PDF_RENDER_TIMEOUT_MS);

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
    if (isConnectionRefused(err)) throw new PdfServiceOfflineError();
    throw err; // erro inesperado — re-lança para o caller logar
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "sem detalhe");
    throw new PdfRenderError(res.status, detail);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// ── checkPdfServiceHealth ─────────────────────────────────────────────────────

export async function checkPdfServiceHealth(): Promise<
  { ok: true } | { ok: false; reason: string }
> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_TIMEOUT_MS);

  try {
    const res = await fetch(`${PDF_SERVICE_URL}/health`, {
      signal: controller.signal,
    });
    if (res.ok) return { ok: true };
    return { ok: false, reason: `HTTP ${res.status} em ${PDF_SERVICE_URL}` };
  } catch (err) {
    if ((err as Error)?.name === "AbortError") {
      return { ok: false, reason: `timeout após ${HEALTH_TIMEOUT_MS}ms` };
    }
    if (isConnectionRefused(err)) {
      return { ok: false, reason: `serviço offline em ${PDF_SERVICE_URL}` };
    }
    return { ok: false, reason: (err as Error)?.message ?? "erro desconhecido" };
  } finally {
    clearTimeout(timer);
  }
}
