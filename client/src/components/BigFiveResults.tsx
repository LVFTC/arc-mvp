// BigFiveResults — visualização de barras por traço + contextos favorecem/drenam
// Usado na tela de Review e no Dashboard pós-submit

import { BIG_FIVE_TRAITS, BIG_FIVE_ITEMS } from "@shared/questionBank";

interface TraitScore {
  key: string;
  label: string;
  score: number; // 1–5
  percentile: number; // 0–100 para a barra
}

interface BigFiveResultsProps {
  // Raw likert answers keyed by itemId
  answers: Record<string, number>;
  compact?: boolean;
}

// Compute scored average per trait (with reverse scoring)
function computeTraitScores(answers: Record<string, number>): TraitScore[] {
  return BIG_FIVE_TRAITS.map(trait => {
    const items = BIG_FIVE_ITEMS.filter(i => i.trait === trait.key);
    const scored = items
      .filter(i => answers[i.id] !== undefined)
      .map(i => i.reverse ? (6 - answers[i.id]) : answers[i.id]);

    const avg = scored.length > 0
      ? scored.reduce((a, b) => a + b, 0) / scored.length
      : 0;

    return {
      key: trait.key,
      label: trait.label,
      score: Math.round(avg * 10) / 10,
      percentile: Math.round(((avg - 1) / 4) * 100),
    };
  });
}

// Descriptions and context bullets per trait
const TRAIT_DESCRIPTIONS: Record<string, {
  low: string;
  high: string;
  favoredBy: string[];
  drainedBy: string[];
}> = {
  extraversion: {
    low: "Tendência introvertida: prefere ambientes com menos estímulos sociais e recarrega energia na solitude.",
    high: "Tendência extrovertida: energiza-se com interação social e ambientes dinâmicos.",
    favoredBy: [
      "Trabalho independente com autonomia",
      "Ambientes de reflexão e análise",
      "Reuniões com pauta clara e tempo definido",
    ],
    drainedBy: [
      "Interações sociais intensas e prolongadas",
      "Ambientes de open space com muitas interrupções",
      "Apresentações frequentes sem preparação",
    ],
  },
  agreeableness: {
    low: "Tendência mais direta e analítica: prioriza resultados e lógica sobre harmonia social.",
    high: "Tendência cooperativa e empática: valoriza harmonia e bem-estar das relações.",
    favoredBy: [
      "Ambientes colaborativos com propósito claro",
      "Trabalho em equipe com confiança estabelecida",
      "Culturas que valorizam escuta e empatia",
    ],
    drainedBy: [
      "Conflitos prolongados sem resolução",
      "Ambientes de alta competição interna",
      "Culturas de crítica sem reconhecimento",
    ],
  },
  conscientiousness: {
    low: "Tendência mais flexível e adaptável: prefere espaço para improvisar e ajustar no caminho.",
    high: "Tendência organizada e disciplinada: funciona melhor com estrutura, planejamento e comprometimento.",
    favoredBy: [
      "Projetos com escopo e prazos definidos",
      "Ambientes com processos claros",
      "Trabalho onde qualidade e precisão são valorizados",
    ],
    drainedBy: [
      "Ambientes muito caóticos sem estrutura mínima",
      "Mudanças de prioridade constantes sem justificativa",
      "Culturas que toleram baixa qualidade de entrega",
    ],
  },
  neuroticism: {
    low: "Alta estabilidade emocional: tende a manter calma sob pressão e se recupera rápido de adversidades.",
    high: "Maior reatividade emocional: processa estímulos com mais intensidade, o que pode gerar criatividade e empatia, mas também desgaste em ambientes de alta pressão.",
    favoredBy: [
      "Ambientes com previsibilidade e segurança psicológica",
      "Liderança que dá feedback claro e frequente",
      "Trabalho com autonomia e ritmo controlável",
    ],
    drainedBy: [
      "Ambientes de alta pressão e incerteza constante",
      "Culturas de feedback escasso ou ambíguo",
      "Trabalho com muitas variáveis fora do controle",
    ],
  },
  intellect: {
    low: "Tendência mais prática e concreta: prefere aplicação direta a exploração teórica.",
    high: "Alta abertura intelectual: aprecia abstração, novas ideias e exploração conceitual.",
    favoredBy: [
      "Trabalho que envolve resolução de problemas complexos",
      "Ambientes que valorizam inovação e experimentação",
      "Projetos com espaço para aprendizado contínuo",
    ],
    drainedBy: [
      "Trabalho puramente rotineiro e repetitivo",
      "Ambientes que resistem a novas ideias",
      "Culturas de execução sem espaço para questionamento",
    ],
  },
};

function getScoreLabel(score: number): { label: string; color: string } {
  if (score >= 4.2) return { label: "Alta tendência", color: "text-emerald-600" };
  if (score >= 3.5) return { label: "Tendência moderada-alta", color: "text-blue-600" };
  if (score >= 2.5) return { label: "Tendência moderada", color: "text-amber-600" };
  if (score >= 1.8) return { label: "Tendência moderada-baixa", color: "text-orange-600" };
  return { label: "Baixa tendência", color: "text-rose-600" };
}

function getBarColor(percentile: number): string {
  if (percentile >= 75) return "bg-emerald-500";
  if (percentile >= 55) return "bg-blue-500";
  if (percentile >= 35) return "bg-amber-500";
  return "bg-rose-400";
}

export function BigFiveResults({ answers, compact = false }: BigFiveResultsProps) {
  const scores = computeTraitScores(answers);
  const hasData = scores.some(s => s.score > 0);

  if (!hasData) {
    return (
      <div className="text-sm text-muted-foreground italic py-4 text-center">
        Preencha o questionário Big Five para ver os resultados.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {scores.map(trait => {
        const desc = TRAIT_DESCRIPTIONS[trait.key];
        const { label: scoreLabel, color: scoreColor } = getScoreLabel(trait.score);
        const barColor = getBarColor(trait.percentile);
        const isHighTendency = trait.percentile >= 55;
        const description = isHighTendency ? desc?.high : desc?.low;

        return (
          <div key={trait.key} className="space-y-2">
            {/* Trait header + bar */}
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-semibold text-foreground min-w-[160px]">
                {trait.label}
              </span>
              <span className={`text-xs font-medium ${scoreColor}`}>
                {trait.score > 0 ? `${trait.score}/5 — ${scoreLabel}` : "—"}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${trait.percentile}%` }}
              />
            </div>

            {/* Description */}
            {!compact && description && (
              <p className="text-xs text-muted-foreground leading-relaxed">
                {description}
              </p>
            )}

            {/* Context bullets */}
            {!compact && desc && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                <div className="rounded-md bg-emerald-50 border border-emerald-100 p-2.5">
                  <p className="text-xs font-semibold text-emerald-700 mb-1">Contextos que favorecem</p>
                  <ul className="space-y-0.5">
                    {desc.favoredBy.map((item, i) => (
                      <li key={i} className="text-xs text-emerald-800 flex items-start gap-1">
                        <span className="mt-0.5 shrink-0">+</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md bg-rose-50 border border-rose-100 p-2.5">
                  <p className="text-xs font-semibold text-rose-700 mb-1">Contextos que drenam</p>
                  <ul className="space-y-0.5">
                    {desc.drainedBy.map((item, i) => (
                      <li key={i} className="text-xs text-rose-800 flex items-start gap-1">
                        <span className="mt-0.5 shrink-0">-</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
