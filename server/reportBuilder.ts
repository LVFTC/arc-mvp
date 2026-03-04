/**
 * server/reportBuilder.ts
 *
 * Assembles the ReportPayload from DB rows.
 * Maps raw Drizzle rows → pdf_service payload shape.
 *
 * FIX: dimKeys agora usam as keys curtas que casam com DIMENSIONS e
 * com os dimension strings de CORE_LIKERT_ITEMS (mental, people, change, results).
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
  // FIX: keys curtas casam com DIMENSIONS.key e com CORE_LIKERT_ITEMS.dimension
  const dimKeys: Record<string, keyof ReportPayload["agilidades"]> = {
    self_management: "autogestao",
    mental: "mental",
    people: "pessoas",
    change: "mudancas",
    results: "resultados",
    // innovation: não mapeado no PDF — dimensão de diagnóstico, não de relatório
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

  // ── Archetype derivation (heurística simples — sem IA) ──
  const topDim = Object.entries(agilidades).reduce((a, b) => a[1] > b[1] ? a : b);
  const archetypeMap: Record<string, {
    name: string; strengths: string[]; tensions: string[]; questions: string[]
  }> = {
    autogestao: {
      name: "O Arquiteto de Si",
      strengths: ["Alta consciência de si mesmo", "Consistência e confiabilidade", "Capacidade de autorregulação"],
      tensions: ["Pode ser excessivamente autocrítico", "Dificuldade em delegar"],
      questions: ["Quando foi a última vez que você mudou de opinião sobre si mesmo?", "O que você tolera em si que não toleraria nos outros?"],
    },
    mental: {
      name: "O Pensador Estratégico",
      strengths: ["Capacidade analítica apurada", "Aprendizado rápido", "Visão sistêmica"],
      tensions: ["Pode paralisar por excesso de análise", "Dificuldade com execução repetitiva"],
      questions: ["Quando foi a última vez que você agiu sem ter certeza?", "O que você sabe que ainda não colocou em prática?"],
    },
    pessoas: {
      name: "O Conector Deliberado",
      strengths: ["Habilidade relacional elevada", "Comunicação adaptável", "Construção de confiança"],
      tensions: ["Pode depender demais da aprovação alheia", "Dificuldade com decisões impopulares"],
      questions: ["Quais relações você tem cultivado intencionalmente?", "Onde você está evitando uma conversa necessária?"],
    },
    mudancas: {
      name: "O Navegador da Incerteza",
      strengths: ["Alta tolerância à ambiguidade", "Adaptabilidade rápida", "Resiliência operacional"],
      tensions: ["Pode buscar mudança por inquietação, não por propósito", "Dificuldade com consistência de longo prazo"],
      questions: ["Qual mudança você está adiando porque parece arriscada?", "Onde a estabilidade seria mais valiosa que a adaptação?"],
    },
    resultados: {
      name: "O Executor Focado",
      strengths: ["Orientação a impacto", "Capacidade de priorização", "Entrega consistente"],
      tensions: ["Pode sacrificar qualidade por velocidade", "Dificuldade em tolerar ambiguidade sem meta clara"],
      questions: ["Qual resultado você está perseguindo que realmente importa?", "O que você está entregando que poderia parar de fazer?"],
    },
  };

  const archetype = archetypeMap[topDim[0]] ?? archetypeMap["resultados"];

  // ── Plan 90d (fallback se não houver dados) ──
  const plan: ReportPayload["plan"] = {
    chosen_hypothesis: choices?.chosenFocus ?? "Hipótese em construção — complete o IKIGAI para refinar.",
    experiencias: [{ title: "Mapeie 3 conversas com profissionais da área de interesse", week: 1, metric: "3 conversas realizadas" }],
    pessoas: [{ profile: "Profissional sênior da área de interesse", justification: "Valida a hipótese de carreira com quem já percorreu o caminho" }],
    educacao: [{ kind: "livro", title: "Designing Your Life — Bill Burnett & Dave Evans" }],
    checkpoints: [{ week: 4, question: "O que aprendi que muda minha hipótese inicial?" }],
  };

  return {
    user_name: userName,
    archetype: archetype.name,
    archetype_strengths: archetype.strengths,
    archetype_tensions: archetype.tensions,
    provocative_questions: archetype.questions,
    agilidades,
    big_five,
    ikigai: ikigaiPayload,
    selected_zone: choices?.chosenZone ?? "Não definida",
    plan,
  };
}
