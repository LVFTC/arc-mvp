import "dotenv/config";
import express, { type Request, type Response } from "express";
import { createServer } from "http";
import net from "net";
import { spawn, type ChildProcess } from "child_process";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { sdk } from "./sdk";
import {
  callPdfService,
  checkPdfServiceHealth,
} from "../pdfClient";
import {
  getFullAssessment,
  getAssessmentStatus,
  createAuditLog,
} from "../db";
import { buildReportPayload } from "../reportBuilder";

// ── pdf_service auto-start ────────────────────────────────────────────────────

let uvicornProc: ChildProcess | null = null;

function spawnUvicorn(): ChildProcess {
  console.log("[pdf_service] Iniciando uvicorn...");

  // ROOT CAUSE FIX — AssertionError: SRE module mismatch
  // O Node herda PYTHONHOME/PYTHONPATH do venv Python 3.13 do sandbox Manus.
  // /usr/bin/python3 é 3.11, mas tenta carregar módulos do 3.13 → crash.
  // Fix: env limpo sem essas variáveis + path absoluto do python3.
  const cleanEnv: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (v !== undefined) cleanEnv[k] = v;
  }
  delete cleanEnv["PYTHONHOME"];
  delete cleanEnv["PYTHONPATH"];
  delete cleanEnv["VIRTUAL_ENV"];

  const proc = spawn(
    "/usr/bin/python3",
    ["-m", "uvicorn", "pdf_service.main:app", "--host", "127.0.0.1", "--port", "8001"],
    { stdio: ["ignore", "pipe", "pipe"], detached: false, env: cleanEnv }
  );
  proc.stdout?.on("data", (d: Buffer) => process.stdout.write(`[uvicorn] ${d}`));
  proc.stderr?.on("data", (d: Buffer) => process.stderr.write(`[uvicorn] ${d}`));
  proc.on("exit", (code) => {
    console.warn(`[pdf_service] uvicorn saiu (code=${code})`);
    uvicornProc = null;
  });
  proc.on("error", (err) => {
    console.error("[pdf_service] Falha ao iniciar:", err.message);
  });
  return proc;
}

async function ensurePdfService(): Promise<void> {
  if (uvicornProc && !uvicornProc.killed) return;
  const h = await checkPdfServiceHealth();
  if (h.ok) { console.log("[pdf_service] Já disponível ✓"); return; }

  uvicornProc = spawnUvicorn();
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 800));
    const hh = await checkPdfServiceHealth();
    if (hh.ok) { console.log("[pdf_service] Pronto ✓"); return; }
  }
  console.warn("[pdf_service] Não respondeu em 20s — PDF pode falhar.");
}

function registerShutdown() {
  const kill = () => { if (uvicornProc && !uvicornProc.killed) uvicornProc.kill("SIGTERM"); };
  process.on("exit", kill);
  process.on("SIGINT", () => { kill(); process.exit(0); });
  process.on("SIGTERM", () => { kill(); process.exit(0); });
}

// ── Port helpers ──────────────────────────────────────────────────────────────

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const s = net.createServer();
    s.listen(port, () => s.close(() => resolve(true)));
    s.on("error", () => resolve(false));
  });
}

async function findAvailablePort(start = 3000): Promise<number> {
  for (let p = start; p < start + 20; p++) {
    if (await isPortAvailable(p)) return p;
  }
  throw new Error(`No available port from ${start}`);
}

// ── GET /api/pdf/report ───────────────────────────────────────────────────────
// Safari-safe: o cliente abre window.open('/api/pdf/report', '_blank') no onClick (user gesture).
// O servidor autentica via cookie, gera e retorna application/pdf inline.
// Safari abre o viewer embutido — sem blob URLs, sem async user gesture.

async function registerPdfRoute(app: express.Express) {
  app.get("/api/pdf/report", async (req: Request, res: Response) => {
    // 1. Autenticar
    let user: Awaited<ReturnType<typeof sdk.authenticateRequest>>;
    try {
      user = await sdk.authenticateRequest(req);
    } catch {
      return res
        .status(401)
        .set("Content-Type", "text/html; charset=utf-8")
        .send("<h2>Sessão expirada.</h2><p><a href='/'>Voltar</a></p>");
    }

    // 2. Assessment completo?
    const status = await getAssessmentStatus(user.id);
    if (!status.allComplete) {
      return res
        .status(403)
        .set("Content-Type", "text/html; charset=utf-8")
        .send("<h2>Avaliação incompleta.</h2><p>Complete todas as seções antes de baixar o PDF.</p><p><a href='/'>Voltar</a></p>");
    }

    // 3. Warm-up: se pdf_service offline, tentar subir e esperar
    let health = await checkPdfServiceHealth();
    if (!health.ok) {
      ensurePdfService().catch(() => {});
      await new Promise(r => setTimeout(r, 3000));
      health = await checkPdfServiceHealth();
    }
    if (!health.ok) {
      return res
        .status(503)
        .set("Content-Type", "text/html; charset=utf-8")
        .send("<h2>PDF temporariamente indisponível.</h2><p>Tente novamente em instantes.</p><p><a href='/'>Voltar</a></p>");
    }

    // 4. Gerar e responder
    try {
      const assessment = await getFullAssessment(user.id);
      const payload = await buildReportPayload(user.id, assessment);
      const pdfBuffer = await callPdfService(payload);

      await createAuditLog(user.id, "pdf_generated", { size: pdfBuffer.length });

      res.set({
        "Content-Type": "application/pdf",
        // inline → Safari abre viewer embutido (melhor UX que attachment no iPhone)
        "Content-Disposition": `inline; filename="arc-relatorio.pdf"`,
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": String(pdfBuffer.length),
      });
      return res.send(pdfBuffer);
    } catch (err) {
      console.error("[GET /api/pdf/report] generation error:", err);
      return res
        .status(503)
        .set("Content-Type", "text/html; charset=utf-8")
        .send("<h2>PDF temporariamente indisponível.</h2><p>Tente novamente em instantes.</p><p><a href='/'>Voltar</a></p>");
    }
  });
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function startServer() {
  ensurePdfService().catch(err => console.error("[pdf_service] startup error:", err));
  registerShutdown();

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);
  await registerPdfRoute(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferred = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferred);
  if (port !== preferred) console.log(`Port ${preferred} ocupada, usando ${port}`);

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
