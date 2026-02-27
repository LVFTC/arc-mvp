import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { CORE_EVIDENCE_PROMPTS, DIMENSIONS } from "@shared/questionBank";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, Save, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { EvidenceExample } from "@/components/EvidenceExample";
import { ArcTeaches, type ArcTeachesContent } from "@/components/ArcTeaches";

// Microintervenção para etapa de evidências
const EVIDENCE_TEACH: ArcTeachesContent = {
  why: "Evidências transformam sua autopercepção em dado verificável. É fácil dizer 'sou bom nisso'. Difícil é descrever uma situação concreta onde isso foi exigido e o que aconteceu. Aqui estamos calibrando o que você marcou no questionário com exemplos reais.",
  trap: "Escrever frases genéricas ('sou dedicado', 'sempre ajudo meu time') sem contexto. Isso não é evidência, é opinião. Evidência tem situação, ação e resultado.",
  howTo: [
    "Use Situação, Ação, Impacto. O que aconteceu, o que você fez especificamente e o que mudou.",
    "Seja específico. 'reduzi o prazo em 3 dias' é melhor do que 'melhorei o processo'.",
    "Não precisa ser um grande feito. Uma situação comum bem descrita vale mais do que um caso heroíco vago.",
  ],
};

const MIN_CHARS = 80;

// Exemplos por dimensão (situação → ação → impacto)
const DIMENSION_EXAMPLES: Record<string, { situation: string; action: string; impact: string }> = {
  self_management: {
    situation: "Estava liderando um projeto com prazo apertado e percebi que minha ansiedade estava afetando a qualidade das minhas decisões.",
    action: "Pausei, identifiquei que estava reagindo emocionalmente, conversei com o time sobre o que era realmente urgente vs. importante, e redistribuí as tarefas.",
    impact: "Entregamos no prazo com menos retrabalho e o time relatou que se sentiu mais confiante nas decisões tomadas.",
  },
  learning_agility: {
    situation: "Fui designado para liderar uma área técnica que eu nunca tinha trabalhado antes — análise de dados com Python.",
    action: "Mapeei as lacunas de conhecimento, busquei um mentor interno, fiz um curso intensivo em 2 semanas e apliquei os aprendizados em um projeto piloto real.",
    impact: "Em 45 dias consegui entregar a primeira análise funcional e documentei o processo para o restante do time.",
  },
  collaboration: {
    situation: "Dois membros do time tinham visões opostas sobre a arquitetura de um sistema, o que estava travando o projeto.",
    action: "Facilitei uma sessão estruturada onde cada um apresentou os prós e contras da sua proposta, identifiquei os pontos de convergência e propus uma solução híbrida.",
    impact: "O time chegou a um consenso em 2 horas, o projeto desbloqueou e a solução final foi adotada como padrão para outros projetos.",
  },
  communication: {
    situation: "Precisei apresentar um relatório técnico complexo para a diretoria, que não tinha background técnico.",
    action: "Reestruturei a apresentação usando analogias do dia a dia, foquei nos impactos de negócio em vez de detalhes técnicos e preparei um resumo executivo de 1 página.",
    impact: "A diretoria aprovou o investimento solicitado e o diretor financeiro pediu que eu replicasse o formato para outras apresentações.",
  },
  innovation: {
    situation: "O processo de onboarding de novos clientes levava 3 semanas e gerava muitas reclamações.",
    action: "Mapeei os gargalos, propus automatizar as etapas repetitivas com uma ferramenta de no-code e testei com 5 clientes antes de escalar.",
    impact: "Reduzimos o onboarding para 5 dias, a satisfação dos clientes aumentou 40% e liberamos 8h/semana da equipe de suporte.",
  },
};

interface CoreEvidenceProps {
  onNext: () => void;
  onPrev: () => void;
}

