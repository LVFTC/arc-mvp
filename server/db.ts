import { eq, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  responsesLikert, InsertResponseLikert,
  responsesEvidence, InsertResponseEvidence,
  ikigaiItems, InsertIkigaiItem,
  userChoices, InsertUserChoice,
  auditLogs, InsertAuditLog,
  tags,
} from "../drizzle/schema";
import { ENV } from './_core/env';

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

export async function saveLikertResponses(userId: number, items: Omit<InsertResponseLikert, "userId">[]) {
  const db = await getDb();
  if (!db) return;

  // Delete existing responses for this user first (upsert pattern)
  await db.delete(responsesLikert).where(eq(responsesLikert.userId, userId));

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
