import { eq, and, like } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  responsesLikert, InsertResponseLikert,
  responsesEvidence, InsertResponseEvidence,
  ikigaiItems, InsertIkigaiItem,
  userChoices, InsertUserChoice,
  auditLogs, InsertAuditLog,
  tags,
  userPlan90d, InsertUserPlan90d,
} from "../drizzle/schema";
import { ENV } from './_core/env';
import {
  CORE_LIKERT_ITEMS,
  CORE_EVIDENCE_PROMPTS,
  BIG_FIVE_ITEMS,
  DIMENSIONS,
  BIG_FIVE_TRAITS,
  IKIGAI_CIRCLES,
} from "../shared/questionBank";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── User Helpers ──────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateUserLgpdConsent(userId: number, version: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set({
    lgpdConsentAt: new Date(),
    lgpdConsentVersion: version,
  }).where(eq(users.id, userId));
}

// ─── LGPD: All queries below enforce userId filtering ──────────

// ─── Likert Responses ──────────────────────────────────────────
// FIX: save by section (core vs bigfive) to avoid deleting cross-section data

export async function saveLikertResponses(
  userId: number,
  items: Omit<InsertResponseLikert, "userId">[],
  section: "core" | "bigfive"
) {
  const db = await getDb();
  if (!db) return;

  // Determine which itemIds belong to this section
  const sectionItemIds = section === "core"
    ? CORE_LIKERT_ITEMS.map(i => i.id)
    : BIG_FIVE_ITEMS.map(i => i.id);

  // Delete only items from this section for this user
  const existing = await db.select({ id: responsesLikert.id, itemId: responsesLikert.itemId })
    .from(responsesLikert)
    .where(eq(responsesLikert.userId, userId));

  const idsToDelete = existing
    .filter(row => sectionItemIds.includes(row.itemId))
    .map(row => row.id);

  if (idsToDelete.length > 0) {
    // Delete in batches to avoid query limits
    for (const id of idsToDelete) {
      await db.delete(responsesLikert).where(
        and(eq(responsesLikert.id, id), eq(responsesLikert.userId, userId))
      );
    }
  }

  if (items.length === 0) return;

  const rows = items.map(item => ({
    ...item,
    userId,
  }));
  await db.insert(responsesLikert).values(rows);
}

export async function getLikertResponses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(responsesLikert).where(eq(responsesLikert.userId, userId));
}

// ─── Evidence Responses ────────────────────────────────────────

export async function saveEvidenceResponses(userId: number, items: Omit<InsertResponseEvidence, "userId">[]) {
  const db = await getDb();
  if (!db) return;

  await db.delete(responsesEvidence).where(eq(responsesEvidence.userId, userId));

  if (items.length === 0) return;

  const rows = items.map(item => ({
    ...item,
    userId,
  }));
  await db.insert(responsesEvidence).values(rows);
}

export async function getEvidenceResponses(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(responsesEvidence).where(eq(responsesEvidence.userId, userId));
}

// ─── IKIGAI Items ──────────────────────────────────────────────

export async function saveIkigaiItems(userId: number, items: Omit<InsertIkigaiItem, "userId">[]) {
  const db = await getDb();
  if (!db) return;

  await db.delete(ikigaiItems).where(eq(ikigaiItems.userId, userId));

  if (items.length === 0) return;

  const rows = items.map(item => ({
    ...item,
    userId,
  }));
  await db.insert(ikigaiItems).values(rows);
}

export async function getIkigaiItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(ikigaiItems).where(eq(ikigaiItems.userId, userId));
}

// ─── User Choices ──────────────────────────────────────────────

export async function saveUserChoices(userId: number, data: Partial<Omit<InsertUserChoice, "userId">>) {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(userChoices).where(eq(userChoices.userId, userId)).limit(1);

  if (existing.length > 0) {
    await db.update(userChoices).set(data).where(eq(userChoices.userId, userId));
  } else {
    await db.insert(userChoices).values({ userId, ...data });
  }
}

export async function getUserChoices(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userChoices).where(eq(userChoices.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ─── Audit Logs ────────────────────────────────────────────────

export async function createAuditLog(userId: number, eventType: string, payload?: unknown) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values({
    userId,
    eventType,
    payload: payload ?? null,
  });
}

export async function getAuditLogs(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.userId, userId));
}