export default function CoreEvidence({ onNext, onPrev }: CoreEvidenceProps) {
  const [dimensionIdx, setDimensionIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const loadedRef = useRef(false);
  const saveMutation = trpc.evidence.save.useMutation();

  const { data: existingAnswers, isLoading } = trpc.evidence.get.useQuery();

  useEffect(() => {
    if (existingAnswers && existingAnswers.length > 0 && !loadedRef.current) {
      loadedRef.current = true;
      const loaded: Record<string, string> = {};
      existingAnswers.forEach((a) => { loaded[a.promptId] = a.text; });
      if (Object.keys(loaded).length > 0) {
        setAnswers(loaded);
      }
    }
  }, [existingAnswers]);

  const currentDimension = DIMENSIONS[dimensionIdx];
  const dimensionPrompts = CORE_EVIDENCE_PROMPTS.filter(
    (p) => p.dimension === currentDimension.key
  );

  const allAnswered = dimensionPrompts.every(
    (p) => answers[p.id] && answers[p.id].trim().length >= MIN_CHARS
  );

  const handleAnswer = (promptId: string, text: string) => {
    setAnswers((prev) => ({ ...prev, [promptId]: text }));
  };

  const handleSaveAndNext = async () => {
    if (dimensionIdx < DIMENSIONS.length - 1) {
      setDimensionIdx(dimensionIdx + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      try {
        const items = CORE_EVIDENCE_PROMPTS
          .filter((p) => answers[p.id] && answers[p.id].trim().length > 0)
          .map((p) => ({
            dimension: p.dimension,
            promptId: p.id,
            text: answers[p.id].trim(),
          }));
        await saveMutation.mutateAsync({ items });
        toast.success("Evidências salvas!");
        onNext();
      } catch {
        toast.error("Erro ao salvar. Tente novamente.");
      }
    }
  };

  const handlePrevDimension = () => {
    if (dimensionIdx > 0) {
      setDimensionIdx(dimensionIdx - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      onPrev();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando respostas...</div>
      </div>
    );
  }

  const example = DIMENSION_EXAMPLES[currentDimension.key];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                {currentDimension.label} — Evidências
              </CardTitle>
              <CardDescription>
                Dimensão {dimensionIdx + 1} de {DIMENSIONS.length} — Descreva situações reais com contexto, ação e impacto
              </CardDescription>
            </div>
          </div>
          <div className="flex gap-1 mt-3">
            {DIMENSIONS.map((d, i) => (
              <div
                key={d.key}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i < dimensionIdx
                    ? "bg-primary"
                    : i === dimensionIdx
                      ? "bg-primary/60"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Microintervenção ARC ensina a pensar */}
          <ArcTeaches content={EVIDENCE_TEACH} />

          {/* Exemplo colapsável */}
          {example && (
            <EvidenceExample
              dimensionLabel={currentDimension.label}
              example={example}
            />
          )}

          {dimensionPrompts.map((prompt, i) => {
            const charCount = (answers[prompt.id] || "").length;
            const isShort = charCount > 0 && charCount < MIN_CHARS;
            const isOk = charCount >= MIN_CHARS;

            return (
              <div key={prompt.id} className="space-y-2">
                <label className="text-sm font-medium text-foreground leading-relaxed block">
                  <span className="text-muted-foreground mr-2">{i + 1}.</span>
                  {prompt.text}
                </label>
                <Textarea
                  value={answers[prompt.id] || ""}
                  onChange={(e) => handleAnswer(prompt.id, e.target.value)}
                  placeholder="Descreva com detalhes: qual era a situação, o que você fez e qual foi o resultado..."
                  rows={5}
                  className={`resize-none transition-colors ${
                    isShort ? "border-amber-400 focus-visible:ring-amber-400/30" : ""
                  }`}
                />
                <div className="flex items-center justify-between">
                  <p className={`text-xs transition-colors ${
                    isOk
                      ? "text-green-600 dark:text-green-500"
                      : isShort
                        ? "text-amber-600 dark:text-amber-400"
                        : "text-muted-foreground"
                  }`}>
                    {isOk
                      ? `✓ ${charCount} caracteres`
                      : charCount === 0
                        ? `Mínimo ${MIN_CHARS} caracteres`
                        : `${charCount}/${MIN_CHARS} caracteres — adicione mais detalhes`}
                  </p>
                  {isShort && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      faltam {MIN_CHARS - charCount} chars
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={handlePrevDimension} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          onClick={handleSaveAndNext}
          disabled={!allAnswered || saveMutation.isPending}
          className="gap-2"
        >
          {saveMutation.isPending ? (
            "Salvando..."
          ) : dimensionIdx < DIMENSIONS.length - 1 ? (
            <>
              Próxima dimensão
              <ArrowRight className="w-4 h-4" />
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Salvar e continuar
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
