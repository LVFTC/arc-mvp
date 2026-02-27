/**
 * tests/pdf-ownership.test.ts
 *
 * P0 Security test: requesting another user's PDF must return 404.
 * Run: pnpm test tests/pdf-ownership.test.ts
 */

import request from "supertest";
import { app } from "../src/app";
import { db } from "../src/db";
import { users, userProfiles } from "../src/db/schema";
import { randomUUID } from "crypto";

// ── Test fixtures ────────────────────────────────────────────────────────────
const USER_A = { id: randomUUID(), email: "alice@arc.test", name: "Alice" };
const USER_B = { id: randomUUID(), email: "bob@arc.test", name: "Bob" };

beforeAll(async () => {
  // Seed two users
  await db.insert(users).values([
    { id: USER_A.id, email: USER_A.email, name: USER_A.name, consentTimestamp: new Date() },
    { id: USER_B.id, email: USER_B.email, name: USER_B.name, consentTimestamp: new Date() },
  ]);
  // Seed a profile for User B
  await db.insert(userProfiles).values({
    id: randomUUID(),
    userId: USER_B.id,
    userName: USER_B.name,
    agilitiesScores: JSON.stringify({ mental: 3, resultados: 4, pessoas: 3, mudancas: 2, autogestao: 3 }),
    bigFiveScores: JSON.stringify({ abertura: 3.5, conscienciosidade: 4, extroversao: 2.5, amabilidade: 4, neuroticismo: 2 }),
    ikigaiInputs: JSON.stringify({ amo: [], souBom: [], mundoPrecisa: [], possoSerPago: [] }),
    archetypeData: JSON.stringify({ name: "Explorador Analítico", strengths: [], tensions: [], questions: [] }),
    selectedZone: "Profissão",
  });
});

afterAll(async () => {
  await db.delete(userProfiles).where(/* all test users */);
  await db.delete(users).where(/* all test users */);
  await db.$client.end?.();
});

// ── Helper: create a session cookie for a given userId ──────────────────────
async function loginAs(userId: string) {
  const res = await request(app)
    .post("/api/test/login")          // test-only route that sets session
    .send({ userId })
    .expect(200);
  return res.headers["set-cookie"];
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/users/:userId/report.pdf — BOLA ownership", () => {
  it("returns 404 when User A requests User B's PDF", async () => {
    const cookieA = await loginAs(USER_A.id);

    await request(app)
      .get(`/api/users/${USER_B.id}/report.pdf`)
      .set("Cookie", cookieA)
      .expect(404);
  });

  it("returns 404 when unauthenticated", async () => {
    await request(app)
      .get(`/api/users/${USER_B.id}/report.pdf`)
      .expect(404);
  });

  it("allows User B to access their own PDF (200 or 502 if pdf-service down)", async () => {
    const cookieB = await loginAs(USER_B.id);

    const res = await request(app)
      .get(`/api/users/${USER_B.id}/report.pdf`)
      .set("Cookie", cookieB);

    // In CI the pdf-service is not running, so 502 is acceptable.
    // What matters is it is NOT 404.
    expect([200, 502]).toContain(res.status);
  });
});

describe("DELETE /api/me/data — LGPD erasure", () => {
  it("deletes all data and returns { deleted: true }", async () => {
    // Create a throwaway user
    const tmpId = randomUUID();
    await db.insert(users).values({
      id: tmpId,
      email: `tmp-${tmpId}@arc.test`,
      name: "Temp",
      consentTimestamp: new Date(),
    });

    const cookie = await loginAs(tmpId);
    const res = await request(app)
      .delete("/api/me/data")
      .set("Cookie", cookie)
      .expect(200);

    expect(res.body.deleted).toBe(true);

    // Verify user no longer in DB
    const row = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, tmpId),
    });
    expect(row).toBeUndefined();
  });

  it("returns 401 when unauthenticated", async () => {
    await request(app).delete("/api/me/data").expect(401);
  });
});