// ─── Plano 90 Dias ────────────────────────────────────────────────────

export async function savePlan90d(
  userId: number,
  data: Omit<InsertUserPlan90d, "userId">
) {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select({ id: userPlan90d.id })
    .from(userPlan90d)
    .where(eq(userPlan90d.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    await db.update(userPlan90d).set(data).where(eq(userPlan90d.userId, userId));
  } else {
    await db.insert(userPlan90d).values({ userId, ...data });
  }
}

export async function getPlan90d(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userPlan90d).where(eq(userPlan90d.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : null;
}

// ─── Full Assessment Data (for Review page) ────────────────────

export async function getFullAssessment(userId: number) {
  const [likert, evidence, ikigai, choices] = await Promise.all([
    getLikertResponses(userId),
    getEvidenceResponses(userId),
    getIkigaiItems(userId),
    getUserChoices(userId),
  ]);

  return { likert, evidence, ikigai, choices };
}

// ─── Assessment Status (for resume session) ────────────────────

export async function getAssessmentStatus(userId: number) {
  const [likert, evidence, ikigai, choices, user] = await Promise.all([
    getLikertResponses(userId),
    getEvidenceResponses(userId),
    getIkigaiItems(userId),
    getUserChoices(userId),
    getDb().then(db => db ? db.select().from(users).where(eq(users.id, userId)).limit(1) : []),
  ]);

  // Count CORE likert items (exclude bigfive)
  const coreItemIds = new Set(CORE_LIKERT_ITEMS.map(i => i.id));
  const bigFiveItemIds = new Set(BIG_FIVE_ITEMS.map(i => i.id));

  const coreLikertCount = likert.filter(r => coreItemIds.has(r.itemId)).length;
  const bigFiveCount = likert.filter(r => bigFiveItemIds.has(r.itemId)).length;
  const evidenceCount = evidence.length;
  const ikigaiCount = ikigai.length;

  const coreLikertTotal = CORE_LIKERT_ITEMS.length;
  const bigFiveTotal = BIG_FIVE_ITEMS.length;
  const evidenceTotal = CORE_EVIDENCE_PROMPTS.length;

  // IKIGAI: need at least 3 per circle (4 circles)
  const ikigaiByCircle = IKIGAI_CIRCLES.map(c => ({
    circle: c.key,
    count: ikigai.filter(i => i.circle === c.key).length,
    min: 3,
  }));
  const ikigaiComplete = ikigaiByCircle.every(c => c.count >= c.min);

  const hasLgpdConsent = !!(user[0]?.lgpdConsentAt);
  const assessmentStatus = choices?.assessmentStatus || null;

  const sections = {
    lgpd: { complete: hasLgpdConsent },
    core_likert: { answered: coreLikertCount, total: coreLikertTotal, complete: coreLikertCount >= coreLikertTotal },
    core_evidence: { answered: evidenceCount, total: evidenceTotal, complete: evidenceCount >= evidenceTotal },
    bigfive: { answered: bigFiveCount, total: bigFiveTotal, complete: bigFiveCount >= bigFiveTotal },
    ikigai: { circles: ikigaiByCircle, complete: ikigaiComplete },
    zone: { chosen: choices?.chosenZone || null, complete: !!choices?.chosenZone },
  };

  // Determine resume step
  let resumeStep: string = "welcome";
  if (!hasLgpdConsent) {
    resumeStep = "welcome";
  } else if (!sections.core_likert.complete) {
    resumeStep = "core_likert";
  } else if (!sections.core_evidence.complete) {
    resumeStep = "core_evidence";
  } else if (!sections.bigfive.complete) {
    resumeStep = "bigfive";
  } else if (!sections.ikigai.complete || !sections.zone.complete) {
    resumeStep = "ikigai";
  } else {
    resumeStep = "review";
  }

  if (assessmentStatus === "completed") {
    resumeStep = "submitted";
  }

  return {
    sections,
    resumeStep,
    assessmentStatus,
    allComplete: sections.core_likert.complete &&
      sections.core_evidence.complete &&
      sections.bigfive.complete &&
      sections.ikigai.complete &&
      sections.zone.complete,
  };
}
