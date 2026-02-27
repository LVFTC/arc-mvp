import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  saveLikertResponses,
  getLikertResponses,
  saveEvidenceResponses,
  getEvidenceResponses,
  saveIkigaiItems,
  getIkigaiItems,
  saveUserChoices,
  getUserChoices,
  createAuditLog,
  getFullAssessment,
  getAssessmentStatus,
  updateUserLgpdConsent,
  savePlan90d,
  getPlan90d,
} from "./db";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ─── LGPD Consent ─────────────────────────────────────────
  lgpd: router({
    consent: protectedProcedure
      .input(z.object({ version: z.string() }))
      .mutation(async ({ ctx, input }) => {
        await updateUserLgpdConsent(ctx.user.id, input.version);
        await createAuditLog(ctx.user.id, "lgpd_consent", { version: input.version });
        return { success: true };
      }),
  }),

  // ─── CORE: Likert Responses ───────────────────────────────
  likert: router({
    save: protectedProcedure
      .input(z.object({
        section: z.enum(["core", "bigfive"]),
        items: z.array(z.object({
          dimension: z.string(),
          itemId: z.string(),
          value: z.number().min(1).max(5),
          reverseFlag: z.boolean(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveLikertResponses(ctx.user.id, input.items, input.section);
        await createAuditLog(ctx.user.id, "likert_saved", { section: input.section, count: input.items.length });
        return { success: true };
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      return getLikertResponses(ctx.user.id);
    }),
  }),

  // ─── CORE: Evidence Responses ─────────────────────────────
  evidence: router({
    save: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          dimension: z.string(),
          promptId: z.string(),
          text: z.string(),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveEvidenceResponses(ctx.user.id, input.items);
        await createAuditLog(ctx.user.id, "evidence_saved", { count: input.items.length });
        return { success: true };
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      return getEvidenceResponses(ctx.user.id);
    }),
  }),

  // ─── IKIGAI Items ─────────────────────────────────────────
  ikigai: router({
    save: protectedProcedure
      .input(z.object({
        items: z.array(z.object({
          circle: z.enum(["love", "good_at", "world_needs", "paid_for"]),
          text: z.string(),
          rank: z.number().min(1).max(5),
        })),
      }))
      .mutation(async ({ ctx, input }) => {
        await saveIkigaiItems(ctx.user.id, input.items);
        await createAuditLog(ctx.user.id, "ikigai_saved", { count: input.items.length });
        return { success: true };
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      return getIkigaiItems(ctx.user.id);
    }),
  }),

  // ─── User Choices (zone + focus) ──────────────────────────
  choices: router({
    save: protectedProcedure
      .input(z.object({
        chosenZone: z.enum(["passion", "profession", "mission", "vocation"]).nullable().optional(),
        chosenFocus: z.string().nullable().optional(),
        assessmentStatus: z.enum(["in_progress", "completed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const data: Record<string, unknown> = {};
        if (input.chosenZone !== undefined) data.chosenZone = input.chosenZone;
        if (input.chosenFocus !== undefined) data.chosenFocus = input.chosenFocus;
        if (input.assessmentStatus !== undefined) data.assessmentStatus = input.assessmentStatus;
        if (input.assessmentStatus === "completed") data.completedAt = new Date();

        await saveUserChoices(ctx.user.id, data);
        await createAuditLog(ctx.user.id, "choices_saved", input);
        return { success: true };
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      return getUserChoices(ctx.user.id);
    }),
  }),

  // ─── Plano 90 Dias ────────────────────────────────────────────────────
  plan90d: router({
    save: protectedProcedure
      .input(z.object({
        cycleObjective: z.string().max(300).nullable().optional(),
        checkpoint1Date: z.string().max(16).nullable().optional(),
        checkpoint2Date: z.string().max(16).nullable().optional(),
        checkpoint3Date: z.string().max(16).nullable().optional(),
        selected70: z.array(z.string()).optional(),
        selected20: z.array(z.string()).optional(),
        selected10: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await savePlan90d(ctx.user.id, input);
        await createAuditLog(ctx.user.id, "plan90d_saved", { selected70: input.selected70?.length, selected20: input.selected20?.length, selected10: input.selected10?.length });
        return { success: true };
      }),

    get: protectedProcedure.query(async ({ ctx }) => {
      return getPlan90d(ctx.user.id);
    }),
  }),

  // ─── Full Assessment (for Review page) ────────────────────
  assessment: router({
    getFull: protectedProcedure.query(async ({ ctx }) => {
      return getFullAssessment(ctx.user.id);
    }),

    status: protectedProcedure.query(async ({ ctx }) => {
      return getAssessmentStatus(ctx.user.id);
    }),

    submit: protectedProcedure.mutation(async ({ ctx }) => {
      await saveUserChoices(ctx.user.id, {
        assessmentStatus: "completed",
        completedAt: new Date(),
      });
      await createAuditLog(ctx.user.id, "assessment_submitted", {});
      return { success: true };
    }),
  }),
});

export type AppRouter = typeof appRouter;
