/**
 * src/routes/pdf.ts  (Express layer — thin wrapper over tRPC logic)
 *
 * GET /api/users/:userId/report.pdf
 *
 * Headers returned:
 *   Content-Type: application/pdf
 *   Content-Disposition: attachment; filename="arc-relatorio.pdf"
 *   Cache-Control: no-store
 *   X-Content-Type-Options: nosniff
 */

import { Router, type Request, type Response } from "express";
import { TRPCError } from "@trpc/server";
import { requireAuth } from "../middleware/auth";
import { buildReportPayload } from "../services/reportBuilder";
import { callPdfService } from "../services/pdfClient";
import { db } from "../db";
import { eq } from "drizzle-orm";
import { userProfiles } from "../db/schema";

export const pdfRouter = Router();

pdfRouter.get(
  "/users/:userId/report.pdf",
  requireAuth,
  async (req: Request, res: Response) => {
    const requestedUserId = req.params.userId;
    const sessionUserId = req.session?.userId as string | undefined;

    // ── BOLA: ownership check ─────────────────────────────────────────────
    if (!sessionUserId || sessionUserId !== requestedUserId) {
      return res.status(404).end(); // 404, not 403 — no user enumeration
    }
    // ─────────────────────────────────────────────────────────────────────

    const profile = await db.query.userProfiles.findFirst({
      where: eq(userProfiles.userId, requestedUserId),
    });

    if (!profile) {
      return res.status(404).end();
    }

    try {
      const payload = await buildReportPayload(requestedUserId, profile);
      const pdfBuffer = await callPdfService(payload);

      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="arc-relatorio.pdf"`,
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
        "Content-Length": pdfBuffer.length.toString(),
      });

      return res.send(pdfBuffer);
    } catch (err) {
      console.error("[pdf-route] render failed", err);
      return res.status(502).json({ error: "PDF generation failed" });
    }
  }
);
