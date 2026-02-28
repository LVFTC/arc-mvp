/**
 * server/reportBuilder.ts
 *
 * Assembles the ReportPayload from DB rows (Manus schema).
 * Maps raw Drizzle rows → pdf_service payload shape.
 */

import {
  CORE_LIKERT_ITEMS,
  BIG_FIVE_ITEMS,
  BIG_FIVE_TRAITS,
  DIMENSIONS,
} from "../shared/questionBank";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ─── Types ─────────────────────────────────────────────────────

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
  /** Mapped to pdf_service Plan90Days schema */
  plan: {
    chosen_hypothesis: string;
    experiencias: Array<{ title: string; week: number; metric: string }>;
    pessoas: Array<{ profile: string; justification: string }>;
    educacao: Array<{ kind: string; title: string }>;
    checkpoints: Array<{ week: number; question: string }>;
  };
}

// ─── Score Computation ─────────────────────────────────────────

function computeLikertScore(
  items: Array<{ itemId: string; value: number; reverseFlag: boolean }>,
  targetItemIds: Set<string>
): number {
  const filtered = items.filter(r => targetItemIds.has(r.itemId));
  if (filtered.length === 0) return 0;
  const sum = filtered.reduce((acc, r) => {
    const val = r.reverseFlag ? 6 - r.value : r.value;
    return acc + val;
  }, 0);
  // Normalize to 0–5 scale
  return Math.round((sum / filtered.length) * 10) / 10;
}

// ─── Main Builder ──────────────────────────────────────────────

