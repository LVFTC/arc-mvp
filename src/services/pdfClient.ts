/**
 * src/services/pdfClient.ts
 *
 * Internal HTTP client that calls the Python pdf-service.
 * Never exposed to end-users directly.
 */

import type { ReportPayload } from "./reportBuilder";

const PDF_SERVICE_URL = process.env.PDF_SERVICE_URL ?? "http://pdf-service:8001";
const PDF_RENDER_TIMEOUT_MS = 30_000;

export async function callPdfService(payload: ReportPayload): Promise<Buffer> {
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
