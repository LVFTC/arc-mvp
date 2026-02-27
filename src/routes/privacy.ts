/**
 * src/routes/privacy.ts
 *
 * DELETE /api/me/data — LGPD Art. 18 right to erasure
 */

import { Router, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middleware/auth";
import { db } from "../db";
import { users, userProfiles, responsesEvidence, plan90Days } from "../db/schema";

export const privacyRouter = Router();

privacyRouter.delete("/me/data", requireAuth, async (req: Request, res: Response) => {
  const userId = req.session?.userId as string | undefined;

  if (!userId) {
    return res.status(401).end();
  }

  try {
    await db.transaction(async (tx) => {
      // Order matters: delete children before parent (FK constraints)
      await tx.delete(responsesEvidence).where(eq(responsesEvidence.userId, userId));
      await tx.delete(plan90Days).where(eq(plan90Days.userId, userId));
      await tx.delete(userProfiles).where(eq(userProfiles.userId, userId));
      await tx.delete(users).where(eq(users.id, userId));
    });

    // Destroy session after deletion
    req.session?.destroy?.(() => {});

    return res.status(200).json({ deleted: true });
  } catch (err) {
    console.error("[delete-data] failed", err);
    return res.status(500).json({ error: "Deletion failed" });
  }
});