export async function buildReportPayload(
  userId: number,
  assessment: {
    likert: Array<{ itemId: string; value: number; reverseFlag: boolean; dimension: string }>;
    evidence: Array<{ dimension: string; promptId: string; text: string }>;
    ikigai: Array<{ circle: string; text: string; rank: number }>;
    choices: { chosenZone?: string | null; chosenFocus?: string | null } | null;
  }
): Promise<ReportPayload> {
  const db = await getDb();
  const userRow = db ? await db.select().from(users).where(eq(users.id, userId)).limit(1) : [];
  const userName = userRow[0]?.name ?? "Participante";

  const { likert, ikigai, choices } = assessment;

  // ── Agilidades scores ──
  const dimKeys: Record<string, keyof ReportPayload["agilidades"]> = {
    self_management: "autogestao",
    mental_agility: "mental",
    people_agility: "pessoas",
    change_agility: "mudancas",
    results_agility: "resultados",
  };

  const agilidades: ReportPayload["agilidades"] = {
    mental: 0, resultados: 0, pessoas: 0, mudancas: 0, autogestao: 0,
  };

  for (const dim of DIMENSIONS) {
    const itemIds = new Set(CORE_LIKERT_ITEMS.filter(i => i.dimension === dim.key).map(i => i.id));
    const score = computeLikertScore(likert, itemIds);
    const key = dimKeys[dim.key];
    if (key) agilidades[key] = score;
  }

  // ── Big Five scores ──
  const bfKeyMap: Record<string, keyof ReportPayload["big_five"]> = {
    extraversion: "extroversao",
    agreeableness: "amabilidade",
    conscientiousness: "conscienciosidade",
    neuroticism: "neuroticismo",
    intellect: "abertura",
  };

  const big_five: ReportPayload["big_five"] = {
    abertura: 0, conscienciosidade: 0, extroversao: 0, amabilidade: 0, neuroticismo: 0,
  };

  for (const trait of BIG_FIVE_TRAITS) {
    const itemIds = new Set(BIG_FIVE_ITEMS.filter(i => i.trait === trait.key).map(i => i.id));
    const score = computeLikertScore(likert, itemIds);
    const key = bfKeyMap[trait.key];
    if (key) big_five[key] = score;
  }

  // ── IKIGAI ──
  const sortedByRank = [...ikigai].sort((a, b) => a.rank - b.rank);
  const ikigaiPayload: ReportPayload["ikigai"] = {
    amo: sortedByRank.filter(i => i.circle === "love").map(i => i.text),
    sou_bom: sortedByRank.filter(i => i.circle === "good_at").map(i => i.text),
    mundo_precisa: sortedByRank.filter(i => i.circle === "world_needs").map(i => i.text),
    posso_ser_pago: sortedByRank.filter(i => i.circle === "paid_for").map(i => i.text),
  };

  // ── Archetype derivation (simple heuristic — no AI) ──
  const topDim = Object.entries(agilidades).reduce((a, b) => a[1] > b[1] ? a : b);
  const archetypeMap: Record<string, { name: string; strengths: string[]; tensions: string[]; questions: string[] }> = {
    autogestao: {
      name: "O Arquiteto de Si",
      strengths: ["Alta consciência de si mesmo", "Consistência e confiabilidade", "Capacidade de autorregulação"],
      tensions: ["Pode ser excessivamente autocrítico", "Dificuldade em delegar"],
      questions: ["Quando foi a última vez que você mudou de opinião sobre si mesmo?", "O que você tolera em si que não toleraria nos outros?"],
    },
    mental: {
      name: "O Pensador Sistêmico",
      strengths: ["Visão analítica e estruturada", "Capacidade de síntese", "Aprendizado rápido"],
      tensions: ["Pode paralisar por excesso de análise", "Dificuldade com ambiguidade"],
      questions: ["Qual problema você ainda não conseguiu simplificar?", "Quando a análise virou desculpa para não agir?"],
    },
    pessoas: {
      name: "O Conector",
      strengths: ["Inteligência relacional elevada", "Comunicação adaptativa", "Capacidade de influência"],
      tensions: ["Pode evitar conflitos necessários", "Dependência de aprovação"],
      questions: ["Qual conversa difícil você está adiando?", "Onde sua empatia virou obstáculo?"],
    },
    mudancas: {
      name: "O Navegador",
      strengths: ["Alta adaptabilidade", "Resiliência em cenários instáveis", "Visão de oportunidade em crises"],
      tensions: ["Pode se perder sem estrutura", "Dificuldade com rotina"],
      questions: ["O que você ainda não aprendeu com a última mudança?", "Onde a adaptabilidade virou falta de posição?"],
    },
    resultados: {
      name: "O Executor",
      strengths: ["Foco em entrega", "Alta capacidade de priorização", "Orientação a impacto"],
      tensions: ["Pode sacrificar qualidade por velocidade", "Dificuldade em pausar para reflexão"],
      questions: ["Qual resultado você perseguiu que não deveria?", "O que você entrega que ninguém pediu?"],
    },
  };

  const archetype = archetypeMap[topDim[0]] ?? archetypeMap["autogestao"];

  // ── Plan 90D ──
  // Map our 70/20/10 template selections to pdf_service Plan90Days schema
  let plan: ReportPayload["plan"] = {
    chosen_hypothesis: "",
    experiencias: [],
    pessoas: [],
    educacao: [],
    checkpoints: [],
  };

  if (db) {
    const { userPlan90d } = await import("../drizzle/schema");
    const planRows = await db.select().from(userPlan90d).where(eq(userPlan90d.userId, userId)).limit(1);
    if (planRows[0]) {
      const p = planRows[0];
      const sel70 = (p.selected70 as string[] | null) ?? [];
      const sel20 = (p.selected20 as string[] | null) ?? [];
      const sel10 = (p.selected10 as string[] | null) ?? [];

      // Map selected_70 → experiencias (main work, week 1-9)
      const experiencias = sel70.map((title, i) => ({
        title,
        week: (i + 1) * 3,
        metric: "Avalie o impacto no trabalho principal ao final do ciclo",
      }));

      // Map selected_20 → educacao (development)
      const educacao = sel20.map(title => ({ kind: "desenvolvimento", title }));

      // Map selected_10 → educacao (exploration)
      const exploracoes = sel10.map(title => ({ kind: "exploração", title }));

      // Checkpoints from dates
      const checkpoints = [
        { week: 4, question: p.checkpoint1Date ? `Checkpoint 1 (${p.checkpoint1Date}): O que mudou desde o início do ciclo?` : "Checkpoint 1: O que mudou desde o início do ciclo?" },
        { week: 8, question: p.checkpoint2Date ? `Checkpoint 2 (${p.checkpoint2Date}): O que precisa ser ajustado?` : "Checkpoint 2: O que precisa ser ajustado?" },
        { week: 12, question: p.checkpoint3Date ? `Checkpoint 3 (${p.checkpoint3Date}): O que ficou para o próximo ciclo?` : "Checkpoint 3: O que ficou para o próximo ciclo?" },
      ];

      plan = {
        chosen_hypothesis: p.cycleObjective ?? "Ciclo de desenvolvimento Arc",
        experiencias,
        pessoas: [],
        educacao: [...educacao, ...exploracoes],
        checkpoints,
      };
    }
  }

  return {
    user_name: userName,
    archetype: archetype.name,
    archetype_strengths: archetype.strengths,
    archetype_tensions: archetype.tensions,
    provocative_questions: archetype.questions,
    agilidades,
    big_five,
    ikigai: ikigaiPayload,
    selected_zone: choices?.chosenZone ?? "",
    plan,
  };
}
