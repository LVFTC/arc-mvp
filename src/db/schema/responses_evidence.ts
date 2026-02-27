// src/db/schema/responses_evidence.ts  — ADD these columns to your existing schema

import { mysqlTable, varchar, date, text, int, timestamp } from "drizzle-orm/mysql-core";
import { users } from "./users";

// PATCH: extend your existing responses_evidence table definition with:
//
//   retentionUntil: date("retention_until").notNull()
//
// Example updated table (merge with your existing columns):

export const responsesEvidence = mysqlTable("responses_evidence", {
  id:             varchar("id", { length: 36 }).primaryKey(),
  userId:         varchar("user_id", { length: 36 }).notNull()
                    .references(() => users.id, { onDelete: "cascade" }),
  fieldName:      varchar("field_name", { length: 64 }).notNull(),
  content:        text("content").notNull(),
  // ── NEW ──────────────────────────────────────────────────────────────────
  retentionUntil: date("retention_until").notNull(),
  // ─────────────────────────────────────────────────────────────────────────
  createdAt:      timestamp("created_at").defaultNow().notNull(),
});

// Helper to compute default retention date (+90 days from now)
export function defaultRetentionUntil(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().split("T")[0]; // "YYYY-MM-DD"
}
