import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { spawn, type ChildProcess } from "child_process";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { checkPdfServiceHealth } from "../pdfClient";

// ── Uvicorn auto-start ────────────────────────────────────────────────────────

let uvicornProcess: ChildProcess | null = null;

function spawnUvicorn(): ChildProcess {
  console.log("[pdf-service] Iniciando uvicorn em 127.0.0.1:8001...");

  const proc = spawn(
    "python3",
    ["-m", "uvicorn", "pdf_service.main:app", "--host", "127.0.0.1", "--port", "8001"],
    {
      stdio: ["ignore", "pipe", "pipe"],
      // Garante que o processo filho seja encerrado quando o Node morrer
      detached: false,
    }
  );

  proc.stdout?.on("data", (data: Buffer) => {
    process.stdout.write(`[uvicorn] ${data}`);
  });
  proc.stderr?.on("data", (data: Buffer) => {
    process.stderr.write(`[uvicorn] ${data}`);
  });
  proc.on("exit", (code, signal) => {
    console.warn(`[pdf-service] uvicorn encerrou (code=${code}, signal=${signal})`);
    uvicornProcess = null;
  });
  proc.on("error", (err) => {
    console.error("[pdf-service] Falha ao iniciar uvicorn:", err.message);
    console.error(
      "[pdf-service] Verifique se pdf_service está instalado: pip install -r pdf_service/requirements.txt"
    );
  });

  return proc;
}

async function ensurePdfService(): Promise<void> {
  // Se já existe um processo rodando, não faz nada
  if (uvicornProcess && !uvicornProcess.killed) return;

  // Verifica se já há algo rodando na porta (deploy externo, Docker, etc.)
  const health = await checkPdfServiceHealth();
  if (health.ok) {
    console.log("[pdf-service] Já disponível em 127.0.0.1:8001 ✓");
    return;
  }

  // Nada rodando — inicia o uvicorn
  uvicornProcess = spawnUvicorn();

  // Aguarda até 15s para o serviço responder
  const deadline = Date.now() + 15_000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 800));
    const h = await checkPdfServiceHealth();
    if (h.ok) {
      console.log("[pdf-service] Uvicorn pronto ✓");
      return;
    }
  }

  // Timeout — logar aviso mas não crashar o Node
  console.warn(
    "[pdf-service] Uvicorn não respondeu em 15s. PDF pode falhar — verifique logs acima."
  );
}

// Encerrar uvicorn graciosamente quando o Node for encerrado
function registerShutdownHooks() {
  const shutdown = () => {
    if (uvicornProcess && !uvicornProcess.killed) {
      console.log("[pdf-service] Encerrando uvicorn...");
      uvicornProcess.kill("SIGTERM");
    }
  };
  process.on("exit", shutdown);
  process.on("SIGINT", () => { shutdown(); process.exit(0); });
  process.on("SIGTERM", () => { shutdown(); process.exit(0); });
}

// ── Port helpers (mantidos do original) ──────────────────────────────────────

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function startServer() {
  // Inicia pdf_service em paralelo (não bloqueia o Node)
  ensurePdfService().catch(err =>
    console.error("[pdf-service] ensurePdfService error:", err)
  );
  registerShutdownHooks();

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
