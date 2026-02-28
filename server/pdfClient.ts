/**
 * server/pdfClient.ts
 *
 * Internal HTTP client that calls the Python pdf_service.
 * Never exposed to end-users directly.
 * PDF_SERVICE_URL defaults to http://127.0.0.1:8001 (local process in Manus env).
 */

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL ?? "http://127.0.0.1:8001";
const PDF_RENDER_TIMEOUT_MS = 30_000;

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
  } finally {
    clearTimeout(timer);
  }

  if (!res.ok) {
    const detail = await res.text().catch(() => "unknown");
    throw new Error(`PDF service error ${res.status}: ${detail}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
