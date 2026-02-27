import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { trpc } from "@/lib/trpc";
import {
  CORE_LIKERT_ITEMS,
  CORE_EVIDENCE_PROMPTS,
  BIG_FIVE_ITEMS,
  BIG_FIVE_TRAITS,
  DIMENSIONS,
  IKIGAI_CIRCLES,
  IKIGAI_ZONES,
} from "@shared/questionBank";
import { ArrowLeft, Send, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface ReviewProps {
  onSubmit: () => void;
  onPrev: () => void;
  onGoToStep: (step: string) => void;
}

export default function Review({ onSubmit, onPrev, onGoToStep }: ReviewProps) {
  const { data: assessment, isLoading: assessmentLoading } = trpc.assessment.getFull.useQuery();
  const { data: status, isLoading: statusLoading } = trpc.assessment.status.useQuery();
  const submitMutation = trpc.assessment.submit.useMutation();
  const utils = trpc.useUtils();

  const isLoading = assessmentLoading || statusLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-pulse text-muted-foreground">Carregando revisão...</div>
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        Nenhum dado encontrado. Complete as etapas anteriores.
      </div>
    );
  }

  const { likert, evidence, ikigai, choices } = assessment;

  // Build lookup maps
  const likertMap = new Map(likert.map((r) => [r.itemId, r.value]));
  const evidenceMap = new Map(evidence.map((r) => [r.promptId, r.text]));

  // Calculate dimension scores
  const dimensionScores = DIMENSIONS.map((dim) => {
    const items = CORE_LIKERT_ITEMS.filter((i) => i.dimension === dim.key);
    let total = 0;
    let count = 0;
    items.forEach((item) => {
      const val = likertMap.get(item.id);
      if (val !== undefined) {
        total += item.reverse ? (6 - val) : val;
        count++;
      }
    });
    return {
      ...dim,
      score: count > 0 ? (total / count).toFixed(1) : "—",
      answered: count,
      total: items.length,
    };
  });

  // Big Five scores
  const bigFiveScores = BIG_FIVE_TRAITS.map((trait) => {
    const items = BIG_FIVE_ITEMS.filter((i) => i.trait === trait.key);
    let total = 0;
    let count = 0;
    items.forEach((item) => {
      const val = likertMap.get(item.id);
      if (val !== undefined) {
        total += item.reverse ? (6 - val) : val;
        count++;
      }
    });
    return {
      ...trait,
      score: count > 0 ? (total / count).toFixed(1) : "—",
      answered: count,
      total: items.length,
    };
  });

  // IKIGAI data
  const ikigaiByCircle = IKIGAI_CIRCLES.map((circle) => ({
    ...circle,
    items: ikigai
      .filter((i) => i.circle === circle.key)
      .sort((a, b) => a.rank - b.rank),
  }));

  const chosenZoneLabel = choices?.chosenZone
    ? IKIGAI_ZONES.find((z) => z.key === choices.chosenZone)?.label || choices.chosenZone
    : "Não selecionada";

  const handleSubmit = async () => {
    try {
      await submitMutation.mutateAsync();
      await utils.assessment.status.invalidate();
      toast.success("Avaliação submetida com sucesso!");
      onSubmit();
    } catch {
      toast.error("Erro ao submeter. Tente novamente.");
    }
  };

  // Use backend status for completion checks
  const allComplete = status?.allComplete === true;
  const coreComplete = status?.sections?.core_likert?.complete === true;
  const evidenceComplete = status?.sections?.core_evidence?.complete === true;
  const bigFiveComplete = status?.sections?.bigfive?.complete === true;
  const ikigaiComplete = status?.sections?.ikigai?.complete === true;
  const zoneComplete = status?.sections?.zone?.complete === true;

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            {allComplete ? (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-500" />
            )}
            Revisão da Avaliação
          </CardTitle>
        </CardHeader>
      </Card>

      {/* CORE Agilidades */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {coreComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              Agilidades (CORE)
            </CardTitle>
            {!coreComplete && (
              <Button variant="ghost" size="sm" className="text-xs text-amber-600" onClick={() => onGoToStep("core_likert")}>
                Completar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dimensionScores.map((dim) => (
              <div key={dim.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm">{dim.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{dim.score}</span>
                  <span className="text-xs text-muted-foreground">/5</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Evidências */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {evidenceComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              Evidências
            </CardTitle>
            {!evidenceComplete && (
              <Button variant="ghost" size="sm" className="text-xs text-amber-600" onClick={() => onGoToStep("core_evidence")}>
                Completar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DIMENSIONS.map((dim) => {
              const prompts = CORE_EVIDENCE_PROMPTS.filter((p) => p.dimension === dim.key);
              return (
                <div key={dim.key}>
                  <h4 className="text-xs font-semibold text-muted-foreground mb-1">{dim.label}</h4>
                  {prompts.map((p) => {
                    const answer = evidenceMap.get(p.id);
                    return (
                      <div key={p.id} className="p-2 rounded bg-muted/20 mb-1">
                        <p className="text-xs text-muted-foreground">{p.text}</p>
                        <p className="text-sm mt-1">
                          {answer || <span className="text-amber-500 italic">Não respondido</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Big Five */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {bigFiveComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              Personalidade (Big Five)
            </CardTitle>
            {!bigFiveComplete && (
              <Button variant="ghost" size="sm" className="text-xs text-amber-600" onClick={() => onGoToStep("bigfive")}>
                Completar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {bigFiveScores.map((trait) => (
              <div key={trait.key} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <span className="text-sm">{trait.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-primary">{trait.score}</span>
                  <span className="text-xs text-muted-foreground">/5</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* IKIGAI */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              {ikigaiComplete && zoneComplete ? (
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-500" />
              )}
              IKIGAI
            </CardTitle>
            {(!ikigaiComplete || !zoneComplete) && (
              <Button variant="ghost" size="sm" className="text-xs text-amber-600" onClick={() => onGoToStep("ikigai")}>
                Completar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ikigaiByCircle.map((circle) => (
            <div key={circle.key}>
              <h4 className="text-xs font-semibold mb-2" style={{ color: circle.color }}>
                {circle.emoji} {circle.label}
              </h4>
              {circle.items.length > 0 ? (
                <ol className="space-y-1">
                  {circle.items.map((item, i) => (
                    <li key={item.id} className="text-sm flex items-center gap-2">
                      <span
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                        style={{ backgroundColor: circle.color }}
                      >
                        {i + 1}
                      </span>
                      {item.text}
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-amber-500 italic">Nenhum item adicionado</p>
              )}
            </div>
          ))}
          <Separator />
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Zona escolhida:</span>
            <span className="text-sm font-bold text-primary">{chosenZoneLabel}</span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between gap-3">
        <Button variant="outline" onClick={onPrev} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!allComplete || submitMutation.isPending}
          className="gap-2"
        >
          {submitMutation.isPending ? "Submetendo..." : (
            <>
              <Send className="w-4 h-4" />
              Submeter avaliação
            </>
          )}
        </Button>
      </div>

      {!allComplete && (
        <p className="text-xs text-center text-amber-600">
          Complete todas as seções acima para poder submeter.
        </p>
      )}
    </div>
  );
}
