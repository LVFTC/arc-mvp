import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

// Mock the db module
vi.mock("./db", () => ({
  saveLikertResponses: vi.fn().mockResolvedValue(undefined),
  getLikertResponses: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, dimension: "self_management", itemId: "sm_1", value: 4, reverseFlag: false, createdAt: new Date(), updatedAt: new Date() },
  ]),
  saveEvidenceResponses: vi.fn().mockResolvedValue(undefined),
  getEvidenceResponses: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, dimension: "self_management", promptId: "sm_ev1", text: "Test evidence", createdAt: new Date(), updatedAt: new Date() },
  ]),
  saveIkigaiItems: vi.fn().mockResolvedValue(undefined),
  getIkigaiItems: vi.fn().mockResolvedValue([
    { id: 1, userId: 1, circle: "love", text: "Programming", rank: 1, createdAt: new Date(), updatedAt: new Date() },
  ]),
  saveUserChoices: vi.fn().mockResolvedValue(undefined),
  getUserChoices: vi.fn().mockResolvedValue({
    id: 1, userId: 1, chosenZone: "passion", chosenFocus: null,
    assessmentStatus: "in_progress", completedAt: null,
    createdAt: new Date(), updatedAt: new Date(),
  }),
  createAuditLog: vi.fn().mockResolvedValue(undefined),
  getFullAssessment: vi.fn().mockResolvedValue({
    likert: [], evidence: [], ikigai: [], choices: null,
  }),
  getAssessmentStatus: vi.fn().mockResolvedValue({
    sections: {
      lgpd: { complete: true },
      core_likert: { answered: 40, total: 40, complete: true },
      core_evidence: { answered: 10, total: 10, complete: true },
      bigfive: { answered: 20, total: 20, complete: true },
      ikigai: { circles: [], complete: true },
      zone: { chosen: "passion", complete: true },
    },
    resumeStep: "review",
    assessmentStatus: "in_progress",
    allComplete: true,
  }),
  updateUserLgpdConsent: vi.fn().mockResolvedValue(undefined),
  upsertUser: vi.fn().mockResolvedValue(undefined),
  getUserByOpenId: vi.fn().mockResolvedValue(undefined),
}));

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Arc Assessment Routers", () => {
  let authCaller: ReturnType<typeof appRouter.createCaller>;
  let unauthCaller: ReturnType<typeof appRouter.createCaller>;

  beforeEach(() => {
    authCaller = appRouter.createCaller(createAuthContext());
    unauthCaller = appRouter.createCaller(createUnauthContext());
    vi.clearAllMocks();
  });

  // ─── LGPD Consent ────────────────────────────────────────
  describe("lgpd.consent", () => {
    it("saves LGPD consent for authenticated user", async () => {
      const result = await authCaller.lgpd.consent({ version: "1.0" });
      expect(result).toEqual({ success: true });
    });

    it("rejects unauthenticated user", async () => {
      await expect(
        unauthCaller.lgpd.consent({ version: "1.0" })
      ).rejects.toThrow();
    });
  });

  // ─── Likert Responses ────────────────────────────────────
  describe("likert", () => {
    it("saves CORE likert responses with section param", async () => {
      const result = await authCaller.likert.save({
        section: "core",
        items: [
          { dimension: "self_management", itemId: "sm_1", value: 4, reverseFlag: false },
          { dimension: "self_management", itemId: "sm_7", value: 2, reverseFlag: true },
        ],
      });
      expect(result).toEqual({ success: true });
    });

    it("saves Big Five likert responses with section param", async () => {
      const result = await authCaller.likert.save({
        section: "bigfive",
        items: [
          { dimension: "bigfive_extraversion", itemId: "bf_e1", value: 3, reverseFlag: false },
        ],
      });
      expect(result).toEqual({ success: true });
    });

    it("validates value range (1-5)", async () => {
      await expect(
        authCaller.likert.save({
          section: "core",
          items: [{ dimension: "test", itemId: "t1", value: 6, reverseFlag: false }],
        })
      ).rejects.toThrow();
    });

    it("validates section enum", async () => {
      await expect(
        authCaller.likert.save({
          section: "invalid" as any,
          items: [{ dimension: "test", itemId: "t1", value: 3, reverseFlag: false }],
        })
      ).rejects.toThrow();
    });

    it("gets likert responses for authenticated user", async () => {
      const result = await authCaller.likert.get();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("itemId");
    });

    it("rejects unauthenticated get", async () => {
      await expect(unauthCaller.likert.get()).rejects.toThrow();
    });
  });

  // ─── Evidence Responses ──────────────────────────────────
  describe("evidence", () => {
    it("saves evidence responses", async () => {
      const result = await authCaller.evidence.save({
        items: [
          { dimension: "self_management", promptId: "sm_ev1", text: "I changed my mind about a project approach after receiving feedback." },
        ],
      });
      expect(result).toEqual({ success: true });
    });

    it("gets evidence responses", async () => {
      const result = await authCaller.evidence.get();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── IKIGAI Items ────────────────────────────────────────
  describe("ikigai", () => {
    it("saves ikigai items with valid circles", async () => {
      const result = await authCaller.ikigai.save({
        items: [
          { circle: "love", text: "Programming", rank: 1 },
          { circle: "love", text: "Teaching", rank: 2 },
          { circle: "love", text: "Writing", rank: 3 },
        ],
      });
      expect(result).toEqual({ success: true });
    });

    it("validates circle enum", async () => {
      await expect(
        authCaller.ikigai.save({
          items: [{ circle: "invalid" as any, text: "Test", rank: 1 }],
        })
      ).rejects.toThrow();
    });

    it("validates rank range (1-5)", async () => {
      await expect(
        authCaller.ikigai.save({
          items: [{ circle: "love", text: "Test", rank: 6 }],
        })
      ).rejects.toThrow();
    });

    it("gets ikigai items", async () => {
      const result = await authCaller.ikigai.get();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  // ─── User Choices ────────────────────────────────────────
  describe("choices", () => {
    it("saves chosen zone", async () => {
      const result = await authCaller.choices.save({
        chosenZone: "passion",
      });
      expect(result).toEqual({ success: true });
    });

    it("validates zone enum", async () => {
      await expect(
        authCaller.choices.save({
          chosenZone: "invalid" as any,
        })
      ).rejects.toThrow();
    });

    it("gets user choices", async () => {
      const result = await authCaller.choices.get();
      expect(result).toBeDefined();
      expect(result?.chosenZone).toBe("passion");
    });
  });

  // ─── Full Assessment ─────────────────────────────────────
  describe("assessment", () => {
    it("gets full assessment data", async () => {
      const result = await authCaller.assessment.getFull();
      expect(result).toHaveProperty("likert");
      expect(result).toHaveProperty("evidence");
      expect(result).toHaveProperty("ikigai");
      expect(result).toHaveProperty("choices");
    });

    it("gets assessment status with section details", async () => {
      const result = await authCaller.assessment.status();
      expect(result).toHaveProperty("sections");
      expect(result).toHaveProperty("resumeStep");
      expect(result).toHaveProperty("allComplete");
      expect(result.sections).toHaveProperty("core_likert");
      expect(result.sections).toHaveProperty("bigfive");
      expect(result.sections).toHaveProperty("ikigai");
      expect(result.sections).toHaveProperty("zone");
      expect(result.sections).toHaveProperty("lgpd");
    });

    it("rejects unauthenticated status", async () => {
      await expect(unauthCaller.assessment.status()).rejects.toThrow();
    });

    it("submits assessment", async () => {
      const result = await authCaller.assessment.submit();
      expect(result).toEqual({ success: true });
    });

    it("rejects unauthenticated submit", async () => {
      await expect(unauthCaller.assessment.submit()).rejects.toThrow();
    });
  });

  // ─── Auth ────────────────────────────────────────────────
  describe("auth.me", () => {
    it("returns user for authenticated context", async () => {
      const result = await authCaller.auth.me();
      expect(result).toBeDefined();
      expect(result?.openId).toBe("test-user-123");
    });

    it("returns null for unauthenticated context", async () => {
      const result = await unauthCaller.auth.me();
      expect(result).toBeNull();
    });
  });
});
