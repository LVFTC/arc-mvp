import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, json } from "drizzle-orm/mysql-core";

// ─── Core User Table ───────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  lgpdConsentAt: timestamp("lgpdConsentAt"),
  lgpdConsentVersion: varchar("lgpdConsentVersion", { length: 16 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── CORE: Likert Responses (Agilidades + Big Five) ────────────
export const responsesLikert = mysqlTable("responses_likert", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dimension: varchar("dimension", { length: 64 }).notNull(),
  itemId: varchar("itemId", { length: 64 }).notNull(),
  value: int("value").notNull(),
  reverseFlag: boolean("reverseFlag").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseLikert = typeof responsesLikert.$inferSelect;
export type InsertResponseLikert = typeof responsesLikert.$inferInsert;

// ─── CORE: Evidence Responses (open text) ──────────────────────
export const responsesEvidence = mysqlTable("responses_evidence", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dimension: varchar("dimension", { length: 64 }).notNull(),
  promptId: varchar("promptId", { length: 64 }).notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ResponseEvidence = typeof responsesEvidence.$inferSelect;
export type InsertResponseEvidence = typeof responsesEvidence.$inferInsert;

// ─── IKIGAI: Items with Ranking ────────────────────────────────
export const ikigaiItems = mysqlTable("ikigai_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  circle: mysqlEnum("circle", ["love", "good_at", "world_needs", "paid_for"]).notNull(),
  text: text("text").notNull(),
  rank: int("rank").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type IkigaiItem = typeof ikigaiItems.$inferSelect;
export type InsertIkigaiItem = typeof ikigaiItems.$inferInsert;

// ─── User Choices (zone + focus) ───────────────────────────────
export const userChoices = mysqlTable("user_choices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  chosenZone: mysqlEnum("chosenZone", ["passion", "profession", "mission", "vocation"]),
  chosenFocus: text("chosenFocus"),
  assessmentStatus: mysqlEnum("assessmentStatus", ["in_progress", "completed"]).default("in_progress").notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserChoice = typeof userChoices.$inferSelect;
export type InsertUserChoice = typeof userChoices.$inferInsert;

// ─── Audit Logs ────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventType: varchar("eventType", { length: 64 }).notNull(),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;

// ─── Tags (future-proof, prepared schema) ──────────────────────
export const tags = mysqlTable("tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  entityType: varchar("entityType", { length: 32 }).notNull(),
  entityId: int("entityId").notNull(),
  tag: varchar("tag", { length: 128 }).notNull(),
  source: varchar("source", { length: 32 }).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type InsertTag = typeof tags.$inferInsert;
