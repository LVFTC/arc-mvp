/**
 * src/services/reportBuilder.ts
 *
 * Assembles the ReportPayload from DB rows.
 * This is the only place that touches raw user data before PDF generation.
 */

import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  userProfiles,
  responsesEvidence,
  plan90Days,
} from "../db/schema";
import type { InferSelectModel } from "drizzle-orm";

type Profile = InferSelectModel<typeof userProfiles>;

export interface ReportPayload {
  user_name: string;
  archetype: string;
  archetype_strengths: string[];
  archetype_tensions: string[];
  provocative_questions: string[];
  agilidades: {
    mental: number;
    resultados: number;
    pessoas: number;
    mudancas: number;
    autogestao: number;
  };
  big_five: {
    abertura: number;
    conscienciosidade: number;
    extroversao: number;
    amabilidade: number;
    neuroticismo: number;
  };
  ikigai: {
    amo: string[];
    sou_bom: string[];
    mundo_precisa: string[];
    posso_ser_pago: string[];
  };
  selected_zone: string;
  plan: {
    chosen_hypothesis: string;
    experiencias: { title: string; week: number; metric: string }[];
    pessoas: { profile: string; justification: string }[];
    educacao: { kind: string; title: string }[];
    checkpoints: { week: number; question: string }[];
  };
}

export async function buildReportPayload(
  userId: string,
  profile: Profile
): Promise<ReportPayload> {
  const plan = await db.query.plan90Days.findFirst({
    where: eq(plan90Days.userId, userId),
  });

  // Scores stored as JSON columns in profile
  const ag = profile.agilitiesScores as Record<string, number>;
  const bf = profile.bigFiveScores as Record<string, number>;
  const ik = profile.ikigaiInputs as Record<string, string[]>;
  const arch = profile.archetypeData as {
    name: string;
    strengths: string[];
    tensions: string[];
    questions: string[];
  };

  return {
    user_name: profile.userName ?? "Participante",
    archetype: arch?.name ?? "",
    archetype_strengths: arch?.strengths ?? [],
    archetype_tensions: arch?.tensions ?? [],
    provocative_questions: arch?.questions ?? [],
    agilidades: {
      mental: ag?.mental ?? 0,
      resultados: ag?.resultados ?? 0,
      pessoas: ag?.pessoas ?? 0,
      mudancas: ag?.mudancas ?? 0,
      autogestao: ag?.autogestao ?? 0,
    },
    big_five: {
      abertura: bf?.abertura ?? 0,
      conscienciosidade: bf?.conscienciosidade ?? 0,
      extroversao: bf?.extroversao ?? 0,
      amabilidade: bf?.amabilidade ?? 0,
      neuroticismo: bf?.neuroticismo ?? 0,
    },
    ikigai: {
      amo: ik?.amo ?? [],
      sou_bom: ik?.souBom ?? [],
      mundo_precisa: ik?.mundoPrecisa ?? [],
      posso_ser_pago: ik?.possoSerPago ?? [],
    },
    selected_zone: profile.selectedZone ?? "",
    plan: {
      chosen_hypothesis: plan?.chosenHypothesis ?? "",
      experiencias: plan?.experiencias ?? [],
      pessoas: plan?.pessoas ?? [],
      educacao: plan?.educacao ?? [],
      checkpoints: plan?.checkpoints ?? [],
    },
  };
}
