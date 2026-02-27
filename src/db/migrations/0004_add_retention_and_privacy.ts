import { sql } from "drizzle-orm";
import type { MysqlDatabase } from "drizzle-orm/mysql2";

// Migration: 0004_add_retention_and_privacy.ts
// Adds:
//   - retention_until on responses_evidence
//   - consent_timestamp on users (if missing)
// Run: pnpm drizzle-kit push  OR  apply as named migration

export async function up(db: MysqlDatabase<any>) {
  // 1. retention_until on open-text evidence table
  await db.execute(sql`
    ALTER TABLE responses_evidence
      ADD COLUMN IF NOT EXISTS retention_until DATE NOT NULL
        DEFAULT (CURRENT_DATE + INTERVAL 90 DAY)
        COMMENT 'LGPD retention window — soft-delete after this date'
  `);

  // 2. consent timestamp on users (idempotent)
  await db.execute(sql`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS consent_timestamp DATETIME NULL
        COMMENT 'Timestamp of explicit LGPD consent'
  `);

  // 3. index to allow efficient retention sweeps (cron job)
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_evidence_retention
      ON responses_evidence (retention_until)
  `);
}

export async function down(db: MysqlDatabase<any>) {
  await db.execute(sql`
    ALTER TABLE responses_evidence DROP COLUMN retention_until
  `);
  await db.execute(sql`
    ALTER TABLE users DROP COLUMN consent_timestamp
  `);
  await db.execute(sql`
    DROP INDEX IF EXISTS idx_evidence_retention ON responses_evidence
  `);
}
