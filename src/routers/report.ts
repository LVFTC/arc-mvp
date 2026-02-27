/**
 * src/routers/report.ts
 *
 * tRPC procedures:
 *   - report.generatePdf  → POST, ownership-gated, calls pdf-service
 *   - report.deleteMyData → DELETE equivalent via mutation
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure } from "../trpc";
import { db } from "../db";
import { users, userProfiles, responsesEvidence, plan90Days } from "../db/schema";
import { buildReportPayload } from "../services/reportBuilder";
import { callPdfService } from "../services/pdfClient";

export const reportRouter = router({
  /**
   * Generate PDF for the authenticated user's own profile.
   * Returns the PDF as a base64 string (caller streams to client).
   *
   * Security:
   *   - protectedProcedure enforces authentication (session/JWT)
   *   - ownership re-checked against DB — BOLA protection
   *   - 404 on ownership mismatch (no user enumeration via 403)
   */
  generatePdf: protectedProcedure
    .input(z.object({ profileId: z.string().uuid() }))
    .mutation(async ({ input, ctx }) => {
      // ── BOLA ownership check ─────────────────────────────────────────────
      const profile = await db.query.userProfiles.findFirst({
        where: eq(userProfiles.id, input.profileId),
      });

      // Return 404 regardless of whether profile exists or belongs to someone else.
      // Never reveal "this profile exists but belongs to another user."
      if (!profile || profile.userId !== ctx.session.userId) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      // ────────────────────────────────────────────────────────────────────

      const payload = await buildReportPayload(profile.userId, profile);
      const pdfBuffer = await callPdfService(payload);

      return {
        pdf: pdfBuffer.toString("base64"),
        filename: `arc-relatorio-${Date.now()}.pdf`,
      };
    }),

  /**
   * Permanently delete all data for the authenticated user (LGPD Art. 18).
   * Cascades: responses_evidence, plan_90_days, user_profiles, then users.
   */
  deleteMyData: protectedProcedure.mutation(async ({ ctx }) => {
    const userId = ctx.session.userId;

    await db.transaction(async (tx) => {
      await tx.delete(responsesEvidence).where(eq(responsesEvidence.userId, userId));
      await tx.delete(plan90Days).where(eq(plan90Days.userId, userId));
      await tx.delete(userProfiles).where(eq(userProfiles.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });

    // Invalidate session after deletion
    ctx.session.destroy?.();

    return { deleted: true };
  }),
});
